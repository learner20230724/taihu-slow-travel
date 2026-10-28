import { spawn, execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { places, placeById, routeTemplates } from "../src/data.js";
import { STORAGE_KEY } from "../src/model.js";
const root = fileURLToPath(new URL("../", import.meta.url));
const out = new URL("../test-results/", import.meta.url);
await mkdir(out, { recursive: true });
const run = (command, args, env = {}) =>
  execFileSync(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
run("npm", ["run", "test"]);
run("npm", ["run", "build"]);
const preview = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4239",
    "--strictPort",
  ],
  { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
);
let previewFailure = "";
preview.stderr.on("data", (data) => {
  previewFailure += data.toString();
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    if (preview.exitCode !== null)
      throw new Error(`Release preview failed: ${previewFailure}`);
    try {
      if ((await fetch("http://127.0.0.1:4239/taihu/")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  check(ready, "Release preview did not become ready.");
  run("npm", ["run", "test:browser"], {
    TAIHU_URL: "http://127.0.0.1:4239/taihu/",
  });
} finally {
  preview.kill("SIGTERM");
}
// The loopback service is installed once as documented; routine releases reload its source.
run("systemctl", ["restart", "taihu-map.service"]);
let serviceReady = false;
for (let attempt = 0; attempt < 20; attempt++) {
  try {
    serviceReady = (await fetch("http://127.0.0.1:4240/health")).ok;
  } catch {}
  if (serviceReady) break;
  await new Promise((resolve) => setTimeout(resolve, 250));
}
check(serviceReady, "Map service did not become ready.");
run(process.execPath, ["scripts/deploy.mjs"]);
const url = "https://guihualab.cn/taihu/";
const response = await fetch(url, { cache: "no-store" });
const html = await response.text();
check(
  response.ok && html.includes("太湖慢游"),
  "Public project URL is not serving this app.",
);
const assets = [
  ...html.matchAll(/(?:src|href)="(\/taihu\/assets\/[^\"]+)"/g),
].map((m) => m[1]);
check(assets.length >= 2, "Public asset references missing.");
for (const asset of assets)
  check(
    (await fetch(new URL(asset, url))).ok,
    `Public asset unavailable: ${asset}`,
  );
check(
  (await fetch("https://guihualab.cn/api/taihu/health")).ok,
  "Public map API unavailable.",
);
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  args: ["--no-sandbox"],
});
const errors = [];
async function realMap(page) {
  // A normal visible map view, with real network tiles. Never a mocked QA screenshot.
  await page.waitForFunction(
    () => {
      const imgs = [
        ...document.querySelectorAll(".real-lake-map img.leaflet-tile"),
      ];
      return (
        imgs.length >= 4 &&
        imgs.every((img) => img.complete && img.naturalWidth === 256) &&
        document.querySelector(".map-network.ready")
      );
    },
    null,
    { timeout: 45000 },
  );
  check(
    await page
      .locator('.leaflet-control-attribution a[href*="openstreetmap"]')
      .isVisible(),
    "Map attribution absent.",
  );
  return page.locator(".real-lake-map img.leaflet-tile").count();
}
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const project = await context.newPage();
  project.on("pageerror", (e) => errors.push(e.message));
  await project.goto(url, { waitUntil: "networkidle" });
  const realTiles = await realMap(project);
  check(
    (await project.locator(".map-footer").innerText()).includes(
      "已核实61个定位、3段道路",
    ),
    "New location catalog missing on public site.",
  );
  check(
    (await project.locator("button[data-point]").count()) ===
      places.filter((p) => p.coords).length,
    "Public point count mismatch.",
  );
  const correctedPin = await project
    .locator('button[data-point="yuyangshan"]')
    .evaluate((el) => [Number(el.dataset.lng), Number(el.dataset.lat)]);
  check(
    correctedPin.every(
      (n, i) => Math.abs(n - placeById.yuyangshan.coords[i]) < 0.000001,
    ),
    "Corrected public point is stale.",
  );
  await project.screenshot({
    path: fileURLToPath(new URL("navigation-preview.png", out)),
  });
  await project.screenshot({
    path: fileURLToPath(new URL("public-desktop.png", out)),
  });
  await project.getByRole("searchbox").fill("渔洋山");
  await project.locator('[data-place-card="yuyangshan"] .card-title').click();
  check(
    (await project.getByRole("dialog").locator(".guide-section").count()) === 7,
    "Detailed public guide incomplete.",
  );
  check(
    (await project.locator(".coordinate-facts").innerText()).includes(
      "120.377742",
    ),
    "Raw coordinate source absent.",
  );
  await project.screenshot({
    path: fileURLToPath(new URL("public-corrected-detail.png", out)),
  });
  await project.getByRole("button", { name: "关闭面板", exact: true }).click();
  await project.getByRole("searchbox").fill("");
  // Verify real road calculation through the same public UI in a synthetic, isolated record.
  await project.evaluate(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          wanted: [],
          visited: [],
          notes: {},
          plan: ["jinyuan", "bogo"],
          direction: "ccw",
        }),
      ),
    STORAGE_KEY,
  );
  await project.reload({ waitUntil: "networkidle" });
  await project.locator(".plan-nav").click();
  const roadResponse = project.waitForResponse(
    (res) => res.url().includes("/api/taihu/route?"),
    { timeout: 35000 },
  );
  await project
    .getByRole("button", { name: "计算道路距离与行车时间", exact: true })
    .click();
  const roadRes = await roadResponse;
  const road = await roadRes.json();
  check(
    roadRes.ok() &&
      road.geometry?.coordinates?.length > 4 &&
      road.distance > 1000,
    "Real public road geometry missing.",
  );
  await project.locator(".road-result").waitFor();
  await project.getByRole("button", { name: "关闭面板", exact: true }).click();
  // Only this verified real screenshot is copied into the navigation site.
  run(process.execPath, ["scripts/sync-lab.mjs"]);
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("https://guihualab.cn/", { waitUntil: "networkidle" });
  const card = page.locator(".project-card.taihu-slow-travel");
  await card.waitFor();
  check((await card.count()) === 1, "Navigation card duplicated.");
  check(
    await card
      .locator("img")
      .evaluate((img) => img.complete && img.naturalWidth > 0),
    "Navigation screenshot unavailable.",
  );
  check(
    (await card.innerText()).includes("69"),
    "Navigation description stale.",
  );
  const popupPromise = page.waitForEvent("popup");
  await card.locator("a.launch").click();
  const linked = await popupPromise;
  linked.on("pageerror", (e) => errors.push(e.message));
  await linked.waitForLoadState("networkidle");
  check(
    linked.url() === url &&
      (await linked.locator("h1").innerText()).includes("太湖"),
    "Public navigation link failed.",
  );
  await realMap(linked);
  await page.screenshot({
    path: fileURLToPath(new URL("public-lab.png", out)),
    fullPage: true,
  });
  await linked.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await linked.setViewportSize({ width: 393, height: 852 });
  await linked.reload({ waitUntil: "networkidle" });
  const mobileTiles = await realMap(linked);
  await linked.screenshot({
    path: fileURLToPath(new URL("public-mobile.png", out)),
    fullPage: true,
  });
  await linked
    .locator('button[data-point="xiangshan"]')
    .first()
    .click({ force: true });
  check(
    await linked.getByRole("dialog").isVisible(),
    "Public mobile map pin did not open guide.",
  );
  check(
    (await linked.locator(".detail-title").innerText()).includes(
      "香山公路驿站",
    ),
    "Wrong mobile location guide.",
  );
  await linked.screenshot({
    path: fileURLToPath(new URL("public-mobile-detail.png", out)),
  });
  await linked.getByRole("button", { name: "关闭面板", exact: true }).click();
  await linked
    .locator(".mobile-nav")
    .getByRole("button", { name: "主题路线" })
    .click();
  check(
    (await linked.locator(".route-card").count()) === routeTemplates.length,
    "Public mobile routes did not render.",
  );
  check(
    await linked.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "Public mobile overflow.",
  );
  check(errors.length === 0, errors.join("; "));
  check(
    (await fetch("https://guihualab.cn/api/share/files")).status === 401,
    "Existing private sharing authentication changed.",
  );
  const report = {
    passed: true,
    url,
    navigation: "https://guihualab.cn/",
    assets,
    realTiles,
    mobileTiles,
    mapTransport: "real OpenStreetMap via cached HTTPS service; no mocks",
    guideCount: places.length,
    sourcedPoints: places.filter((p) => p.coords).length,
    realRoadRanges: places.filter((p) => p.roadGeometry).length,
    unmapped: places
      .filter((p) => !p.coords && !p.roadGeometry)
      .map((p) => p.id),
    routes: routeTemplates.length,
    correctedPoint: "yuyangshan",
    road: {
      provider: road.provider,
      distance: road.distance,
      duration: road.duration,
      vertices: road.geometry.coordinates.length,
    },
    navigationClick: true,
    mobilePinGuide: true,
    errors,
    publishedAt: new Date().toISOString(),
  };
  await writeFile(
    new URL("release-report.json", out),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
