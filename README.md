# Mark Qiu — Personal Portfolio

A single-page portfolio for myself.

## Highlights

- **LUQ LABS products** — Ten Thousand Suns (3D exhibition), Lu Xun & Han Pictorial Art (client exhibition), CitizenReady AI, and Rental Note
- **Experience & projects** — work history plus notable projects (VeriStudio, CocktailSteps, Find a Job, LineCanary, LicenseLink, WFC)
- **Education** — B.S. Informatics, UC Irvine
- **Photography** — an interactive globe and a full gallery of landscapes across 20+ destinations
- **Bilingual** — an EN/中文 switch on both pages; English is the default and `?lang=zh` is shareable

## Tech

Plain **HTML / CSS / vanilla JavaScript** — no build step.

- `index.html` — main single-page site
- `gallery.html`, `gallery.js` — photo gallery with lightbox (Three.js)
- `globe.js` — interactive 3D globe (cobe)
- `style.css` — Neo-Brutalist design system
- `i18n-zh.js`, `i18n.js` — EN/中文 switch. English is the authored default and
  lives in the HTML; `i18n-zh.js` holds only the Chinese. `?lang=zh` deep-links
  into Chinese and the choice persists in `localStorage`.

Run the translation gate with `node --test tests/i18n.test.mjs` before committing
any copy change. It fails on a missing key, a key nothing uses, English left
unmarked in text or in a translatable attribute, a stale allow-list entry, and
markup nested where the engine would destroy it.

Run `node --test tests/gallery.test.mjs` after adding photos. It fails when a
listed file is missing, when one location's photos are split apart in
`gallery.js`, or when the gallery stops playing them in that order.
