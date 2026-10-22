// Small geometry helpers for the landmark models. Points are [x, z] in metres.

// Evenly spaced points along each edge of an outline (battlements, railings), as [x, z, edgeAngle].
export function alongEdges(points, spacing) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i], [bx, bz] = points[i + 1], len = Math.hypot(bx - ax, bz - az);
    const n = Math.floor(len / spacing);
    for (let k = 0; k < n; k++) {
      const f = (k + 0.5) / n;
      out.push([ax + (bx - ax) * f, az + (bz - az) * f, Math.atan2(bz - az, bx - ax)]);
    }
  }
  return out;
}

// The side of a footprint's bounding box that faces a point (a street or square): its middle, length and outward normal.
// Works on the box rather than single edges because fronts are often mapped as several short pieces.
export function facadeSide(points, toward) {
  const xs = points.map(p => p[0]), zs = points.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const sides = [
    { mid: [cx, z0], len: x1 - x0, normal: [0, -1] }, { mid: [cx, z1], len: x1 - x0, normal: [0, 1] },
    { mid: [x0, cz], len: z1 - z0, normal: [-1, 0] }, { mid: [x1, cz], len: z1 - z0, normal: [1, 0] }];
  // the side whose outward direction points most towards the point, measured from the centre
  const dx = toward[0] - cx, dz = toward[1] - cz;
  const score = s => (s.normal[0] * dx) / ((x1 - x0) / 2 || 1) + (s.normal[1] * dz) / ((z1 - z0) / 2 || 1);
  return sides.sort((a, b) => score(b) - score(a))[0];
}
