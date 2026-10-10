import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test.use({ channel: "msedge" });

const require = createRequire(import.meta.url);
const module = { exports: {} };
const compiled = ts.transpileModule(readFileSync(new URL("../app/education-logo.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(compiled, {
  module, exports: module.exports,
  require: name => name.endsWith(".css") ? undefined : require(name),
});
const EducationLogo = module.exports.default;
const css = ["globals.css", "refinements.css", "education-logo.css", "admin/admin.css"]
  .map(path => readFileSync(new URL(`../app/${path}`, import.meta.url), "utf8")).join("\n");
const url = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="gold"/></svg>');

test("logo zoom exceeds 100% with global styles and stays inside its crop", async ({ page }) => {
  for (const [width, admin, size] of [[1200, false, 128], [390, false, 72], [390, true, 128]]) {
    await page.setViewportSize({ width, height: 600 });
    for (const scale of [40, 100, 150, 200, 300]) {
      const entry = { institution: "Zoom test", logo: { url }, logoDisplay: { scale, x: 0, y: 50 } };
      const logo = renderToStaticMarkup(createElement(EducationLogo, { entry }));
      await page.setContent(`<style>${css} body{padding:40px}</style><div class="${admin ? "admin-education-logo" : ""}">${logo}</div>`);
      const metrics = await page.locator(".education-logo").evaluate(element => {
        const image = element.querySelector("img").getBoundingClientRect();
        const box = element.getBoundingClientRect();
        return {
          boxWidth: box.width, boxHeight: box.height, imageWidth: image.width, imageHeight: image.height,
          outsideHit: !!document.elementFromPoint(box.right + 1, box.y + box.height / 2)?.closest(".education-logo"),
          pageOverflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      const context = `${admin ? "admin" : "public"} ${width}px at ${scale}%`;
      expect(metrics.boxWidth, context).toBe(size);
      expect(metrics.boxHeight, context).toBe(size);
      expect(metrics.imageWidth, context).toBeCloseTo(size * scale / 100, 1);
      expect(metrics.imageHeight, context).toBeCloseTo(size * scale / 100, 1);
      expect(metrics.outsideHit, context).toBe(false);
      expect(metrics.pageOverflow, context).toBe(false);
    }
  }
});
