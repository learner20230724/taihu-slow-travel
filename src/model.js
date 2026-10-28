import { placeById } from "./data.js";
export const STORAGE_KEY = "taihu-field-notes-v1";
export const initialNotes = () => ({
  version: 1,
  wanted: [],
  visited: [],
  notes: {},
  plan: [],
  direction: "ccw",
});
export function sanitizeNotes(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    value.version !== 1
  )
    throw new Error("请选择太湖慢游导出的 v1 备份文件。");
  const ids = (input) =>
    Array.isArray(input)
      ? [
          ...new Set(
            input.filter(
              (id) => typeof id === "string" && Object.hasOwn(placeById, id),
            ),
          ),
        ].slice(0, 100)
      : [];
  const notes = {};
  if (
    value.notes &&
    typeof value.notes === "object" &&
    !Array.isArray(value.notes)
  )
    for (const [id, note] of Object.entries(value.notes))
      if (Object.hasOwn(placeById, id) && typeof note === "string")
        notes[id] = note.slice(0, 2000);
  return {
    version: 1,
    wanted: ids(value.wanted),
    visited: ids(value.visited),
    notes,
    plan: ids(value.plan).slice(0, 12),
    direction: value.direction === "cw" ? "cw" : "ccw",
  };
}
export function readNotes(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return {
      value: raw ? sanitizeNotes(JSON.parse(raw)) : initialNotes(),
      error: "",
    };
  } catch {
    return {
      value: initialNotes(),
      error:
        "原有浏览器记录暂时无法读取，已保留原数据。请先导出或检查浏览器存储后再修改。",
    };
  }
}
export function mapUrl(p, provider = "amap") {
  const keyword = p.nav || `${p.city}${p.name}`;
  if (p.coords && p.coordinateSource) {
    if (provider === "baidu")
      return `https://api.map.baidu.com/marker?location=${p.coords[1]},${p.coords[0]}&title=${encodeURIComponent(p.name)}&content=${encodeURIComponent(p.address || keyword)}&coord_type=wgs84&output=html&src=webapp.guihualab.taihu`;
    const source = p.coordinateSource;
    const position =
      source.system === "GCJ-02" ? [source.lng, source.lat] : p.coords;
    return `https://uri.amap.com/marker?position=${position.join(",")}&name=${encodeURIComponent(p.name)}&coordinate=${source.system === "GCJ-02" ? "gaode" : "wgs84"}&callnative=1&src=taihu-slow-travel`;
  }
  return provider === "baidu"
    ? `https://api.map.baidu.com/geocoder?address=${encodeURIComponent(keyword)}&output=html&src=taihu-slow-travel`
    : `https://uri.amap.com/search?keyword=${encodeURIComponent(keyword)}&city=${encodeURIComponent(p.city)}&view=map&src=taihu-slow-travel`;
}
export function formatDuration(p) {
  return `${p.duration[0]}—${p.duration[1]}分钟`;
}
export function formatCost(p) {
  if (p.cost[0] === null)
    return p.category === "food" ? "价格请询店" : "费用见详情";
  if (p.cost[1] === 0) return "公共湖岸";
  return `¥${p.cost[0]}—${p.cost[1]}${p.category === "food" ? "/人" : " 预算"}`;
}
export function chooseTemplateRoute(template, direction = "ccw") {
  const ids = template.ids.filter((id) => placeById[id]);
  return direction === "cw" ? [...ids].reverse() : [...ids];
}
export function filterPlaces(
  input,
  {
    region = "all",
    category = "all",
    season = "all",
    query = "",
    short = false,
    mainline = false,
    unseen = false,
    wanted = false,
  },
  notes,
) {
  const needle = query.trim().toLocaleLowerCase();
  return input.filter(
    (p) =>
      (region === "all" || p.region === region) &&
      (category === "all" || p.category === category) &&
      (season === "all" || p.seasons.includes(season)) &&
      (!short || p.duration[0] <= 60) &&
      (!mainline || !p.branch) &&
      (!unseen || !notes.visited.includes(p.id)) &&
      (!wanted || notes.wanted.includes(p.id)) &&
      (!needle ||
        `${p.name} ${p.city} ${p.summary} ${p.tags.join(" ")} ${(p.dishes || []).join(" ")}`
          .toLocaleLowerCase()
          .includes(needle)),
  );
}
export function planStats(ids) {
  const rows = ids.map((id) => placeById[id]).filter(Boolean);
  return {
    count: rows.length,
    min: rows.reduce((n, p) => n + p.duration[0], 0),
    max: rows.reduce((n, p) => n + p.duration[1], 0),
    regions: new Set(rows.map((p) => p.region)).size,
    branches: rows.filter((p) => p.branch).length,
  };
}
