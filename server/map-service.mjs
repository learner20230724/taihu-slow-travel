import http from "node:http";
import path from "node:path";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const USER_AGENT =
  "TaihuSlowTravel/2.0 (+https://guihualab.cn/taihu/; https://github.com/learner20230724/taihu-slow-travel/issues)";
const REFERER = "https://guihualab.cn/taihu/";
const week = 7 * 24 * 3600;

export function allowedTile(z, x, y) {
  if (
    ![z, x, y].every(Number.isInteger) ||
    z < 8 ||
    z > 18 ||
    x < 0 ||
    y < 0 ||
    x >= 2 ** z ||
    y >= 2 ** z
  )
    return false;
  const lon = (x / 2 ** z) * 360 - 180;
  const lat =
    (180 / Math.PI) * Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** z)));
  const lon2 = ((x + 1) / 2 ** z) * 360 - 180;
  const lat2 =
    (180 / Math.PI) *
    Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / 2 ** z)));
  return lon < 121 && lon2 > 119.35 && lat > 30.55 && lat2 < 31.95;
}

export function cacheAge(headers) {
  const match = headers.get("cache-control")?.match(/(?:^|,)\s*max-age=(\d+)/i);
  if (match) return Number(match[1]);
  const expires = Date.parse(headers.get("expires"));
  return Number.isFinite(expires)
    ? Math.max(0, Math.floor((expires - Date.now()) / 1000))
    : week;
}

export function validCoordinates(value) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 12)
    return false;
  return value.every(
    (p) =>
      Array.isArray(p) &&
      p.length === 2 &&
      p.every(Number.isFinite) &&
      p[0] > 119.4 &&
      p[0] < 120.9 &&
      p[1] > 30.6 &&
      p[1] < 31.9,
  );
}

