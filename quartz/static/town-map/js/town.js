import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { RAIL_Y } from './rail.js';
import { buildRailway } from './viaduct.js';
import { LANDMARK_ROOF } from './landmarks.js';

const PALETTE = { ground: 0xe0cdb2, street: 0xf6ede0, park: 0xa9c58c, water: 0x7fb0cc,
                  building: 0xf6e6d0, landmark: 0xecb98a, rail: 0x6f6a62, edge: 0x2e261e, brick: 0xc48466, bank: 0x9dbb82 };
// Flat layers sit slightly above the ground and use polygon offset so they never flicker into it.
const layerMat = (color, n) => new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -n, polygonOffsetUnits: -n });

function shapeFrom(p) {
  const s = new THREE.Shape();
  p.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  return s;
}
function flat(p, y, color) {
  const g = new THREE.ShapeGeometry(shapeFrom(p));
  g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
  return new THREE.Mesh(g, layerMat(color, 1));
}
// Clay look: a small random tint per building so the blocks read as hand made, not machine identical.
// (Wall-foot darkening was tried here and removed: walls only have top and bottom vertices, so it
// smeared into a gradient down the whole wall. The screen space occlusion pass does that job properly.)
function clay(g, h, tint) {
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    col[i * 3] = tint; col[i * 3 + 1] = tint; col[i * 3 + 2] = tint * 0.98;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
function ribbon(p, w, y) {
  const pos = [], idx = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
    let dx = b[0] - a[0], dz = b[1] - a[1]; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    pos.push(p[i][0] - dz * w / 2, y, p[i][1] + dx * w / 2, p[i][0] + dz * w / 2, y, p[i][1] - dx * w / 2);
    if (i) { const k = i * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  // Flat strips face straight up. Computed normals go bad on the zero area slivers at sharp bends,
  // and the occlusion pass drew those as black shards on the ground.
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  return g;
}

// The model is a square block cut from the town: anything outside it is clipped, like a cut-away architectural model.
export const CLIP_HALF = 800;
export const clipPlanes = [
  new THREE.Plane(new THREE.Vector3(1, 0, 0), CLIP_HALF), new THREE.Plane(new THREE.Vector3(-1, 0, 0), CLIP_HALF),
  new THREE.Plane(new THREE.Vector3(0, 0, 1), CLIP_HALF), new THREE.Plane(new THREE.Vector3(0, 0, -1), CLIP_HALF)];

const WHITE = new THREE.Color(0xffffff);

export function buildTown(scene, town) {
  const bounds = { minX: -CLIP_HALF, maxX: CLIP_HALF, minZ: -CLIP_HALF, maxZ: CLIP_HALF };
  const W = 2 * CLIP_HALF, D = 2 * CLIP_HALF;
  const groundMat = new THREE.MeshLambertMaterial({ color: PALETTE.ground });
  const ground = new THREE.Mesh(new THREE.BoxGeometry(W, 6, D), groundMat);
  ground.position.set(0, -3, 0);
  ground.receiveShadow = true; scene.add(ground);

  town.parks.forEach(pk => scene.add(flat(pk.p, 0.05, PALETTE.park)));
  town.water.areas.forEach(a => scene.add(flat(a.p, 0.08, PALETTE.water)));
  const waterGeo = town.water.lines.map(l => ribbon(l.p, l.w, 0.09));
  if (waterGeo.length) scene.add(new THREE.Mesh(mergeGeometries(waterGeo), layerMat(PALETTE.water, 3)));
  const streetGeo = town.streets.map(s => ribbon(s.p, s.w, 0.3));
  scene.add(new THREE.Mesh(mergeGeometries(streetGeo), layerMat(PALETTE.street, 2)));
  scene.add(new THREE.Mesh(ribbon(town.railway.p, 7, RAIL_Y + 0.05), layerMat(PALETTE.rail, 4)));
  const rail = buildRailway(town.railway);

  const plain = [], marks = [], windowSpots = [], lampSpots = [], edgeGeos = [];
  let seed = 7; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647; // fixed seed so the town looks the same every visit
  for (const b of town.buildings) {
    if (b.name in LANDMARK_ROOF) continue; // modelled in landmarks.js
    if (b.kind === 'train_station') b.h = Math.min(b.h, RAIL_Y - 0.4); // the booking hall sits under the raised platforms
    const g = new THREE.ExtrudeGeometry(shapeFrom(b.p), { depth: b.h, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    clay(g, b.h, 0.93 + 0.07 * rand());
    (b.landmark ? marks : plain).push(g);
    edgeGeos.push(new THREE.EdgesGeometry(g, 25));
    // Window lights: points just outside each facade, one per floor, about half of them lit.
    if (b.h >= 5) {
      for (let i = 0; i < b.p.length - 1; i++) {
        const [ax, az] = b.p[i], [bx, bz] = b.p[i + 1], len = Math.hypot(bx - ax, bz - az);
        for (let d = 3; d < len - 2; d += 6) {
          const f = d / len;
          for (let y = 2; y < b.h - 1; y += 3.2) {
            if (rand() < 0.45) windowSpots.push([ax + (bx - ax) * f, y, az + (bz - az) * f]);
          }
        }
      }
    }
  }
  // Street lamps every 30 m along named roads (not footpaths).
  for (const s of town.streets) {
    if (s.w < 5) continue;
    let carry = 0;
    for (let i = 0; i < s.p.length - 1; i++) {
      const [ax, az] = s.p[i], [bx, bz] = s.p[i + 1], len = Math.hypot(bx - ax, bz - az);
      for (let d = carry; d < len; d += 30) lampSpots.push([ax + (bx - ax) * d / len, 5, az + (bz - az) * d / len]);
      carry = (carry - len) % 30; if (carry < 0) carry += 30;
    }
  }
  const bMat = new THREE.MeshStandardMaterial({ color: PALETTE.building, roughness: 1, metalness: 0, vertexColors: true });
  const lMat = new THREE.MeshStandardMaterial({ color: PALETTE.landmark, roughness: 1, metalness: 0, vertexColors: true });
  // Edge lines, drawn like a pencil outline on a card model. Faded in by distance in updateView.
  // Screen-space lines (0.9 px, sharper than plain lines on high density screens) so the outline reads clearly up close.
  const lineMat = new LineMaterial({ color: PALETTE.edge, linewidth: 0.9, transparent: true, opacity: 0, depthWrite: false });
  edgeGeos.push(new THREE.EdgesGeometry(rail.brick, 25));
  const edges = new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(mergeGeometries(edgeGeos)), lineMat);
  edges.renderOrder = 2; scene.add(edges);
  const bMesh = new THREE.Mesh(mergeGeometries(plain), bMat); bMesh.castShadow = bMesh.receiveShadow = true; scene.add(bMesh);
  const brick = new THREE.Mesh(rail.brick, new THREE.MeshStandardMaterial({ color: PALETTE.brick, roughness: 1 }));
  brick.castShadow = brick.receiveShadow = true; scene.add(brick);
  if (rail.grass) { const bank = new THREE.Mesh(rail.grass, new THREE.MeshLambertMaterial({ color: PALETTE.bank, side: THREE.DoubleSide })); bank.castShadow = bank.receiveShadow = true; scene.add(bank); }
  if (marks.length) { const m = new THREE.Mesh(mergeGeometries(marks), lMat); m.castShadow = true; scene.add(m); }

  // Window glow: small emissive points, faded in after dusk.
  const lightGeo = new THREE.BufferGeometry();
  lightGeo.setAttribute('position', new THREE.Float32BufferAttribute(windowSpots.flat(), 3));
  const glow = (() => { // soft round sprite so lights read as glows, not squares
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.8)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const pointsMat = (color, size) => new THREE.PointsMaterial({ color, size, map: glow, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending });
  const lightMat = pointsMat(0xffb85c, 7), lampMat = pointsMat(0xffd59a, 10);
  scene.add(new THREE.Points(lightGeo, lightMat));
  const lampGeo = new THREE.BufferGeometry();
  lampGeo.setAttribute('position', new THREE.Float32BufferAttribute(lampSpots.flat(), 3));
  scene.add(new THREE.Points(lampGeo, lampMat));

  const hemi = new THREE.HemisphereLight(0xffffff, 0xb8b0a0, 0.9); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 2; sun.shadow.bias = -0.0005; Object.assign(sun.shadow.camera, { left: -1100, right: 1100, top: 1100, bottom: -1100, far: 4000 });
  scene.add(sun); scene.add(sun.target);
  // The shadow map follows what the camera looks at and shrinks as you zoom in, so close-up shadows stay sharp.
  const sunDir = new THREE.Vector3(0, 1, 0), focus = new THREE.Vector3();
  let shadowHalf = 1100;
  function placeSun() {
    sun.target.position.copy(focus);
    sun.position.copy(focus).addScaledVector(sunDir, 2000);
    const c = sun.shadow.camera;
    if (c.right !== shadowHalf) { c.left = c.bottom = -shadowHalf; c.right = c.top = shadowHalf; c.updateProjectionMatrix(); }
  }

  function setHour(h) {
    // Sun arc for mid October in Chelmsford: rise about 07:20, set about 18:00.
    const t = (h - 7.33) / (18.0 - 7.33);
    const elev = Math.sin(Math.PI * Math.min(Math.max(t, 0), 1)) * 32 * Math.PI / 180;
    const azim = (-70 + 140 * t) * Math.PI / 180; // east to west through south
    const day = Math.max(0, Math.min(1, (Math.min(h - 6.8, 18.6 - h)) / 0.8));
    sunDir.set(Math.sin(azim), Math.max(0.04, Math.sin(elev)), Math.cos(azim)).normalize();
    placeSun();
    sun.intensity = 0.15 + 1.5 * day;
    sun.color.setHSL(0.09, 0.6 * (1 - day) + 0.1, 0.55 + 0.4 * day);
    hemi.intensity = 0.25 + 0.7 * day;
    scene.background = WHITE; // the disc fades into a white page at every hour, like a model on a plinth
    groundMat.color.setHex(PALETTE.ground).multiplyScalar(0.55 + 0.45 * day); // ground sinks darker than the buildings at night
    lightMat.opacity = 0.9 * (1 - day); lampMat.opacity = 0.8 * (1 - day);
    bMat.emissive.setHex(0x2a1d10); bMat.emissiveIntensity = 0.6 * (1 - day); // faint warm bounce off the facades at night
  }
  // dist is the camera's distance to what it is looking at. Lines appear from about 1,500 m and are full by 700 m.
  function updateView(dist, width, height, target) {
    if (target) {
      const half = Math.round(Math.min(1100, Math.max(160, dist * 0.8)) / 20) * 20; // stepped, so the map is not rebuilt every frame
      if (half !== shadowHalf || focus.distanceToSquared(target) > 400) { shadowHalf = half; focus.copy(target); placeSun(); }
    }
    const f = Math.max(0, Math.min(1, (1500 - dist) / 800));
    lineMat.opacity = 0.75 * f;
    lineMat.resolution.set(width, height);
    edges.visible = f > 0;
  }
  return { setHour, updateView, groundMesh: ground, bounds, lineMat };
}
