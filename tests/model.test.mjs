import test from "node:test";
import assert from "node:assert/strict";
import {
  places,
  placeById,
  routeTemplates,
  regions,
  categories,
} from "../src/data.js";
import {
  initialNotes,
  sanitizeNotes,
  filterPlaces,
  chooseTemplateRoute,
  mapUrl,
  readNotes,
  planStats,
} from "../src/model.js";

test("every discovery and route is complete and points at a public source", () => {
  assert.ok(places.length >= 40);
  assert.equal(new Set(places.map((p) => p.id)).size, places.length);
  for (const p of places) {
    assert.ok(
      regions.some((r) => r.id === p.region),
      p.id,
    );
    assert.ok(
      categories.some((c) => c.id === p.category),
      p.id,
    );
    assert.ok(p.summary && p.tip && p.nav, p.id);
    assert.equal(new URL(p.source.url).protocol, "https:");
    if (p.coords)
      assert.ok(
        p.coords[0] > 119 &&
          p.coords[0] < 121 &&
          p.coords[1] > 30 &&
          p.coords[1] < 32,
        p.id,
      );
    assert.ok(p.duration[0] <= p.duration[1]);
  }
  for (const route of routeTemplates) {
    assert.ok(route.ids.length >= 2);
    for (const id of route.ids)
      assert.ok(Object.hasOwn(placeById, id), `${route.id}: ${id}`);
    assert.equal(new Set(route.ids).size, route.ids.length);
  }
});
test("compound filtering respects city, category, season and personal lists", () => {
  const n = {
    ...initialNotes(),
    wanted: ["xihe", "mingzhu"],
    visited: ["mingzhu"],
  };
  const found = filterPlaces(
    places,
    {
      region: "wuxi",
      category: "food",
      season: "winter",
      wanted: true,
      unseen: true,
    },
    n,
  );
  assert.deepEqual(
    found.map((p) => p.id),
    ["xihe"],
  );
  assert.equal(
    filterPlaces(places, { query: "完全不存在的地点" }, n).length,
    0,
  );
  assert.ok(
    filterPlaces(places, { mainline: true }, n).every((p) => !p.branch),
  );
  assert.ok(
    filterPlaces(places, { short: true }, n).every((p) => p.duration[0] <= 60),
  );
  assert.ok(
    filterPlaces(places, { query: "玉兰饼" }, n).some((p) => p.id === "xihe"),
  );
});
test("reverse template does not mutate source or invent driving times", () => {
  const r = routeTemplates[0],
    before = [...r.ids];
  assert.deepEqual(chooseTemplateRoute(r, "cw"), [...before].reverse());
  assert.deepEqual(r.ids, before);
  const stats = planStats(["lihu", "mingzhu"]);
  assert.equal(stats.min, 60);
  assert.equal(stats.regions, 1);
});
test("import rejects malformed formats and ignores prototype and unknown ids", () => {
  assert.throws(() => sanitizeNotes({ version: 2 }));
  assert.throws(() => sanitizeNotes([]));
  const n = sanitizeNotes(
    JSON.parse(
      '{"version":1,"wanted":["mingzhu","mingzhu","__proto__","no-place"],"visited":[1,"constructor"],"notes":{"__proto__":"bad","mingzhu":"hello"},"plan":["moon"],"direction":"oops"}',
    ),
  );
  assert.deepEqual(n.wanted, ["mingzhu"]);
  assert.deepEqual(n.visited, []);
  assert.deepEqual(n.notes, { mingzhu: "hello" });
  assert.equal(n.direction, "ccw");
});
test("failed storage read is reported and never writes away the original", () => {
  const result = readNotes({
    getItem: () => "{broken",
    setItem: () => assert.fail("must not write"),
  });
  assert.ok(result.error);
  assert.deepEqual(result.value, initialNotes());
});
test("unverified locations use name search, verified links declare the matching datum", () => {
  for (const provider of ["amap", "baidu"]) {
    const url = new URL(mapUrl(placeById.mingzhu, provider));
    assert.equal(url.protocol, "https:");
    assert.ok(decodeURIComponent(url.href).includes("十里明珠堤"));
    assert.ok(!url.href.includes("120.119"));
  }
  const gcj = new URL(mapUrl(placeById.yuyangshan));
  assert.equal(gcj.searchParams.get("coordinate"), "gaode");
  assert.equal(gcj.searchParams.get("position"), "120.377742,31.222853");
  const wgs = new URL(mapUrl(placeById.xiangshan));
  assert.equal(wgs.searchParams.get("coordinate"), "wgs84");
  const baidu = new URL(mapUrl(placeById.yuyangshan, "baidu"));
  assert.equal(baidu.searchParams.get("coord_type"), "wgs84");
  assert.equal(
    baidu.searchParams.get("location"),
    `${placeById.yuyangshan.coords[1]},${placeById.yuyangshan.coords[0]}`,
  );
});
