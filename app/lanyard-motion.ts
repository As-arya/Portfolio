export const anchorHeight = 4.5;
export const ropeLength = 1.23;
export const cardAnchorOffset = 1.45;
export function clampDragPoint(x: number, y: number, z: number): [number, number, number] {
  // Let the card leave the canvas, but cap extreme pulls before physics resumes.
  return [
    Math.max(-4, Math.min(4, x)),
    Math.max(-5.5, Math.min(3.8, y)),
    Math.max(-2, Math.min(2, z)),
  ];
}
// Fold the rope above its anchor; even the bottom of the card starts off-camera.
export const dropPositions: [number, number, number][] = [
  [0.2, 5.4, 0],
  [0.4, 6.2, 0],
  [0.6, 7, 0],
  [0.6, 5.55, 0],
];
export function canResetLanyard(
  scrollY: number,
  stageTop: number,
  viewportHeight: number,
) {
  return scrollY <= 2 && stageTop >= viewportHeight;
}
