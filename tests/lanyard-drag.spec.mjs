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
  const y = box.y + box.height * 0.45;
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
  await page.waitForTimeout(1800);
  const returned = await darkPixels();
  if (returned < 1000) await stage.screenshot({ path: "test-results/lanyard-failed-return.png" });
  console.log({ before, held, returned, errors });
  expect(before).toBeGreaterThan(1000);
  expect(held).toBeLessThan(before * 0.4);
  expect(returned).toBeGreaterThan(1000);
  expect(errors).toEqual([]);
});
