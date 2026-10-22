import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { DISC_OUTER } from './disc.js'; // must load before anything renders: it patches the shared shaders
import { buildTown } from './town.js';
import { createClouds } from './clouds.js';
import { createUI } from './ui.js';
import { createTrains } from './trains.js';
import { nextDepartures } from './timetable.js';
import { createLayers } from './layers.js';
import { createLandmarks, LANDMARK_ROOF } from './landmarks.js';
import { buildGraph } from './walk.js';
import { createWalkView, WALK_KEY, ROUTE_COLOUR } from './walkview.js';

const load = p => fetch(p).then(r => { if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); });
const town = await load('data/town.json');

const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // soft shadow edges suit the clay look
stage.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 5, 9000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.46; controls.minDistance = 120; controls.maxDistance = 3200;
controls.autoRotate = true; controls.autoRotateSpeed = 0.35;
controls.addEventListener('start', () => { controls.autoRotate = false; });

const world = buildTown(scene, town);
const landmarks = createLandmarks(scene, town, world.lineMat);
for (const b of town.buildings) if (b.name in LANDMARK_ROOF) b.h = LANDMARK_ROOF[b.name]; // pins stand on the modelled roof
const st = town.station;
controls.target.set((world.bounds.minX + world.bounds.maxX) / 2, 0, (world.bounds.minZ + world.bounds.maxZ) / 2);
const far = (innerWidth < innerHeight ? 1.9 : 1) * (+new URLSearchParams(location.search).get('zoom') || 1); // portrait phones stand further back; ?zoom=0.3 starts close
const home = new THREE.Vector3(controls.target.x + 700 * far, 900 * far, controls.target.z + 1100 * far);
// On load the camera starts high above the clouds and sinks down through them to the usual view (?intro=0 skips it).
const introFrom = new THREE.Vector3(home.x * 0.35, home.y + 1700, home.z * 0.35), introMs = 5500;
// introStart: -1 off, 0 waiting for the first frame (so the descent is never missed while data loads), else its start time.
// ?introAt=0.4 freezes the descent at that point, for checks and filming.
let introStart = new URLSearchParams(location.search).get('intro') === '0' ? -1 : 0;
const introAt = +new URLSearchParams(location.search).get('introAt') || 0;
camera.position.copy(introStart < 0 ? home : introFrom);
controls.addEventListener('start', () => { introStart = -1; });
{ // ?cam=x,y,z,targetX,targetZ places the camera, for checks and filming
  const c = new URLSearchParams(location.search).get('cam')?.split(',').map(Number);
  if (c?.length === 5) { introStart = -1; controls.autoRotate = false; camera.position.set(c[0], c[1], c[2]); controls.target.set(c[3], 0, c[4]); }
}

const LAYERS = [{ id: 'trains', label: 'Trains' }, { id: 'events', label: 'Events' },
                { id: 'walk', label: 'Walk from here' }, { id: 'places', label: 'Places' }];
const ui = createUI(LAYERS);
const cloudScene = new THREE.Scene(); // drawn after the occlusion pass, which cannot handle soft sprites
let clouds = introStart < 0 ? null : createClouds(cloudScene, introFrom, home, controls.target), cloudsGone = 0; // only for the descent
const qs = new URLSearchParams(location.search);
const fake = qs.get('t'); // ?t=2026-10-22T18:37 runs the town at that moment, for checks and filming
const clockOffset = fake ? new Date(fake) - new Date() : 0;
{ // the slider starts at the current time (or the ?t= moment); ?h=21 overrides it for checks and filming
  const start = new Date(Date.now() + clockOffset), el = document.getElementById('hour');
  el.value = qs.get('h') || (start.getHours() + start.getMinutes() / 60).toFixed(2);
  el.dispatchEvent(new Event('input'));
}
world.setHour(ui.hour());
ui.onHour(h => world.setHour(h));

