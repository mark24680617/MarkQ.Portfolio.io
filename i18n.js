/* i18n.js — the engine. English is never stored here: it is the authored text
   in the HTML, captured on first run and restored when switching back.
   Classic script on purpose. A module would defer past script.js, and the hero
   would animate in English before the swap landed. */
(function () {
  'use strict';

  var STORAGE_KEY = 'mq-lang';
  var HTML_LANG = { en: 'en', zh: 'zh-Hans' };

  var ZH = window.MQ_I18N_ZH || {};
  var GENRE = window.MQ_I18N_GENRE || {};

  var original = new WeakMap();

  function resolve() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q && HTML_LANG[q]) return q;
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored && HTML_LANG[stored]) return stored;
    } catch (e) {
      /* Safari private mode throws on localStorage. English is the right fallback. */
    }
    return 'en';
  }

  var current = resolve();

  /* Capture the English once, the first time an element is touched. */
  function english(el, kind, attr) {
    var slot = kind + '|' + (attr || '');
    var store = original.get(el);
    if (!store) { store = {}; original.set(el, store); }
    if (!(slot in store)) {
      store[slot] = kind === 'attr' ? el.getAttribute(attr)
        : kind === 'html' ? el.innerHTML
        : el.textContent;
    }
    return store[slot];
  }

  function apply(lang) {
    var zh = lang === 'zh';

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var en = english(el, 'text');
      el.textContent = zh ? (ZH[el.getAttribute('data-i18n')] || en) : en;
    });

    /* Only these keys are ever treated as markup, and only because the English
       they replace already contains inline tags. */
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var en = english(el, 'html');
      el.innerHTML = zh ? (ZH[el.getAttribute('data-i18n-html')] || en) : en;
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var bits = pair.split(':');
        var attr = bits[0].trim();
        var key = bits[1] && bits[1].trim();
        if (!attr || !key) return;
        var en = english(el, 'attr', attr);
        el.setAttribute(attr, zh ? (ZH[key] || en) : en);
      });
    });

    /* Without this a screen reader keeps reading the new language with the old
       language's voice. */
    document.documentElement.lang = HTML_LANG[lang];
    document.body.classList.toggle('lang-zh', zh);

    syncLinks(lang);
    paintToggle(lang);
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  /* Carry the language across the index <-> gallery hop. */
  function syncLinks(lang) {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!/^(index|gallery)\.html/.test(href)) return;
      var hashAt = href.indexOf('#');
      var hash = hashAt > -1 ? href.slice(hashAt) : '';
      var base = href.split('?')[0].split('#')[0];
      a.setAttribute('href', base + (lang === 'zh' ? '?lang=zh' : '') + hash);
    });
  }

  function paintToggle(lang) {
    var btn = document.querySelector('.lang-toggle');
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(lang === 'zh'));
    btn.setAttribute('aria-label', lang === 'zh' ? '切换到英文 / Switch to English' : 'Switch to Chinese / 切换到中文');
    btn.querySelectorAll('[data-lang]').forEach(function (seg) {
      seg.classList.toggle('active', seg.getAttribute('data-lang') === lang);
    });
  }

  function set(lang) {
    if (!HTML_LANG[lang] || lang === current) return;
    current = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* see resolve() */ }
    var url = new URL(location.href);
    if (lang === 'zh') url.searchParams.set('lang', 'zh');
    else url.searchParams.delete('lang');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
    apply(lang);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.lang-toggle')) {
      set(current === 'zh' ? 'en' : 'zh');
    }
  });

  window.I18N = {
    get lang() { return current; },
    set: set,
    t: function (key, en) { return current === 'zh' ? (ZH[key] || en) : en; },
    genre: function (g) { return current === 'zh' ? (GENRE[g] || g) : g; },
  };

  apply(current);
})();
