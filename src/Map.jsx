import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Minus,
  Plus,
  LocateFixed,
  Maximize2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { categories } from "./data.js";

const LAKE_BOUNDS = [
  [30.88, 119.87],
  [31.59, 120.64],
];
const MAX_BOUNDS = [
  [30.55, 119.35],
  [31.95, 121],
];

export default function LakeMap({
  places,
  selected,
  onSelect,
  onOpen,
  region,
  plan,
  roadRoute = null,
  focusToken = 0,
}) {
  const container = useRef(null),
    mapRef = useRef(null),
    tilesRef = useRef(null),
    markerGroup = useRef(null),
    routeLayer = useRef(null);
  const selectRef = useRef(onSelect),
    openRef = useRef(onOpen),
    initial = useRef(true);
  const [status, setStatus] = useState("loading");
  const verified = places.filter(
    (p) => Array.isArray(p.coords) && p.coordinateSource,
  );
  const roads = places.filter((p) => p.roadGeometry);
  selectRef.current = onSelect;
  openRef.current = onOpen;

  useEffect(() => {
    const map = L.map(container.current, {
      minZoom: 8,
      maxZoom: 18,
      zoomControl: false,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      scrollWheelZoom: false,
      maxBounds: MAX_BOUNDS,
      maxBoundsViscosity: 0.8,
      attributionControl: true,
    });
    mapRef.current = map;
    map.attributionControl.setPrefix(false);
    map.fitBounds(LAKE_BOUNDS, { padding: [18, 18], animate: false });
    const tiles = L.tileLayer("/api/taihu/tiles/{z}/{x}/{y}.png", {
      minZoom: 8,
      maxZoom: 18,
      bounds: MAX_BOUNDS,
      noWrap: true,
      keepBuffer: 0,
      updateWhenIdle: true,
      updateWhenZooming: false,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);
    tilesRef.current = tiles;
    let successes = 0,
      failures = 0;
    tiles.on("loading", () => {
      successes = 0;
      failures = 0;
      setStatus("loading");
    });
    tiles.on("tileload", () => {
      successes++;
      if (!failures) setStatus("ready");
    });
    tiles.on("tileerror", () => {
      failures++;
      setStatus("error");
    });
    tiles.on("load", () =>
      setStatus(!failures && successes ? "ready" : "error"),
    );
    markerGroup.current = L.layerGroup().addTo(map);
    L.control
      .scale({ imperial: false, maxWidth: 100, position: "bottomleft" })
      .addTo(map);
    const resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resize.observe(container.current);
    map.on("focus", () => map.scrollWheelZoom.enable());
    map.on("blur", () => map.scrollWheelZoom.disable());
    const timeout = setTimeout(() => {
      if (!successes) setStatus("error");
    }, 22000);
    return () => {
      clearTimeout(timeout);
      resize.disconnect();
      map.remove();
      mapRef.current = null;
      initial.current = true;
    };
  }, []);

  useEffect(() => {
    const group = markerGroup.current;
    if (!mapRef.current || !group) return;
    group.clearLayers();
    for (const road of roads) {
      const layer = L.geoJSON(road.roadGeometry, {
        style: {
          color: road.id === selected ? "#346c44" : "#96b38a",
          weight: road.id === selected ? 7 : 4,
          opacity: 0.9,
        },
      });
      layer.on("click", () => {
        selectRef.current(road.id);
        if (window.matchMedia("(max-width: 767px)").matches)
          openRef.current?.(road.id);
      });
      const name = document.createElement("span");
      name.textContent = road.name;
      layer.bindTooltip(name, { sticky: true, className: "real-map-label" });
      layer.addTo(group);
    }
    for (const p of verified) {
      const color =
        categories.find((c) => c.id === p.category)?.color || "#285b48";
      const index = plan.indexOf(p.id),
        active = p.id === selected;
      const button = document.createElement("button");
      button.className = `real-map-pin ${active ? "active" : ""} ${index >= 0 ? "in-plan" : ""}`;
      button.style.setProperty("--pin-color", color);
      button.setAttribute("aria-label", `在地图上查看${p.name}`);
      button.setAttribute("data-point", p.id);
      button.setAttribute("aria-pressed", String(active));
      button.dataset.lng = String(p.coords[0]);
      button.dataset.lat = String(p.coords[1]);
      const dot = document.createElement("span");
      dot.textContent = index >= 0 ? String(index + 1) : "";
      button.append(dot);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        selectRef.current(p.id);
        if (window.matchMedia("(max-width: 767px)").matches)
          openRef.current?.(p.id);
      });
      const marker = L.marker([p.coords[1], p.coords[0]], {
        icon: L.divIcon({
          html: button,
          className: "real-map-marker",
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        }),
        keyboard: false,
        zIndexOffset: active ? 2000 : index >= 0 ? 1000 : 0,
      });
      const label = document.createElement("span");
      label.textContent = p.name;
      marker.bindTooltip(label, {
        permanent: active,
        direction: "top",
        offset: [0, -11],
        className: "real-map-label",
      });
      marker.addTo(group);
    }
  }, [places, selected, plan]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (region === "all")
      map.fitBounds(LAKE_BOUNDS, { padding: [18, 18], animate: false });
    else if (verified.length)
      map.fitBounds(
        L.latLngBounds(verified.map((p) => [p.coords[1], p.coords[0]])),
        { padding: [45, 45], maxZoom: 12, animate: false },
      );
  }, [region]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (initial.current) {
      initial.current = false;
      if (!focusToken) return;
    }
    const p = places.find((p) => p.id === selected && p.coords);
    if (p && focusToken)
      map.setView([p.coords[1], p.coords[0]], Math.max(map.getZoom(), 14), {
        animate: false,
      });
    const road = places.find((p) => p.id === selected && p.roadGeometry);
    if (road && focusToken)
      map.fitBounds(L.geoJSON(road.roadGeometry).getBounds(), {
        padding: [35, 35],
        maxZoom: 14,
        animate: false,
      });
  }, [focusToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (routeLayer.current) {
      map.removeLayer(routeLayer.current);
      routeLayer.current = null;
    }
    if (roadRoute?.geometry) {
      const layer = L.geoJSON(roadRoute.geometry, {
        style: { color: "#1d6b54", weight: 5, opacity: 0.85, lineCap: "round" },
      }).addTo(map);
      routeLayer.current = layer;
      map.fitBounds(layer.getBounds(), { padding: [40, 40], animate: false });
    }
  }, [roadRoute]);

  const retry = () => {
    setStatus("loading");
    tilesRef.current?.redraw();
  };
  return (
    <div className="map-wrap real-map-wrap">
      <div className="map-heading">
        <span className="map-heading-dot" />
        <strong>太湖道路地图</strong>
        <span className="map-sublabel">放大查看岛屿、道路和地点</span>
      </div>
      <div className="map-canvas real-map-canvas">
        <div
          ref={container}
          className="real-lake-map"
          aria-label="OpenStreetMap 太湖真实地图"
        />
        <div className={`map-network ${status}`} role="status">
          {status === "loading"
            ? "正在加载地图"
            : status === "error"
              ? "底图加载遇到问题"
              : "OpenStreetMap 地图"}
          {status === "error" && (
            <button onClick={retry}>
              <RefreshCw size={12} />
              重试
            </button>
          )}
        </div>
        {status === "error" && (
          <div className="map-load-help">
            <p>底图暂未完整加载，地点清单仍可使用。</p>
            <a
              href="https://www.openstreetmap.org/#map=10/31.235/120.150"
              target="_blank"
              rel="noopener noreferrer"
            >
              打开原地图
              <ExternalLink size={12} />
            </a>
          </div>
        )}
        <div className="map-controls">
          <button
            aria-label="放大地图"
            onClick={() => mapRef.current?.zoomIn()}
          >
            <Plus size={18} />
          </button>
          <button
            aria-label="缩小地图"
            onClick={() => mapRef.current?.zoomOut()}
          >
            <Minus size={18} />
          </button>
          <button
            aria-label="复位地图"
            onClick={() =>
              mapRef.current?.fitBounds(LAKE_BOUNDS, {
                padding: [18, 18],
                animate: false,
              })
            }
          >
            <LocateFixed size={18} />
          </button>
          <button
            aria-label="全屏地图"
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else container.current.parentElement.requestFullscreen?.();
            }}
          >
            <Maximize2 size={17} />
          </button>
        </div>
      </div>
      <div className="map-footer">
        <span>
          <i />
          已核实{verified.length}个定位
          {roads.length ? `、${roads.length}段道路` : ""}
        </span>
        {places.length > verified.length + roads.length && (
          <span className="unlocated-count">
            另{places.length - verified.length - roads.length}个待核实，未落点
          </span>
        )}
        <small>
          {roadRoute
            ? "深色实线为道路计算结果，非实时路况"
            : "打开地点可核对定位来源"}
        </small>
      </div>
    </div>
  );
}
