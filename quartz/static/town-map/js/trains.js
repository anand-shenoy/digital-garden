import * as THREE from 'three';
import { trainState, pointAt, dayType } from './timetable.js';
import { RAIL_Y } from './rail.js';

const CAR = 20, GAP = 1.2, CARS = 8, OFFSET = 2.4; // metres
const pad = n => String(n).padStart(2, '0');

function makeTrain(mat, winMat) {
  const g = new THREE.Group();
  const body = new THREE.BoxGeometry(CAR, 3.6, 2.8);
  const band = new THREE.BoxGeometry(CAR * 0.96, 0.8, 2.86);
  for (let i = 0; i < CARS; i++) {
    const c = new THREE.Mesh(body, mat); c.castShadow = true;
    const w = new THREE.Mesh(band, winMat);
    g.add(c, w);
  }
  return g;
}

export function createTrains(scene, town, tt) {
  const track = town.railway;
  const group = new THREE.Group(); scene.add(group);
  const mat = new THREE.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.6 });
  const winMat = new THREE.MeshStandardMaterial({ color: 0x3a4148, emissive: 0xffd28a, emissiveIntensity: 0 });
  // Platforms and canopies, so the station reads at a glance. Both sides of the line, 240 m long.
  const platMat = new THREE.MeshStandardMaterial({ color: 0xd8cbb6, roughness: 1 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x8e8578, roughness: 0.9 });
  for (let s = track.stationS - 120; s < track.stationS + 120; s += 12) {
    const q = pointAt(track, s + 6), nx = -Math.sin(q.angle), nz = Math.cos(q.angle);
    for (const side of [-1, 1]) {
      const plat = new THREE.Mesh(new THREE.BoxGeometry(12.2, 1, 5), platMat);
      plat.position.set(q.x + nx * side * 7, RAIL_Y + 0.5, q.z + nz * side * 7); plat.rotation.y = -q.angle;
      plat.receiveShadow = true; group.add(plat);
      if (Math.abs(s - track.stationS) < 70) {
        const roof = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.4, 5.6), roofMat);
        roof.position.set(q.x + nx * side * 7, RAIL_Y + 5.2, q.z + nz * side * 7); roof.rotation.y = -q.angle;
        roof.castShadow = true; group.add(roof);
      }
    }
  }
  const pool = new Map(); // key -> mesh
  const pickables = [];

  function placeCars(mesh, s, dir) {
    // Lay each car along the track behind the head, so trains follow curves.
    const sign = dir === 'london' ? 1 : -1; // london-bound head moves towards s = 0, cars trail at higher s
    mesh.children.forEach((child, k) => {
      const car = Math.floor(k / 2);
      const sCar = s + sign * (car * (CAR + GAP) + CAR / 2);
      const off = sCar < 0 || sCar > track.length;
      child.visible = !off;
      if (off) return;
      const q = pointAt(track, sCar);
      const nx = -Math.sin(q.angle), nz = Math.cos(q.angle); // track normal
      const side = (dir === 'london' ? -1 : 1) * OFFSET;
      const isBand = k % 2 === 1;
      child.position.set(q.x + nx * side, RAIL_Y + (isBand ? 2.3 : 1.8), q.z + nz * side);
      child.rotation.y = -q.angle;
    });
  }

  function update(now, hour) {
    const mins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60 + now.getMilliseconds() / 60000;
    const list = tt.services[dayType(now)] || [];
    const live = new Set();
    for (const svc of list) {
      if (Math.abs(svc.t - mins) > 6) continue;
      const st = trainState(svc, mins, track);
      if (!st) continue;
      const key = `${svc.t}-${svc.dir}-${svc.to}-${svc.stops}`;
      live.add(key);
      let mesh = pool.get(key);
      if (!mesh) {
        mesh = makeTrain(mat, winMat);
        mesh.userData = { kind: 'train', to: svc.to, time: `${pad(Math.floor(svc.t / 60))}:${pad(svc.t % 60)}`, stops: svc.stops };
        mesh.children.forEach(c => { c.userData = mesh.userData; pickables.push(c); });
        group.add(mesh); pool.set(key, mesh);
      }
      placeCars(mesh, st.s, st.dir);
    }
    for (const [key, mesh] of pool) if (!live.has(key)) {
      group.remove(mesh); pool.delete(key);
      mesh.children.forEach(c => pickables.splice(pickables.indexOf(c), 1));
    }
    winMat.emissiveIntensity = hour >= 17.5 || hour < 7.3 ? 0.9 : 0;
  }
  return { update, group, pickables, liveSource: null };
}
