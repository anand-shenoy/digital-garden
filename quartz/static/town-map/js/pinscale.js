// Pins keep their size when zoomed out and shrink to half as the camera closes in, so they never swamp the buildings.
// dist is the camera's distance to the point it looks at, in metres.
export const PIN_NEAR = 300, PIN_FAR = 1500;
export function pinScale(dist) {
  const f = Math.min(1, Math.max(0, (dist - PIN_NEAR) / (PIN_FAR - PIN_NEAR)));
  return 0.5 + 0.5 * f;
}
