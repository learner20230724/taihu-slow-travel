import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { places, regions, categories, routeTemplates } from "../src/data.js";
import { STORAGE_KEY } from "../src/model.js";
import { allowedTile } from "../server/map-service.mjs";
const base = process.env.TAIHU_URL || "http://127.0.0.1:4238/taihu/";
const out = new URL("../test-results/", import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1080 },
  deviceScaleFactor: 1,
});
// Automated pan/zoom and filter checks use a transport fixture, never harvest OSM tiles.
const tileFixture = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lLkAAAAASUVORK5CYII=",
  "base64",
);
let outOfRangeTiles = 0;
await context.route("**/api/taihu/tiles/**", (route) => {
  const xyz = new URL(route.request().url()).pathname
    .match(/tiles\/(\d+)\/(\d+)\/(\d+)/)
    .slice(1)
    .map(Number);
  if (!allowedTile(...xyz)) {
    outOfRangeTiles++;
    return route.fulfill({ status: 400, body: "Map range exceeded" });
  }
  return route.fulfill({
    contentType: "image/png",
    body: tileFixture,
    headers: { "Cache-Control": "public, max-age=604800" },
  });
});
let routeCalls = 0;
await context.route("**/api/taihu/route?**", async (route) => {
  routeCalls++;
  await route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      provider: "OSRM fixture",
      distance: 1200,
      duration: 180,
      geometry: {
        type: "LineString",
        coordinates: [
          [120.1, 31.1],
          [120.11, 31.12],
          [120.12, 31.13],
        ],
      },
      traffic: false,
    }),
  });
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const report = {
  base,
  checks: [],
  layouts: [],
  errors,
  tileTransport:
    "fixture; actual basemap verified separately on public deployment",
};
async function load(hash = "explore") {
  await page.goto(`${base}#${hash}`, { waitUntil: "networkidle" });
}
async function close() {
  await page.getByRole("button", { name: "关闭面板", exact: true }).click();
}
try {
  const response = await page.goto(base, { waitUntil: "networkidle" });
  assert(response.ok(), "Page failed");
  assert(
    (await page.title()) === "太湖慢游 · 每次绕湖，都有新发现",
    "Wrong title",
  );
  for (const region of regions) {
    await page
      .locator(".region-tabs")
      .getByRole("button", { name: region.name, exact: true })
      .click();
    const expected =
      region.id === "all"
        ? places.length
        : places.filter((p) => p.region === region.id).length;
    assert(
      (await page.locator("[data-place-card]").count()) ===
        Math.min(12, expected),
      `City filter ${region.name}`,
    );
  }
  await page
    .locator(".region-tabs")
    .getByRole("button", { name: "整座太湖" })
    .click();
  for (const category of categories) {
    await page
      .locator(".category-filters button")
      .filter({ hasText: category.name })
      .click();
    const expected =
      category.id === "all"
        ? places.length
        : places.filter((p) => p.category === category.id).length;
    assert(
      (await page.locator("[data-place-card]").count()) ===
        Math.min(12, expected),
      `Category filter ${category.name}`,
    );
  }
  await page
    .locator(".category-filters button")
    .filter({ hasText: "全部发现" })
    .click();
  await page.locator(".season-pills button").filter({ hasText: "秋" }).click();
  assert(
    (await page.locator("[data-place-card]").count()) > 0,
    "Season filter",
  );
  await page
    .locator(".season-pills button")
    .filter({ hasText: "不限" })
    .click();
  await page.getByRole("searchbox").fill("玉兰饼");
  assert(
    (await page.locator('[data-place-card="xihe"]').count()) === 1,
    "Text search",
  );
  await page.getByRole("searchbox").fill("一个不存在的太湖地点");
  assert(
    await page.locator(".discover-section .empty-state").isVisible(),
    "No-results state",
  );
  await page.getByRole("searchbox").fill("");
  report.checks.push(
    "6 cities, 7 categories, seasons, search and empty states",
  );
  await page
    .locator('button[data-point="xiangshan"]')
    .first()
    .click({ force: true });
  assert(
    (await page.locator(".selected-body h2").innerText()).includes(
      "香山公路驿站",
    ),
    "Map pin selection",
  );
  await page.getByRole("button", { name: "放大地图", exact: true }).click();
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: "缩小地图", exact: true }).click();
    await page.waitForTimeout(250);
  }
  await page.waitForLoadState("networkidle");
  assert(
    outOfRangeTiles === 0,
    "Zooming out never requests tiles beyond the supported region",
  );
  await page.locator(".map-network.ready").waitFor();
  await page.getByRole("button", { name: "复位地图", exact: true }).click();
  await page
    .locator(".selected-body")
    .getByRole("button", { name: "加入这次路线", exact: true })
    .click();
  await page.getByRole("searchbox").fill("锡和无锡菜");
  await page.locator('[data-place-card="xihe"] .card-title').click();
  await page.getByRole("dialog").waitFor();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "收藏想去锡和无锡菜 · 景丽苑店", exact: true })
    .click();
  await page.getByRole("button", { name: "标记已去", exact: true }).click();
  await page
    .getByRole("textbox", {
      name: "记下吃过的菜、喜欢的位置，或下次再来的理由",
    })
    .fill("自动化验证：下次尝尝玉兰饼。");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "加入这次路线", exact: true })
    .click();
  const navigation = await page
    .getByRole("dialog")
    .getByRole("link", { name: "高德地图" })
    .getAttribute("href");
  assert(decodeURIComponent(navigation).includes("景丽苑"), "Navigation name");
  assert(
    (await page.getByRole("dialog").innerText()).includes("为什么值得停"),
    "Detailed highlights",
  );
  assert(
    (await page.getByRole("dialog").locator(".guide-walk li").count()) === 3,
    "Specific walk steps",
  );
  assert(
    (await page.getByRole("dialog").locator(".detail-source a").count()) >= 2,
    "Multiple traceable sources",
  );
  assert(
    (await page.getByRole("dialog").innerText()).includes("此地点暂不落点"),
    "Unverified location is explicit",
  );
  await close();
  await page.reload({ waitUntil: "networkidle" });
  let saved = JSON.parse(
    await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
  );
  assert(
    saved.wanted.includes("xihe") &&
      saved.visited.includes("xihe") &&
      saved.notes.xihe.includes("玉兰饼") &&
      saved.plan.length === 2,
    "Persistence",
  );
  report.checks.push(
    "map selection, zoom, name-based navigation, wanted, visited, note and reload persistence",
  );
  await page.locator(".plan-nav").click();
  assert((await page.locator(".plan-list li").count()) === 2, "Plan add");
  await page
    .getByRole("button", { name: "上移锡和无锡菜 · 景丽苑店", exact: true })
    .click();
  assert(
    (await page.locator(".plan-list li").first().innerText()).includes("锡和"),
    "Plan reorder",
  );
  await page.getByRole("button", { name: /逆时针 · 反转顺序/ }).click();
  assert(
    (await page.locator(".plan-list li").first().innerText()).includes(
      "香山公路驿站",
    ),
    "Plan reverse",
  );
  await page
    .getByRole("button", { name: "计算道路距离与行车时间", exact: true })
    .click();
  assert(
    (await page.locator(".road-error").innerText()).includes("尚未核实"),
    "Unverified points not routed",
  );
  assert(routeCalls === 0, "No guessed coordinates sent for routing");
  await close();
  // Add a second sourced point, then explicitly request a partial route.
  await page.getByRole("searchbox").fill("锦苑");
  await page.locator('[data-place-card="jinyuan"] .card-title').click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "加入这次路线", exact: true })
    .click();
  await close();
  await page.locator(".plan-nav").click();
  await page
    .getByRole("button", { name: "计算道路距离与行车时间", exact: true })
    .click();
  await page
    .getByRole("button", { name: "仅计算2个已定位地点", exact: true })
    .click();
  await page.locator(".road-result").waitFor();
  assert(
    (await page.locator(".road-result").innerText()).includes("未计算锡和"),
    "Partial road result discloses omitted stop",
  );
  assert(routeCalls === 1, "Partial route requires explicit choice");
  const routeDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载路书", exact: true }).click();
  const routeFile = await routeDownload;
  assert(routeFile.suggestedFilename().endsWith(".txt"), "Route export");
  assert(
    (await readFile(await routeFile.path(), "utf8")).includes("uri.amap.com"),
    "Exported navigation",
  );
  await close();
  await page.getByRole("searchbox").fill("");
  await load("routes");
  assert(
    (await page.locator(".route-card").count()) === routeTemplates.length,
    "All templates render",
  );
  await page.locator(".segmented button").filter({ hasText: "半天" }).click();
  assert(
    (await page.locator(".route-card").count()) ===
      routeTemplates.filter((r) => r.duration === "半天").length,
    "Half-day route filter",
  );
  await page
    .locator(".segmented button")
    .filter({ hasText: "所有路线" })
    .click();
  await page.locator(".route-load").first().click();
  assert(
    (await page.locator(".plan-list li").count()) ===
      routeTemplates[0].ids.length,
    "Template load",
  );
  await page
    .getByRole("button", { name: "计算道路距离与行车时间", exact: true })
    .click();
  await page.locator(".road-result").waitFor();
  assert(
    (await page.locator(".road-result").innerText()).includes("1.2公里"),
    "Road response rendered",
  );
  assert(routeCalls === 2, "Verified coordinates sent to route service");
  await close();
  report.checks.push(
    "route reorder, reverse, export, duration filter and template load",
  );
  await load("food");
  assert(
    (await page.locator("[data-place-card]").count()) ===
      places.filter((p) => p.category === "food").length,
    "Food library",
  );
  await load("journal");
  assert(
    (await page.locator('[data-place-card="xihe"]').count()) === 1,
    "Wanted journal",
  );
  const backupDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出备份", exact: true }).click();
  const backupFile = await backupDownload;
  const backup = JSON.parse(await readFile(await backupFile.path(), "utf8"));
  assert(backup.visited.includes("xihe"), "Backup contents");
  const incoming = {
    version: 1,
    wanted: ["yigao"],
    visited: ["moon"],
    notes: { yigao: "导入验证" },
    plan: ["moon"],
  };
  await page.locator("input[type=file]").setInputFiles({
    name: "notes.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(incoming)),
  });
  await page.waitForFunction(
    (key) => JSON.parse(localStorage.getItem(key)).wanted.includes("yigao"),
    STORAGE_KEY,
  );
  saved = JSON.parse(
    await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
  );
  assert(
    saved.wanted.includes("xihe") &&
      saved.visited.includes("moon") &&
      saved.plan.length === routeTemplates[0].ids.length,
    "Import merge preserved existing route",
  );
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{broken"),
  });
  await page.waitForFunction(() =>
    document.querySelector(".toast")?.textContent.includes("有效的JSON"),
  );
  assert(
    (await page.locator(".toast").innerText()).includes("有效的JSON"),
    "Bad import reporting",
  );
  report.checks.push(
    "food, journal, JSON export/import merge and invalid file handling",
  );
  for (const width of [320, 393, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 852 : 1080 });
    for (const view of ["explore", "routes", "food", "journal"]) {
      await load(view);
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `Horizontal overflow at ${width}/${view}`,
      );
    }
    await load("explore");
    await page
      .locator("[data-place-card]")
      .first()
      .locator(".card-title")
      .click();
    assert(
      await page.getByRole("dialog").isVisible(),
      `Mobile detail at ${width}`,
    );
    const box = await page.getByRole("dialog").boundingBox();
    assert(
      box.x >= 0 && box.x + box.width <= width + 1,
      `Drawer overflow ${width}`,
    );
    await page.screenshot({
      path: new URL(`detail-${width}.png`, out).pathname,
    });
    await page.keyboard.press("Escape");
    assert((await page.getByRole("dialog").count()) === 0, "Escape dismissal");
    if (width < 768) {
      await page
        .locator(".mobile-nav")
        .getByRole("button", { name: "主题路线" })
        .click();
      assert(
        (await page.locator(".route-card").count()) > 0,
        "Mobile navigation",
      );
    }
    await load("explore");
    if (width === 393) {
      await page.getByRole("button", { name: "复位地图", exact: true }).click();
      await page
        .locator('button[data-point="xiangshan"]')
        .first()
        .click({ force: true });
      assert(
        await page.getByRole("dialog").isVisible(),
        "Mobile map pin opens complete guide",
      );
      assert(
        (await page.locator(".detail-title").innerText()).includes(
          "香山公路驿站",
        ),
        "Mobile pin guide matches location",
      );
      await close();
    }
    report.layouts.push(width);
  }
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load("explore");
  await page.screenshot({
    path: new URL("fixture-desktop.png", out).pathname,
  });
  await page.setViewportSize({ width: 393, height: 852 });
  await page.reload({ waitUntil: "networkidle" });
  await page.screenshot({
    path: new URL("mobile-preview.png", out).pathname,
    fullPage: true,
  });
  const failurePage = await context.newPage();
  failurePage.on("pageerror", (e) => errors.push(e.message));
  await failurePage.addInitScript((key) => {
    localStorage.setItem(key, "{broken");
  }, STORAGE_KEY);
  await failurePage.goto(base, { waitUntil: "networkidle" });
  assert(
    await failurePage.locator(".storage-warning").isVisible(),
    "Storage warning",
  );
  await failurePage
    .locator(".selected-body")
    .getByRole("button", { name: "加入这次路线", exact: true })
    .click();
  assert(
    (await failurePage.evaluate(
      (key) => localStorage.getItem(key),
      STORAGE_KEY,
    )) === "{broken",
    "Corrupt record overwritten",
  );
  await failurePage.close();
  const unavailable = await context.newPage();
  unavailable.on("pageerror", (e) => errors.push(e.message));
  await unavailable.route("**/api/taihu/tiles/**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":"fixture outage"}',
    }),
  );
  await unavailable.goto(base, { waitUntil: "networkidle" });
  await unavailable.locator(".map-network.error").waitFor();
  assert(
    (await unavailable.locator(".map-load-help").innerText()).includes(
      "暂未完整加载",
    ),
    "Actual tile failure remains visible",
  );
  assert(
    (await unavailable.locator("svg.lake-map").count()) === 0,
    "Map error never replaced by invented geography",
  );
  await unavailable.close();
  report.checks.push(
    "verified road response; mobile pin opens guide; tile outage visible with no fabricated fallback",
  );
  report.checks.push(
    "320/393/768/1440 layouts, details, keyboard close, mobile navigation and corrupted-data preservation",
  );
  assert(errors.length === 0, `Browser errors: ${errors.join("; ")}`);
  report.passed = true;
  await writeFile(
    new URL("browser-report.json", out),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
