import assert from "node:assert/strict";
import {
  anchorHeight,
  springRestLength,
  springStiffness,
  jointMass,
  cardAnchorOffset,
  maxDragReach,
  maxRopeSegment,
  dropPositions,
  canResetLanyard,
  clampDragPoint,
} from "../app/lanyard-motion.ts";

// Half-visible Home and a still-visible card must never trigger a teleport.
assert.equal(canResetLanyard(350, 400, 800), false);
assert.equal(canResetLanyard(3, 900, 800), false);
assert.equal(canResetLanyard(0, 799, 800), false);
assert.equal(canResetLanyard(0, 900, 800), true);
const cameraTop = 20 * Math.tan((16 * Math.PI) / 360);
assert.ok(anchorHeight > cameraTop, "strap anchor stays above the camera");
assert.ok(
  dropPositions[3][1] - 1.3 > cameraTop,
  "entire card starts above the frame",
);
let previous = [0, anchorHeight, 0];
for (const position of dropPositions.slice(0, 3)) {
  assert.ok(
    Math.hypot(...position.map((n, i) => n - previous[i])) <= maxRopeSegment,
    "folded starting rope must not violate its joints",
  );
  previous = position;
}
assert.ok(Math.abs(dropPositions[2][1] - dropPositions[3][1] - cardAnchorOffset) < 1e-9);
assert.ok(springRestLength * 3 < maxDragReach);
assert.ok(maxDragReach < maxRopeSegment * 3);
assert.ok(
  springRestLength * springStiffness < jointMass * 40,
  "compressed springs cannot hold the folded rope above the anchor",
);
const attachmentOffset = { x: 0, y: cardAnchorOffset, z: 0 };
assert.deepEqual(clampDragPoint(1, 2, 0, attachmentOffset), [1, 2, 0]);
assert.ok(
  clampDragPoint(0, -100, 0, attachmentOffset)[1] < -cameraTop - 1.3,
  "the card can be pulled completely below its visible frame",
);
const drag = clampDragPoint(100, -100, 100, attachmentOffset);
assert.ok(drag.every(Number.isFinite), "far drags remain finite");
assert.ok(
  Math.abs(
    Math.hypot(drag[0], drag[1] + cardAnchorOffset - anchorHeight, drag[2]) -
      maxDragReach,
  ) < 1e-9,
  "far drags stop at the rope's maximum reach instead of resetting to the origin",
);
const rotatedOffset = { x: cardAnchorOffset, y: 0, z: 0 };
const rotatedDrag = clampDragPoint(-100, -100, -100, rotatedOffset);
assert.ok(
  Math.abs(
    Math.hypot(
      rotatedDrag[0] + rotatedOffset.x,
      rotatedDrag[1] - anchorHeight,
      rotatedDrag[2],
    ) - maxDragReach,
  ) < 1e-9,
  "rope reach uses the rotated card attachment",
);
console.log("Lanyard reset visibility, drop geometry, and drag constraint passed.");
