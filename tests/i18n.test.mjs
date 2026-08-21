import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
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
      // Own-property check, not `key in zh` — `in` walks the prototype chain,
      // so data-i18n="toString" would pass by resolving to Object.prototype.
      assert.ok(Object.prototype.hasOwnProperty.call(zh, key),
        `${file} uses "${key}", which is not in i18n-zh.js`);
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

// Every top-level HTML page is covered by default, rather than needing to be
// opted in — a page added later without updating this list would otherwise
// sit silently outside the gate.
const COVERED = readdirSync(ROOT).filter((f) => f.endsWith('.html'));

test('no English text is left unmarked', () => {
  for (const file of COVERED) {
    const missed = unmarkedText(file)
      .filter((t) => /[A-Za-z]{3,}/.test(t))
      .filter((t) => !ALLOWED.has(t));
    assert.deepEqual(missed, [], `${file} has untranslated text: ${JSON.stringify(missed)}`);
  }
});

test('no ALLOWED entry is stale', () => {
  const present = new Set(COVERED.flatMap((file) => unmarkedText(file)));
  for (const entry of ALLOWED) {
    assert.ok(present.has(entry),
      `"${entry}" is in ALLOWED but matches no loose text in ${COVERED.join(', ')}`);
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
      const html = /data-i18n-html=/.test(attrs);
      const text = !html && /data-i18n=/.test(attrs);
      const marked = html || text;
      // data-i18n writes el.textContent, so ANY child tag — marked or not —
      // flattens away silently. data-i18n-html exists precisely so markup can
      // survive, so only a marked descendant is a violation there.
      if (stack.some((f) => f.text)) {
        nested.push(`<${tag}> at offset ${m.index} (child of a data-i18n text element)`);
      } else if (marked && stack.some((f) => f.i18n)) {
        nested.push(`<${tag}> at offset ${m.index}`);
      }
      stack.push({ tag, i18n: marked, text: text });
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

const TRANSLATABLE_ATTRS = ['alt', 'title', 'placeholder', 'aria-label'];

// Attribute values that stay English by policy — the attribute equivalent of
// ALLOWED above.
const ATTR_ALLOWED = new Set([
  '中文 / Chinese', // the toggle's constant aria-label, never translated
  'Mark Qiu', // meta[name="author"] — the byline is not translated
]);

function metaName(attrs) {
  const m = attrs.match(/\bname="([^"]*)"/);
  return m && m[1];
}

/** Translatable attribute values with no data-i18n-attr marker naming them. */
function unmarkedAttrs(file) {
  const src = read(file)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const missed = [];
  const tagRe = /<(\/)?([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/)?>/g;
  let m;
  while ((m = tagRe.exec(src))) {
    if (m[1]) continue; // closing tags carry no attributes
    const tag = m[2].toLowerCase();
    const attrs = m[3] || '';
    const marker = attrs.match(/data-i18n-attr="([^"]*)"/);
    const markedAttrs = new Set(
      marker ? marker[1].split(',').map((pair) => pair.split(':')[0].trim()) : [],
    );
    // content only carries translatable text on meta[name="description"]
    // (and meta[name="author"], which ATTR_ALLOWED exempts below) — not on
    // e.g. meta[name="viewport"], whose content is a technical value.
    const checked = ['description', 'author'].includes(metaName(attrs))
      ? [...TRANSLATABLE_ATTRS, 'content']
      : TRANSLATABLE_ATTRS;
    for (const attr of checked) {
      const am = attrs.match(new RegExp(`\\b${attr}="([^"]*)"`));
      if (!am) continue;
      const value = decodeEntities(am[1]);
      if (!/[A-Za-z]{3,}/.test(value)) continue;
      if (ATTR_ALLOWED.has(value)) continue;
      if (markedAttrs.has(attr)) continue;
      missed.push(`${file}: <${tag} ${attr}="${value}">`);
    }
  }
  return missed;
}

test('no translatable attribute is left unmarked', () => {
  for (const file of COVERED) {
    const missed = unmarkedAttrs(file);
    assert.deepEqual(missed, [], `untranslated attributes: ${JSON.stringify(missed)}`);
  }
});

test('no dictionary key is dead', () => {
  const { zh } = loadDictionary();
  const used = new Set([...keysInHtml('index.html'), ...keysInHtml('gallery.html')]);
  for (const key of Object.keys(zh)) {
    assert.ok(used.has(key), `"${key}" is in i18n-zh.js but no HTML uses it`);
  }
});
