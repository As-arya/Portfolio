import { test, expect } from "@playwright/test";

test.use({ channel: "msedge", viewport: { width: 1380, height: 900 }, reducedMotion: "reduce" });
const baseURL = process.env.PORTFOLIO_TEST_URL || "http://127.0.0.1:3000";

test("certificate samples render, enlarge, follow language and fit mobile", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && !message.location().url.endsWith("/favicon.ico")) errors.push(message.text());
  });
  await page.goto(`${baseURL}/#certificates`);
  await expect(page.locator(".projects-heading .eyebrow, .projects-heading > p, .certificates-intro .eyebrow, .certificates-intro > p, .contact-copy > .eyebrow, .education-heading > p")).toHaveCount(0);
  await expect(page.locator('a[href="#certificates"][aria-current="location"]')).toHaveCount(1);
  await expect(page.locator(".certificate-card")).toHaveCount(2);
  await expect(page.locator(".certificate-card").first()).toHaveCSS("opacity", "1");
  await expect.poll(() => page.locator(".certificate-image-button > img").evaluateAll(images => images.every(image => image.naturalWidth > 0))).toBe(true);
  const opener = page.locator(".certificate-image-button").first();
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("h2")).toHaveText("Frontend Fundamentals (Contoh)");
  await expect(dialog.locator("img")).toHaveAttribute("src", "/certificates/sample-web.svg");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await page.getByRole("button", { name: "Change language to English" }).click();
  await expect(page.locator(".certificate-card h2").first()).toHaveText("Frontend Fundamentals (Sample)");
  await opener.click();
  await expect(dialog.locator("h2")).toHaveText("Frontend Fundamentals (Sample)");
  await dialog.getByRole("button", { name: "Close certificate" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto(`${baseURL}/#education`);
  await expect(page.locator(".education-row")).toHaveCount(2);
  await expect(page.locator(".education-coursework")).toContainText("Algorithms & Data Structures");
  await expect(page.locator(".education-now")).toHaveText("Present");
  await expect(page.locator(".education-coursework h4")).toHaveText("Selected Coursework");
  await expect(page.locator(".education-logo")).toHaveCount(2);
  await expect.poll(() => page.locator(".education-logo").evaluateAll(images => images.every(image => image.naturalWidth > 0))).toBe(true);
  for (const width of [1380, 820, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const positions = await page.locator(".education-row article").first().evaluate(article => {
      const bounds = selector => article.querySelector(selector).getBoundingClientRect().toJSON();
      return { years: bounds(".education-years"), logo: bounds(".education-logo"), copy: bounds(".education-copy") };
    });
    expect(positions.logo.x).toBeGreaterThanOrEqual(positions.years.right);
    if (width > 767) {
      expect(positions.copy.x).toBeGreaterThan(positions.logo.right);
      expect(Math.abs(positions.logo.y - positions.copy.y)).toBeLessThan(2);
    } else expect(positions.copy.y).toBeGreaterThanOrEqual(positions.logo.bottom);
    if (width === 1380) await page.locator("#education").screenshot({ path: testInfo.outputPath("education-preview.png") });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { message: `No overflow at ${width}px` }).toBe(true);
  }
  await expect(page.locator("main > section").first()).toHaveAttribute("id", "about");
  await expect(page.locator("#home, .hero")).toHaveCount(0);
  await expect(page.locator("#about h1")).toHaveAttribute("aria-label", "Asarya Jachred Alotia.");
  await expect(page.locator("#about .availability")).toBeVisible();
  expect(errors).toEqual([]);
});

test("certificate API rejects unauthenticated reads and writes", async ({ request }) => {
  expect((await request.get(`${baseURL}/api/admin/certificates`)).status()).toBe(401);
  expect((await request.put(`${baseURL}/api/admin/certificates`, {
    headers: { origin: baseURL }, data: { certificates: [] },
  })).status()).toBe(401);
});
