import test from "node:test";
import assert from "node:assert/strict";
import { parseContributions } from "../app/github-contributions.ts";

test("parses GitHub contribution cells in date order", () => {
  const html = '<td data-date="2026-09-28" data-level="2"></td><tool-tip>3 contributions on September 28th.</tool-tip>'
    + '<td data-date="2026-09-27" data-level="0"></td><tool-tip>No contributions on September 27th.</tool-tip>';
  assert.deepEqual(parseContributions(html), [
    { date: "2026-09-27", level: 0, count: 0 },
    { date: "2026-09-28", level: 2, count: 3 },
  ]);
});
