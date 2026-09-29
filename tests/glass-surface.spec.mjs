import { test, expect } from "@playwright/test";

test.use({ channel: "msedge" });

test("responsive navigation, activity, and project reveal stay usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const days = Array.from({ length: 365 }, (_, index) => ({
    date: new Date(Date.UTC(2025, 8, 29 + index)).toISOString().slice(0, 10),
    count: index === 2 ? 5 : index === 364 ? 2 : 0,
    level: index === 2 ? 3 : index === 364 ? 2 : 0,
  }));
  await page.route("**/api/github-contributions", (route) =>
    route.fulfill({ json: { days } }),
  );
  await page.goto("http://127.0.0.1:3000");
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });

  await expect(page.locator(".navbar .glass-surface")).toBeVisible();
  await expect(page.locator(".hero-intro .glass-surface")).toBeVisible();
  await expect(page.getByRole("button", { name: /Jeda animasi|Pause animation/ })).toHaveCount(0);
  await expect.poll(() => page.locator(".navbar .glass-surface").evaluate((element) => getComputedStyle(element).backdropFilter)).toContain("url(");
  await page.getByRole("button", { name: /Menu navigasi|Navigation menu/ }).click();
  await expect(page.locator("#navigation")).toBeVisible();
  await page.locator("#navigation").getByRole("link", { name: "Technology" }).click();
  await expect(page.locator("#navigation")).toBeHidden();
  await expect(page.getByRole("heading", { name: "Technology." })).toBeVisible();
  await expect(page.locator(".logo-loop")).toHaveCount(3);
  await expect(page.locator(".logo-loop--reverse")).toHaveCount(1);
  await expect(page.locator(".logo-loop-list").first()).toContainText("Figma");
  await expect(page.locator(".activity-pixel canvas")).toHaveCount(1);
  await expect(page.getByRole("img", { name: /Grafik kontribusi GitHub satu tahun terakhir/ })).toBeVisible();
  await expect(page.locator(".github-activity-grid .activity-level-2")).toHaveCount(1);
  await expect(page.locator(".github-activity-grid span[title]")).toHaveCount(365);
  await expect(page.locator(".github-activity-grid span[title]").first()).toHaveAttribute("title", /^2025-09-29:/);
  await expect(page.locator(".activity-metric-main .eyebrow")).toHaveText("365 HARI TERAKHIR");
  await expect(page.locator(".activity-metric-main strong span")).toHaveAttribute("aria-label", "7");
  const calendar = page.locator(".activity-calendar-scroll");
  await expect(calendar).toHaveCSS("scrollbar-width", "none");
  await calendar.click();
  const bounds = await calendar.boundingBox();
  expect(bounds).not.toBeNull();
  const mobileStart = await calendar.evaluate((element) => element.scrollLeft);
  expect(mobileStart).toBeGreaterThan(0);
  await page.mouse.move(bounds.x + 20, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width - 20, bounds.y + bounds.height / 2);
  await page.mouse.up();
  expect(await calendar.evaluate((element) => element.scrollLeft)).toBeLessThan(mobileStart);
  await expect(page.locator('#about .social-link[aria-label="GitHub"]')).toHaveAttribute("href", "https://github.com/As-arya");
  await expect(page.locator('#about .social-link[aria-label="Instagram"]')).toHaveAttribute("href", "https://www.instagram.com/ary_alotia/");
  await expect(page.locator('#about .social-link[aria-label="LinkedIn"]')).toHaveAttribute("href", "https://www.linkedin.com/in/asarya-alotia-29i/");
  const initialProjects = await page.locator(".project-list article").count();
  expect(initialProjects).toBeGreaterThan(0);
  expect(initialProjects).toBeLessThanOrEqual(3);
  await expect(page.locator(".project-row-faded")).toHaveCount(1);
  await expect(page.locator(".more-projects-toggle svg")).toHaveCSS("border-top-width", "0px");
  await page.getByRole("button", { name: "Lihat lainnya" }).click();
  await expect(page.locator(".project-row-faded")).toHaveCount(0);
  const expandedProjects = await page.locator(".project-list article").count();
  expect(expandedProjects).toBeGreaterThanOrEqual(initialProjects);
  if (expandedProjects === initialProjects) await expect(page.getByText("Proyek lainnya sedang disiapkan.")).toBeVisible();
  await page.getByRole("button", { name: "Tampilkan lebih sedikit" }).click();
  await expect(page.locator(".project-list article")).toHaveCount(initialProjects);
  await expect(page.getByText("Proyek lainnya sedang disiapkan.")).toBeHidden();
  await page.setViewportSize({ width: 1532, height: 900 });
  await page.reload();
  await expect(page.locator(".github-activity-grid span[title]")).toHaveCount(365);
  expect(await page.locator(".github-activity-grid span").first().evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(23);
  const desktopRange = await calendar.evaluate((element) => ({ left: element.scrollLeft, max: element.scrollWidth - element.clientWidth }));
  expect(desktopRange.max).toBeGreaterThan(0);
  expect(desktopRange.left).toBeGreaterThanOrEqual(desktopRange.max - 1);
  await calendar.scrollIntoViewIfNeeded();
  const desktopStart = await calendar.evaluate((element) => element.scrollLeft);
  expect(desktopStart).toBeGreaterThan(0);
  const desktopBounds = await calendar.boundingBox();
  expect(desktopBounds).not.toBeNull();
  await page.mouse.move(desktopBounds.x + 20, desktopBounds.y + desktopBounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(desktopBounds.x + desktopBounds.width - 20, desktopBounds.y + desktopBounds.height / 2);
  await page.mouse.up();
  expect(await calendar.evaluate((element) => element.scrollLeft)).toBeLessThan(desktopStart);
  await expect(page.locator("#projects h2")).toHaveText("Selected projects.");
  await expect(page.locator("#contact h2")).toHaveText("Let’s connect.");
  await expect(page.locator('#contact input[name="name"]')).toHaveAttribute("placeholder", "John Doe");
  await expect(page.locator('#contact input[name="email"]')).toHaveAttribute("placeholder", "john.doe@example.com");
  await page.getByRole("button", { name: "Change language to English" }).click();
  await expect(page.locator("#projects h2")).toHaveText("Selected projects.");
  await expect(page.locator("#contact h2")).toHaveText("Let’s connect.");
});
