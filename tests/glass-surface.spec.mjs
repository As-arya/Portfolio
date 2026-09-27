import { test, expect } from "@playwright/test";

test.use({ channel: "msedge" });

test("mobile navigation, technology, activity, and project reveal stay usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("https://github-contributions-api.jogruber.de/v4/As-arya?y=last", (route) =>
    route.fulfill({
      json: {
        total: { lastYear: 2 },
        contributions: [
          { date: "2026-09-26", count: 0, level: 0 },
          { date: "2026-09-27", count: 2, level: 2 },
        ],
      },
    }),
  );
  await page.goto("http://127.0.0.1:3000");
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });

  await expect(page.locator(".navbar .glass-surface")).toBeVisible();
  await expect(page.locator(".hero-intro .glass-surface")).toBeVisible();
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
  await expect(page.getByRole("img", { name: "2 kontribusi GitHub dalam 365 hari terakhir" })).toBeVisible();
  await page.locator(".activity-metric-main").scrollIntoViewIfNeeded();
  await expect(page.locator(".activity-metric-main strong")).toHaveText("2");
  await expect(page.locator(".activity-metric-pair strong").first()).toHaveText("1");
  await expect(page.locator(".activity-metric-pair strong").last()).toHaveText("50%");
  await expect(page.locator(".github-activity a")).toHaveCount(0);
  await expect(page.locator(".project-list article")).toHaveCount(3);
  await page.getByRole("button", { name: "Lihat lainnya" }).click();
  await expect(page.getByText("Proyek lainnya sedang disiapkan.")).toBeVisible();
  await page.getByRole("button", { name: "Tampilkan lebih sedikit" }).click();
  await expect(page.getByText("Proyek lainnya sedang disiapkan.")).toBeHidden();
});
