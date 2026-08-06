const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

// ─── Min-Heap Priority Queue (O(log n) — replaces O(n²) sort) ────────────────
class MinHeap {
    constructor() { this.h = []; }
    push(item) { this.h.push(item); this._up(this.h.length - 1); }
    pop() {
        if (!this.h.length) return undefined;
        const top = this.h[0];
        const last = this.h.pop();
        if (this.h.length) { this.h[0] = last; this._down(0); }
        return top;
    }
    get size() { return this.h.length; }
    _up(i) {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (this.h[p].cost <= this.h[i].cost) break;
            [this.h[p], this.h[i]] = [this.h[i], this.h[p]]; i = p;
        }
    }
    _down(i) {
        const n = this.h.length;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && this.h[l].cost < this.h[s].cost) s = l;
            if (r < n && this.h[r].cost < this.h[s].cost) s = r;
            if (s === i) break;
            [this.h[s], this.h[i]] = [this.h[i], this.h[s]]; i = s;
        }
    }
}

// ─── Dijkstra ─────────────────────────────────────────────────────────────────
function dijkstra(graph, start, end, nodes) {
    const dist = new Map();
    const prev = new Map();
    const visited = new Set();
    const pq = new MinHeap();

    dist.set(start, 0);
    pq.push({ id: start, cost: 0 });

    while (pq.size > 0) {
        const { id: u, cost: uCost } = pq.pop();
        if (visited.has(u)) continue;
        visited.add(u);
        if (u === end) break;

        for (const { id: v, weight } of (graph.get(u) || [])) {
            if (visited.has(v)) continue;
            const newCost = uCost + weight;
            if (!dist.has(v) || newCost < dist.get(v)) {
                dist.set(v, newCost);
                prev.set(v, u);
                pq.push({ id: v, cost: newCost });
            }
        }
    }

    if (!dist.has(end)) return null;

    const path = [];
    let cur = end;
    while (cur !== undefined) {
        const n = nodes.get(cur);
        if (n) path.unshift([n.lat, n.lng]);
        cur = prev.get(cur);
    }
    return { path, distance: dist.get(end) };
}

// ─── Penalty ──────────────────────────────────────────────────────────────────
// DANGER_RADIUS: ~500m in degrees (was 0.015 = 1.5 km — massively too large)
const DANGER_RADIUS = 0.005;
// MAX_PENALTY: roads at zone centre cost 25× more (was 1000× — caused 10 km detours)
const MAX_PENALTY = 25;

function edgePenalty(lat, lng, redZones) {
    let maxPenalty = 1;
    for (const zone of redZones) {
        const d = Math.hypot(zone.lat - lat, zone.lng - lng);
        if (d < DANGER_RADIUS) {
            const ratio = 1 - d / DANGER_RADIUS;
            const penalty = 1 + (MAX_PENALTY - 1) * ratio * ratio;
            if (penalty > maxPenalty) maxPenalty = penalty;
        }
    }
    return maxPenalty;
}

// ─── Overpass OSM Fetch ───────────────────────────────────────────────────────
async function fetchOSMData(south, west, north, east) {
    const query = `
    [out:json][timeout:30];
    (
      way["highway"~"^(primary|secondary|tertiary|residential|unclassified|trunk|motorway|service|living_street)$"](${south},${west},${north},${east});
    );
    out body;
    >;
    out skel qt;
  `;
    const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
    const data = await res.json();

    const nodes = new Map();
    const ways = [];
    for (const el of data.elements) {
        if (el.type === "node") nodes.set(String(el.id), { lat: el.lat, lng: el.lon });
        else if (el.type === "way" && el.nodes) ways.push({ nodes: el.nodes.map(String) });
    }
    return { nodes, ways };
}

