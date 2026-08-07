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

// ─── Overpass Mirrors + Cache ──────────────────────────────────────────────────
// Multiple public Overpass instances — if one refuses/times out, the next is tried.
// Order matters: put the most reliable one first.
const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
];

// IMPORTANT: replace with your real contact info. Public Overpass instances are
// more likely to soft-block/rate-limit requests with generic/anonymous User-Agents,
// especially from datacenter IPs (Render, AWS, etc).
const OVERPASS_USER_AGENT = "SafeRoute/1.0 (contact: studytime24680@gmail.com)";

// Simple in-memory response cache so repeated requests for the same area
// (e.g. multiple users routing through the same neighborhood) don't all
// hit Overpass. Not persistent — resets on server restart/deploy.
const osmCache = new Map(); // key -> { data, expiresAt }
const OSM_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const OSM_CACHE_MAX_ENTRIES = 200;

function bboxCacheKey(south, west, north, east) {
    // Round to ~5 decimal places (~1m precision) so near-identical bboxes share a cache entry
    const r = (n) => Math.round(n * 1e5) / 1e5;
    return `${r(south)},${r(west)},${r(north)},${r(east)}`;
}

function getCachedOSM(key) {
    const entry = osmCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        osmCache.delete(key);
        return null;
    }
    return entry.data;
}

function setCachedOSM(key, data) {
    if (osmCache.size >= OSM_CACHE_MAX_ENTRIES) {
        // Evict oldest entry (Map preserves insertion order)
        const oldestKey = osmCache.keys().next().value;
        osmCache.delete(oldestKey);
    }
    osmCache.set(key, { data, expiresAt: Date.now() + OSM_CACHE_TTL_MS });
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Overpass OSM Fetch ───────────────────────────────────────────────────────
// ─── Overpass OSM Fetch (Fixed for Live/Render) ───────────────────────────────
async function fetchOSMData(south, west, north, east) {
    const cacheKey = bboxCacheKey(south, west, north, east);
    const cached = getCachedOSM(cacheKey);
    if (cached) {
        console.log(`OSM cache hit for bbox ${cacheKey}`);
        return cached;
    }

    const query = `[out:json][timeout:15];
(
  way["highway"~"^(primary|secondary|tertiary|residential|unclassified|trunk|motorway|service|living_street)$"](${south},${west},${north},${east});
);
out body;
>;
out skel qt;`;

    // Updated reliable endpoints order
    const LIVE_ENDPOINTS = [
    //Main French Mirror (France)
    "https://overpass.openstreetmap.fr/api/interpreter",

    //Main German Mirror (Germany)
    "https://overpass-api.de/api/interpreter",

    //Mail.ru Mirror
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",

    //LZ4 Alternative Mirror (Germany)
    "https://lz4.overpass-api.de/api/interpreter",

    //Kumi Systems Mirror (Very Fast & Reliable)
    "https://overpass.kumi.systems/api/interpreter",
    
    //Private Router Mirror (EU)
    "https://overpass.private.coffee/api/interpreter",

    //OpenStreetMap Switzerland Mirror (Europe)
    "https://overpass.osm.ch/api/interpreter",

    //OpenStreetMap Taiwan Mirror (Asia - Good for low latency)
    "https://overpass.api.openstreetmap.tw/api/interpreter",
    
    //Nectar Server Mirror
    "https://overpass.nchc.org.tw/api/interpreter",

    //LocationIQ (API Key Required - Best for Render/Live Server)
    `https://us1.locationiq.com/v1/overpass.php?key=pk.0fec33d1bd63117df195dc1e0d4c8c0f&data=${encodeURIComponent(query)}`,
    ];

    let lastError;

    for (let i = 0; i < LIVE_ENDPOINTS.length; i++) {
        const endpoint = LIVE_ENDPOINTS[i];
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 sec timeout

        try {
            // Using POST instead of GET to avoid long URL issues on Datacenters
            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": OVERPASS_USER_AGENT,
                    "Accept": "application/json"
                },
                body: "data=" + encodeURIComponent(query),
                signal: controller.signal,
            });
            
            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error(`Status ${res.status} ${res.statusText}`);
            }

            const data = await res.json();

            if (!data || !data.elements) {
                throw new Error("Invalid OSM response payload");
            }

            const nodes = new Map();
            const ways = [];
            for (const el of data.elements) {
                if (el.type === "node") nodes.set(String(el.id), { lat: el.lat, lng: el.lon });
                else if (el.type === "way" && el.nodes) ways.push({ nodes: el.nodes.map(String) });
            }

            const result = { nodes, ways };
            setCachedOSM(cacheKey, result);
            return result;

        } catch (err) {
            clearTimeout(timeoutId);
            lastError = err;
            console.warn(`Overpass Mirror #${i + 1} Failed [${endpoint}]:`, err.message);
            
            // Wait 1 second before trying next mirror
            if (i < LIVE_ENDPOINTS.length - 1) {
                await sleep(1000);
            }
        }
    }

    throw new Error(`All Overpass mirrors failed. Last error: ${lastError?.message || 'Timeout'}`);
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

        // 1. Fetch OSM road graph (mirrors + backoff + cache handled inside)
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
        // Log full detail: message + cause/code, so Render logs actually tell you why it failed
        console.error(
            "Safe route error:",
            err.message,
            "| cause:", err.cause?.message || err.cause || err.code || "unknown"
        );
        const message = err.message || "Network error";
        if (message.includes("Overpass") || message.includes("fetch failed")) {
            return res.status(502).json({ success: false, message: "Route service unavailable. Please try again later." });
        }
        return res.status(500).json({ success: false, message: "Unable to calculate safe route. Please try again." });
    }
};