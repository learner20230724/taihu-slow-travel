import transform from "coordtransform";

// OSM uses WGS84. Public Amap POIs use GCJ-02; keeping their datum is essential.
export function gcjToWgs84(lng, lat) {
  let [x, y] = transform.gcj02towgs84(lng, lat);
  for (let i = 0; i < 5; i++) {
    const [gx, gy] = transform.wgs84togcj02(x, y);
    x -= gx - lng;
    y -= gy - lat;
  }
  return [x, y];
}

export function getVerifiedPosition(place) {
  if (place.roadGeometry) return null;
  const source = place.coordinateSource;
  if (!source || !source.url || !source.matchedName) return null;
  const { lng, lat, system } = source;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng < 119.4 || lng > 120.9 || lat < 30.6 || lat > 31.9) return null;
  if (!["poi", "entrance", "area"].includes(source.precision)) return null;
  let url;
  try {
    url = new URL(source.url);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (system === "WGS84") return [lng, lat];
  if (system === "GCJ-02") return gcjToWgs84(lng, lat);
  if (system === "BD-09") return gcjToWgs84(...transform.bd09togcj02(lng, lat));
  return null;
}

export function haversineMeters(a, b) {
  const rad = (n) => (n * Math.PI) / 180;
  const dLat = rad(b[1] - a[1]),
    dLng = rad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export const precisionLabels = {
  poi: "地图POI定位",
  entrance: "入口定位",
  area: "区域中心，非入口",
};
