import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { mkdtempSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parseEnv } from "node:util";
import { HttpError, jsonBody, requestOrigin, sameOrigin } from "../lib/http";
import { cell } from "../lib/csv";
import { verifyTurnstile } from "../lib/turnstile";

test("Firebase Admin loads with the documented Vercel Node runtime options", () => {
  const { NODE_OPTIONS } = parseEnv(readFileSync(new URL("../.env.example", import.meta.url), "utf8"));
  const result = spawnSync(process.execPath, ["-e", "require('firebase-admin/auth'); require('firebase-admin/firestore');"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    // Exercise a runtime with ESM require disabled before applying the documented option.
    env: { ...process.env, NODE_OPTIONS: ["--no-experimental-require-module", NODE_OPTIONS].filter(Boolean).join(" ") },
    encoding: "utf8",
    timeout: 15_000,
  });
  expect(result.status, result.error?.message || result.stderr).toBe(0);
});

function env(values) {
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  return () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  };
}

function load(relative, dependencies, extra = {}) {
  const source = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports, Response, Date, URL, process,
    require(path) {
      if (path in dependencies) return dependencies[path];
      throw new Error(`Unexpected dependency: ${path}`);
    }, ...extra,
  });
  return module.exports;
}

test("canonical origin survives TLS proxying and rejects forged host/origin", () => {
  const restore = env({ NODE_ENV: "production", APP_ORIGIN: "https://portfolio.example" });
  try {
    const request = (origin, host = "internal:3000", site = "same-origin") => new Request("http://internal:3000/api/contact", {
      headers: { origin, host, "sec-fetch-site": site },
    });
    expect(requestOrigin(request("https://portfolio.example"))).toBe("https://portfolio.example");
    expect(() => sameOrigin(request("https://portfolio.example"))).not.toThrow();
    expect(() => sameOrigin(request("https://evil.example", "evil.example"))).toThrow();
    expect(() => sameOrigin(request("null"))).toThrow();
    expect(() => sameOrigin(request("https://portfolio.example", "internal:3000", "cross-site"))).toThrow();
    delete process.env.APP_ORIGIN;
    expect(() => sameOrigin(request("https://portfolio.example"))).toThrow();
    for (const origin of ["https://portfolio.example/path", "https://user:pass@portfolio.example", "http://portfolio.example", "garbage"]) {
      process.env.APP_ORIGIN = origin;
      expect(() => requestOrigin(request(origin))).toThrow();
    }
  } finally { restore(); }
});

