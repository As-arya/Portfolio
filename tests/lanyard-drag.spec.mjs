import { test, expect } from "@playwright/test";
import sharp from "sharp";

test.use({ channel: "msedge", viewport: { width: 1380, height: 800 } });

test("lanyard can be pulled below its frame and returns safely", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:3000/#about");
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

test("long drag inside the frame returns progressively", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000/#about");
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
        if (r > 95 && r < 225 && g > 95 && g < 225 && b > 95 && b < 225 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18) count++;
      }
      if (count > 60) return y;
    }
    return NaN;
  };
  const initial = await cardTop();
  await page.mouse.move(x, box.y + box.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(x, box.y + box.height * 0.78, { steps: 30 });
  const held = await cardTop();
  await page.mouse.up();
  await page.waitForTimeout(120);
  const early = await cardTop();
  expect(held).toBeGreaterThan(initial + 100);
  expect(early).toBeGreaterThan(initial + 60);
  await expect.poll(cardTop, { timeout: 3000 }).toBeLessThan(held - 15);
  await expect.poll(cardTop, { timeout: 3000 }).toBeLessThan(initial + 60);
});