export function createMapServer({
  cacheDir = "/var/cache/taihu-map",
  fetchImpl = fetch,
  now = () => Date.now(),
} = {}) {
  const inFlight = new Map();
  const routeCache = new Map();
  async function getTile(z, x, y) {
    const key = `${z}/${x}/${y}`;
    if (inFlight.has(key)) return inFlight.get(key);
    const promise = (async () => {
      const imagePath = path.join(cacheDir, `${key}.png`),
        metaPath = path.join(cacheDir, `${key}.json`);
      let previous = null,
        image = null;
      try {
        previous = JSON.parse(await readFile(metaPath, "utf8"));
        image = await readFile(imagePath);
      } catch {}
      if (previous?.expires > now() && image)
        return {
          image,
          age: Math.max(1, Math.floor((previous.expires - now()) / 1000)),
          etag: previous.etag,
          cache: "HIT",
        };
      const headers = { "User-Agent": USER_AGENT, Referer: REFERER };
      if (previous?.etag) headers["If-None-Match"] = previous.etag;
      if (previous?.lastModified)
        headers["If-Modified-Since"] = previous.lastModified;
      const response = await fetchImpl(
        `https://tile.openstreetmap.org/${key}.png`,
        { headers, signal: AbortSignal.timeout(20000) },
      );
      const age = cacheAge(response.headers);
      if (response.status === 304 && image) {
        previous.expires = now() + age * 1000;
        await writeFile(metaPath, JSON.stringify(previous));
        return { image, age, etag: previous.etag, cache: "REVALIDATED" };
      }
      if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("image/png")
      )
        throw new Error("Tile upstream unavailable");
      const bytes = Buffer.from(await response.arrayBuffer());
      if (
        bytes.length > 1000000 ||
        bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a"
      )
        throw new Error("Invalid tile response");
      await mkdir(path.dirname(imagePath), { recursive: true });
      const temp = `${imagePath}.${process.pid}.tmp`;
      await writeFile(temp, bytes);
      await rename(temp, imagePath);
      const meta = {
        expires: now() + age * 1000,
        etag: response.headers.get("etag"),
        lastModified: response.headers.get("last-modified"),
      };
      await writeFile(metaPath, JSON.stringify(meta));
      return { image: bytes, age, etag: meta.etag, cache: "MISS" };
    })();
    inFlight.set(key, promise);
    try {
      return await promise;
    } finally {
      inFlight.delete(key);
    }
  }
  function json(res, status, data) {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify(data));
  }
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (!["GET", "HEAD"].includes(req.method)) {
      json(res, 405, { error: "仅支持读取" });
      return;
    }
    if (url.pathname === "/health") {
      json(res, 200, {
        ok: true,
        version: "2.0.0",
        map: "OpenStreetMap",
        routing: "OSRM",
      });
      return;
    }
    const tile = url.pathname.match(
      /^\/tiles\/(\d{1,2})\/(\d{1,7})\/(\d{1,7})\.png$/,
    );
    if (tile) {
      const [z, x, y] = tile.slice(1).map(Number);
      if (!allowedTile(z, x, y)) {
        json(res, 400, { error: "地图范围仅限太湖及周边" });
        return;
      }
      if (inFlight.size >= 40) {
        json(res, 503, { error: "地图请求较多，请稍候" });
        return;
      }
      try {
        const value = await getTile(z, x, y);
        const headers = {
          "Content-Type": "image/png",
          "Cache-Control": `public, max-age=${value.age}`,
          "X-Tile-Cache": value.cache,
          "X-Content-Type-Options": "nosniff",
        };
        if (value.etag) headers.ETag = value.etag;
        if (value.etag && req.headers["if-none-match"] === value.etag) {
          res.writeHead(304, headers);
          res.end();
          return;
        }
        res.writeHead(200, headers);
        res.end(req.method === "HEAD" ? undefined : value.image);
      } catch {
        json(res, 503, {
          error: "真实地图底图暂时不可用，请稍后重试或打开高德地图",
        });
      }
      return;
    }
    if (url.pathname === "/route") {
      let coordinates;
      try {
        coordinates = JSON.parse(url.searchParams.get("coordinates"));
      } catch {}
      if (!validCoordinates(coordinates)) {
        json(res, 400, { error: "请选择2—12个已核实定位的地点" });
        return;
      }
      const key = JSON.stringify(coordinates);
      const cached = routeCache.get(key);
      if (cached && cached.until > now()) {
        json(res, 200, cached.value);
        return;
      }
      const values = coordinates
        .map((p) => p.map((n) => n.toFixed(6)).join(","))
        .join(";");
      try {
        const upstream = await fetchImpl(
          `https://router.project-osrm.org/route/v1/driving/${values}?overview=full&geometries=geojson&steps=false&alternatives=false&radiuses=${coordinates.map(() => 250).join(";")}`,
          {
            headers: { "User-Agent": USER_AGENT },
            signal: AbortSignal.timeout(25000),
          },
        );
        const data = await upstream.json();
        if (
          !upstream.ok ||
          data.code !== "Ok" ||
          !data.routes?.[0]?.geometry?.coordinates?.length
        ) {
          json(res, 422, {
            error:
              "未找到可用道路路线；可能入口离道路较远，请改用高德分段导航。",
          });
          return;
        }
        const route = data.routes[0];
        const value = {
          provider: "OSRM / OpenStreetMap",
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry,
          legs: route.legs.map((leg) => ({
            distance: leg.distance,
            duration: leg.duration,
          })),
          waypoints: data.waypoints?.map((w) => ({
            name: w.name,
            distance: w.distance,
            location: w.location,
          })),
          calculatedAt: new Date(now()).toISOString(),
          traffic: false,
        };
        if (routeCache.size > 80) routeCache.clear();
        routeCache.set(key, { until: now() + 3600000, value });
        json(res, 200, value);
      } catch {
        json(res, 503, {
          error: "道路计算服务暂不可用，没有生成替代线路；请使用地图导航。",
        });
      }
      return;
    }
    json(res, 404, { error: "未找到接口" });
  });
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  const server = createMapServer({
    cacheDir: process.env.TAIHU_MAP_CACHE || "/var/cache/taihu-map",
  });
  server.listen(Number(process.env.TAIHU_MAP_PORT || 4240), "127.0.0.1", () =>
    console.log("Taihu map service ready on loopback"),
  );
}