test("JSON size limit counts streamed bytes and cancels oversized chunks", async () => {
  const request = body => new Request("http://localhost/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body });
  expect(await jsonBody(request('{"message":"é"}'), 16)).toEqual({ message: "é" });
  await expect(jsonBody(request('{"message":"éé"}'), 16)).rejects.toMatchObject({ status: 413 });
  let cancelled = false;
  let pulls = 0;
  const stream = new ReadableStream({
    pull(controller) { pulls++; controller.enqueue(new Uint8Array(1024)); },
    cancel() { cancelled = true; },
  }, { highWaterMark: 0 });
  const streamed = new Request("http://localhost/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: stream, duplex: "half" });
  await expect(jsonBody(streamed, 100)).rejects.toMatchObject({ status: 413 });
  expect(cancelled).toBe(true);
  expect(pulls).toBe(1);
  const declared = request("{}");
  declared.headers.set("Content-Length", "200");
  await expect(jsonBody(declared, 100)).rejects.toMatchObject({ status: 413 });
  await expect(jsonBody(request("{broken"))).rejects.toMatchObject({ status: 400 });
  await expect(jsonBody(request(new Uint8Array([0xff])))).rejects.toMatchObject({ status: 400 });
  await expect(jsonBody(new Request("http://localhost/api/contact", { method: "POST", body: "{}" }))).rejects.toMatchObject({ status: 415 });
});

test("CSV cells neutralize formulas even behind whitespace/control characters", () => {
  for (const value of ["=1+1", "+SUM(A1)", "-1+1", "@SUM(A1)", "\t=1+1", "\r=1+1", "\n=1+1", " \t=1+1", "\u0000=1+1"]) {
    expect(cell(value)).toBe(`"'${value}"`);
  }
  expect(cell('Hello "Ada",\nNext line')).toBe('"Hello ""Ada"",\nNext line"');
  expect(cell("Ada Lovelace")).toBe('"Ada Lovelace"');
});

test("Turnstile enforces success, hostname, action and production keys before storage", async () => {
  const restore = env({ NODE_ENV: "production", TURNSTILE_SECRET_KEY: "production-secret", NEXT_PUBLIC_TURNSTILE_SITE_KEY: "production-site-key" });
  const originalFetch = globalThis.fetch;
  let result = { success: true, hostname: "portfolio.example", action: "contact" };
  let calls = 0;
  try {
    globalThis.fetch = async (_url, options) => {
      calls++;
      expect(options.signal).toBeInstanceOf(AbortSignal);
      expect(options.cache).toBe("no-store");
      return Response.json(result);
    };
    await verifyTurnstile("valid-token", "portfolio.example");
    for (const invalid of [
      { ...result, success: false }, { ...result, hostname: "evil.example" },
      { ...result, action: "login" }, { success: true }, { success: "true", hostname: "portfolio.example", action: "contact" }, null,
    ]) {
      result = invalid;
      await expect(verifyTurnstile("token", "portfolio.example")).rejects.toMatchObject({ status: 400 });
    }
    const previousCalls = calls;
    await expect(verifyTurnstile("x".repeat(2049), "portfolio.example")).rejects.toMatchObject({ status: 400 });
    for (const key of ["1x0000000000000000000000000000000AA", "2x0000000000000000000000000000000AA", "3x0000000000000000000000000000000AA"]) {
      process.env.TURNSTILE_SECRET_KEY = key;
      await expect(verifyTurnstile("token", "portfolio.example")).rejects.toMatchObject({ status: 503 });
    }
    process.env.TURNSTILE_SECRET_KEY = "production-secret";
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "1x00000000000000000000AA";
    await expect(verifyTurnstile("token", "portfolio.example")).rejects.toMatchObject({ status: 503 });
    expect(calls).toBe(previousCalls);
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "production-site-key";
    globalThis.fetch = async () => { throw new Error("timeout"); };
    await expect(verifyTurnstile("token", "portfolio.example")).rejects.toMatchObject({ status: 502 });
    process.env.NODE_ENV = "development";
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
    globalThis.fetch = async () => Response.json({ success: true });
    await verifyTurnstile("dummy-token", "localhost");
  } finally { globalThis.fetch = originalFetch; restore(); }
});

test("contact quotas are shared transactions and reset after fifteen minutes", async () => {
  const docs = new Map();
  let now = 1_000_000;
  let tail = Promise.resolve();
  const database = {
    collection: collection => ({ doc: id => `${collection}/${id}` }),
    runTransaction(callback) {
      const pending = tail.then(async () => {
        const writes = [];
        const result = await callback({
          get: async ref => ({ data: () => docs.get(ref) }),
          set: (ref, value) => writes.push([ref, value]),
          create: (ref, value) => {
            if (docs.has(ref)) throw new Error("already exists");
            writes.push([ref, value]);
          },
        });
        for (const [ref, value] of writes) docs.set(ref, value);
        return result;
      });
      tail = pending.catch(() => {});
      return pending;
    },
  };
  const { storeContact } = load("../lib/contact-store.ts", {
    "node:crypto": await import("node:crypto"), "./firebase-admin": { db: () => database }, "./http": { HttpError },
  }, { Date: class extends Date { static now() { return now; } } });
  const contact = (id, email = "ada@example.com") => ({ id, email, name: "Ada", message: "Hello there!", createdAt: "now", read: false, emailStatus: "pending" });
  const results = await Promise.allSettled(Array.from({ length: 5 }, (_, i) => storeContact(contact(String(i)))));
  expect(results.filter(result => result.status === "fulfilled")).toHaveLength(3);
  expect(results.filter(result => result.status === "rejected")).toHaveLength(2);
  expect(results.find(result => result.status === "rejected").reason.status).toBe(429);
  expect([...docs.keys()].filter(key => key.startsWith("contacts/"))).toHaveLength(3);
  expect([...docs.keys()].join(" ")).not.toContain("ada@example.com");
  for (let i = 0; i < 27; i++) await storeContact(contact(`other-${i}`, `other-${i}@example.com`));
  await expect(Promise.resolve(storeContact(contact("over-global", "new@example.com")))).rejects.toMatchObject({ status: 429 });
  expect(docs.get("security/contact-global").count).toBe(30);
  now += 15 * 60_000;
  await storeContact(contact("next-window"));
  expect(docs.get("security/contact-global").count).toBe(1);
});

test("invalid Contact requests never reach database writes or email", async () => {
  const restore = env({ NODE_ENV: "test", APP_ORIGIN: "http://localhost:3000" });
  let stored = 0;
  let mailed = 0;
  let verificationFails = true;
  const { POST } = load("../app/api/contact/route.ts", {
    "../../../lib/firebase-admin": { db: () => ({ collection: () => ({ doc: () => ({ id: "test-id", update: async () => {} }) }) }) },
    "../../../lib/http": await import("../lib/http"),
    "../../../lib/mail": { sendContactEmail: async () => { mailed++; } },
    "../../../lib/turnstile": { verifyTurnstile: async () => { if (verificationFails) throw new HttpError(400, "Invalid challenge"); } },
    "../../../lib/validation": await import("../lib/validation"),
    "../../../lib/contact-store": { storeContact: async () => { stored++; } },
  });
  try {
    const post = (origin = "http://localhost:3000", message = "Hello there!") => POST(new Request("http://localhost:3000/api/contact", {
      method: "POST", headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ name: "Ada", email: "ada@example.com", message, turnstileToken: "token" }),
    }));
    expect((await post("https://evil.example")).status).toBe(403);
    expect((await post()).status).toBe(400);
    expect((await post("http://localhost:3000", "x".repeat(40000))).status).toBe(413);
    expect(stored).toBe(0);
    expect(mailed).toBe(0);
    verificationFails = false;
    expect((await post()).status).toBe(201);
    expect(stored).toBe(1);
    expect(mailed).toBe(1);
  } finally { restore(); }
});

