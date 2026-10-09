import { test, expect } from "@playwright/test";

test.use({ channel: "msedge", viewport: { width: 1440, height: 900 } });
const baseURL = process.env.PORTFOLIO_TEST_URL || "http://127.0.0.1:3000";

async function trackWaves(page) {
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-theme", "light");
    const draw = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      const result = draw.apply(this, args);
      if (this.canvas.parentElement?.classList.contains("gradient-waves")) {
        window.waveFrames = (window.waveFrames || 0) + 1;
        const pixels = new Uint8Array(4);
        this.readPixels(Math.floor(this.canvas.width * .75), Math.floor(this.canvas.height * .25), 1, 1, this.RGBA, this.UNSIGNED_BYTE, pixels);
        window.wavePixel = [...pixels];
      }
      return result;
    };
  });
}

test("waves render, recolor in place and keep desktop and mobile readable", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && /shader|program|webgl/i.test(message.text())) errors.push(message.text()); });
  await trackWaves(page);
  await page.goto(baseURL);
  const waves = page.locator(".gradient-waves");
  await expect(waves.locator("canvas")).toHaveCount(1);
  await expect(waves).toHaveAttribute("aria-hidden", "true");
  await expect(waves).toHaveCSS("pointer-events", "none");
  await expect.poll(() => page.evaluate(() => window.wavePixel?.[3] || 0)).toBeGreaterThan(0);
  const colors = () => waves.locator("canvas").evaluate(canvas => {
    const gl = canvas.getContext("webgl2");
    const program = gl.getParameter(gl.CURRENT_PROGRAM);
    return [...gl.getUniform(program, gl.getUniformLocation(program, "uWaveColor"))];
  });
  const light = await colors();
  await expect(page.locator(".typing-name-text")).toHaveText("Asarya\nJachred Alotia");
  await page.screenshot({ path: testInfo.outputPath("waves-light.png") });
  const canvas = await waves.locator("canvas").elementHandle();
  await page.getByRole("button", { name: "Ganti tema", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect.poll(colors).not.toEqual(light);
  expect(await canvas.evaluate(element => element === document.querySelector(".gradient-waves canvas"))).toBe(true);
  await page.evaluate(() => Promise.all(document.documentElement.getAnimations({ subtree: true }).filter(animation => animation.effect?.pseudoElement).map(animation => animation.finished.catch(() => {}))));
  await page.screenshot({ path: testInfo.outputPath("waves-dark.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => waves.locator("canvas").evaluate(canvas => canvas.width)).toBe(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("waves-mobile.png") });
  expect(errors).toEqual([]);
});

test("waves stop animating when reduced motion is requested", async ({ page }) => {
  await trackWaves(page);
  await page.goto(baseURL);
  await expect.poll(() => page.evaluate(() => window.waveFrames || 0)).toBeGreaterThan(5);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(200);
  const frames = await page.evaluate(() => window.waveFrames);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.waveFrames)).toBe(frames);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(() => page.evaluate(() => window.waveFrames)).toBeGreaterThan(frames + 2);
});

test("waves retain a CSS fallback after WebGL context loss", async ({ page }) => {
  await page.goto(baseURL);
  const canvas = page.locator(".gradient-waves canvas");
  await expect(canvas).toHaveCount(1);
  await canvas.evaluate(element => element.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext());
  await expect(canvas).toHaveCSS("visibility", "hidden");
  await expect(page.locator(".gradient-waves")).not.toHaveCSS("background-image", "none");
  await expect(page.locator("#about h1")).toBeVisible();
});
