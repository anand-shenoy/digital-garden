// Hand built models of the buildings locals steer by. Each has a massing model, always shown, and fine detail
// (battlements, columns, windows, signs) that appears as the camera comes close.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { alongEdges, facadeSide } from './shapes.js';
import { pointAt } from './timetable.js';
import { RAIL_Y } from './rail.js';

// Buildings drawn here instead of as plain blocks, with the roof height pins should stand on.
export const LANDMARK_ROOF = { 'Chelmsford Cathedral': 19, 'Shire Hall': 18 };
const NEAR = 520, FAR = 580; // detail shows inside NEAR metres of the camera and hides beyond FAR

const mat = color => new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0 });
const M = { flint: mat(0xcfc6b6), stone: mat(0xf4ecdc), lead: mat(0x9aa0a6), dark: mat(0x3b352e),
            brick: mat(0xece0c8), bronze: mat(0x5e6b5f) };

// A box of size w x h x d whose base centre sits at (x, y, z) in the model's own frame, turned by ry.
function box(w, h, d, x, y, z, ry = 0) {
  const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0);
  if (ry) g.rotateY(ry);
  return g.translate(x, y, z);
}
function cyl(rTop, rBot, h, seg, x, y, z) { const g = new THREE.CylinderGeometry(rTop, rBot, h, seg); return g.translate(x, y + h / 2, z); }
function prism(w, h, d, x, y, z) { // a triangular gable or pediment, w wide, h high, d deep (along local z)
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); return g.translate(x, y, z - d / 2);
}
function ridge(len, w, h, x, y, z) { // a long pitched roof running along local x
  const g = prism(w, h, len, 0, 0, 0); g.rotateY(Math.PI / 2); return g.translate(x, y, z);
}
function footprint(p, h) { // a building footprint (world coordinates) raised to h
  const s = new THREE.Shape(); p.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2); return g;
}
const merlons = (outline, y, size = 0.7, spacing = 1.5) =>
  alongEdges(outline, spacing).map(([x, z, a]) => box(size, size * 1.2, size * 0.7, x, y, z, -a));

// Gather geometry by material, then merge into one mesh per material plus one set of edge lines.
function assemble(parts, lineMat, { shadows = true } = {}) {
  const group = new THREE.Group(), byMat = new Map(), edges = [];
  for (const [m, g] of parts) {
    const flat = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(flat.attributes)) if (k !== 'position' && k !== 'normal') flat.deleteAttribute(k);
    (byMat.get(m) || byMat.set(m, []).get(m)).push(flat);
    edges.push(new THREE.EdgesGeometry(flat, 25));
  }
  for (const [m, gs] of byMat) {
    const mesh = new THREE.Mesh(mergeGeometries(gs), m);
    mesh.castShadow = shadows; mesh.receiveShadow = true; group.add(mesh);
  }
  const lines = new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(mergeGeometries(edges)), lineMat);
  lines.renderOrder = 2; group.add(lines);
  return group;
}
// Put a model built in its own frame (x along its main axis, z out of its front) at a world position and heading.
function frame(group, x, z, angle) { group.position.set(x, 0, z); group.rotation.y = -angle; return group; }

