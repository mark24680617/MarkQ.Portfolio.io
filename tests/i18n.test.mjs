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

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

// Text that stays English by policy.
const ALLOWED = new Set(['MQ.', '← MQ.', 'LUQ LABS', 'LUQ LABS ↗', 'GitHub ↗',
  'GitHub', 'LinkedIn', 'Devpost ↗', 'cocktailsteps.com ↗', 'luqlabs.com ↗', '0%',
  'Ten Thousand Suns', 'CitizenReady AI', 'Rental Note', 'VeriStudio',
  'CocktailSteps', 'LicenseLink', 'WFC — WorkFlow_Customize',
  // the product-card h3 "Lu Xun &amp; Han Pictorial Art" is intentionally
  // unmarked; unmarkedText() decodes &amp; to a literal "&" before comparing.
  'Lu Xun & Han Pictorial Art',
  // the doctype declaration precedes the first real tag match, so it is
  // never inside a stack frame and always counts as loose text.
  '<!doctype html>',
  'Python', 'C++', 'Go', 'TypeScript', 'Expo', 'StoreKit', 'S2S', 'Supabase',
  'Firebase', 'Vercel', 'Godot', 'Three.js', 'WebGL', 'AI/ML', 'SM-2',
  'Docker', 'Bun', 'Tauri', 'FastAPI', 'Next.js', 'OpenAI', 'Backblaze B2',
  'MySQL', 'Redis', 'Hive', 'Kratos']);

// The entities index.html and gallery.html actually use, decoded to their
// real characters rather than blanked to a space, so ALLOWED can hold real
// rendered strings instead of blanking artifacts. Numeric refs decode too;
// any other named entity falls back to a space (safe default, unused today).
const NAMED_ENTITIES = { amp: '&', copy: '©', rsquo: '’', larr: '←', middot: '·' };

export function decodeEntities(s) {
  return s.replace(/&([a-z]+);|&#(\d+);/gi, (m, name, num) => {
    if (num) return String.fromCharCode(Number(num));
    return NAMED_ENTITIES[name.toLowerCase()] || ' ';
  });
}

/** Text nodes with no data-i18n ancestor. */
function unmarkedText(file) {
  const src = read(file)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const loose = [];
  const stack = [];
  const tagRe = /<(\/)?([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/)?>/g;
  let last = 0;
  let m;
  while ((m = tagRe.exec(src))) {
    if (!stack.some((f) => f.i18n)) loose.push(src.slice(last, m.index));
    last = tagRe.lastIndex;
    const closing = m[1];
    const tag = m[2].toLowerCase();
    const attrs = m[3] || '';
    const selfClose = m[4];
    if (closing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tag) { stack.length = i; break; }
      }
    } else if (!VOID.has(tag) && !selfClose) {
      stack.push({ tag, i18n: /data-i18n(?:-html)?=/.test(attrs) });
    }
  }
  if (!stack.some((f) => f.i18n)) loose.push(src.slice(last));
  return loose.map((t) => decodeEntities(t).trim()).filter(Boolean);
}

const COVERED = ['index.html', 'gallery.html'];

test('no English text is left unmarked', () => {
  for (const file of COVERED) {
    const missed = unmarkedText(file)
      .filter((t) => /[A-Za-z]{3,}/.test(t))
      .filter((t) => !ALLOWED.has(t));
    assert.deepEqual(missed, [], `${file} has untranslated text: ${JSON.stringify(missed)}`);
  }
});

test('entity decoding handles the named entities in use, plus numeric refs', () => {
  assert.equal(decodeEntities('&amp;'), '&');
  assert.equal(decodeEntities('&copy;'), '©');
  assert.equal(decodeEntities('&rsquo;'), '’');
  assert.equal(decodeEntities('&larr;'), '←');
  assert.equal(decodeEntities('&middot;'), '·');
  assert.equal(decodeEntities('&#65;'), 'A');
  assert.equal(decodeEntities('Lu Xun &amp; Han Pictorial Art'), 'Lu Xun & Han Pictorial Art');
});

/** data-i18n-attr may coexist with a text marker on the same element
    (.hero-title does exactly that); only data-i18n/-html nesting is a bug. */
function nestedI18nMarkers(file) {
  const src = read(file)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const nested = [];
  const stack = [];
  const tagRe = /<(\/)?([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/)?>/g;
  let m;
  while ((m = tagRe.exec(src))) {
    const closing = m[1];
    const tag = m[2].toLowerCase();
    const attrs = m[3] || '';
    const selfClose = m[4];
    if (closing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tag) { stack.length = i; break; }
      }
    } else if (!VOID.has(tag) && !selfClose) {
      const marked = /data-i18n(?:-html)?=/.test(attrs);
      if (marked && stack.some((f) => f.i18n)) nested.push(`<${tag}> at offset ${m.index}`);
      stack.push({ tag, i18n: marked });
    }
  }
  return nested;
}

test('no data-i18n/-html element contains a descendant carrying either', () => {
  for (const file of COVERED) {
    const nested = nestedI18nMarkers(file);
    assert.deepEqual(nested, [], `${file} nests i18n markers, hiding the child from coverage: ${nested.join(', ')}`);
  }
});

test('no dictionary key is dead', () => {
  const { zh } = loadDictionary();
  const used = new Set([...keysInHtml('index.html'), ...keysInHtml('gallery.html')]);
  for (const key of Object.keys(zh)) {
    assert.ok(used.has(key), `"${key}" is in i18n-zh.js but no HTML uses it`);
  }
});
