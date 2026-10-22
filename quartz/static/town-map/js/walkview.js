// Draws the 5, 10 and 15 minute walking rings from a tapped point, and routes to the three nearest places.
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { nearestNode, dijkstra, ringEdges, route, nearestPlaces } from './walk.js';

export const WALK_KEY = ['#2f9e6e', '#e0a030', '#d0603a']; // 5, 10 and 15 minute rings
export const ROUTE_COLOUR = '#2f6fd0'; // routes to the nearest places, blue so it reads on the map and in the key
const RING_COLOURS = WALK_KEY.map(c => new THREE.Color(c));

export function createWalkView(scene, graph, places) {
  const group = new THREE.Group(); scene.add(group);
  // Screen space lines, so the rings stay a readable thickness at every zoom (plain WebGL lines are 1 px).
  const mats = [...RING_COLOURS.map(c => new LineMaterial({ color: c, linewidth: 3 })), new LineMaterial({ color: new THREE.Color(ROUTE_COLOUR), linewidth: 4.5 })];
  function clear() { group.children.slice().forEach(c => { c.geometry.dispose(); group.remove(c); }); }
  function lines(segs, mat, y) {
    const g = new LineSegmentsGeometry().setPositions(segs.flatMap(([a, b, c, d]) => [a, y, b, c, y, d]));
    const l = new LineSegments2(g, mat); l.renderOrder = 3; return l;
  }
  function showFrom(x, z) {
    clear();
    const start = nearestNode(graph, x, z, 150);
    if (start < 0) return { status: 'nopath' };
    const { dist, prev } = dijkstra(graph, start, 1200);
    ringEdges(graph, dist).forEach((segs, i) => { if (segs.length) group.add(lines(segs, mats[i], 0.6 + i * 0.05)); });
    const near = nearestPlaces(graph, dist, places, 3);
    for (const n of near) {
      const p = route(graph, prev, n.node);
      if (p.length > 1) group.add(lines(p.slice(1).map((q, i) => [...p[i], ...q]), mats[3], 1.2));
    }
    const dot = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshBasicMaterial({ color: 0x1d1d1b }));
    dot.position.set(graph.nodes[start][0], 6, graph.nodes[start][1]);
    group.add(dot);
    return { status: 'ok', near };
  }
  function setSize(w, h) { for (const m of mats) m.resolution.set(w, h); }
  return { showFrom, clear, setSize, group };
}
