# Neo-Brutalist Portfolio Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite Mark Qiu's portfolio as a Neo-Brutalist, motion-driven single-page site with LUQ LABS as a featured section, plus a standalone gallery page.

**Architecture:** Pure HTML/CSS/JS static site. Single `index.html` with 7 scroll sections, `gallery.html` for full photo collection. Animations via Intersection Observer + CSS transitions. No build step, no frameworks.

**Tech Stack:** HTML5, CSS3 (custom properties, grid, flexbox), Vanilla JS (Intersection Observer, scroll spy), Google Fonts (Space Grotesk + Inter)

---

### Task 1: CSS Design System Foundation

**Files:**
- Rewrite: `style.css` (replace entirely)

This task creates the complete CSS file — design tokens, base reset, component classes, all section styles, animation classes, and responsive breakpoints.

- [ ] **Step 1: Write the complete style.css**

Write `style.css` with the following sections in order:

1. **Design Tokens** (`:root` custom properties):
   - `--bg: #F5F0E8`, `--surface: #FFFFFF`, `--text: #000000`, `--text-muted: #555555`, `--text-light: #888888`
   - `--accent-orange: #FF6B35`, `--accent-teal: #2EC4B6`, `--accent-yellow: #FFBF69`
   - `--border: 3px solid #000`, `--border-heavy: 4px solid #000`
   - `--shadow: 4px 4px 0 #000`, `--shadow-hover: 2px 2px 0 #000`
   - `--font-display: 'Space Grotesk', system-ui, sans-serif`, `--font-body: 'Inter', system-ui, sans-serif`
   - `--spring: cubic-bezier(0.34, 1.56, 0.64, 1)`, `--ease: cubic-bezier(0.25, 0.46, 0.45, 0.94)`
   - `--maxw: 1100px`

2. **Reset**: `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`. `html { scroll-behavior: smooth; scroll-padding-top: 60px; }`. Body with `font-family: var(--font-body)`, `background: var(--bg)`, `color: var(--text)`.

3. **Utilities**: `.container` (max-width, auto margin, padding 0 24px). `.skip-link` (positioned off-screen, visible on focus, orange background, border).

4. **Nav** (`.site-nav`): sticky top, z-index 100, yellow background, border-bottom. Flex layout with logo left (20px, 900 weight, -1px spacing) and links right (11px, 700 weight, uppercase, letter-spacing 1px). Active/hover: bottom border. Hamburger: hidden by default, 3-line icon with animated open state (X shape). Mobile nav: absolute positioned dropdown below nav.

5. **Buttons** (`.btn`): padding 10px 24px, border 3px solid #000, font 11px 800 weight uppercase, box-shadow 4px 4px 0 #000. Hover: translateY(2px) + shadow-hover. Active: translateY(4px) + shadow none. Variants: `.btn-primary` (orange bg), `.btn-secondary` (white bg), `.btn-dark` (black bg, cream text).

6. **Tags** (`.tag`): inline-block, padding 3px 10px, border 2px solid #000, font 11px 600 weight uppercase, bg var(--bg).

7. **Section spacing** (`.section`): padding 80px 0. `.section-label`: 11px, 700 weight, uppercase, letter-spacing 3px, muted color. `.section-title`: Space Grotesk 36px, 900 weight, -2px letter-spacing, uppercase.

8. **Hero** (`.hero`): min-height 100vh, flex column center, text-align center. `.hero-badge`: bordered pill with "Portfolio — 2025". `.hero-title`: clamp(48px, 10vw, 80px), 900 weight, -3px spacing. `.hero-title .letter`: inline-block, opacity 0, translateY(30px); `.letter.visible`: opacity 1, translateY(0), spring transition. `.hero-divider`: flex row of 3 color bars (40px × 5px each), scaleX(0) by default, scaleX(1) when visible. `.hero-subtitle`: 13px uppercase, muted, fades in. `.hero-buttons .btn`: opacity 0, translateY(20px), spring in when visible. `.scroll-hint`: absolute bottom, pulsing arrow via `@keyframes bounce`.

9. **About** (`.about-card`): border, white bg, shadow, padding 40px, grid 1fr 1fr with gap 40px. `.skills-label`: bordered bottom, uppercase. `.skills-grid`: flex wrap, gap 6px.

10. **LUQ LABS** (`.luqlabs`): 4px border, overflow hidden. `.luqlabs-header`: orange bg, flex between, 4px bottom border. Title 32px, 900 weight. `.luqlabs-products`: cream bg, grid 1fr 1fr. `.product-card`: bordered, white bg, with colored header bar (teal for CitizenReady, yellow for Rental Note), body with title/description/tags.

