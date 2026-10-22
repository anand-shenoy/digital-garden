// Height of the tallest building footprint containing a point (0 if none), so pins can stand on roofs.
function inside(p, x, z) {
  let ins = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, zi] = p[i], [xj, zj] = p[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins;
  }
  return ins;
}
export function roofAt(town, x, z) {
  let h = 0;
  for (const b of town.buildings) if (b.h > h && inside(b.p, x, z)) h = b.h;
  return h;
}
