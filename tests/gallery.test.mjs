import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

// Not imported from i18n.test.mjs: importing a test file registers its tests
// again, so every i18n test would run twice.
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const read = (p) => readFileSync(ROOT + p, 'utf8');

// photos[] as gallery.js declares it, México's \u escape decoded.
function photosInGalleryJs() {
  return [...read('gallery.js').matchAll(/\{\s*src:\s*'([^']+)',\s*genre:\s*'((?:[^'\\]|\\.)*)'\s*\}/g)]
    .map((m) => ({
      src: m[1],
      genre: m[2].replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
    }));
}

test('photos of one location sit together in photos[]', () => {
  const genres = photosInGalleryJs().map((p) => p.genre);
  const closed = new Set();
  genres.forEach((g, i) => {
    if (i > 0 && g !== genres[i - 1]) closed.add(genres[i - 1]);
    assert.ok(!closed.has(g), `"${g}" appears again at photos[${i}] after another location`);
  });
});

test('every photo file gallery.js lists exists', () => {
  for (const { src } of photosInGalleryJs()) {
    assert.ok(existsSync(ROOT + src), `${src} is listed in gallery.js but missing`);
  }
});

/** Runs the real gallery.js on autoplay, with THREE and the DOM stubbed and a
    fixed clock, and returns photo indices in the order they reach the point
    the location label reads from. */
function playbackOrder(frames) {
  const src = read('gallery.js').replace(/^import \* as THREE from 'three';\s*/m, '');
  const DT = 1 / 60;
  const meshes = [];
  const pending = [];
  let raf = null;
  const noop = () => {};
  const THREE = {
    WebGLRenderer: function () { this.setPixelRatio = noop; this.setSize = noop; this.render = noop; },
    Scene: function () { this.add = (m) => meshes.push(m); },
    PerspectiveCamera: function () { this.updateProjectionMatrix = noop; },
    Raycaster: function () { this.setFromCamera = noop; this.intersectObjects = () => []; },
    Vector2: function () {},
    ShaderMaterial: function (o) { this.uniforms = o.uniforms; },
    TextureLoader: function () { this.load = (s, cb) => pending.push(cb); },
    PlaneGeometry: function () {},
    Mesh: function (g, material) {
      this.material = material;
      this.position = { set(x, y, z) { this.z = z; } };
      this.scale = { set: noop };
    },
    Clock: function () { this.getDelta = () => DT; this.getElapsedTime = () => 0; },
    LinearFilter: 0,
    DoubleSide: 0,
  };
  const stubEl = () => ({ textContent: '', style: {}, classList: { add: noop, remove: noop }, addEventListener: noop });
  const els = {};
  runInContext(src, createContext({
    THREE, Math, Array, Infinity,
    document: { getElementById: (id) => (els[id] ||= stubEl()), addEventListener: noop },
    window: { innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1, matchMedia: () => ({ matches: false }), addEventListener: noop },
    requestAnimationFrame: (f) => { raf = f; },
    setTimeout: () => 0, setInterval: () => 0, Date: { now: () => 0 },
  }));
  // Textures arrive after the script has finished declaring its state, as they
  // do in a browser; each carries its photo index so a plane can be read back.
  pending.forEach((cb, idx) => cb({ image: { width: 3, height: 2 }, idx }));

  const order = [];
  for (let f = 0; f < frames; f++) {
    raf();
    let nearest = null;
    let nearestZ = Infinity;
    for (const m of meshes) {
      const tex = m.material.uniforms.map.value;
      if (tex && m.material.uniforms.opacity.value > 0.3 && Math.abs(m.position.z) < nearestZ) {
        nearestZ = Math.abs(m.position.z);
        nearest = tex.idx;
      }
    }
    if (nearest !== null && nearest !== order[order.length - 1]) order.push(nearest);
  }
  return order;
}

test('the tunnel plays photos[] front to back, so each location passes as one run', () => {
  const total = photosInGalleryJs().length;
  // About 250 frames carry one photo past the camera at autoplay speed.
  const order = playbackOrder(Math.ceil((total + 3) * 260));
  const expected = Array.from({ length: total + 3 }, (_, k) => k % total);
  assert.deepEqual(order.slice(0, total + 3), expected,
    'photos must reach the camera in photos[] order and wrap back to the first');
});
