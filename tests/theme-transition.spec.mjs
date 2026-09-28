import { test, expect } from "@playwright/test";

test.use({ channel: "msedge", viewport: { width: 1280, height: 800 } });

test("theme expands from its button and respects reduced motion", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("portfolio-theme", "light"));
  await page.goto("http://127.0.0.1:3000");
  const button = page.getByRole("button", { name: "Ganti tema" });
  const bounds = await button.boundingBox();
  expect(bounds).not.toBeNull();
  await page.evaluate(() => {
    const root = document.documentElement;
    const animate = root.animate;
    root.animate = function (keyframes, options) {
      const animation = animate.call(this, keyframes, options);
      if (options?.pseudoElement === "::view-transition-new(root)") {
        window.themeBubble = { keyframes, options, finished: animation.finished };
      }
      return animation;
    };
  });

  await button.click();
  await expect.poll(() => page.evaluate(() => window.themeBubble?.options.pseudoElement)).toBe("::view-transition-new(root)");
  const { keyframes } = await page.evaluate(() => window.themeBubble);
  const [start, end] = keyframes.clipPath;
  const match = start.match(/^circle\(0px at ([\d.]+)px ([\d.]+)px\)$/);
  expect(match).not.toBeNull();
  expect(Number(match[1])).toBeCloseTo(bounds.x + bounds.width / 2, 0);
  expect(Number(match[2])).toBeCloseTo(bounds.y + bounds.height / 2, 0);
  const radius = Number(end.match(/^circle\(([\d.]+)px at /)?.[1]);
  expect(radius).toBeGreaterThan(Math.hypot(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2));
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(button).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("portfolio-theme"))).toBe("dark");

  await page.evaluate(() => window.themeBubble.finished);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await button.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(button).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => localStorage.getItem("portfolio-theme"))).toBe("light");
});
