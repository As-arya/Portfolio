import assert from "node:assert/strict";
import {
  anchorHeight,
  ropeLength,
  cardAnchorOffset,
  dropPositions,
  canResetLanyard,
  clampDragPoint,
} from "../app/lanyard-motion.ts";

// Half-visible Home and a still-visible card must never trigger a teleport.
assert.equal(canResetLanyard(350, 400, 800), false);
assert.equal(canResetLanyard(3, 900, 800), false);
assert.equal(canResetLanyard(0, 799, 800), false);
assert.equal(canResetLanyard(0, 900, 800), true);
const cameraTop = 16 * Math.tan((24 * Math.PI) / 360);
assert.ok(anchorHeight > cameraTop, "strap anchor stays above the camera");
assert.ok(
  dropPositions[3][1] - 1.3 > cameraTop,
  "entire card starts above the frame",
);
let previous = [0, anchorHeight, 0];
for (const position of dropPositions.slice(0, 3)) {
  assert.ok(
    Math.hypot(...position.map((n, i) => n - previous[i])) <= ropeLength,
    "folded starting rope must not violate its joints",
  );
  previous = position;
}
assert.ok(Math.abs(dropPositions[2][1] - dropPositions[3][1] - cardAnchorOffset) < 1e-9);
assert.deepEqual(clampDragPoint(1, 2, 0), [1, 2, 0]);
assert.ok(Math.abs(clampDragPoint(0, -0.6, 0)[1] + 0.6) < 1e-9);
assert.ok(clampDragPoint(0, -5, 0)[1] < -cameraTop - 1.3, "card can leave the canvas completely");
const drag = clampDragPoint(100, -100, 100);
assert.deepEqual(drag, [4, -5.5, 2]);
console.log("Lanyard reset visibility and drop geometry passed.");
