import * as THREE from 'three';
import { project } from './geo.js';
import { spread } from './spread.js';
import { roofAt } from './roof.js';
import { pinScale } from './pinscale.js';

const COLOURS = { music: 0xc4602b, food: 0xd9a43a, family: 0x4f8a6b, arts: 0x7a5aa6, sport: 0x2f7fb0,
                  park: 0x5b8f4e, culture: 0x7a5aa6, landmark: 0x8a6f4f };
const LABEL = { music: 'Music', food: 'Food and drink', family: 'Family', arts: 'Arts', sport: 'Sport and outdoors',
                park: 'Park', culture: 'Culture', landmark: 'Landmark' };

// A map pin: a coloured ball on a slim stem whose foot touches the roof or ground below.
const STEM_H = 11, BALL_R = 4.6;
const stemGeo = new THREE.CylinderGeometry(0.7, 0.7, STEM_H, 10).translate(0, STEM_H / 2, 0);
const ballGeo = new THREE.SphereGeometry(BALL_R, 24, 16).translate(0, STEM_H + BALL_R * 0.85, 0);
const stemMat = new THREE.MeshStandardMaterial({ color: 0x5a544c, roughness: 0.7 });

function pin(color, scale) {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(ballGeo, new THREE.MeshStandardMaterial({ color, roughness: 0.45, emissive: color, emissiveIntensity: 0.15 }));
  const stem = new THREE.Mesh(stemGeo, stemMat);
  ball.castShadow = stem.castShadow = true;
  g.add(stem, ball);
  g.userData.base = scale;
  g.scale.setScalar(scale);
  return g;
}

export function createLayers(scene, places, eventsFile, town) {
  const groups = { events: new THREE.Group(), places: new THREE.Group() };
  const pickables = [];
  const evXZ = spread(eventsFile.events.map(e => project(e.lon, e.lat)), 14);
  eventsFile.events.forEach((e, i) => {
    const p = pin(COLOURS[e.cat], 1.6); p.position.set(evXZ[i][0], roofAt(town, evXZ[i][0], evXZ[i][1]), evXZ[i][1]);
    const data = { kind: 'event', title: e.name, lines: [`${LABEL[e.cat]} · ${e.when}`, e.place, `Gathered ${eventsFile.gathered}`], link: e.source };
    p.children.forEach(c => { c.userData = data; pickables.push(c); });
    groups.events.add(p);
  });
  const plXZ = spread(places.map(pl => [pl.x, pl.z]), 10);
  places.forEach((pl, i) => {
    const p = pin(COLOURS[pl.kind], 1); p.position.set(plXZ[i][0], roofAt(town, plXZ[i][0], plXZ[i][1]), plXZ[i][1]);
    const data = { kind: 'place', title: pl.name, lines: [LABEL[pl.kind]] };
    p.children.forEach(c => { c.userData = data; pickables.push(c); });
    groups.places.add(p);
  });
  scene.add(groups.events, groups.places);
  const all = [...groups.events.children, ...groups.places.children];
  // Scale pins with zoom: full size from afar, down to half size close in. dist: camera to the point it looks at.
  let lastK = 0;
  function zoom(dist) {
    const k = pinScale(dist);
    if (Math.abs(k - lastK) < 0.005) return;
    lastK = k;
    for (const p of all) p.scale.setScalar(p.userData.base * k);
  }
  return { setVisible: (k, on) => { groups[k].visible = on; }, pickables, zoom };
}
