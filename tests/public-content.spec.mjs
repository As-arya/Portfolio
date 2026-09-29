import { test, expect } from "@playwright/test";

test.use({ channel: "msedge" });

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

  await page.goto("http://127.0.0.1:3000/");
  const opener = page.locator(".project-row .project-image-button").first();
  const titleId = await page.locator(".project-row h3").first().textContent();
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("#dialog-title")).toHaveText(titleId);
  await expect(dialog.locator(".dialog-gallery")).toBeVisible();
  await expect(dialog.locator(".project-detail-content")).not.toBeEmpty();
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
  await expect(page).toHaveURL("http://127.0.0.1:3000/");
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
