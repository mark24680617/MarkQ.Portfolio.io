import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const read = (p) => readFileSync(ROOT + p, 'utf8');

// i18n-zh.js is a classic script that assigns to `window`. Running it in a
// bare VM context with a stub window is enough to read it back — no DOM.
export function loadDictionary() {
  const ctx = createContext({ window: {} });
  runInContext(read('i18n-zh.js'), ctx);
  return { zh: ctx.window.MQ_I18N_ZH, genre: ctx.window.MQ_I18N_GENRE };
}

// gallery.js writes México as a \u escape, so unescape before comparing.
function genresInGalleryJs() {
  const src = read('gallery.js');
  const found = [...src.matchAll(/genre:\s*'((?:[^'\\]|\\.)*)'/g)].map((m) =>
    m[1].replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  );
  return [...new Set(found)].sort();
}

test('dictionary loads and is non-empty', () => {
  const { zh, genre } = loadDictionary();
  assert.equal(typeof zh, 'object', 'window.MQ_I18N_ZH must be an object');
  assert.equal(typeof genre, 'object', 'window.MQ_I18N_GENRE must be an object');
  assert.ok(Object.keys(zh).length > 50, 'dictionary looks truncated');
});

test('no dictionary value is empty or accidentally still English', () => {
  const { zh } = loadDictionary();
  for (const [k, v] of Object.entries(zh)) {
    assert.equal(typeof v, 'string', `${k} is not a string`);
    assert.ok(v.trim().length > 0, `${k} is empty`);
    assert.ok(/[一-鿿]/.test(v), `${k} contains no Chinese: ${v}`);
  }
});

test('genre map covers exactly the genres gallery.js uses', () => {
  const { genre } = loadDictionary();
  assert.deepEqual(Object.keys(genre).sort(), genresInGalleryJs());
});
