import { test, expect } from "@playwright/test";

test.use({ channel: "msedge" });
const baseURL = process.env.PORTFOLIO_TEST_URL || "http://127.0.0.1:3000";

test("admin APIs reject unauthenticated access and cross-site session changes", async ({ request }) => {
  const reads = ["session", "projects", "settings", "education", "certificates", "contacts", "contacts/export"];
  for (const path of reads) {
    expect((await request.get(`${baseURL}/api/admin/${path}`)).status(), path).toBe(401);
  }
  const writes = [
    ["POST", "projects"], ["PUT", "projects/test"], ["POST", "projects/order"],
    ["PUT", "settings"], ["PUT", "education"], ["PUT", "certificates"],
    ["POST", "upload-signature"], ["POST", "media/delete"], ["POST", "recovery"],
    ["PATCH", "contacts/aaaaaaaaaaaaaaaaaaaa"], ["POST", "contacts/aaaaaaaaaaaaaaaaaaaa/retry"],
  ];
  for (const [method, path] of writes) {
    expect((await request.fetch(`${baseURL}/api/admin/${path}`, {
      method, headers: { origin: baseURL }, data: {},
    })).status(), `${method} ${path}`).toBe(401);
  }
  expect((await request.post(`${baseURL}/api/admin/session`, {
    headers: { origin: "https://other.example" }, data: { idToken: "invalid" },
  })).status()).toBe(403);
  const invalid = await request.post(`${baseURL}/api/admin/session`, {
    headers: { origin: baseURL }, data: { idToken: "invalid" },
  });
  expect(invalid.status()).toBe(401);
  expect(invalid.headers()["set-cookie"]).toBeUndefined();
  expect((await request.delete(`${baseURL}/api/admin/session`, {
    headers: { origin: "https://other.example" },
  })).status()).toBe(403);
});

test("both admin accounts use one password form and guarded pages require login", async ({ page }) => {
  await page.goto(`${baseURL}/admin`);
  await expect(page).toHaveURL(`${baseURL}/admin/login`);
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveAttribute("type", "password");
  await expect(page.getByRole("button", { name: /Google/ })).toHaveCount(0);
  await expect(page.getByText(/Akun cadangan hanya untuk pemulihan/)).toBeVisible();
  await page.goto(`${baseURL}/admin/recovery`);
  await expect(page).toHaveURL(`${baseURL}/admin/login`);
  await page.getByRole("link", { name: "Lupa kata sandi?" }).click();
  await expect(page.getByText(/masuk dengan email dan kata sandi akun cadangan/)).toBeVisible();
});
