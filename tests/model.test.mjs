import test from 'node:test';
import assert from 'node:assert/strict';
import { places, placeById, routeTemplates, regions, categories } from '../src/data.js';
import { initialNotes, sanitizeNotes, filterPlaces, chooseTemplateRoute, mapUrl, readNotes, planStats } from '../src/model.js';

test('every discovery and route is complete and points at a public source',()=>{
  assert.ok(places.length>=40);
  assert.equal(new Set(places.map(p=>p.id)).size,places.length);
  for(const p of places){assert.ok(regions.some(r=>r.id===p.region),p.id);assert.ok(categories.some(c=>c.id===p.category),p.id);assert.ok(p.summary&&p.tip&&p.nav,p.id);assert.equal(new URL(p.source.url).protocol,'https:');assert.ok(p.coords[0]>119&&p.coords[0]<121&&p.coords[1]>30&&p.coords[1]<32,p.id);assert.ok(p.duration[0]<=p.duration[1]);}
  for(const route of routeTemplates){assert.ok(route.ids.length>=2);for(const id of route.ids)assert.ok(Object.hasOwn(placeById,id),`${route.id}: ${id}`);assert.equal(new Set(route.ids).size,route.ids.length);}
});
test('compound filtering respects city, category, season and personal lists',()=>{
  const n={...initialNotes(),wanted:['xihe','mingzhu'],visited:['mingzhu']};
  const found=filterPlaces(places,{region:'wuxi',category:'food',season:'winter',wanted:true,unseen:true},n);
  assert.deepEqual(found.map(p=>p.id),['xihe']);
  assert.equal(filterPlaces(places,{query:'完全不存在的地点'},n).length,0);
  assert.ok(filterPlaces(places,{mainline:true},n).every(p=>!p.branch));
  assert.ok(filterPlaces(places,{short:true},n).every(p=>p.duration[0]<=60));
  assert.ok(filterPlaces(places,{query:'玉兰饼'},n).some(p=>p.id==='xihe'));
});
test('reverse template does not mutate source or invent driving times',()=>{
  const r=routeTemplates[0],before=[...r.ids];
  assert.deepEqual(chooseTemplateRoute(r,'cw'),[...before].reverse());assert.deepEqual(r.ids,before);
  const stats=planStats(['lihu','mingzhu']);assert.equal(stats.min,50);assert.equal(stats.regions,1);
});
test('import rejects malformed formats and ignores prototype and unknown ids',()=>{
  assert.throws(()=>sanitizeNotes({version:2}));assert.throws(()=>sanitizeNotes([]));
  const n=sanitizeNotes(JSON.parse('{"version":1,"wanted":["mingzhu","mingzhu","__proto__","no-place"],"visited":[1,"constructor"],"notes":{"__proto__":"bad","mingzhu":"hello"},"plan":["moon"],"direction":"oops"}'));
  assert.deepEqual(n.wanted,['mingzhu']);assert.deepEqual(n.visited,[]);assert.deepEqual(n.notes,{mingzhu:'hello'});assert.equal(n.direction,'ccw');
});
test('failed storage read is reported and never writes away the original',()=>{
  const result=readNotes({getItem:()=>'{broken',setItem:()=>assert.fail('must not write')});assert.ok(result.error);assert.deepEqual(result.value,initialNotes());
});
test('navigation is a name search and never passes approximate pin coordinates',()=>{
  for(const provider of ['amap','baidu']){const url=new URL(mapUrl(placeById.mingzhu,provider));assert.equal(url.protocol,'https:');assert.ok(decodeURIComponent(url.href).includes('碧玉螺岸'));assert.ok(!url.href.includes('120.119'));}
});
