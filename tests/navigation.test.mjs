import assert from "node:assert/strict";
import { activeSection } from "../app/navigation.ts";

const sections = [
  { id: "home", top: 0 },
  { id: "about", top: 912 },
  { id: "skill", top: 1712 },
  { id: "projects", top: 2512 },
  { id: "contact", top: 4012 },
];
assert.equal(activeSection(sections, 100), "home");
assert.equal(activeSection(sections, 911), "home");
assert.equal(activeSection(sections, 912), "about");
assert.equal(activeSection(sections, 1712), "skill");
assert.equal(activeSection(sections, 4012), "contact");
assert.equal(
  activeSection(sections, 100),
  "home",
  "returning to Home resets highlight",
);
console.log("Navigation boundaries passed.");
