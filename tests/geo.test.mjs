import test from "node:test";
import assert from "node:assert/strict";
import transform from "coordtransform";
import {
  gcjToWgs84,
  getVerifiedPosition,
  haversineMeters,
} from "../src/geo.js";
import { places, placeById } from "../src/data.js";
import legacyIds from "../src/legacy-ids.json" with { type: "json" };

test("every legacy place ID remains available to existing personal records", () => {
  assert.equal(legacyIds.length, 43);
  for (const id of legacyIds) assert.ok(Object.hasOwn(placeById, id), id);
});
test("each displayed point has an explicit original coordinate record and datum", () => {
  assert.ok(places.length >= 65);
  const located = places.filter((p) => p.coords);
  assert.ok(located.length >= 55);
  for (const p of located) {
    assert.ok(p.coordinateSource.url.startsWith("https://"), p.id);
    assert.ok(p.coordinateSource.matchedName, p.id);
    assert.ok(
      ["WGS84", "GCJ-02", "BD-09"].includes(p.coordinateSource.system),
      p.id,
    );
    assert.ok(
      ["area", "poi", "entrance"].includes(p.coordinateSource.precision),
    );
    assert.deepEqual(p.coords, getVerifiedPosition(p));
  }
  for (const p of places.filter((p) => !p.coordinateSource))
    assert.equal(
      p.coords,
      null,
      `${p.id} must not fall back to a guessed location`,
    );
});
test("previous kilometer-scale mistakes are checked against independent source records", () => {
  assert.equal(placeById.yuyangshan.coordinateSource.lng, 120.377742);
  assert.equal(placeById.yuyangshan.coordinateSource.lat, 31.222853);
  assert.equal(placeById.gongchayuan.coordinateSource.lng, 119.806622);
  assert.equal(placeById.gongchayuan.coordinateSource.lat, 31.128766);
  assert.ok(
    haversineMeters(placeById.xiangshan.coords, [119.9345627, 31.1433299]) <
      100,
  );
  assert.ok(
    haversineMeters(placeById.gongchayuan.coords, [119.89, 31.11]) > 7000,
  );
  assert.ok(
    haversineMeters(placeById.yuyangshan.coords, [120.43, 31.23]) > 4000,
  );
  assert.ok(
    !placeById.moon.coordinateSource.url.includes("BV10972348"),
    "bus stop must not represent the square",
  );
});
test("GCJ-02 conversion matches a known fixture and inverts the forward datum transform", () => {
  const fixture = [116.41024449916938, 39.91640428150164];
  assert.ok(haversineMeters(gcjToWgs84(...fixture), [116.404, 39.915]) < 0.1);
  for (const p of places.filter(
    (p) => p.coordinateSource?.system === "GCJ-02",
  )) {
    const raw = p.coordinateSource;
    const again = transform.wgs84togcj02(...p.coords);
    assert.ok(haversineMeters(again, [raw.lng, raw.lat]) < 0.1, p.id);
  }
  assert.equal(getVerifiedPosition({ coords: [120, 31] }), null);
  assert.equal(
    getVerifiedPosition({
      coordinateSource: {
        url: "https://example.com",
        matchedName: "x",
        lng: 120,
        lat: 31,
        precision: "poi",
        system: "unknown",
      },
    }),
    null,
  );
});
test("named roads retain their real disconnected OSM segments rather than fabricated connecting lines", () => {
  assert.equal(placeById.mingzhu.roadGeometry.features.length, 9);
  assert.equal(placeById.mashan.roadGeometry.features.length, 3);
  for (const id of ["mingzhu", "mashan"])
    for (const feature of placeById[id].roadGeometry.features) {
      assert.equal(feature.geometry.type, "LineString");
      assert.ok(feature.properties.tags.highway);
      assert.ok(feature.properties.url.match(/openstreetmap.org\/way\/\d+/));
      assert.ok(feature.geometry.coordinates.length > 1);
    }
});
test("every guide has useful detail and multiple public sources, including uncertainty", () => {
  for (const p of places) {
    assert.ok(p.address, p.id);
    assert.ok(p.summary.length >= 70, p.id);
    assert.ok(p.sources.length >= 2, p.id);
    assert.equal(p.guide.highlights.length, 3, p.id);
    assert.equal(p.guide.walk.length, 3, p.id);
    assert.ok(JSON.stringify(p.guide).length > 350, p.id);
    for (const key of ["bestTime", "parking", "food", "pairing", "watchOut"])
      assert.ok(p.guide[key], `${p.id}/${key}`);
  }
});