test("draft projects require primary access and never enter the public list", async () => {
  let primary = false;
  const projects = [{ slug: "hidden", status: "draft", order: 0 }, { slug: "visible", status: "published", order: 1 }];
  const { getProject, getPublishedProjects } = load("../lib/repository.ts", {
    "../app/data": { projects: [] }, "../app/sample-content": {},
    "./auth": { requirePrimary: async () => { if (!primary) throw new HttpError(401, "Login required"); } },
    "./firebase-admin": { firebaseConfigured: () => true, db: () => ({ collection: () => ({
      get: async () => ({ docs: projects.map(project => ({ data: () => project })) }),
      doc: slug => ({ get: async () => ({ data: () => projects.find(project => project.slug === slug) }) }),
    }) }) },
  });
  expect(await getProject("hidden")).toBeNull();
  expect((await getPublishedProjects()).map(project => project.slug)).toEqual(["visible"]);
  await expect(Promise.resolve(getProject("hidden", { includeDraft: true }))).rejects.toMatchObject({ status: 401 });
  primary = true;
  expect((await getProject("hidden", { includeDraft: true })).status).toBe("draft");
});

test("session checks reject revoked tokens and stale logins", async () => {
  const restore = env({ PRIMARY_ADMIN_UID: "primary", PRIMARY_ADMIN_EMAIL: "primary@example.com", BACKUP_ADMIN_UID: "backup", BACKUP_ADMIN_EMAIL: "backup@example.com" });
  let rejected = false;
  let cookie = "signed-session";
  let authTime = Date.now() / 1000;
  let user = "primary";
  const checks = [];
  const token = () => ({ uid: user, email: `${user}@example.com`, auth_time: authTime, firebase: { sign_in_provider: "password" } });
  const { sessionRole, roleFromIdToken, requirePrimary, requireRecovery } = load("../lib/auth.ts", {
    "next/headers": { cookies: async () => ({ get: () => cookie ? { value: cookie } : undefined }) },
    "./http": { HttpError },
    "./firebase-admin": { auth: () => ({
      verifyIdToken: async (_value, revocation) => { checks.push(revocation); if (rejected) throw new Error("revoked"); return token(); },
      verifySessionCookie: async (_value, revocation) => { checks.push(revocation); if (rejected) throw new Error("revoked"); return token(); },
    }) },
  });
  try {
    expect(await roleFromIdToken("signed-id-token")).toBe("primary");
    expect(await sessionRole()).toBe("primary");
    await requirePrimary();
    await expect(Promise.resolve(requireRecovery())).rejects.toMatchObject({ status: 401 });
    user = "backup";
    expect(await sessionRole()).toBe("recovery");
    await requireRecovery();
    await expect(Promise.resolve(requirePrimary())).rejects.toMatchObject({ status: 401 });
    user = "primary";
    authTime -= 301;
    await expect(Promise.resolve(roleFromIdToken("stale-token"))).rejects.toMatchObject({ status: 401 });
    rejected = true;
    expect(await sessionRole()).toBeNull();
    await expect(Promise.resolve(roleFromIdToken("revoked-token"))).rejects.toMatchObject({ status: 401 });
    expect(checks.every(Boolean)).toBe(true);
    cookie = "";
    expect(await sessionRole()).toBeNull();
  } finally { restore(); }
});

