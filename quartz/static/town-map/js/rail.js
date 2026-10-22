// The railway through central Chelmsford runs raised, on brick viaduct arches and grassy embankment.
export const RAIL_Y = 6; // metres, top of the deck the trains run on

// Split the track into runs: the mapped viaduct and bridge spans, with embankment in between.
export function railRuns(length, spans) {
  const out = []; let s = 0;
  for (const sp of [...spans].sort((a, b) => a.s0 - b.s0)) {
    const s0 = Math.max(s, Math.min(sp.s0, length)), s1 = Math.min(sp.s1, length);
    if (s1 <= s0) continue;
    if (s0 > s) out.push({ s0: s, s1: s0, kind: 'bank' });
    out.push({ s0, s1, kind: sp.kind }); s = s1;
  }
  if (s < length) out.push({ s0: s, s1: length, kind: 'bank' });
  return out;
}
