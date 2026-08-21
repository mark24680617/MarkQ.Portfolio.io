# Mark Qiu — Personal Portfolio

A single-page portfolio for myself.

## Highlights

- **LUQ LABS products** — Ten Thousand Suns (3D exhibition), Lu Xun & Han Pictorial Art (client exhibition), CitizenReady AI, and Rental Note
- **Experience & projects** — work history plus notable projects (VeriStudio, CocktailSteps, LicenseLink, WFC)
- **Education** — B.S. Informatics, UC Irvine
- **Photography** — an interactive globe and a full gallery of landscapes across 10+ destinations

## Tech

Plain **HTML / CSS / vanilla JavaScript** — no build step.

- `index.html` — main single-page site
- `gallery.html`, `gallery.js` — photo gallery with lightbox (Three.js)
- `globe.js` — interactive 3D globe (cobe)
- `style.css` — Neo-Brutalist design system
- `i18n-zh.js`, `i18n.js` — EN/中文 switch. English is the authored default and
  lives in the HTML; `i18n-zh.js` holds only the Chinese. `?lang=zh` deep-links
  into Chinese and the choice persists in `localStorage`.

Run the translation gate with `node --test tests/i18n.test.mjs` — it fails on a
missing key, a dead key, or any English left unmarked.
