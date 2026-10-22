// The raised railway: brick arches on the mapped viaduct spans, a girder deck on bridges, grassy embankment elsewhere.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { pointAt } from './timetable.js';
import { RAIL_Y, railRuns } from './rail.js';

const BAY = 9; // metres per arch
const widthAt = (track, s) => (Math.abs(s - track.stationS) < 130 ? 22 : 10); // wider through the station for the platforms

function archBay(len, width) {
  // One arch seen side on: a pier each side, a round arch between, solid brick up to the deck. Extruded across the line.
  const r = Math.min(3, len / 2 - 1.2), spring = RAIL_Y - r - 1.2, s = new THREE.Shape();
  s.moveTo(-len / 2, 0); s.lineTo(-r, 0); s.lineTo(-r, spring);
  s.absarc(0, spring, r, Math.PI, 0, true);
  s.lineTo(r, 0); s.lineTo(len / 2, 0); s.lineTo(len / 2, RAIL_Y); s.lineTo(-len / 2, RAIL_Y); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false, curveSegments: 8 });
  g.translate(0, 0, -width / 2);
  return g;
}
const place = (g, q) => g.applyMatrix4(new THREE.Matrix4().makeRotationY(-q.angle).setPosition(q.x, 0, q.z));

function parapets(q, len, width) {
  return [-1, 1].map(side => {
    const b = new THREE.BoxGeometry(len, 1, 0.5);
    b.translate(0, RAIL_Y + 0.5, side * (width / 2 - 0.25));
    return place(b, q);
  });
}

function bank(track, s0, s1) {
  // Trapezoid embankment, 10 m wide on top, 22 m at the foot. Flat shaded faces, so each slope reads clearly.
  const pos = [], idx = [], step = 6, n = Math.max(1, Math.round((s1 - s0) / step));
  for (let i = 0; i <= n; i++) {
    const q = pointAt(track, s0 + (s1 - s0) * i / n), nx = -Math.sin(q.angle), nz = Math.cos(q.angle);
    const at = (o, y) => [q.x + nx * o, y, q.z + nz * o];
    pos.push(...at(-11, 0), ...at(-5, RAIL_Y), ...at(-5, RAIL_Y), ...at(5, RAIL_Y), ...at(5, RAIL_Y), ...at(11, 0));
    if (i) for (let f = 0; f < 3; f++) {
      const a = (i - 1) * 6 + f * 2, b = i * 6 + f * 2;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function buildRailway(track) {
  const brick = [], grass = [];
  for (const run of railRuns(track.length, track.spans || [])) {
    const len = run.s1 - run.s0;
    if (run.kind === 'bank') { grass.push(bank(track, run.s0, run.s1)); continue; }
    if (run.kind === 'bridge') { // a plain girder deck over the road
      const q = pointAt(track, run.s0 + len / 2), w = widthAt(track, run.s0 + len / 2);
      const d = new THREE.BoxGeometry(len, 1.4, w); d.translate(0, RAIL_Y - 0.7, 0);
      brick.push(place(d, q), ...parapets(q, len, w));
      continue;
    }
    const n = Math.max(1, Math.round(len / BAY)), bay = len / n;
    for (let i = 0; i < n; i++) {
      const s = run.s0 + bay * (i + 0.5), q = pointAt(track, s), w = widthAt(track, s);
      brick.push(place(archBay(bay + 0.3, w), q), ...parapets(q, bay + 0.3, w));
    }
  }
  const nonIndexed = gs => gs.map(g => (g.index ? g.toNonIndexed() : g));
  const strip = g => { for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k); return g; };
  return { brick: mergeGeometries(nonIndexed(brick).map(strip)), grass: grass.length ? mergeGeometries(grass) : null };
}
