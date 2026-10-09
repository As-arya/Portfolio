import { test, expect } from "@playwright/test";

test.use({ channel: "msedge" });
const baseURL = process.env.PORTFOLIO_TEST_URL || "http://127.0.0.1:3000";

test("education admin API requires authentication for reads and writes", async ({ request }) => {
  expect((await request.get(`${baseURL}/api/admin/education`)).status()).toBe(401);
  expect((await request.put(`${baseURL}/api/admin/education`, {
    headers: { origin: baseURL }, data: { education: [] },
  })).status()).toBe(401);
});

test("project window follows the language toggle and Contact posts verified data", async ({ page }) => {
  await page.route("**/turnstile/v0/api.js?render=explicit", (route) => route.fulfill({
    contentType: "text/javascript",
    body: "window.turnstile={render:(_,options)=>{setTimeout(()=>options.callback('test-token'),0);return 'test-widget'},reset:()=>{},remove:()=>{}}",
  }));
  let submitted;
  await page.route("**/api/contact", (route) => {
    submitted = route.request().postDataJSON();
    return route.fulfill({ status: 201, json: { saved: true } });
  });

  await page.goto(`${baseURL}/`);
  const opener = page.locator(".project-row .project-image-button").first();
  const titleId = await page.locator(".project-row h3").first().textContent();
  const expectedTags = await page.locator(".project-row").first().locator(".project-tags > span").allTextContents();
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("#dialog-title")).toHaveText(titleId);
  await expect(dialog.locator(".dialog-gallery")).toBeVisible();
  await expect(dialog.locator(".project-detail-content")).not.toBeEmpty();
  const tags = dialog.locator(".project-stack .project-tags");
  if (expectedTags.length) {
    await expect(tags.locator("span")).toHaveText(expectedTags);
    expect(await dialog.locator(".project-detail-content").evaluate(element =>
      Boolean(element.compareDocumentPosition(element.parentElement.querySelector(".project-stack")) & Node.DOCUMENT_POSITION_FOLLOWING),
    )).toBe(true);
  } else await expect(dialog.locator(".project-stack")).toHaveCount(0);
  await expect(page.locator('.nav-links a[href="#education"]')).toHaveText("Education");
  await expect(dialog.locator(".dialog-pixel canvas")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await page.getByRole("button", { name: "Change language to English" }).click();
  const titleEn = await page.locator(".project-row h3").first().textContent();
  await opener.click();
  await expect(dialog.locator("#dialog-title")).toHaveText(titleEn);
  await expect(dialog.locator(".project-detail-content")).not.toBeEmpty();

  await dialog.getByRole("button", { name: "Close details" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(`${baseURL}/`);
  await page.locator("#contact input[name=name]").fill("Ada Lovelace");
  await page.locator("#contact input[name=email]").fill("ada@example.com");
  await page.locator("#contact textarea[name=message]").fill("Hello from the portfolio form.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Message received" })).toBeVisible();
  expect(submitted).toEqual({
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "Hello from the portfolio form.",
    turnstileToken: "test-token",
  });
});