function cathedral(b, lineMat) {
  // Nave runs a little south of east. The 15th century west tower carries the 1749 octagonal lantern and needle spire.
  const a = 0.1155, T = { x: 211.8, z: 44.3 }, TW = 9.5, TH = 23;
  const toLocal = ([x, z]) => { const dx = x - T.x, dz = z - T.z; return [dx * Math.cos(a) + dz * Math.sin(a), -dx * Math.sin(a) + dz * Math.cos(a)]; };
  const body = b.p.map(toLocal); // the mapped outline, in the model's frame
  const sq = [[-TW / 2, -TW / 2], [TW / 2, -TW / 2], [TW / 2, TW / 2], [-TW / 2, TW / 2], [-TW / 2, -TW / 2]];
  const clere = [[TW / 2, -6], [38, -6], [38, 6], [TW / 2, 6], [TW / 2, -6]];
  const s = new THREE.Shape(); body.forEach(([u, v], i) => (i ? s.lineTo(u, -v) : s.moveTo(u, -v)));
  const walls = new THREE.ExtrudeGeometry(s, { depth: 11, bevelEnabled: false }); walls.rotateX(-Math.PI / 2);
  const massing = [
    [M.flint, walls],
    [M.flint, box(38 - TW / 2, 5.5, 12, (38 + TW / 2) / 2, 11, 0)],          // clerestory
    [M.lead, ridge(38 - TW / 2, 12, 2, (38 + TW / 2) / 2, 16.5, 0)],        // low pitched nave roof
    [M.flint, box(TW, TH, TW, 0, 0, 0)],                                    // tower
    [M.stone, cyl(2.8, 2.8, 4.5, 8, 0, TH, 0)],                             // octagonal lantern
    [M.lead, cyl(3.1, 3.1, 0.5, 8, 0, TH + 4.5, 0)],
    [M.lead, cyl(0.05, 1.6, 8.2, 8, 0, TH + 5, 0)],                         // needle spire
  ];
  const detail = [
    ...merlons(sq, TH).map(g => [M.stone, g]),
    ...merlons(clere, 16.5, 0.6).map(g => [M.stone, g]),
    ...merlons(body, 11, 0.6, 1.7).map(g => [M.stone, g]),
    ...[[-1, -1], [1, -1], [1, 1], [-1, 1]].flatMap(([i, j]) => [                 // corner pinnacles
      [M.stone, box(0.8, 2.2, 0.8, i * (TW / 2 - 0.4), TH, j * (TW / 2 - 0.4))],
      [M.stone, cyl(0.02, 0.45, 1.4, 4, i * (TW / 2 - 0.4), TH + 2.2, j * (TW / 2 - 0.4))]]),
    [M.dark, box(0.12, 5, 3, -TW / 2 - 0.06, 5.5, 0)],                             // great west window
    [M.dark, box(0.12, 3.2, 2.2, -TW / 2 - 0.06, 0, 0)],                            // west door
    ...[0, 1, 2, 3].flatMap(k => [-1.4, 1.4].map(o => {                             // paired belfry openings
      const g = box(1.1, 3.4, 0.12, o, 17.5, TW / 2 + 0.06); g.rotateY(k * Math.PI / 2); return [M.dark, g]; })),
    ...[...Array(8).keys()].map(k => {                                              // lantern openings
      const g = box(1, 2.6, 0.12, 0, TH + 0.9, 2.7); g.rotateY(k * Math.PI / 4 + Math.PI / 8); return [M.dark, g]; }),
    ...[-1, 1].flatMap(side => [...Array(8).keys()].map(k =>                         // clerestory windows
      [M.dark, box(2, 3, 0.12, TW / 2 + 3 + k * 4, 12.2, side * 6.06)])),
    [M.lead, cyl(0.06, 0.06, 1.8, 4, 0, TH + 13.2, 0)], [M.lead, box(1.2, 0.3, 0.1, 0.3, TH + 14.4, 0)], // weathervane
  ];
  return { at: [T.x, T.z], massing: frame(assemble(massing, lineMat), T.x, T.z, a), detail: frame(assemble(detail, lineMat, { shadows: false }), T.x, T.z, a) };
}