test("upload signatures bind the folder, preset and image formats after authorization", async () => {
  const restore = env({ NODE_ENV: "test", APP_ORIGIN: "http://localhost:3000", CLOUDINARY_UPLOAD_PRESET: "portfolio_signed" });
  const signatures = [];
  let primary = true;
  const { POST } = load("../app/api/admin/upload-signature/route.ts", {
    "../../../../lib/auth": { requirePrimary: async () => { if (!primary) throw new HttpError(401, "Login required"); } },
    "../../../../lib/http": await import("../lib/http"),
    "../../../../lib/cloudinary": {
      MAX_IMAGE_BYTES: 10 * 1024 * 1024,
      cloudinaryClient: () => ({ cloudName: "example", apiKey: "public-api-key", apiSecret: "private-secret", cloudinary: { utils: {
        api_sign_request: (params, secret) => { signatures.push(params); expect(secret).toBe("private-secret"); return "signature"; },
      } } }),
    },
  });
  const post = (fileSize = 1000, fileType = "image/png") => POST(new Request("http://localhost:3000/api/admin/upload-signature", {
    method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" }, body: JSON.stringify({ fileSize, fileType }),
  }));
  try {
    const response = await post();
    expect(response.status).toBe(200);
    expect(signatures[0]).toMatchObject({ asset_folder: "portfolio", public_id_prefix: "portfolio", upload_preset: "portfolio_signed", allowed_formats: "jpg,png,webp" });
    expect(await response.text()).not.toContain("private-secret");
    expect((await post(10 * 1024 * 1024 + 1)).status).toBe(400);
    expect((await post(1000, "image/svg+xml")).status).toBe(400);
    primary = false;
    expect((await post()).status).toBe(401);
    expect(signatures).toHaveLength(1);
  } finally { restore(); }
});

test("session cookies use Secure, HttpOnly, SameSite and a bounded expiry", async () => {
  const restore = env({ NODE_ENV: "production", APP_ORIGIN: "https://portfolio.example" });
  const cookies = [];
  const { POST } = load("../app/api/admin/session/route.ts", {
    "next/headers": { cookies: async () => ({ set: (...args) => cookies.push(args) }) },
    "../../../../lib/firebase-admin": { auth: () => ({ createSessionCookie: async () => "signed-session" }) },
    "../../../../lib/auth": { roleFromIdToken: async () => "primary", SESSION_COOKIE: "portfolio_session", SESSION_AGE_MS: 5 * 24 * 60 * 60 * 1000 },
    "../../../../lib/http": await import("../lib/http"),
  });
  try {
    const response = await POST(new Request("http://internal:3000/api/admin/session", {
      method: "POST", headers: { origin: "https://portfolio.example", "content-type": "application/json" }, body: JSON.stringify({ idToken: "token" }),
    }));
    expect(response.status).toBe(200);
    expect(cookies[0]).toEqual(["portfolio_session", "signed-session", { httpOnly: true, secure: true, sameSite: "strict", maxAge: 432000, path: "/" }]);
  } finally { restore(); }
});

test("deploy guard fails for dummy keys and invalid origins without printing secrets", () => {
  const directory = mkdtempSync(join(tmpdir(), "portfolio-security-"));
  const environment = { ...process.env };
  for (const key of ["NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_APP_ID", "FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY", "PRIMARY_ADMIN_UID", "PRIMARY_ADMIN_EMAIL", "BACKUP_ADMIN_UID", "BACKUP_ADMIN_EMAIL", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "CLOUDINARY_UPLOAD_PRESET", "NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"]) environment[key] = "private-fixture-value";
  environment.APP_ORIGIN = "https://portfolio.example";
  environment.PRIMARY_ADMIN_UID = "primary";
  environment.BACKUP_ADMIN_UID = "backup";
  environment.PRIMARY_ADMIN_EMAIL = "primary@example.com";
  environment.BACKUP_ADMIN_EMAIL = "backup@example.com";
  const check = () => spawnSync(process.execPath, [fileURLToPath(new URL("../scripts/check-deploy.mjs", import.meta.url))], { cwd: directory, env: environment, encoding: "utf8" });
  try {
    expect(check().status).toBe(0);
    environment.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
    environment.APP_ORIGIN = "http://portfolio.example/path";
    const failed = check();
    expect(failed.status).toBe(1);
    expect(failed.stderr).toContain("kunci tes");
    expect(failed.stderr).toContain("APP_ORIGIN");
    expect(failed.stderr).not.toContain("private-fixture-value");
  } finally { rmdirSync(directory); }
});
