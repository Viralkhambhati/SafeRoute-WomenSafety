import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import HeatmapLayer from "../components/HeatmapLayer";
import { API_BASE_URL } from "../services/api";
import "../style/Home.css";

const START_ICON = L.divIcon({
  className: "",
  html: '<div class="marker-dot marker-start"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});
const END_ICON = L.divIcon({
  className: "",
  html: '<div class="marker-dot marker-end"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});
const PIN_ICON = L.divIcon({
  className: "",
  html: '<div class="marker-dot marker-pin"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function MapEvents({ onMapClick }) {
  const map = useMap();
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

function FitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length >= 2) {
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40], maxZoom: 15, animate: true });
    } else if (coords.length === 1) {
      map.setView(coords[0], 14, { animate: true });
    }
  }, [coords, map]);
  return null;
}

// Fixes Leaflet tile & heatmap rendering on mobile when container size changes
function MapResizer({ onReady }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
      // Re-trigger heatmap fetch after map has correct bounds on mobile
      if (onReady) onReady(map);
    }, 150);
    const handleResize = () => {
      map.invalidateSize();
      if (onReady) onReady(map);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [map, onReady]);
  return null;
}


function ViewportHeatmapLoader({ onViewportChange, onMapReady }) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  useEffect(() => {
    if (!onViewportChange) return;

    const handleViewportChange = () => {
      onViewportChange(map);
    };

    handleViewportChange();
    map.on("moveend", handleViewportChange);
    map.on("zoomend", handleViewportChange);

    return () => {
      map.off("moveend", handleViewportChange);
      map.off("zoomend", handleViewportChange);
    };
  }, [map, onViewportChange]);

  return null;
}

function RouteLayerCleaner({ trigger, routeLayersRef }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !routeLayersRef) return;

    const timer = setTimeout(() => {
      routeLayersRef.current.forEach((layer) => {
        try {
          if (layer && map.hasLayer(layer)) {
            map.removeLayer(layer);
          }
        } catch (e) {
          // Layer may already be removed
        }
      });
      routeLayersRef.current = [];
    }, 0);

    return () => clearTimeout(timer);
  }, [map, trigger, routeLayersRef]);

  return null;
}

function useDebouncedSuggestions(query, skip) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (skip || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=8&q=${encodeURIComponent(query)}&addressdetails=1`)
        .then((r) => { setLoading(false); return r.json(); })
        .then((data) => setResults(data || []))
        .catch(() => { setLoading(false); setResults([]); });
    }, 300);
    return () => { clearTimeout(timer); setLoading(false); };
  }, [query, skip]);
  return { results, loading };
}

async function geocode(query, existing) {
  if (existing) return existing;
  if (!query.trim()) return null;
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}&addressdetails=1`);
    const data = await r.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name };
  } catch {
    return null;
  }
}