function shireHall(b, lineMat) {
  // 1791, John Johnson. Portland stone front facing down the High Street: rusticated ground floor with three arched
  // entrances, four Ionic columns carrying a pediment, and three Coade stone relief panels between them.
  const f = facadeSide(b.p, [283, 124]), H = 17, FW = Math.min(f.len, 26); // the stone front is narrower than the whole plan
  const angle = Math.atan2(-f.normal[0], f.normal[1]); // local x runs along the front, local z points out of it
  const [ox, oz] = f.mid;
  const toLocal = ([x, z]) => { const dx = x - ox, dz = z - oz, c = Math.cos(angle), s = Math.sin(angle); return [dx * c + dz * s, -dx * s + dz * c]; };
  const local = b.p.map(toLocal);
  const s = new THREE.Shape(); local.forEach(([u, v], i) => (i ? s.lineTo(u, -v) : s.moveTo(u, -v)));
  const walls = new THREE.ExtrudeGeometry(s, { depth: H, bevelEnabled: false }); walls.rotateX(-Math.PI / 2);
  const cols = [-5.4, -1.8, 1.8, 5.4];
  const massing = [
    [M.brick, walls],
    [M.stone, box(FW, H, 0.6, 0, 0, 0.3)],                      // stone front
    [M.stone, box(14.4, 1.2, 1.8, 0, H - 1.2, 0.9)],               // entablature over the columns
    [M.stone, prism(14.4, 3.2, 1.8, 0, H, 0.9)],                   // pediment
    [M.stone, box(FW + 0.4, 0.6, 1, 0, H - 0.6, 0.5)],          // cornice
  ];
  const arch = x => { const sh = new THREE.Shape(); sh.moveTo(-1.1, 0); sh.lineTo(1.1, 0); sh.lineTo(1.1, 3); sh.absarc(0, 3, 1.1, 0, Math.PI, false); sh.closePath();
    return new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false }).translate(x, 0, 0.62); };
  const detail = [
    ...cols.flatMap(x => [[M.stone, cyl(0.5, 0.55, 9.4, 14, x, 6.2, 1.2)], [M.stone, box(1.4, 0.5, 1.4, x, 15.6, 1.2)], [M.stone, box(1.3, 0.4, 1.3, x, 5.8, 1.2)]]),
    [M.stone, box(FW, 0.3, 1, 0, 5.8, 0.5)],                                       // band over the ground floor
    ...[1.4, 2.8, 4.2].map(y => [M.dark, box(FW - 0.2, 0.08, 0.1, 0, y, 0.64)]),  // rusticated joints
    ...[-3.6, 0, 3.6].map(x => [M.dark, arch(x)]),                                    // three arched entrances
    ...[-3.6, 0, 3.6].map(x => [M.dark, box(1.6, 3.4, 0.1, x, 7, 0.65)]),           // first floor windows
    ...[-3.6, 0, 3.6].map(x => [M.stone, box(2.2, 1.8, 0.25, x, 12.4, 0.7)]),        // relief panels
    ...[-9.5, 9.5].flatMap(x => [6.8, 11.6].map(y => [M.dark, box(1.4, 2.8, 0.1, x, y, 0.65)])),
  ];
  // Judge Tindal's seated statue on its plinth in Tindal Square, in front of the hall.
  const st = new THREE.Group();
  const statue = assemble([[M.stone, box(2.4, 2.6, 2.4, 0, 0, 0)], [M.stone, box(2.8, 0.4, 2.8, 0, 0, 0)],
    [M.bronze, box(1.1, 1.3, 1.3, 0, 2.6, 0)], [M.bronze, box(0.9, 0.7, 0.6, 0, 2.6, 0.75)],
    [M.bronze, new THREE.SphereGeometry(0.35, 12, 8).translate(0, 4.25, 0)]], lineMat, { shadows: false });
  st.add(frame(statue, 248, 127, angle));
  const det = frame(assemble(detail, lineMat, { shadows: false }), ox, oz, angle);
  const g = new THREE.Group(); g.add(det, st);
  return { at: [ox, oz], massing: frame(assemble(massing, lineMat), ox, oz, angle), detail: g };
}

function stationSigns(track, lineMat) {
  // Station name boards along both platforms, so the station is named when you are close enough to read it.
  const c = document.createElement('canvas'); c.width = 512; c.height = 96; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#1d1d1b'; g.font = '600 58px system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Chelmsford', 256, 50);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const face = new THREE.MeshBasicMaterial({ map: tex });
  const group = new THREE.Group(), posts = [];
  for (const ds of [-90, -30, 30, 90]) for (const side of [-1, 1]) {
    const q = pointAt(track, track.stationS + ds), nx = -Math.sin(q.angle), nz = Math.cos(q.angle), o = side * 8.6;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.95), face);
    const sign = new THREE.Group(); sign.position.set(q.x + nx * o, RAIL_Y + 1, q.z + nz * o); sign.rotation.y = -q.angle;
    board.position.set(0, 2.6, side * -0.06); if (side > 0) board.rotation.y = Math.PI; // face the track
    const back = board.clone(); back.rotation.y += Math.PI; back.position.z *= -1;
    sign.add(board, back); group.add(sign);
    for (const px of [-2, 2]) posts.push(box(0.15, 2.6, 0.15, px, 0, 0).applyMatrix4(new THREE.Matrix4().compose(sign.position, sign.quaternion, sign.scale)));
  }
  group.add(assemble(posts.map(p => [M.dark, p]), lineMat, { shadows: false }));
  const st = pointAt(track, track.stationS);
  return { at: [st.x, st.z], massing: new THREE.Group(), detail: group };
}

export function createLandmarks(scene, town, lineMat) {
  const list = [];
  const named = n => town.buildings.find(b => b.name === n);
  if (named('Chelmsford Cathedral')) list.push(cathedral(named('Chelmsford Cathedral'), lineMat));
  if (named('Shire Hall')) list.push(shireHall(named('Shire Hall'), lineMat));
  list.push(stationSigns(town.railway, lineMat));
  for (const l of list) { scene.add(l.massing, l.detail); l.detail.visible = false; }
  const v = new THREE.Vector3();
  function update(camera) {
    for (const l of list) {
      const d = camera.position.distanceTo(v.set(l.at[0], 10, l.at[1]));
      if (l.detail.visible ? d > FAR : d < NEAR) l.detail.visible = !l.detail.visible;
    }
  }
  return { update };
}
