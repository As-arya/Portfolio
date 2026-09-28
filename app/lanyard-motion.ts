export const anchorHeight = 4.5;
// Compression must not support the folded chain above the anchor.
export const springRestLength = 0.05;
export const springStiffness = 20;
export const jointMass = 0.1;
export const cardAnchorOffset = 1.45;
export const maxDragReach = 7.5;
// Leave room between the drag cap (7.5) and the three hard limits (8.1).
export const maxRopeSegment = 2.7;
export function clampDragPoint(
  x: number,
  y: number,
  z: number,
  attachmentOffset: { x: number; y: number; z: number },
): [number, number, number] {
  const px = Math.max(-20, Math.min(4, x));
  const py = Math.max(-20.5, Math.min(3.8, y));
  const pz = Math.max(-20, Math.min(2, z));
  const dx = px + attachmentOffset.x;
  const dy = py + attachmentOffset.y - anchorHeight;
  const dz = pz + attachmentOffset.z;
  const distance = Math.hypot(dx, dy, dz);
  if (distance <= maxDragReach) return [px, py, pz];
  const scale = maxDragReach / distance;
  return [
    dx * scale - attachmentOffset.x,
    anchorHeight + dy * scale - attachmentOffset.y,
    dz * scale - attachmentOffset.z,
  ];
}
// Fold the rope above its anchor; even the bottom of the card starts off-camera.
export const dropPositions: [number, number, number][] = [
  [0, 5.4, 0],
  [0, 6.2, 0],
  [0, 7, 0],
  [0, 5.55, 0],
];
export function canResetLanyard(
  scrollY: number,
  stageTop: number,
  viewportHeight: number,
) {
  return scrollY <= 2 && stageTop >= viewportHeight;
}
