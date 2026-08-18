"use client";

import { useEffect, useRef } from "react";
import { Map as MapLibreMap, Popup, type Map as MapType } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const CARIBBEAN_POINTS: Array<{ name: string; lat: number; lon: number; kind: "island" | "mainland" }> = [
  { name: "Cuba", lat: 21.52, lon: -77.78, kind: "island" },
  { name: "Jamaica", lat: 18.11, lon: -77.3, kind: "island" },
  { name: "Hispaniola", lat: 19.0, lon: -70.67, kind: "island" },
  { name: "Puerto Rico", lat: 18.22, lon: -66.59, kind: "island" },
  { name: "Trinidad & Tobago", lat: 10.69, lon: -61.22, kind: "island" },
  { name: "Bahamas", lat: 24.14, lon: -76.0, kind: "island" },
  { name: "Antigua & Barbuda", lat: 17.12, lon: -61.85, kind: "island" },
  { name: "Barbados", lat: 13.19, lon: -59.54, kind: "island" },
  { name: "Dominica", lat: 15.42, lon: -61.37, kind: "island" },
  { name: "Granada", lat: 12.11, lon: -61.68, kind: "island" },
  { name: "Santa Lucía", lat: 13.91, lon: -60.98, kind: "island" },
  { name: "San Vicente", lat: 13.25, lon: -61.2, kind: "island" },
  { name: "Curazao", lat: 12.17, lon: -68.99, kind: "island" },
  { name: "Aruba", lat: 12.52, lon: -69.97, kind: "island" },
  { name: "Costa Caribe México", lat: 20.93, lon: -88.0, kind: "mainland" },
  { name: "Belice", lat: 17.19, lon: -88.5, kind: "mainland" },
  { name: "Guatemala Caribe", lat: 15.78, lon: -88.7, kind: "mainland" },
  { name: "Honduras Caribe", lat: 15.77, lon: -86.28, kind: "mainland" },
  { name: "Nicaragua Caribe", lat: 13.4, lon: -83.5, kind: "mainland" },
  { name: "Costa Rica Caribe", lat: 10.0, lon: -83.0, kind: "mainland" },
  { name: "Panamá Caribe", lat: 9.33, lon: -79.87, kind: "mainland" },
  { name: "Colombia Caribe", lat: 11.02, lon: -74.85, kind: "mainland" },
  { name: "Venezuela Caribe", lat: 10.48, lon: -66.9, kind: "mainland" },
  { name: "Guyana", lat: 6.8, lon: -58.15, kind: "mainland" },
  { name: "Surinam", lat: 5.85, lon: -55.18, kind: "mainland" },
];

export default function MapCaribe() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapType | null>(null);

  useEffect(() => {
    if (!container.current || map.current) return;

    const geo: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: CARIBBEAN_POINTS.map((p) => ({
        type: "Feature",
        properties: { name: p.name, kind: p.kind },
        geometry: { type: "Point", coordinates: [p.lon, p.lat] },
      })),
    };

    const m = new MapLibreMap({
      container: container.current,
      center: [-72, 16.5],
      zoom: 3.4,
      minZoom: 2.2,
      maxZoom: 8,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          dots: {
            type: "geojson",
            data: geo,
          },
        },
        layers: [
          {
            id: "sea",
            type: "background",
            paint: { "background-color": "#0B2333" },
          },
          {
            id: "dots",
            type: "circle",
            source: "dots",
            paint: {
              "circle-color": [
                "case",
                ["==", ["get", "kind"], "island"],
                "#FFC93D",
                "#3CC6C1",
              ],
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                2,
                2.5,
                6,
                5,
              ],
              "circle-stroke-width": 1.2,
              "circle-stroke-color": "rgba(255,255,255,0.45)",
            },
          },
        ],
      },
    });

    m.on("load", () => {
      const popup = new Popup({
        closeButton: false,
        offset: 14,
        className: "maplibre-popup-dark",
      });
      m.on("mouseenter", "dots", (e) => {
        m.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (f) {
          popup.setLngLat(f.geometry.type === "Point" ? (f.geometry.coordinates as [number, number]) : [0, 0]).setHTML(
            `<span style="font-weight:600">${f.properties?.name}</span>`,
          ).addTo(m);
        }
      });
      m.on("mouseleave", "dots", () => {
        m.getCanvas().style.cursor = "";
        popup.remove();
      });
    });

    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden border border-ocean-200/80 shadow-lg dark:border-ocean-800">
      <div ref={container} className="h-[420px] w-full" />
      <div className="flex items-center justify-between border-t border-ocean-200/80 bg-ocean-950 px-4 py-2 text-[11px] text-ocean-200/80 dark:border-ocean-800">
        <span>CARIBE SCIENCE · red de investigación regional</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-sun-400" /> Islas
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-reef-400" /> Costas continentales
          </span>
        </span>
      </div>
    </div>
  );
}