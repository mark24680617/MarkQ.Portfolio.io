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

export function keysInHtml(file) {
  const src = read(file);
  const keys = [];
  for (const m of src.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) keys.push(m[1]);
  for (const m of src.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const pair of m[1].split(',')) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      assert.ok(attr && key, `malformed data-i18n-attr pair "${pair}" in ${file}`);
      keys.push(key);
    }
  }
  return keys;
}

test('every key used in the HTML exists in the dictionary', () => {
  const { zh } = loadDictionary();
  for (const file of ['index.html', 'gallery.html']) {
    for (const key of keysInHtml(file)) {
      assert.ok(key in zh, `${file} uses "${key}", which is not in i18n-zh.js`);
    }
  }
});
