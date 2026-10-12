import { test, expect } from "@playwright/test";
import sharp from "sharp";

test.use({ channel: "msedge", viewport: { width: 1380, height: 800 }, reducedMotion: "no-preference" });
const baseURL = process.env.PORTFOLIO_TEST_URL || "http://127.0.0.1:3000";

test("card artwork is available before JavaScript or the 3D bundle", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1380, height: 800 } });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/#about`);
    const image = page.locator(".lanyard-static img");
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
    await expect(page.locator(".lanyard-canvas")).toHaveCount(0);
  } finally { await context.close(); }
});

test("slow textures keep the artwork visible until the first 3D frame", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  let requested = false;
  await page.route("**/lanyard/back.*", async route => {
    requested = true;
    await pending;
    await route.continue();
  });
  try {
    await page.goto(`${baseURL}/#about`, { waitUntil: "domcontentloaded" });
    await expect.poll(() => requested, { timeout: 15_000 }).toBe(true);
    await expect(page.locator(".lanyard-scene")).toHaveAttribute("data-ready", "false");
    const preview = page.locator(".lanyard-static img");
    await expect(preview).toBeVisible();
    await expect.poll(() => preview.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(page.locator(".lanyard")).toHaveCSS("visibility", "hidden");
    release();
    await expect(page.locator(".lanyard-scene")).toHaveAttribute("data-ready", "true", { timeout: 25_000 });
    await expect(page.locator(".lanyard-static")).toHaveCount(0);
    await expect(page.locator(".lanyard-canvas")).toBeVisible();
    const screenshot = await page.locator(".lanyard-stage").screenshot({ path: testInfo.outputPath("lanyard-ready.png") });
    const { data, info } = await sharp(screenshot).raw().toBuffer({ resolveWithObject: true });
    let colored = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      const channels = [data[i], data[i + 1], data[i + 2]];
      if (Math.max(...channels) - Math.min(...channels) > 25 && Math.max(...channels) > 70) colored++;
    }
    expect(colored, "First visible 3D frame includes the portrait, not only the card border").toBeGreaterThan(500);
  } finally { release(); }
});

test("a failed required texture keeps the artwork instead of an incomplete card", async ({ page }) => {
  let rejected = false;
  await page.route("**/lanyard/back.*", route => { rejected = true; return route.abort(); });
  await page.goto(`${baseURL}/#about`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".lanyard-static img")).toBeVisible();
  await expect.poll(() => page.locator(".lanyard-static img").evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect.poll(() => rejected, { timeout: 15_000 }).toBe(true);
  await expect(page.locator(".scene-loading")).toHaveCount(0, { timeout: 15_000 });
  await expect(page.locator(".lanyard-scene")).toHaveAttribute("data-ready", "false");
  await expect(page.locator(".lanyard-canvas")).toHaveCount(0);
});