// ─── Graph Builder ────────────────────────────────────────────────────────────
function buildGraph(nodes, ways, redZones) {
    const graph = new Map();
    const addEdge = (a, b, w) => {
        if (!graph.has(a)) graph.set(a, []);
        if (!graph.has(b)) graph.set(b, []);
        graph.get(a).push({ id: b, weight: w });
        graph.get(b).push({ id: a, weight: w }); // bidirectional
    };
    for (const way of ways) {
        for (let i = 0; i < way.nodes.length - 1; i++) {
            const nA = way.nodes[i], nB = way.nodes[i + 1];
            const posA = nodes.get(nA), posB = nodes.get(nB);
            if (!posA || !posB) continue;

            const dlat = posB.lat - posA.lat;
            const dlng = posB.lng - posA.lng;
            const cosLat = Math.cos((posA.lat * Math.PI) / 180);
            const baseMeters = Math.hypot(dlat * 111320, dlng * 111320 * cosLat);

            const midLat = (posA.lat + posB.lat) / 2;
            const midLng = (posA.lng + posB.lng) / 2;
            const penalty = edgePenalty(midLat, midLng, redZones);

            addEdge(nA, nB, baseMeters * penalty);
        }
    }
    return graph;
}

// ─── Closest Road Node ────────────────────────────────────────────────────────
function closestNode(nodes, lat, lng) {
    let bestId = null, bestDist = Infinity;
    for (const [id, pos] of nodes) {
        const d = Math.hypot(pos.lat - lat, pos.lng - lng);
        if (d < bestDist) { bestDist = d; bestId = id; }
    }
    return bestId;
}

// ─── Real distance from path coords (ignores penalties) ──────────────────────
function realDistanceMeters(path) {
    let dist = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const [la, loa] = path[i], [lb, lob] = path[i + 1];
        dist += Math.hypot(
            (lb - la) * 111320,
            (lob - loa) * 111320 * Math.cos((la * Math.PI) / 180)
        );
    }
    return dist;
}

// ─── Controller ──────────────────────────────────────────────────────────────
exports.getSafeRoute = async (req, res) => {
    try {
        const { start, end, redZones = [] } = req.body;
        if (!start || !end) {
            return res.status(400).json({ success: false, message: "start and end required" });
        }

        // Tight bounding box: proportional padding, capped at ±0.07°
        // Prevents fetching a whole city for a short trip
        const latSpan = Math.abs(end.lat - start.lat);
        const lngSpan = Math.abs(end.lng - start.lng);
        const pad = Math.min(0.07, Math.max(0.015, Math.max(latSpan, lngSpan) * 0.5));

        const south = Math.min(start.lat, end.lat) - pad;
        const north = Math.max(start.lat, end.lat) + pad;
        const west = Math.min(start.lng, end.lng) - pad;
        const east = Math.max(start.lng, end.lng) + pad;

        // 1. Fetch OSM road graph
        const { nodes, ways } = await fetchOSMData(south, west, north, east);
        if (nodes.size === 0) {
            return res.status(422).json({ success: false, message: "No road network found in area" });
        }

        // 2. Build penalty graph (only risky zones: intensity < 0.5)
        const dangerZones = redZones.filter(z => z.intensity != null && z.intensity < 0.5);
        const graph = buildGraph(nodes, ways, dangerZones);

        // 3. Snap start/end to nearest road node
        const startNode = closestNode(nodes, start.lat, start.lng);
        const endNode = closestNode(nodes, end.lat, end.lng);
        if (!startNode || !endNode) {
            return res.status(422).json({ success: false, message: "Could not snap to road network" });
        }

        // 4. Run Dijkstra — finds shortest penalty-weighted path
        const result = dijkstra(graph, startNode, endNode, nodes);
        if (!result) {
            return res.status(422).json({ success: false, message: "No safe path found" });
        }

        // 5. Compute true geographic distance (no penalties — for display)
        const realDist = realDistanceMeters(result.path);

        return res.json({
            success: true,
            coords: result.path,
            distance: (realDist / 1000).toFixed(1),
            duration: Math.round((realDist / 1000) / 30 * 60), // ~30 km/h city speed
            nodeCount: result.path.length,
        });

    } catch (err) {
        console.error("Safe route error:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
};
