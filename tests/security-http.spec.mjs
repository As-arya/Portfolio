import { test, expect } from "@playwright/test";

test.use({ channel: "msedge", bypassCSP: false });
const baseURL = process.env.PORTFOLIO_TEST_URL || "http://127.0.0.1:3000";

test("production pages send fresh nonces and browser security headers", async ({ request }) => {
  const first = await request.get(`${baseURL}/admin/login`, { headers: { "x-nonce": "attacker-controlled" } });
  const second = await request.get(`${baseURL}/admin/login`);
  for (const response of [first, second]) {
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["strict-transport-security"]).toBe("max-age=31536000");
    expect(headers["x-powered-by"]).toBeUndefined();
    const csp = headers["content-security-policy"];
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    const nonce = csp.match(/'nonce-([^']+)'/)[1];
    expect(nonce).not.toBe("attacker-controlled");
    expect(await response.text()).toContain(`nonce="${nonce}"`);
  }
  expect(first.headers()["content-security-policy"]).not.toBe(second.headers()["content-security-policy"]);
});

test("private API errors are not cached and forged sessions cannot access data", async ({ request }) => {
  for (const path of ["session", "contacts", "contacts/export", "projects", "settings", "education", "certificates"]) {
    const response = await request.get(`${baseURL}/api/admin/${path}`, { headers: { cookie: "portfolio_session=forged-session" } });
    expect(response.status(), path).toBe(401);
    expect(response.headers()["cache-control"], path).toContain("no-store");
    expect(response.headers()["set-cookie"]).toBeUndefined();
    expect(Object.keys(await response.json())).toEqual(["error"]);
  }
});

test("public Contact rejects cross-site, malformed, oversized and unverified requests", async ({ request }) => {
  const valid = { name: "Ada", email: "ada@example.com", message: "Security test, must not be stored.", turnstileToken: "invalid-token" };
  const response = await request.post(`${baseURL}/api/contact`, { headers: { origin: "https://evil.example" }, data: valid });
  expect(response.status()).toBe(403);
  expect((await request.post(`${baseURL}/api/contact`, { data: valid })).status()).toBe(403);
  expect((await request.post(`${baseURL}/api/contact`, { headers: { origin: baseURL, "sec-fetch-site": "cross-site" }, data: valid })).status()).toBe(403);
  expect((await request.post(`${baseURL}/api/contact`, { headers: { origin: baseURL, "content-type": "text/plain" }, data: JSON.stringify(valid) })).status()).toBe(415);
  expect((await request.post(`${baseURL}/api/contact`, { headers: { origin: baseURL, "content-type": "application/json" }, data: "{broken" })).status()).toBe(400);
  expect((await request.post(`${baseURL}/api/contact`, { headers: { origin: baseURL }, data: { ...valid, message: "x".repeat(33000) } })).status()).toBe(413);
  const unverified = await request.post(`${baseURL}/api/contact`, { headers: { origin: baseURL }, data: valid });
  expect([400, 503]).toContain(unverified.status());
  expect((await unverified.json()).error).toBeTruthy();
});

test("source files and development control endpoints are not exposed", async ({ request }) => {
  for (const path of ["/.env", "/.env.local", "/.git/config", "/lib/firebase-admin.ts", "/__nextjs_mcp"]) {
    const response = await request.get(`${baseURL}${path}`);
    expect(response.status(), path).toBe(404);
    expect(await response.text(), path).not.toContain("BEGIN PRIVATE KEY");
  }
});

test("CSP allows the UI and challenge but blocks injected inline script", async ({ page }) => {
  await page.addInitScript(() => {
    window.cspViolations = [];
    window.inlineAttackRan = false;
    document.addEventListener("securitypolicyviolation", event => window.cspViolations.push({ directive: event.effectiveDirective, blocked: event.blockedURI }));
  });
  await page.route("**/turnstile/v0/api.js?render=explicit", route => route.fulfill({
    contentType: "text/javascript",
    body: "window.turnstile={render:(_,o)=>{window.challengeAction=o.action;setTimeout(()=>o.callback('test-token'),0);return 'test-widget'},reset:()=>{},remove:()=>{}}",
  }));
  await page.goto(baseURL);
  await expect(page.locator("#about")).toBeVisible();
  await expect(page.locator(".gradient-waves canvas")).toHaveCount(1);
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => window.challengeAction)).toBe("contact");
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
  await page.route(`${baseURL}/`, async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace("</body>", "<script>window.inlineAttackRan=true</script></body>");
    await route.fulfill({ response, body });
  });
  await page.reload();
  expect(await page.evaluate(() => window.inlineAttackRan)).toBe(false);
  await expect.poll(() => page.evaluate(() => window.cspViolations.some(event => event.directive === "script-src-elem" && event.blocked === "inline"))).toBe(true);
  await page.goto(`${baseURL}/admin/login`);
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Kata sandi", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
});
