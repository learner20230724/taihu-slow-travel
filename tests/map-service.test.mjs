import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createMapServer,
  allowedTile,
  cacheAge,
  validCoordinates,
} from "../server/map-service.mjs";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lLkAAAAASUVORK5CYII=",
  "base64",
);
async function fixture(t, fetchImpl, now) {
  const dir = await mkdtemp(path.join(tmpdir(), "taihu-map-"));
  const server = createMapServer({ cacheDir: dir, fetchImpl, now });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  });
  return `http://127.0.0.1:${server.address().port}`;
}
test("map requests are limited to public Taihu tiles and valid regional coordinates", () => {
  assert.ok(allowedTile(9, 426, 209));
  assert.ok(!allowedTile(7, 106, 52));
  assert.ok(!allowedTile(9, 1, 1));
  assert.ok(!allowedTile(19, 1, 1));
  assert.ok(
    validCoordinates([
      [120.1, 31.1],
      [120.2, 31.2],
    ]),
  );
  assert.ok(!validCoordinates([[120.1, 31.1]]));
  assert.ok(
    !validCoordinates([
      ["120", 31],
      [120.2, 31.2],
    ]),
  );
  assert.ok(
    !validCoordinates([
      [0, 31],
      [120.2, 31.2],
    ]),
  );
  assert.equal(cacheAge(new Headers()), 604800);
  assert.equal(
    cacheAge(new Headers({ "cache-control": "public, max-age=7200" })),
    7200,
  );
});
test("tiles are identified, cached and conditionally revalidated, without default no-cache", async (t) => {
  let clock = 1_800_000_000_000,
    calls = [];
  const base = await fixture(
    t,
    async (url, options) => {
      calls.push({ url, headers: options.headers });
      if (calls.length === 2)
        return new Response(null, {
          status: 304,
          headers: { "cache-control": "public, max-age=604800" },
        });
      return new Response(png, {
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=604800",
          etag: '"tile-fixture"',
        },
      });
    },
    () => clock,
  );
  let response = await fetch(base + "/tiles/9/426/209.png");
  assert.equal(response.status, 200);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), png);
  response = await fetch(base + "/tiles/9/426/209.png");
  assert.equal(response.headers.get("x-tile-cache"), "HIT");
  assert.equal(calls.length, 1);
  response = await fetch(base + "/tiles/9/426/209.png", {
    headers: { "If-None-Match": '"tile-fixture"' },
  });
  assert.equal(response.status, 304);
  assert.equal(calls.length, 1);
  clock += 8 * 86400000;
  response = await fetch(base + "/tiles/9/426/209.png");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-tile-cache"), "REVALIDATED");
  assert.equal(calls.length, 2);
  assert.ok(calls[0].headers["User-Agent"].startsWith("TaihuSlowTravel/"));
  assert.equal(calls[0].headers.Referer, "https://guihualab.cn/taihu/");
  assert.ok(!calls[0].headers["Cache-Control"]);
  assert.equal(calls[1].headers["If-None-Match"], '"tile-fixture"');
});
test("upstream errors return an explicit failure instead of a fabricated fallback", async (t) => {
  const base = await fixture(
    t,
    async () => new Response("not a tile", { status: 503 }),
  );
  const tile = await fetch(base + "/tiles/9/426/209.png");
  assert.equal(tile.status, 503);
  assert.match((await tile.json()).error, /底图/);
  const invalid = await fetch(base + "/tiles/9/0/0.png");
  assert.equal(invalid.status, 400);
  const rejected = await fetch(
    base +
      "/route?coordinates=" +
      encodeURIComponent(
        JSON.stringify([
          [120, 31],
          [120.1, 31.1],
        ]),
      ),
  );
  assert.equal(rejected.status, 503);
  assert.ok(!(await rejected.json()).geometry);
});
test("road service returns the original road geometry and keeps failures distinct", async (t) => {
  const geometry = {
    type: "LineString",
    coordinates: [
      [120, 31],
      [120.001, 31.002],
      [120.01, 31.01],
    ],
  };
  let calls = 0;
  const base = await fixture(t, async (url) => {
    calls++;
    assert.ok(
      url.startsWith("https://router.project-osrm.org/route/v1/driving/"),
    );
    return Response.json({
      code: "Ok",
      routes: [
        {
          distance: 1234,
          duration: 180,
          geometry,
          legs: [{ distance: 1234, duration: 180 }],
        },
      ],
      waypoints: [],
    });
  });
  const url =
    base +
    "/route?coordinates=" +
    encodeURIComponent(
      JSON.stringify([
        [120, 31],
        [120.01, 31.01],
      ]),
    );
  const first = await fetch(url);
  assert.equal(first.status, 200);
  const data = await first.json();
  assert.deepEqual(data.geometry, geometry);
  assert.equal(data.distance, 1234);
  assert.equal(data.traffic, false);
  await fetch(url);
  assert.equal(calls, 1);
  const invalid = await fetch(base + "/route?coordinates=null");
  assert.equal(invalid.status, 400);
});
test("unroutable points never create a straight line or a success marker", async (t) => {
  const base = await fixture(t, async () =>
    Response.json({ code: "NoSegment", message: "fixture" }, { status: 400 }),
  );
  const response = await fetch(
    base +
      "/route?coordinates=" +
      encodeURIComponent(
        JSON.stringify([
          [120, 31],
          [120.01, 31.01],
        ]),
      ),
  );
  assert.equal(response.status, 422);
  assert.ok(!(await response.json()).geometry);
});
