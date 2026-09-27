export const anchorHeight = 4.5;
export const ropeLength = 1.23;
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
