// Walking network: graph search over OpenStreetMap paths. Distances in metres.
export function buildGraph({ nodes, edges }) {
  const adj = nodes.map(() => []);
  for (const [i, j, m] of edges) { adj[i].push([j, m]); adj[j].push([i, m]); }
  return { nodes, adj };
}

export function nearestNode(graph, x, z, maxM = 150) {
  let best = -1, bd = maxM;
  graph.nodes.forEach(([nx, nz], i) => { const d = Math.hypot(nx - x, nz - z); if (d <= bd) { bd = d; best = i; } });
  return best;
}

export function dijkstra(graph, start, maxM) {
  const n = graph.nodes.length, dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1);
  const heap = [[0, start]]; dist[start] = 0;
  const push = it => { heap.push(it); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  while (heap.length) {
    const [d, u] = pop();
    if (d > dist[u]) continue;
    for (const [v, m] of graph.adj[u]) {
      const nd = d + m;
      if (nd <= maxM && nd < dist[v]) { dist[v] = nd; prev[v] = u; push([nd, v]); }
    }
  }
  return { dist, prev };
}

// One list of segments per ring: an edge belongs to the first ring whose limit covers both of its ends.
export function ringEdges(graph, dist, limits = [400, 800, 1200]) {
  const rings = limits.map(() => []), seen = new Set();
  graph.adj.forEach((list, i) => {
    for (const [j] of list) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue; seen.add(key);
      const far = Math.max(dist[i], dist[j]);
      const r = limits.findIndex(L => far <= L);
      if (r >= 0) rings[r].push([...graph.nodes[i], ...graph.nodes[j]]);
    }
  });
  return rings;
}

export function route(graph, prev, target) {
  const out = [];
  for (let v = target; v !== -1; v = prev[v]) out.push(graph.nodes[v]);
  return out.reverse();
}

export function nearestPlaces(graph, dist, places, k = 3) {
  return places
    .map(place => { const node = nearestNode(graph, place.x, place.z, 80); return { place, node, metres: node < 0 ? Infinity : dist[node] }; })
    .filter(r => Number.isFinite(r.metres))
    .sort((a, b) => a.metres - b.metres)
    .slice(0, k);
}
