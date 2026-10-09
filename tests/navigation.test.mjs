import assert from "node:assert/strict";
import { activeSection } from "../app/navigation.ts";

const sections = [
  { id: "about", top: 160 },
  { id: "education", top: 1512 },
  { id: "skill", top: 1712 },
  { id: "projects", top: 2512 },
  { id: "certificates", top: 3012 },
  { id: "contact", top: 4012 },
];
assert.equal(activeSection(sections, 100), "about");
assert.equal(activeSection(sections, 911), "about");
assert.equal(activeSection(sections, 912), "about");
assert.equal(activeSection(sections, 1712), "skill");
assert.equal(activeSection(sections, 1512), "education");
assert.equal(activeSection(sections, 3012), "certificates");
assert.equal(activeSection(sections, 4012), "contact");
assert.equal(
  activeSection(sections, 100),
  "about",
  "returning to the top selects About",
);
console.log("Navigation boundaries passed.");
