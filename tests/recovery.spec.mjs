import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { HttpError, errorResponse, sameOrigin } from "../lib/http";

const routeSource = ts.transpileModule(readFileSync(new URL("../app/api/admin/recovery/route.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function recovery({ role = "recovery", lastAt = 0, resetLink = "", fail = false } = {}) {
  const calls = { generated: [], set: [], update: [] };
  const marker = { update: async value => { calls.update.push(value); } };
  const module = { exports: {} };
  vm.runInNewContext(routeSource, {
    module, exports: module.exports, Response, Date,
    process: { env: { PRIMARY_ADMIN_EMAIL: "primary@example.com" } },
    require(path) {
      if (path.endsWith("/lib/auth")) return { requireRecovery: async () => {
        if (role !== "recovery") throw new HttpError(401, "Akun pemulihan diperlukan.");
      } };
      if (path.endsWith("/lib/firebase-admin")) return {
        auth: () => ({ generatePasswordResetLink: async email => {
          calls.generated.push(email);
          if (fail) throw new HttpError(503, "Firebase sementara tidak tersedia.");
          return "https://example.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=test";
        } }),
        db: () => ({ collection: () => ({ doc: () => marker }), runTransaction: async callback => callback({
          get: async () => ({ data: () => ({ lastAt, resetLink }) }),
          set: (ref, value) => { calls.set.push(value); },
        }) }),
      };
      if (path.endsWith("/lib/http")) return { HttpError, errorResponse, sameOrigin };
      throw new Error(`Unexpected route dependency: ${path}`);
    },
  });
  const request = new Request("http://localhost:3000/api/admin/recovery", {
    method: "POST", headers: { origin: "http://localhost:3000", host: "localhost:3000" },
  });
  return { post: () => module.exports.POST(request), calls };
}

test("backup receives a reset link without SMTP and with caching disabled", async () => {
  const route = recovery();
  const response = await route.post();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect((await response.json()).resetLink).toContain("mode=resetPassword");
  expect(route.calls.generated).toEqual(["primary@example.com"]);
  expect(route.calls.set).toHaveLength(1);
});

test("primary and unauthenticated requests cannot obtain backup reset links", async () => {
  for (const role of ["primary", null]) {
    const route = recovery({ role });
    expect((await route.post()).status).toBe(401);
    expect(route.calls.generated).toEqual([]);
    expect(route.calls.set).toEqual([]);
  }
});

test("recovery retains the fifteen-minute limit", async () => {
  const route = recovery({ lastAt: Date.now() });
  expect((await route.post()).status).toBe(429);
  expect(route.calls.generated).toEqual([]);
});

test("reloading recovery retrieves the existing link without generating another", async () => {
  const resetLink = "https://example.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=test";
  const route = recovery({ lastAt: Date.now(), resetLink });
  const response = await route.post();
  expect(response.status).toBe(200);
  expect((await response.json()).resetLink).toBe(resetLink);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(route.calls.generated).toEqual([]);
  expect(route.calls.set).toEqual([]);
});

test("failed link creation releases the recovery limit", async () => {
  const route = recovery({ fail: true });
  expect((await route.post()).status).toBe(503);
  expect(route.calls.update).toEqual([{ lastAt: 0, resetLink: "" }]);
});
