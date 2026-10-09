import { test, expect } from "@playwright/test";
import sharp from "sharp";

test.use({ channel: "msedge", viewport: { width: 1380, height: 800 } });
const baseURL = process.env.PORTFOLIO_TEST_URL || "http://127.0.0.1:3000";

test("lanyard can be pulled below its frame and returns safely", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseURL}/#about`);
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });
  const stage = page.locator(".lanyard-stage");
  await stage.scrollIntoViewIfNeeded();
  await expect(page.locator(".lanyard-scene")).toHaveAttribute("data-ready", "true");
  await page.waitForTimeout(1400);
  const box = await stage.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height * 0.5;
  const darkPixels = async () => {
    const image = await stage.screenshot();
    const { data, info } = await sharp(image)
      .extract({ left: Math.floor(box.width / 2 - 130), top: 140, width: 260, height: Math.floor(box.height - 170) })
      .raw()
      .toBuffer({ resolveWithObject: true });
    let count = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      if (data[i] < 90 && data[i + 1] < 90 && data[i + 2] < 90) count++;
    }
    return count;
  };
  const before = await darkPixels();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, box.y + box.height + 180, { steps: 30 });
  const held = await darkPixels();
  await page.mouse.up();
  await page.waitForTimeout(4200);
  const returned = await darkPixels();
  expect(before).toBeGreaterThan(1000);
  expect(held).toBeLessThan(before * 0.4);
  expect(returned).toBeGreaterThan(1000);
  await expect.poll(async () => {
    const { data: settledA, info } = await sharp(await stage.screenshot()).raw().toBuffer({ resolveWithObject: true });
    await page.waitForTimeout(600);
    const settledB = await sharp(await stage.screenshot()).raw().toBuffer();
    let changed = 0;
    for (let i = 0; i < settledA.length; i += info.channels) {
      if (Math.abs(settledA[i] - settledB[i]) + Math.abs(settledA[i + 1] - settledB[i + 1]) + Math.abs(settledA[i + 2] - settledB[i + 2]) > 60) changed++;
    }
    return changed;
  }, { timeout: 15000 }).toBeLessThan(5000);
  expect(errors).toEqual([]);
});

test("drag inside the frame stretches the band and returns", async ({ page }) => {
  await page.goto(`${baseURL}/#about`);
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });
  const stage = page.locator(".lanyard-stage");
  await stage.scrollIntoViewIfNeeded();
  await expect(page.locator(".lanyard-scene")).toHaveAttribute("data-ready", "true");
  await page.waitForTimeout(1400);
  const box = await stage.boundingBox();
  const x = box.x + box.width / 2;
  const cardTop = async () => {
    const { data, info } = await sharp(await stage.screenshot()).raw().toBuffer({ resolveWithObject: true });
    for (let y = 120; y < info.height - 100; y++) {
      let count = 0;
      for (let px = Math.floor(info.width / 2 - 75); px < info.width / 2 + 75; px++) {
        const i = (y * info.width + px) * info.channels;
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
        if (r < 90 && g < 90 && b < 90) count++;
      }
      if (count > 100) return y;
    }
    return NaN;
  };
  const initial = await cardTop();
  await page.mouse.move(x, box.y + box.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(x, box.y + box.height * 0.78, { steps: 30 });
  const held = await cardTop();
  await page.mouse.up();
  expect(held).toBeGreaterThan(initial + 100);
  await expect.poll(cardTop, { timeout: 3000 }).toBeLessThan(held - 15);
  await expect.poll(cardTop, { timeout: 3000 }).toBeLessThan(initial + 60);
});

test("reduced motion uses a static card that can still flip", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${baseURL}/#about`);
  const stage = page.locator(".lanyard-stage");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage.locator("canvas")).toHaveCount(0);
  await expect(stage.locator("img")).toHaveAttribute("src", /front\.png/);
  await expect(page.locator(".lanyard-controls")).toHaveCount(0);
  await stage.click();
  await expect(stage.locator("img")).toHaveAttribute("src", /back\.png/);
  await stage.press("Space");
  await expect(stage.locator("img")).toHaveAttribute("src", /front\.png/);
});

test("mobile layout fits and returning to About preserves the card", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/#about`);
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });
  const scene = page.locator(".lanyard-scene");
  await page.locator(".lanyard-stage").scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-ready", "true");
  const canvas = await scene.locator("canvas").elementHandle();
  await page.locator(".lanyard-stage").press("Enter");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.locator(".lanyard-stage").scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-ready", "true");
  await expect(scene.locator("canvas")).toHaveCount(1);
  expect(await canvas.evaluate(element => element.isConnected)).toBe(true);
  await expect(page.locator(".lanyard-stage")).toHaveAttribute("aria-pressed", "true");
});

test("flip shows the back within a second", async ({ page }) => {
  await page.goto(`${baseURL}/#about`);
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });
  const stage = page.locator(".lanyard-stage");
  await stage.scrollIntoViewIfNeeded();
  await expect(page.locator(".lanyard-scene")).toHaveAttribute("data-ready", "true");
  await page.waitForTimeout(1400);
  const box = await stage.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.5);
  await expect(stage).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(800);
  const { data, info } = await sharp(await stage.screenshot()).raw().toBuffer({ resolveWithObject: true });
  let blue = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 2] > 140 && data[i + 2] > data[i] * 1.4 && data[i + 2] > data[i + 1] * 1.1) blue++;
  }
  expect(blue).toBeGreaterThan(1000);
});

test("strap lettering keeps its proportions without visible controls", async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem("portfolio-theme", "dark"));
  await page.goto(`${baseURL}/#about`);
  const stage = page.locator(".lanyard-stage");
  await stage.scrollIntoViewIfNeeded();
  await expect(page.locator(".lanyard-scene")).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".lanyard-controls")).toHaveCount(0);
  await page.waitForTimeout(1400);
  const screenshot = await stage.screenshot({ path: testInfo.outputPath("lanyard-preview.png") });
  const { data, info } = await sharp(screenshot).raw().toBuffer({ resolveWithObject: true });
  let left = info.width, right = 0, top = info.height, bottom = 0;
  for (let y = 28; y < info.height * 0.21; y++) {
    for (let x = Math.floor(info.width * 0.42); x < info.width * 0.58; x++) {
      const i = (y * info.width + x) * info.channels;
      if (data[i] > 225 && data[i + 1] > 225 && data[i + 2] > 225) {
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
  }
  expect(right - left).toBeGreaterThan(10);
  expect((bottom - top) / (right - left)).toBeGreaterThan(2.6);
});
