import suzhou from "./content/suzhou.json" with { type: "json" };
import northwest from "./content/northwest.json" with { type: "json" };
import south from "./content/south.json" with { type: "json" };
import roadFeatures from "./content/roads.json" with { type: "json" };
import { getVerifiedPosition } from "./geo.js";
export {
  regions,
  categories,
  seasons,
  checkedAt,
  foodNotes,
  routeTemplates,
} from "./catalog.js";

const cities = {
  suzhou: "苏州",
  wuxi: "无锡",
  changzhou: "常州",
  yixing: "宜兴",
  changxing: "长兴",
  huzhou: "湖州",
};
export const places = [...suzhou, ...northwest, ...south].map((p) => {
  const features = roadFeatures.features.filter(
    (f) => f.properties.placeId === p.id,
  );
  const roadGeometry = features.length
    ? { type: "FeatureCollection", features }
    : null;
  return {
    duration: [45, 90],
    cost: [null, null],
    tags: [],
    seasons: ["spring", "summer", "autumn", "winter"],
    ...p,
    city: cities[p.region],
    source: p.sources?.[0] || p.source,
    sources: p.sources || (p.source ? [p.source] : []),
    coordinateSource: p.coordinateSource || null,
    coords: getVerifiedPosition({ ...p, roadGeometry }),
    tagline:
      p.tagline && p.tagline.length <= 28
        ? p.tagline
        : p.tags?.slice(0, 3).join(" · ") || "沿湖慢慢发现",
    nav: p.nav || `${cities[p.region]}${p.name}`,
    tip: p.tip || p.guide.watchOut,
    roadGeometry,
  };
});
export const placeById = Object.fromEntries(places.map((p) => [p.id, p]));