const tt = await load('data/timetable.json');
const trains = createTrains(scene, town, tt);
const updaters = [];
let boardTick = 0;
updaters.push(now => {
  trains.update(now, ui.hour());
  if (!trains.group.visible) { ui.setBoard(null); return; }
  if (boardTick++ % 30) return; // draw at once, then refresh about twice a second
  ui.setBoard(nextDepartures(tt, now, 6), trains.liveSource ? 'Live' : 'Timetable');
});
const places = await load('data/places.json');
const eventsFile = await load('data/events.json');
const layers = createLayers(scene, places, eventsFile, town);
const raycaster = new THREE.Raycaster();
let downAt = null, onGroundTap = null, walkEnabled = true, walkView = null;
renderer.domElement.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return; // a drag, not a tap
  const r = renderer.domElement.getBoundingClientRect();
  raycaster.setFromCamera({ x: (e.clientX - r.left) / r.width * 2 - 1, y: -(e.clientY - r.top) / r.height * 2 + 1 }, camera);
  const visible = o => o.parent?.visible !== false && o.parent?.parent?.visible !== false;
  const hits = raycaster.intersectObjects([...trains.pickables, ...layers.pickables].filter(visible), false);
  if (hits.length) {
    const d = hits[0].object.userData;
    if (d.kind === 'train') ui.showInfo(`${d.time} to ${d.to}`, [d.stops ? 'Stops at Chelmsford' : 'Passes through', 'From the timetable']);
    else ui.showInfo(d.title, d.lines, d.link);
    return;
  }
  ui.hideInfo();
  onGroundTap?.(raycaster);
});
ui.onLayerToggle((id, on) => {
  if (id === 'trains') trains.group.visible = on;
  if (id === 'events' || id === 'places') layers.setVisible(id, on);
  if (id === 'walk') { walkEnabled = on; if (!on) walkView?.clear(); }
});
const graph = buildGraph(await load('data/walk.json'));
walkView = createWalkView(scene, graph, places);
onGroundTap = rc => {
  if (!walkEnabled) return;
  const hit = rc.intersectObject(world.groundMesh, false)[0];
  if (!hit) return;
  const r = walkView.showFrom(hit.point.x, hit.point.z);
  if (r.status === 'nopath') { ui.showInfo('No path near here', ['Tap closer to a street or footpath.']); return; }
  ui.showInfo('Walking from here', r.near.map(n => `${n.place.name}: ${Math.max(1, Math.round(n.metres / 80))} min walk`), null,
    [...WALK_KEY.map((c, i) => ({ colour: c, label: `${(i + 1) * 5} min` })), { colour: ROUTE_COLOUR, label: 'Route' }]);
};

// Screen space ambient occlusion on larger screens. Phones rely on the occlusion baked into the walls.
const useAO = Math.min(innerWidth, innerHeight) >= 600 && qs.get('ao') !== '0';
let composer = null, gtao = null;
if (useAO) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  gtao = new GTAOPass(scene, camera, stage.clientWidth, stage.clientHeight);
  gtao.updateGtaoMaterial({ radius: 4, distanceExponent: 2, thickness: 2, scale: 1, samples: 16 }); // small radius so occlusion hugs corners and wall feet
  gtao.blendIntensity = 1;
  composer.addPass(gtao);
  const cloudPass = new RenderPass(cloudScene, camera); cloudPass.clear = false; composer.addPass(cloudPass);
  composer.addPass(new OutputPass());
}

function resize() {
  renderer.setSize(stage.clientWidth, stage.clientHeight, false);
  composer?.setSize(stage.clientWidth, stage.clientHeight);
  walkView.setSize(stage.clientWidth, stage.clientHeight);
  camera.aspect = stage.clientWidth / stage.clientHeight; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
renderer.setAnimationLoop(() => {
  if (introStart === 0) introStart = performance.now();
  if (introStart > 0) {
    const f = introAt || Math.min(1, (performance.now() - introStart) / introMs), e = 1 - Math.pow(1 - f, 3);
    camera.position.lerpVectors(introFrom, home, e);
    if (f >= 1) introStart = -1;
  }
  controls.update();
  if (clouds) { // the clouds clear over a second and a half once the descent ends or someone takes control
    if (introStart < 0 && !cloudsGone) cloudsGone = performance.now();
    const life = cloudsGone ? 1 - (performance.now() - cloudsGone) / 1500 : 1;
    if (life <= 0) { clouds.dispose(); clouds = null; } else clouds.update(camera, ui.hour(), life);
  }
  landmarks.update(camera);
  const now = new Date(Date.now() + clockOffset);
  for (const u of updaters) u(now);
  const dist = camera.position.distanceTo(controls.target);
  layers.zoom(dist);
  // Keep the depth range tight around what is on screen: a 5 m to 9 km range blurs close-up depth and smears the occlusion.
  const near = Math.max(2, dist / 40), far = dist * 4 + 2500;
  if (Math.abs(camera.near - near) > 0.5 || Math.abs(camera.far - far) > 50) { camera.near = near; camera.far = far; camera.updateProjectionMatrix(); }
  world.updateView(dist, stage.clientWidth, stage.clientHeight, controls.target);
  if (composer) composer.render();
  else { renderer.autoClear = true; renderer.render(scene, camera); renderer.autoClear = false; renderer.render(cloudScene, camera); }
});
export { scene, camera, renderer, controls, ui, world, town, updaters, st };