11. **Experience**: `.exp-title-bar` with orange accent bar (5px × 36px) + title. `.timeline`: padding-left 32px, vertical line via `::before` (3px wide, #ddd). `.timeline-entry`: relative. `.timeline-dot`: absolute left, 17px circle, 3px border, colored fill. `.timeline-card`: bordered, white bg, shadow, with h3 title, meta, ul bullets, tags. `.projects-sub`: margin-top 48px. `.projects-grid`: grid 1fr 1fr. `.project-mini-card`: bordered, shadow, padding 20px.

12. **Education** (`.edu-grid`): grid 1fr 1fr. `.edu-card`: bordered, shadow, flex row with 48px logo and text content.

13. **Photography** (`.photo-showcase`): black bg, padding 80px. Header flex between with white h2 and orange stat text. `.photo-grid-showcase`: grid 3 columns, 8px gap. `.photo-cell`: overflow hidden, 2px border #333, hover: border-color orange + scale(1.02). `.featured`: grid-column span 2, grid-row span 2. `.btn-outline-orange`: orange border button, fill on hover.

14. **Contact** (`.contact-block`): teal bg, centered h2 36px. `.contact-buttons`: flex row of btn-secondary.

15. **Footer** (`.site-footer`): black bg, centered text, 12px gray.

16. **Reveal animations**: `.reveal`: opacity 0, translateY(40px). `.reveal.visible`: opacity 1, translateY(0), 0.6s spring. `.reveal-left`/`.reveal-right`: translateX ±40px variants. `.stagger-1` through `.stagger-10`: transition-delay N×50ms.

17. **Gallery page**: `.gallery-header-section`: padding top 120px, centered, h1 48px. `.gallery-group-label`: bordered pill, uppercase. `.gallery-masonry`: CSS columns 3, column-gap 12px. `.gallery-item`: break-inside avoid, margin-bottom 12px, border, hover lift + shadow. **Lightbox**: fixed inset, black bg 95% opacity, flex center, img with white border, close/prev/next buttons, caption. `.gallery-stats`: flex center row.

18. **Responsive** (`@media max-width: 768px`): hide nav-links, show hamburger. Single-column for about-card, luqlabs-products, projects-grid, edu-grid. Hero buttons stack vertically. Photo grid 2 columns. Gallery masonry 2 columns. At 480px: everything single column. **Reduced motion**: disable all transitions and animations, make all reveals instantly visible.

The exact CSS is provided in the spec's design system section. Implementation follows those tokens and rules exactly.

- [ ] **Step 2: Verify CSS loads without errors**

Run: `open index.html` in browser. Check dev console for CSS parse errors.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: rewrite style.css with Neo-Brutalist design system"
```

---

### Task 2: Rewrite index.html — Single Page Structure

**Files:**
- Rewrite: `index.html` (replace entirely)

Complete single-page HTML with all 7 sections. All content from the original multi-page site is consolidated here.

- [ ] **Step 1: Write the complete index.html**

Structure:
- `<head>`: charset, viewport, author meta, description meta ("Mark Qiu — Founder of LUQ LABS, Developer, Photographer"), Google Fonts (Space Grotesk 400-900 + Inter 400-800), link to style.css, title "Mark Qiu — Founder · Developer · Photographer"
- `<body>`:

**Skip link**: `<a class="skip-link" href="#about">Skip to content</a>`

**Nav** (`<nav class="site-nav">`):
- Logo: `<a href="#" class="nav-logo">MQ.</a>`
- Links: About (#about), LUQ LABS (#luqlabs), Experience (#experience), Education (#education), Photos (#photos), Contact (#contact)
- Hamburger button with 3 `<span>` bars
- Mobile nav div with same links

**Hero** (`<section class="hero" id="hero">`):
- Badge: `<div class="hero-badge">Portfolio — 2025</div>`
- Title: `<h1 class="hero-title" aria-label="Mark Qiu">MARK QIU</h1>` (JS will split into letter spans)
- Divider: `<div class="hero-divider"><span></span><span></span><span></span></div>`
- Subtitle: `<p class="hero-subtitle">Founder · Developer · Photographer</p>`
- Buttons: LUQ LABS ↗ (btn-primary, links to luqlabs.com), My Work ↓ (btn-secondary, links to #experience), GitHub ↗ (btn-dark, links to github.com/mark24680617)
- Scroll hint with bounce arrow

**About** (`<section class="section" id="about">`):
- `.about-card.reveal` with two columns:
  - Left: section-label "About" + paragraph: "I'm **Mark Qiu**, a Computer Science graduate from **UC Irvine** and founder of **LUQ LABS**, where I build focused tools that solve real problems. My background is in backend systems, data pipelines, and full-stack development. Outside of code, I'm a photographer and guitar player who's always chasing the next great shot or jam session."
  - Right: skills-label "Skills" + skills-grid with tags: Go, Python, JavaScript, TypeScript, React, MySQL, Redis, Hive, HTML/CSS, Git — each with `.reveal .stagger-N`

**LUQ LABS** (`<section class="section" id="luqlabs">`):
- `.luqlabs.reveal`:
  - Header: orange bg, title "LUQ LABS", mission "Building focused tools that solve real problems", button "luqlabs.com ↗" linking to https://luqlabs.com
  - Products area: label "Products" spanning full width, then two product-cards:
    - **CitizenReady AI**: teal header "AI-Powered", h3 title, description: "AI-powered citizenship test preparation platform. Realistic mock interviews, spaced repetition memory training (SM-2 algorithm), and support for 9 languages. Covers all 128 U.S. civics questions." Tags: AI/ML, 9 Languages, SM-2.
    - **Rental Note**: yellow header "Mobile App", h3 title, description: "Your rentals, your records — always in your pocket. Track rental agreements, payments, and rental history with a clean, intuitive interface." Tags: Mobile, Finance, Tracking.

**Experience** (`<section class="section" id="experience">`):
- Title bar with orange accent bar + h2 "Experience"
- Timeline with 2 entries:
  - **Bilibili**: orange dot, h3 "Backend Developer Intern", meta "Bilibili · Shanghai, China · June 2024 – August 2024", 4 bullet points (80% query reduction bolded), tags: Go, MySQL, Redis, Hive, Kratos.
  - **SOCCCD**: yellow dot, h3 "Project Specialist: Student Design Team", meta "South Orange County Community College District · Mission Viejo, CA · April 2022 – June 2023", 3 bullet points.
- Notable Projects subsection: 2 mini-cards:
  - **LicenseLink**: description + tags (TypeScript, Docker, AI Copilot)
  - **Code Whiteboard Tutor**: description + tags (Python, Gemini, Gradio)

**Education** (`<section class="section" id="education">`):
- h2 "Education" + edu-grid with 2 cards:
  - **UCI**: logo (pictures/UCI_logo.svg), h3 "University of California, Irvine", degree "B.S. Informatics · GPA: 3.7", year "2025", coursework list
  - **WCHS**: logo (pictures/WCHS.png), h3 "Whittier Christian High School", year "2020", achievement text

**Photography** (`<section class="photo-showcase" id="photos">`):
- Header: h2 "Photography" + stat "40+ Photos · 10+ Destinations"
- Grid: 5 photos — featured (Yosemite_1.jpeg, span 2 columns), then Osaka_1, Dali_1, Joshua_2, Cancun_1
- CTA: btn-outline-orange "Explore Full Gallery →" linking to gallery.html

**Contact** (`<section class="contact-block" id="contact">`):
- h2 "Let's Connect" with `.reveal`
- 3 buttons: Email (mailto:mark24680617@gmail.com), LinkedIn (external), GitHub (external) — each `.reveal .stagger-N`

**Footer**: `<footer class="site-footer"><p>&copy; 2026 Mark Qiu. All rights reserved.</p></footer>`

**Script**: `<script src="./script.js"></script>`

- [ ] **Step 2: Open in browser and verify structure**

Run: `open index.html`

Expected: All 7 sections render with correct content. CSS applies. No JS errors (script.js doesn't exist yet — one 404 expected).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: rewrite index.html as single-page Neo-Brutalist layout"
```

---

### Task 3: Create script.js — Animations, Nav, Hero Effects

**Files:**
- Create: `script.js`

All JavaScript: hero letter stagger, Intersection Observer reveal system, scroll spy for nav, hamburger menu toggle.

- [ ] **Step 1: Write the complete script.js**

Wrap everything in an IIFE with `'use strict'`.

**`initHeroLetters()`**: Select `.hero-title`. Read its `textContent`, store as `text`. Set `aria-label` to `text`. Remove all child nodes with a while loop (`while (title.firstChild) title.removeChild(title.firstChild)`). For each character in `text`, create a `<span class="letter">`, set `textContent` to the char (use `\u00A0` for spaces), set `style.transitionDelay` to `(i * 60) + 'ms'`, append to title. After 200ms timeout, add `.visible` to each `.letter`.

**`initHeroSequence()`**: After 600ms, add `.visible` to each `.hero-divider span` with 120ms stagger between them. After 900ms, add `.visible` to `.hero-subtitle`. After 1100ms, add `.visible` to each `.hero-buttons .btn` with 120ms stagger.

**`initReveal()`**: Select all `.reveal, .reveal-left, .reveal-right`. Create IntersectionObserver with `threshold: 0.1, rootMargin: '0px 0px -50px 0px'`. On intersect, add `.visible` class and unobserve.

**`initScrollSpy()`**: Collect all `.nav-links a` and `.nav-mobile a`. Map each to its target section via href. On scroll (passive listener), find which section is above `scrollY + 80`. Toggle `.active` on the matching link.

**`initHamburger()`**: Select `.nav-hamburger` and `.nav-mobile`. On click, toggle `.open` on both. On mobile link click, remove `.open` from both.

**`DOMContentLoaded`**: Call all init functions.

- [ ] **Step 2: Open index.html in browser and verify**

Expected: Hero title letters animate in one by one. Divider bars, subtitle, buttons animate in sequence. Scrolling reveals sections with spring animation. Nav highlights current section. Hamburger works at narrow widths.

- [ ] **Step 3: Commit**

```bash
git add script.js
git commit -m "feat: add script.js with animations, scroll spy, and hamburger menu"
```

---

### Task 4: Rewrite gallery.html — Brutalist Gallery with Lightbox

**Files:**
- Rewrite: `gallery.html` (replace entirely)

Brutalist-styled gallery page with destination groups, masonry grid, lightbox, and scroll animations. Reuses `style.css` and `script.js`.

- [ ] **Step 1: Write the complete gallery.html**

Structure:
- `<head>`: Same fonts and style.css as index.html. Title "Gallery — Mark Qiu".
- `<body>`:

**Skip link** to `#gallery-main`.

**Nav**: Same as index.html but all links prefixed with `index.html#` (e.g., `index.html#about`). Logo links to `index.html`.

**Lightbox** markup: `<div class="lightbox" id="lightbox">` with close button, prev/next buttons, `<img>` element, caption div.

**Main** (`<main id="gallery-main">`):
- Header section: h1 "Photography" + subtitle "Capturing moments across 10+ destinations" — both with `.reveal`
- Container with gallery groups:
  - **Personal** (6 photos: personal_1 through personal_6)
  - **Japan** (3 photos: Osaka_1-3)
  - **California** (8 photos: California_1-3, Yosemite_1-2, sequio, Joshua_1-2)
  - **Mexico** (2 photos: Cancun_1-2)
  - **China** (17 photos: Dali_1-3, Lijiang_1-3, Daochen_1-6, dunhuang_1-3, danxia_1-2)
  - **Special Moments** (1 photo: Comet)
- Each group: `.gallery-group-label` (bordered tag) + `.gallery-masonry` with `.gallery-item.reveal` containing `<img class="lb-trigger">` with loading="lazy"
- Stats section: 20+ Destinations, 40+ Photos, 5 Countries

**Footer**: Same as index.html.

**Scripts**: Load `script.js` for reveal animations. Inline `<script>` for lightbox:
- Select all `.lb-trigger` images, store index
- `open(i)`: set img src/alt from triggers[i], add `.open` to lightbox, prevent body scroll
- `close()`: remove `.open`, restore scroll
- `prev()`/`next()`: wrap-around index navigation
- Event listeners: click triggers, close button, prev/next buttons, click-outside-to-close, keyboard (Escape, ArrowLeft, ArrowRight)

- [ ] **Step 2: Open gallery.html in browser and verify**

Expected: Masonry grid of photos grouped by destination. Clicking a photo opens lightbox. Arrow keys navigate. Escape closes. Scroll animations fire.

- [ ] **Step 3: Commit**

```bash
git add gallery.html
git commit -m "feat: rewrite gallery.html with Brutalist masonry grid and lightbox"
```

---

### Task 5: Delete Old Pages and Final Verification

**Files:**
- Delete: `about.html`
- Delete: `projects.html`

- [ ] **Step 1: Delete about.html and projects.html**

```bash
git rm about.html projects.html
```

- [ ] **Step 2: Verify no broken links**

Open `index.html` and `gallery.html` in browser. Check:
- All nav links point to valid anchors or `index.html#section`
- No 404s in Network tab (except favicon)
- Gallery link from main page works
- Back-to-home link from gallery works
- All photos load
- All external links (GitHub, LinkedIn, LUQ LABS, Email) work

- [ ] **Step 3: Test responsive layout**

In browser DevTools, test these widths:
- 1200px (desktop): two-column grids, horizontal nav
- 768px (tablet): columns collapse where appropriate
- 375px (mobile): single column, hamburger menu, stacked buttons

- [ ] **Step 4: Test animations and interactions**

- Hero: letters stagger in, divider slides, subtitle fades, buttons pop
- Scroll: each section reveals with spring animation
- Hover: buttons press down, cards lift, photos zoom
- Nav: active link highlights on scroll
- Gallery: lightbox opens/closes, keyboard navigation, prev/next

- [ ] **Step 5: Commit cleanup**

```bash
git commit -m "chore: remove about.html and projects.html (content merged to single page)"
```
