import { test, expect } from "@playwright/test";
import sharp from "sharp";

test.use({ channel: "msedge", viewport: { width: 1380, height: 800 }, reducedMotion: "no-preference" });
const baseURL = process.env.PORTFOLIO_TEST_URL || "http://127.0.0.1:3000";

test("a cold first visit shows the portrait while the front image is still downloading", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1380, height: 800 } });
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  let requested = false;
  await context.route("**/lanyard/front.webp", async route => {
    requested = true;
    await pending;
    await route.continue();
  });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/#about`, { waitUntil: "domcontentloaded" });
    await expect.poll(() => requested).toBe(true);
    const image = page.locator(".lanyard-static img");
    expect(await image.evaluate(element => element.complete)).toBe(false);
    const { data, info } = await sharp(await image.screenshot()).raw().toBuffer({ resolveWithObject: true });
    let colored = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      if (Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) > 25) colored++;
    }
    expect(colored, "The portrait is present even before the full image or JavaScript arrives").toBeGreaterThan(500);
  } finally { release(); await context.close(); }
});

test("image decoding must finish before the loading preview is removed", async ({ page }) => {
  await page.addInitScript(() => {
    const decode = HTMLImageElement.prototype.decode;
    // Dev StrictMode runs the lanyard effect twice, so more than one decode can be held at once.
    const held = [];
    let released = false;
    window.releaseDecode = () => { released = true; held.splice(0).forEach(release => release()); };
    HTMLImageElement.prototype.decode = function () {
      if (released || !this.src.endsWith("/lanyard/back.webp")) return decode.call(this);
      window.decodePending = true;
      return new Promise((resolve, reject) => held.push(() => decode.call(this).then(resolve, reject)));
    };
  });
  await page.goto(`${baseURL}/#about`, { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => window.decodePending), { timeout: 5_000 }).toBe(true);
  await expect(page.locator(".lanyard-scene")).toHaveAttribute("data-ready", "false");
  await expect(page.locator(".lanyard-static img")).toBeVisible();
  await page.evaluate(() => window.releaseDecode());
  await expect(page.locator(".lanyard-scene")).toHaveAttribute("data-ready", "true", { timeout: 15_000 });
  await expect(page.locator(".portfolio-home")).toHaveAttribute("data-revealed", "true");
});

test("a failed front image uses the embedded portrait instead of a black card", async ({ page }) => {
  await page.route("**/lanyard/front.webp", route => route.abort());
  await page.goto(`${baseURL}/#about`, { waitUntil: "domcontentloaded" });
  const image = page.locator(".lanyard-static img");
  await expect(image).toHaveAttribute("src", /^data:image\/webp;base64,/);
  await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
  await expect(page.locator(".lanyard-canvas")).toHaveCount(0);
});

for (const width of [1380, 390]) {
  test(`full entry plays on load and on return without reloading textures at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    let textureRequests = 0;
    page.on("request", request => { if (/\/lanyard\/(front|back|strap)\.webp/.test(request.url())) textureRequests++; });
    await page.setViewportSize({ width, height: width === 390 ? 844 : 800 });
    await page.goto(`${baseURL}/#about`, { waitUntil: "domcontentloaded" });
    const stage = page.locator(".lanyard-stage");
    await stage.scrollIntoViewIfNeeded();
    await expect(page.locator(".lanyard-scene")).toHaveAttribute("data-ready", "true", { timeout: 25_000 });
    await expect(page.locator(".portfolio-home")).toHaveAttribute("data-revealed", "true");
    const portrait = async path => {
      const { data, info } = await sharp(await stage.screenshot({ path })).raw().toBuffer({ resolveWithObject: true });
      let count = 0, sumX = 0;
      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
          const i = (y * info.width + x) * info.channels;
          const channels = [data[i], data[i + 1], data[i + 2]];
          if (Math.max(...channels) - Math.min(...channels) > 25 && Math.max(...channels) > 70) {
            count++;
            sumX += x;
          }
        }
      }
      return { count, x: sumX / count, width: info.width };
    };
    const fullEntry = async label => {
      const positions = [];
      for (let i = 0; i < 10; i++) {
        const image = await portrait(i === 3 ? testInfo.outputPath(`lanyard-${label}-entry.png`) : undefined);
        if (image.count > 500) positions.push(image.x);
        await page.waitForTimeout(100);
      }
      const hanging = await portrait(testInfo.outputPath(`lanyard-${label}-hanging.png`));
      expect(hanging.count, "The complete portrait is visible after the fall").toBeGreaterThan(500);
      expect(positions.length).toBeGreaterThan(2);
      expect(Math.max(...positions) - hanging.x, "The original side-to-center fall plays in full").toBeGreaterThan(hanging.width * 0.08);
    };
    await fullEntry("initial");
    const canvas = await page.locator(".lanyard-canvas").elementHandle();
    const loaded = textureRequests;
    await page.locator("#contact h2").scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    await stage.scrollIntoViewIfNeeded();
    await fullEntry("return");
    expect(textureRequests, "Returning reuses the decoded textures").toBe(loaded);
    expect(await canvas.evaluate(element => element.isConnected)).toBe(true);
  });
}

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

test("slow textures keep the artwork visible until the renderer and full intro are ready", async ({ page }, testInfo) => {
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
    await expect(page.locator(".portfolio-home")).toHaveAttribute("data-revealed", "true");
    await expect(page.locator(".lanyard-static")).toHaveCount(0);
    await expect(page.locator(".lanyard-canvas")).toBeVisible();
    await page.waitForTimeout(1_500);
    const screenshot = await page.locator(".lanyard-stage").screenshot({ path: testInfo.outputPath("lanyard-ready.png") });
    const { data, info } = await sharp(screenshot).raw().toBuffer({ resolveWithObject: true });
    let colored = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      const channels = [data[i], data[i + 1], data[i + 2]];
      if (Math.max(...channels) - Math.min(...channels) > 25 && Math.max(...channels) > 70) colored++;
    }
    expect(colored, "After the entrance the card includes the portrait, not only its border").toBeGreaterThan(500);
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
