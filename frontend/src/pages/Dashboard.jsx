import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import HeatmapLayer from "../components/HeatmapLayer";
import { useAuth } from "../context/AuthContext";
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
const RATING_ICON = L.divIcon({
  className: "",
  html: '<div class="rating-marker"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function getRatingColor(score) {
  if (score >= 8) return "#10B981";
  if (score >= 5) return "#F59E0B";
  return "#8B0000";
}

function getRatingIcon(score) {
  const color = getRatingColor(score);
  return L.divIcon({
    className: "",
    html: `<div class="rating-marker" style="background:${color};border-color:#fff;"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const ratingQuestions = [
  {
    key: "q1",
    label: "Q1. How is the street lighting in this area?",
    options: [
      { value: 1, label: "No lighting / broken streetlights" },
      { value: 5, label: "Dim or partial lighting" },
      { value: 10, label: "Well-lit throughout" },
    ],
  },
  {
    key: "q2",
    label: "Q2. How many people are usually present here at this time?",
    options: [
      { value: 1, label: "Deserted / empty" },
      { value: 5, label: "A few people around" },
      { value: 10, label: "Busy / crowded" },
    ],
  },
  {
    key: "q3",
    label: "Q3. How open and visible is this area?",
    options: [
      { value: 1, label: "Narrow lanes, blind spots, hidden corners" },
      { value: 5, label: "Somewhat open, partial visibility" },
      { value: 10, label: "Wide open, fully visible" },
    ],
  },
  {
    key: "q4",
    label: "Q4. Is there any visible security presence?",
    options: [
      { value: 1, label: "None visible" },
      { value: 5, label: "Not sure / partially visible" },
      { value: 10, label: "Clearly visible" },
    ],
  },
  {
    key: "q5",
    label: "Q5. Overall, how safe did you personally feel here?",
    options: [
      { value: 1, label: "Unsafe" },
      { value: 5, label: "Neutral" },
      { value: 10, label: "Safe / comfortable" },
    ],
  },
];

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

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [mapCenter] = useState([21.1702, 72.8311]);
  const [mapZoom] = useState(13);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapData, setHeatmapData] = useState([]);
  const [heatmapLoading, setHeatmapLoading] = useState(false);

  const [ratingLat, setRatingLat] = useState(null);
  const [ratingLng, setRatingLng] = useState(null);
  const [ratingQ1, setRatingQ1] = useState(5);
  const [ratingQ2, setRatingQ2] = useState(5);
  const [ratingQ3, setRatingQ3] = useState(5);
  const [ratingQ4, setRatingQ4] = useState(5);
  const [ratingQ5, setRatingQ5] = useState(5);
  const [ratingStep, setRatingStep] = useState(0);
  const [ratingCategory, setRatingCategory] = useState("safe");
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");
  const mapRef = useRef(null);
  const heatmapDebounceRef = useRef(null);

  const getCurrentRatingValue = () => {
    switch (ratingStep) {
      case 0:
        return ratingQ1;
      case 1:
        return ratingQ2;
      case 2:
        return ratingQ3;
      case 3:
        return ratingQ4;
      case 4:
        return ratingQ5;
      default:
        return 5;
    }
  };

  const setCurrentRatingValue = (value) => {
    switch (ratingStep) {
      case 0:
        setRatingQ1(value);
        break;
      case 1:
        setRatingQ2(value);
        break;
      case 2:
        setRatingQ3(value);
        break;
      case 3:
        setRatingQ4(value);
        break;
      case 4:
        setRatingQ5(value);
        break;
    }
  };

  const calculateFinalScore = () => {
    return (
      ratingQ1 * 0.25 +
      ratingQ2 * 0.2 +
      ratingQ3 * 0.15 +
      ratingQ4 * 0.15 +
      ratingQ5 * 0.25
    );
  };

  useEffect(() => {
    const score = calculateFinalScore();
    if (score <= 3) {
      setRatingCategory("risky");
    } else if (score <= 7) {
      setRatingCategory("moderate");
    } else {
      setRatingCategory("safe");
    }
  }, [ratingQ1, ratingQ2, ratingQ3, ratingQ4, ratingQ5]);

  useEffect(() => {
    return () => {
      if (heatmapDebounceRef.current) {
        clearTimeout(heatmapDebounceRef.current);
      }
    };
  }, []);

  const handleMapClick = (latlng) => {
    setRatingLat(latlng.lat);
    setRatingLng(latlng.lng);
    setRatingStep(0);
    setShowRatingForm(true);
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
          params.append("lat", mapCenter[0]);
          params.append("lng", mapCenter[1]);
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
  }, [mapCenter]);

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

  const submitRating = async () => {
    if (ratingLat == null || ratingLng == null) return;

    const score = calculateFinalScore();
    const category = score <= 3 ? "risky" : score <= 7 ? "moderate" : "safe";

    setRatingLoading(true);
    setRatingMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/heatmap/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: ratingLat,
          lng: ratingLng,
          q1: ratingQ1,
          q2: ratingQ2,
          q3: ratingQ3,
          q4: ratingQ4,
          q5: ratingQ5,
          score: parseFloat(score.toFixed(1)),
          category,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setRatingMessage("Safety rating submitted successfully!");
        setShowRatingForm(false);
        setRatingLat(null);
        setRatingLng(null);
        setRatingQ1(5);
        setRatingQ2(5);
        setRatingQ3(5);
        setRatingQ4(5);
        setRatingQ5(5);
        setRatingCategory("safe");
        setRatingStep(0);
        if (mapRef.current) {
          handleViewportChange(mapRef.current);
        } else {
          fetchHeatmapData();
        }
      } else {
        setRatingMessage(data.message || "Failed to submit rating");
      }
    } catch (error) {
      setRatingMessage("Network error — try again");
    } finally {
      setRatingLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <div className="home-layout">
      <aside className="home-sidebar">

        <div className="sidebar-search">
          {/* Rating Header */}
          <div className="rating-section-header">
            <div className="rating-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div>
              <h3 className="rating-section-title">Safety Rating</h3>
              <p className="rating-section-sub">Tap the map to rate any location</p>
            </div>
          </div>

          {showRatingForm && (
            <div className="rating-panel">
              {/* Location Badge */}
              <div className="rating-location-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span>{ratingLat?.toFixed(4)}°N, {ratingLng?.toFixed(4)}°E</span>
              </div>

              {/* Progress Steps */}
              <div className="rating-progress">
                {ratingQuestions.map((_, idx) => (
                  <div
                    key={idx}
                    className={`rating-progress-dot ${idx === ratingStep ? "active" : idx < ratingStep ? "done" : ""}`}
                    onClick={() => idx < ratingStep && setRatingStep(idx)}
                  />
                ))}
                <div className="rating-progress-bar" style={{ width: `${(ratingStep / (ratingQuestions.length - 1)) * 100}%` }} />
              </div>

              {/* Question */}
              <div className="rating-question-card">
                <p className="rating-question-label">
                  <span className="rating-step-badge">Q{ratingStep + 1}</span>
                  {ratingQuestions[ratingStep].label.replace(/^Q\d+\.\s*/, "")}
                </p>
                <div className="rating-options">
                  {ratingQuestions[ratingStep].options.map((option) => {
                    return (
                      <label
                        key={option.value}
                        className={`rating-option-card ${getCurrentRatingValue() === option.value ? "selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name={`rating-question-${ratingStep}`}
                          value={option.value}
                          checked={getCurrentRatingValue() === option.value}
                          onChange={() => setCurrentRatingValue(option.value)}
                        />
                        <span className="rating-option-text">{option.label}</span>
                        {getCurrentRatingValue() === option.value && (
                          <span className="rating-option-check">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Live Score Preview */}
              {ratingStep === ratingQuestions.length - 1 && (
                <div className={`rating-score-preview rating-score-${ratingCategory}`}>
                  <span className="rating-score-label">Predicted Score</span>
                  <span className="rating-score-value">{calculateFinalScore().toFixed(1)} / 10</span>
                  <span className={`rating-category-pill pill-${ratingCategory}`}>
                    {ratingCategory === "safe" ? "🟢 Safe" : ratingCategory === "moderate" ? "🟡 Moderate" : "🔴 Risky"}
                  </span>
                </div>
              )}

              {/* Navigation */}
              <div className="rating-nav">
                <button
                  className="rating-btn-cancel"
                  type="button"
                  onClick={() => { setShowRatingForm(false); setRatingMessage(""); }}
                >
                  Cancel
                </button>
                <div className="rating-nav-right">
                  {ratingStep > 0 && (
                    <button className="rating-btn-ghost" type="button" onClick={() => setRatingStep((prev) => Math.max(0, prev - 1))}>
                      ← Back
                    </button>
                  )}
                  {ratingStep < ratingQuestions.length - 1 ? (
                    <button className="rating-btn-primary" type="button" onClick={() => setRatingStep((prev) => Math.min(ratingQuestions.length - 1, prev + 1))}>
                      Next →
                    </button>
                  ) : (
                    <button className="rating-btn-submit" type="button" onClick={submitRating} disabled={ratingLoading}>
                      {ratingLoading ? (
                        <span className="rating-spinner" />
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          Submit
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {ratingMessage && (
                <div className={`status ${ratingMessage.includes("successfully") ? "ok" : "error"}`}>
                  {ratingMessage}
                </div>
              )}
            </div>
          )}

          {!showRatingForm && (
            <div className="rating-hint">
              <div className="rating-hint-icon-wrap">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4fd1a5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="rating-hint-text">
                <p className="rating-hint-title">Rate a Location</p>
                <p className="rating-hint-desc">Tap anywhere on the map to evaluate that area's safety score.</p>
              </div>
            </div>
          )}
        </div>

        {/* <button className="navbar-rating-btn dashboard-logout-btn" onClick={handleLogout}>
          Logout
        </button> */}
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
          <ViewportHeatmapLoader onViewportChange={handleViewportChange} onMapReady={handleMapReady} />
          {ratingLat && ratingLng && (
            <Marker position={[ratingLat, ratingLng]} icon={getRatingIcon(calculateFinalScore())} />
          )}
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
        </div>
      </main>
    </div>
  );
}
