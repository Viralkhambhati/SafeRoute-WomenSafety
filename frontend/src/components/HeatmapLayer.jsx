import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function HeatmapLayer({ heatmapData, visible }) {
  const map = useMap();
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    const group = layerGroupRef.current;
    group.clearLayers();

    if (!visible || !heatmapData || heatmapData.length === 0) {
      return;
    }

    heatmapData.forEach((point) => {
      if (point.lat == null || point.lng == null) return;

      const intensity = point.intensity || 0.5;
      const radius = 350;

      let color = "#10B981";
      let fillColor = "#34D399";
      if (intensity < 0.6) {
        color = "#F59E0B";
        fillColor = "#FBBF24";
      }
      if (intensity < 0.4) {
        color = "#5a0000";
        fillColor = "#fa0707";
      }

      const circle = L.circle([point.lat, point.lng], {
        radius,
        color,
        fillColor,
        fillOpacity: 0.45,
        weight: 3,
        opacity: 0.9,
      });

      group.addLayer(circle);
    });
  }, [heatmapData, visible, map]);

  useEffect(() => {
    return () => {
      if (layerGroupRef.current) {
        try {
          layerGroupRef.current.remove();
        } catch (e) {}
        layerGroupRef.current = null;
      }
    };
  }, [map]);

  return null;
}

export default HeatmapLayer;