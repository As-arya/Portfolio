import { test, expect } from "@playwright/test";

test.use({ channel: "msedge", viewport: { width: 1908, height: 900 } });

test("section animations replay and project effects remain interactive", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("portfolio-language", "en"));
  await page.goto("http://127.0.0.1:3000");
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });

  const name = page.locator(".typing-name-text");
  await page.locator('.nav-links a[href="#about"]').click();
  await expect(page).toHaveURL(/#about$/);
  await expect(name).toHaveText("Asarya\nJachred Alotia");
  const about = page.locator("#about");
  await about.evaluate((section) => {
    const bounds = section.getBoundingClientRect();
    scrollTo({ top: scrollY + bounds.top + bounds.height / 2 - innerHeight * 0.75, behavior: "instant" });
  });
  await expect.poll(() => page.locator(".scroll-reveal-word").evaluateAll((words) =>
    Math.max(...words.map((word) => Number(getComputedStyle(word).opacity))),
  )).toBeLessThan(0.2);
  await about.evaluate((section) => section.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect.poll(() => page.locator(".scroll-reveal-word").last().evaluate((word) => getComputedStyle(word).opacity)).toBe("1");
  expect(await page.locator(".scroll-reveal").evaluate((paragraph) => getComputedStyle(paragraph).fontWeight)).toBe("650");
  await expect(page.locator(".social-links")).toBeVisible();
  await expect(page.locator(".about-facts")).toBeVisible();
  expect(await page.locator(".scroll-reveal-word").first().evaluate((word) => getComputedStyle(word).filter)).toBe("none");
  expect(await page.locator(".scroll-reveal").evaluate((paragraph) => getComputedStyle(paragraph).transform)).toBe("none");
  expect(await page.locator(".typing-name").evaluate((heading) => heading.style.opacity)).toBe("");
  await page.locator("#projects").scrollIntoViewIfNeeded();
  await expect(name).toBeEmpty();
  await page.locator('.nav-links a[href="#about"]').click();
  await expect(name).toHaveText("Asarya\nJachred Alotia");

  const title = page.locator(".decrypted-text-animated");
  await title.scrollIntoViewIfNeeded();
  await expect(title).toHaveText("Technology");
  const skillLinks = page.locator(".logo-loop-list:first-child .technology-logo");
  await expect(skillLinks).toHaveCount(22);
  await expect.poll(() => skillLinks.evaluateAll((links) => links.every((link) =>
    link.href.startsWith("https://") && link.querySelector("img")?.naturalWidth > 0,
  ))).toBe(true);
  await expect(page.getByRole("link", { name: "Flutter" })).toHaveAttribute("href", "https://flutter.dev/");
  await page.locator(".decrypted-text").hover();
  await expect.poll(() => title.textContent()).not.toBe("Technology");
  await expect(title).toHaveText("Technology");

  const card = page.locator(".pixel-card").first();
  await card.hover();
  await expect.poll(() => card.locator("canvas").evaluate((canvas) => {
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    return data.some((value, index) => index % 4 === 3 && value > 0);
  })).toBe(true);
  await card.locator("button").scrollIntoViewIfNeeded();
  const projectScroll = await page.evaluate(() => scrollY);
  await card.locator("button").click();
  const dialog = page.locator(".project-dialog");
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => scrollY)).toBe(projectScroll);
  await expect(dialog.locator(".dialog-pixel canvas")).toHaveCount(1);
  await dialog.locator(".dialog-close").click();
  expect(await page.evaluate(() => scrollY)).toBe(projectScroll);

  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect(page.locator(".contact-pixel canvas")).toHaveCount(1);
});
