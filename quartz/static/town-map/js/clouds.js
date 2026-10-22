// A bank of cloud the camera sinks through on load. Once the descent ends the clouds fade away and are removed,
// so the town is never seen through haze afterwards.
import * as THREE from 'three';

function puffTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 26; i++) { // overlapping soft blobs make a cumulus outline
    const x = 128 + (rnd() - 0.5) * 140, y = 140 + (rnd() - 0.5) * 60, r = 30 + rnd() * 45;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(255,255,255,0.7)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  return new THREE.CanvasTexture(c);
}
// The clouds sit far outside the town's round base, so they skip its edge cut and white fade (see disc.js).
const noDisc = shader => {
  shader.fragmentShader = shader.fragmentShader.replace('#include <clipping_planes_fragment>', '').replace('#include <fog_fragment>', '');
};

// from, to: the camera's start and end positions for the descent; centre: what the camera looks at.
// The bank fills the space between the camera and the town below it, so the town shows through gaps and then
// the camera drops beneath it.
export function createClouds(scene, from, to, centre, count = 56) {
  const tex = puffTexture(), group = new THREE.Group(), clouds = [];
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, opacity: 0, fog: false });
    mat.onBeforeCompile = noDisc;
    const s = new THREE.Sprite(mat);
    const y = to.y + 150 + rnd() * (from.y - to.y - 400), k = (from.y - y) / (from.y - to.y); // a point on the path at this height
    // halfway between the camera's path at that height and the point it looks at, so the bank lies across the view
    s.position.lerpVectors(from, to, k).lerp(centre, 0.5).setY(y);
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 650;
    s.position.x += Math.cos(a) * r; s.position.z += Math.sin(a) * r;
    const w = 380 + rnd() * 380; s.scale.set(w, w * 0.6, 1);
    group.add(s); clouds.push({ s, speed: 4 + rnd() * 6 });
  }
  scene.add(group);
  let last = performance.now();
  // life: 1 while descending, falling to 0 as the clouds clear.
  function update(camera, hour, life) {
    const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
    const night = hour >= 18.6 || hour < 6.8;
    for (const c of clouds) {
      c.s.position.x += c.speed * dt; // drift east
      // Thin a cloud out as the camera reaches it, so passing through feels like breaking cloud, not hitting a wall.
      const d = c.s.position.distanceTo(camera.position);
      c.s.material.opacity = Math.max(0, Math.min(0.95, (d - 80) / 320)) * life * (night ? 0.4 : 1);
      c.s.material.color.setScalar(night ? 0.6 : 1);
    }
  }
  function dispose() {
    scene.remove(group);
    for (const c of clouds) c.s.material.dispose();
    tex.dispose();
  }
  return { update, dispose, group };
}
