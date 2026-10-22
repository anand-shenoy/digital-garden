// Pins that share a spot (several events at one venue) fan out on a small ring so each can be tapped.
export function spread(points, radius) {
  const groups = new Map();
  points.forEach(([x, z], i) => {
    const key = `${Math.round(x)}:${Math.round(z)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(i);
  });
  const out = points.map(p => [...p]);
  for (const idx of groups.values()) {
    if (idx.length < 2) continue;
    idx.forEach((i, k) => {
      const a = (k / idx.length) * Math.PI * 2;
      out[i] = [points[i][0] + Math.cos(a) * radius, points[i][1] + Math.sin(a) * radius];
    });
  }
  return out;
}