export default function Home() {
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [fromCoord, setFromCoord] = useState(null);
  const [toCoord, setToCoord] = useState(null);
  const [showFromSug, setShowFromSug] = useState(false);
  const [showToSug, setShowToSug] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [safestRoute, setSafestRoute] = useState(null);
  const [defaultRoute, setDefaultRoute] = useState(null);
  const [fastestRoute, setFastestRoute] = useState(null);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([21.1702, 72.8311]);
  const [mapZoom, setMapZoom] = useState(13);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapData, setHeatmapData] = useState([]);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const mapRef = useRef(null);
  const heatmapDebounceRef = useRef(null);
  const routeLayersRef = useRef([]);
  const [routeClearCounter, setRouteClearCounter] = useState(0);

  const clearRouteState = useCallback(() => {
    setRoutes([]);
    setSafestRoute(null);
    setDefaultRoute(null);
    setFastestRoute(null);
    setSelectedRoute(0);
    setRouteCoords([]);
    setDistance(null);
    setDuration(null);
    setStatus("");
    setStatusType("");
    setRouteClearCounter((c) => c + 1);
  }, []);

  const fromSuggestions = useDebouncedSuggestions(fromQuery, !!fromCoord);
  const toSuggestions = useDebouncedSuggestions(toQuery, !!toCoord);

  const pickFrom = useCallback((place) => {
    setFromQuery(place.display_name);
    setFromCoord({ lat: parseFloat(place.lat), lng: parseFloat(place.lon), name: place.display_name });
    setShowFromSug(false);
    clearRouteState();
  }, [clearRouteState]);

  const pickTo = useCallback((place) => {
    setToQuery(place.display_name);
    setToCoord({ lat: parseFloat(place.lat), lng: parseFloat(place.lon), name: place.display_name });
    setShowToSug(false);
    clearRouteState();
  }, [clearRouteState]);

  const swapLocations = useCallback(() => {
    const tempQuery = fromQuery;
    const tempCoord = fromCoord;
    setFromQuery(toQuery);
    setFromCoord(toCoord);
    setToQuery(tempQuery);
    setToCoord(tempCoord);
    clearRouteState();
  }, [fromQuery, fromCoord, toQuery, toCoord, clearRouteState]);

  const handleMapClick = useCallback((latlng) => {
    if (!fromCoord) {
      setFromQuery(`${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`);
      setFromCoord({ lat: latlng.lat, lng: latlng.lng, name: `Pin ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}` });
      clearRouteState();
    } else if (!toCoord) {
      setToQuery(`${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`);
      setToCoord({ lat: latlng.lat, lng: latlng.lng, name: `Pin ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}` });
      clearRouteState();
    } else {
      setFromQuery(`${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`);
      setFromCoord({ lat: latlng.lat, lng: latlng.lng, name: `Pin ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}` });
      setToCoord(null);
      setToQuery("");
      clearRouteState();
    }
  }, [fromCoord, toCoord, clearRouteState]);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        setMapZoom(15);
      },
      () => {
        alert("Unable to retrieve your location");
      }
    );
  }, []);

  const jitterCoord = (coord, meters) => {
    const latOffset = (meters / 111320) * (Math.random() > 0.5 ? 1 : -1);
    const lngOffset = (meters / (111320 * Math.cos((coord.lat * Math.PI) / 180))) * (Math.random() > 0.5 ? 1 : -1);
    return { ...coord, lat: coord.lat + latOffset, lng: coord.lng + lngOffset };
  };

  const findRoute = async () => {
    clearRouteState();
    setLoading(true);
    setStatus("Looking up locations...");
    setStatusType("");
    try {
      const start = await geocode(fromQuery, fromCoord);
      const end = await geocode(toQuery, toCoord);
      if (!start) {
        setStatus("Could not find the starting location.");
        setStatusType("error");
        setLoading(false);
        return;
      }
      if (!end) {
        setStatus("Could not find the ending location.");
        setStatusType("error");
        setLoading(false);
        return;
      }
      setFromCoord(start);
      setToCoord(end);
      setStatus("Calculating route...");

      const fetchRouteAlternatives = async (s, e) => {
        const url = `https://router.project-osrm.org/route/v1/driving/${s.lng},${s.lat};${e.lng},${e.lat}?overview=full&geometries=geojson&alternatives=true`;
        const r = await fetch(url);
        const data = await r.json();
        if (data.code !== "Ok" || !data.routes || !data.routes.length) return [];

        return data.routes.map((route, idx) => ({
          isDefault: idx === 0,
          index: idx,
          coords: route.geometry.coordinates.map((c) => [c[1], c[0]]),
          distance: (route.distance / 1000).toFixed(1),
          duration: Math.round(route.duration / 60),
          geometryHash: route.geometry.coordinates.map((c) => `${c[0].toFixed(6)},${c[1].toFixed(6)}`).join("|"),
        }));
      };

      const osrmRoutes = await fetchRouteAlternatives(start, end);
      if (!osrmRoutes.length) {
        setStatus("No drivable route found.");
        setStatusType("error");
        setLoading(false);
        return;
      }

      const defaultRoute = osrmRoutes.find((route) => route.isDefault) || osrmRoutes[0];
      const fastestRoute = osrmRoutes.reduce((best, r) => (r.duration < best.duration ? r : best), defaultRoute);

      let safestRoute = null;
      try {
        const safeRes = await fetch(`${API_BASE_URL}/safe-route`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start: { lat: start.lat, lng: start.lng },
            end: { lat: end.lat, lng: end.lng },
            redZones: heatmapData.filter(hp => hp.intensity != null && hp.intensity < 0.5)
          })
        });
        const safeData = await safeRes.json();
        if (safeData.success && safeData.coords) {
          safestRoute = {
            isDefault: false,
            index: -1,
            coords: safeData.coords,
            distance: safeData.distance,
            duration: safeData.duration,
            geometryHash: "safe-route-backend"
          };
        }
      } catch (backendErr) {
        console.warn("Backend safe route failed:", backendErr);
      }

      // If backend safe route failed, fallback to OSRM safest (least dangerous)
      if (!safestRoute) {
        const scoredRoutes = osrmRoutes.map((route) => {
          let dangerScore = 0;
          const step = Math.max(1, Math.floor(route.coords.length / 40));
          for (let i = 0; i < route.coords.length; i += step) {
            const [lat, lng] = route.coords[i];
            for (const hp of heatmapData) {
              if (hp.intensity != null && hp.intensity < 0.5) {
                const d = Math.hypot(hp.lat - lat, hp.lng - lng);
                if (d < 0.015) dangerScore++;
              }
            }
          }
          return { ...route, touchesRedZone: dangerScore > 0, dangerScore };
        });
        const strictlySafe = scoredRoutes.filter((r) => !r.touchesRedZone).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        const leastDangerous = scoredRoutes.filter((r) => r.geometryHash !== defaultRoute.geometryHash).sort((a, b) => a.dangerScore - b.dangerScore || parseFloat(a.distance) - parseFloat(b.distance));
        safestRoute = strictlySafe[0] || leastDangerous[0] || defaultRoute;
      } else {
        safestRoute.isBackend = true;
      }

      setRoutes(osrmRoutes);
      setSafestRoute(safestRoute);
      setDefaultRoute(defaultRoute);
      setFastestRoute(fastestRoute);
      setSelectedRoute(1);
      setRouteCoords(safestRoute.coords);
      setDistance(safestRoute.distance);
      setDuration(safestRoute.duration);
      setStatus("Route loaded successfully.");
      setStatusType("ok");
    } catch (err) {
      const message = err?.message || "Network error — check your internet connection.";
      console.error("Route fetching error:", err);
      setStatus(message);
      setStatusType("error");
      clearRouteState();
    }
    setLoading(false);
  };

  const clearAll = () => {
    setFromQuery("");
    setToQuery("");
    setFromCoord(null);
    setToCoord(null);
    setRouteCoords([]);
    setRoutes([]);
    setSafestRoute(null);
    setDefaultRoute(null);
    setFastestRoute(null);
    setSelectedRoute(0);
    setDistance(null);
    setDuration(null);
    setStatus("");
    setStatusType("");
  };

  const fetchHeatmapData = useCallback(async (bounds = null) => {
    if (heatmapDebounceRef.current) {
      clearTimeout(heatmapDebounceRef.current);
    }

    heatmapDebounceRef.current = setTimeout(async () => {
      setHeatmapLoading(true);
      try {
        const params = new URLSearchParams();

        if (bounds) {
          params.append("south", bounds.south);
          params.append("north", bounds.north);
          params.append("west", bounds.west);
          params.append("east", bounds.east);
        } else {
          const centerLat = fromCoord ? fromCoord.lat : mapCenter[0];
          const centerLng = fromCoord ? fromCoord.lng : mapCenter[1];
          params.append("lat", centerLat);
          params.append("lng", centerLng);
          params.append("radius", 5);
        }

        const response = await fetch(`${API_BASE_URL}/heatmap?${params.toString()}`);
        const data = await response.json();
        if (data.success) {
          setHeatmapData(data.data || []);
        } else {
          setHeatmapData([]);
        }
      } catch (error) {
        console.log("Heatmap fetch error:", error);
        setHeatmapData([]);
      } finally {
        setHeatmapLoading(false);
      }
    }, 250);
  }, [fromCoord, mapCenter]);

  const handleViewportChange = useCallback((mapInstance) => {
    if (!mapInstance || !showHeatmap) return;

    const bounds = mapInstance.getBounds();
    const viewportBounds = {
      south: bounds.getSouth().toString(),
      north: bounds.getNorth().toString(),
      west: bounds.getWest().toString(),
      east: bounds.getEast().toString(),
    };

    fetchHeatmapData(viewportBounds);
  }, [fetchHeatmapData, showHeatmap]);

  const handleMapReady = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
    handleViewportChange(mapInstance);
  }, [handleViewportChange]);

  const toggleHeatmap = () => {
    setShowHeatmap((prev) => {
      const nextValue = !prev;
      if (nextValue) {
        if (mapRef.current) {
          handleViewportChange(mapRef.current);
        } else {
          fetchHeatmapData();
        }
      }
      return nextValue;
    });
  };

  // Returns true if route passes through any red zone, false if it's safe
  const routeTouchesRedZone = (coords) => {
    if (!heatmapData.length) return false;

    const threshold = 0.015; // ~1.5km radius
    const step = Math.max(1, Math.floor(coords.length / 60));

    for (let i = 0; i < coords.length; i += step) {
      const [lat, lng] = coords[i];
      for (const hp of heatmapData) {
        if (hp.intensity == null || hp.intensity > 0.5) continue; // Only flag clear red zones
        const d = Math.hypot(hp.lat - lat, hp.lng - lng);
        if (d <= threshold) return true;
      }
    }
    return false;
  };

  useEffect(() => {
    if (mapRef.current) {
      handleViewportChange(mapRef.current);
    } else {
      fetchHeatmapData();
    }
  }, [fetchHeatmapData, handleViewportChange]);

  useEffect(() => {
    return () => {
      if (heatmapDebounceRef.current) {
        clearTimeout(heatmapDebounceRef.current);
      }
    };
  }, []);

  const selectedRouteData = selectedRoute === 1 ? safestRoute : selectedRoute === 2 ? fastestRoute : defaultRoute;

  return (
    <div className="home-layout">
      <aside className="home-sidebar">
        {/* <div className="sidebar-brand">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4fd1a5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
             <path d="M12 2L2 7l10 5 10-5-10-5z" />
             <path d="M2 17l10 5 10-5" />
             <path d="M2 12l10 5 10-5" />
           </svg>
           <span className="sidebar-title">SafeRoute</span>
         </div> */}

        <div className="sidebar-search">
          <div className="search-field">
            <label>Starting location</label>
            <div className="input-with-icon">
              <span className="input-icon start-icon"></span>
              <input
                value={fromQuery}
                onChange={(e) => { setFromQuery(e.target.value); setFromCoord(null); setShowFromSug(true); }}
                onFocus={() => setShowFromSug(true)}
                onBlur={() => setTimeout(() => setShowFromSug(false), 200)}
                placeholder="Search or tap map..."
                autoComplete="off"
              />
            </div>
            {showFromSug && (
              <div className="suggestions show">
                {fromSuggestions.loading && <div className="suggestion-item" style={{ cursor: "default", color: "#7f93aa" }}>Searching...</div>}
                {!fromSuggestions.loading && fromSuggestions.results.length === 0 && fromQuery.trim().length >= 2 && (
                  <div className="suggestion-item" style={{ cursor: "default", color: "#7f93aa" }}>No results found</div>
                )}
                {!fromSuggestions.loading && fromSuggestions.results.map((p, i) => (
                  <div key={i} className="suggestion-item" onMouseDown={() => pickFrom(p)}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.display_name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="swap-btn" onClick={swapLocations} title="Swap locations">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4M7 4L3 8M7 4L11 8" />
              <path d="M17 8V20M17 20L21 16M17 20L13 16" />
            </svg>
          </button>

          <div className="search-field">
            <label>Destination location</label>
            <div className="input-with-icon">
              <span className="input-icon end-icon"></span>
              <input
                value={toQuery}
                onChange={(e) => { setToQuery(e.target.value); setToCoord(null); setShowToSug(true); }}
                onFocus={() => setShowToSug(true)}
                onBlur={() => setTimeout(() => setShowToSug(false), 200)}
                placeholder="Search or tap map..."
                autoComplete="off"
              />
            </div>
            {showToSug && (
              <div className="suggestions show">
                {toSuggestions.loading && <div className="suggestion-item" style={{ cursor: "default", color: "#7f93aa" }}>Searching...</div>}
                {!toSuggestions.loading && toSuggestions.results.length === 0 && toQuery.trim().length >= 2 && (
                  <div className="suggestion-item" style={{ cursor: "default", color: "#7f93aa" }}>No results found</div>
                )}
                {!toSuggestions.loading && toSuggestions.results.map((p, i) => (
                  <div key={i} className="suggestion-item" onMouseDown={() => pickTo(p)}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.display_name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="btn btn-primary-full" onClick={findRoute} disabled={loading}>
            {loading ? "Finding..." : "Find Safe Routes"}
          </button>
          <button className="btn btn-ghost-full" onClick={clearAll}>Clear</button>

          {status && <div className={`status ${statusType}`}>{status}</div>}

          {(defaultRoute || safestRoute || fastestRoute) && (
            <div className="route-cards">
              <h3 className="route-cards-title">Route Options</h3>
              <div className="route-cards-list">
                {defaultRoute && (
                  <div
                    className={`route-card ${selectedRoute === 0 ? "active" : ""}`}
                    onClick={() => {
                      setSelectedRoute(0);
                      setRouteCoords(defaultRoute.coords);
                      setDistance(defaultRoute.distance);
                      setDuration(defaultRoute.duration);
                    }}
                  >
                    <div className="route-card-header">
                      <span className="route-badge default">Default</span>
                    </div>
                    <div className="route-card-body">
                      <span className="route-info">{defaultRoute.distance} km · {defaultRoute.duration} min</span>
                    </div>
                  </div>
                )}
                {safestRoute && (
                  <div
                    className={`route-card safest ${selectedRoute === 1 ? "active" : ""}`}
                    onClick={() => {
                      setSelectedRoute(1);
                      setRouteCoords(safestRoute.coords);
                      setDistance(safestRoute.distance);
                      setDuration(safestRoute.duration);
                    }}
                  >
                    <div className="route-card-header">
                      <span className="route-badge safest">Safe - Avoid the Red Zone</span>
                    </div>
                    <div className="route-card-body">
                      <span className="route-info">{safestRoute.distance} km · {safestRoute.duration} min</span>
                    </div>
                  </div>
                )}
                {fastestRoute && (
                  <div
                    className={`route-card fastest ${selectedRoute === 2 ? "active" : ""}`}
                    onClick={() => {
                      setSelectedRoute(2);
                      setRouteCoords(fastestRoute.coords);
                      setDistance(fastestRoute.distance);
                      setDuration(fastestRoute.duration);
                    }}
                  >
                    <div className="route-card-header">
                      <span className="route-badge fastest">Fastest - Fastest Route</span>
                    </div>
                    <div className="route-card-body">
                      <span className="route-info">{fastestRoute.distance} km · {fastestRoute.duration} min</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {fromCoord && toCoord && (() => {
            let href = `https://www.google.com/maps/dir/?api=1&origin=${fromCoord.lat},${fromCoord.lng}&destination=${toCoord.lat},${toCoord.lng}&travelmode=driving`;

            if (selectedRouteData && selectedRouteData.coords && selectedRouteData.coords.length > 5) {
              const coords = selectedRouteData.coords;
              const samples = [];
              const step = Math.max(1, Math.floor(coords.length / 9));
              for (let i = step; i < coords.length - 1; i += step) {
                samples.push(`${coords[i][0]},${coords[i][1]}`);
                if (samples.length >= 8) break;
              }
              if (samples.length > 0) {
                href += `&waypoints=${samples.join('|')}`;
              }
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="google-maps-btn"
              >
                Open Selected Route in Google Maps
              </a>
            );
          })()}
        </div>
      </aside>

      <main className="home-map">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          zoomSnap={0.25}
          zoomDelta={0.5}
          minZoom={3}
          maxZoom={19}
          touchZoom={true}
          dragging={true}
          doubleClickZoom={true}
          boxZoom={true}
          keyboard={true}
          zoomControl={true}
          attributionControl={true}
          tap={true}
          touchDrag={true}
          bounceAtZoomLimits={true}
          animate={true}
          inertia={true}
          inertiaDeceleration={3000}
          inertiaMaxSpeed={1500}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />
          <MapEvents onMapClick={handleMapClick} />
          <FitBounds coords={routeCoords} />
          <MapResizer onReady={handleViewportChange} />
          <ViewportHeatmapLoader onViewportChange={handleViewportChange} onMapReady={handleMapReady} />
          <RouteLayerCleaner trigger={routeClearCounter} routeLayersRef={routeLayersRef} />
          {fromCoord && <Marker key={`from-${routeClearCounter}`} position={[fromCoord.lat, fromCoord.lng]} icon={START_ICON} />}
          {toCoord && <Marker key={`to-${routeClearCounter}`} position={[toCoord.lat, toCoord.lng]} icon={END_ICON} />}
          {routeCoords.length > 0 && <Polyline key={`route-${routeClearCounter}`} positions={routeCoords} pathOptions={{ color: "#4fd1a5", weight: 5, opacity: 0.9 }} />}
          {safestRoute && safestRoute.index !== defaultRoute?.index && (
            <Polyline key={`safest-${routeClearCounter}`} positions={safestRoute.coords} pathOptions={{ color: "#1d9e75", weight: 4, opacity: 0.7 }} />
          )}
          {fastestRoute && fastestRoute.index !== defaultRoute?.index && fastestRoute.index !== safestRoute?.index && (
            <Polyline key={`fastest-${routeClearCounter}`} positions={fastestRoute.coords} pathOptions={{ color: "#f39c12", weight: 4, opacity: 0.7 }} />
          )}
          {routes.map((route) => {
            if (route.index === defaultRoute?.index || route.index === safestRoute?.index || route.index === fastestRoute?.index) return null;
            return (
              <Polyline
                key={`alt-${routeClearCounter}-${route.index}`}
                positions={route.coords}
                pathOptions={{ color: "#7f8c8d", weight: 2, opacity: 0.3, dashArray: "8 8" }}
              />
            );
          })}
          {showHeatmap && <HeatmapLayer heatmapData={heatmapData} visible={showHeatmap} />}
        </MapContainer>

        <div className="map-overlay-controls">
          <button
            className={`map-control-btn ${showHeatmap ? "active" : ""}`}
            onClick={toggleHeatmap}
            title="Toggle Heatmap"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20z" />
            </svg>
          </button>
          {/*<button className="map-control-btn" onClick={locateUser} title="My Location">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
            </svg>
          </button>*/}
        </div>
      </main>
    </div>
  );
}
