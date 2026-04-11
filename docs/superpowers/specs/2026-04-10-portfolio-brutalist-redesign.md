# Portfolio Brutalist Redesign — Design Spec

## Overview

Redesign Mark Qiu's personal portfolio from a traditional multi-page dark-themed site into a Neo-Brutalist, motion-driven single-page experience. Incorporate LUQ LABS founder identity as a parallel brand alongside the personal brand.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Style | Neo-Brutalist — light background, thick black borders, bold accent colors, exposed grid |
| Structure | Single page (`index.html`) + standalone Gallery page (`gallery.html`) |
| LUQ LABS role | Parallel with personal brand — dedicated section, not just a timeline item |
| Color palette | Warm & Bold — Orange/Teal/Yellow on cream with black |
| Photography | Strong visual showcase (6-8 photos) on main page + full Gallery page |
| Layout | Block Stack — full-width blocks stacked vertically |
| Motion | Scroll-triggered spring animations, hover effects, staggered reveals |

## Tech Stack

- Pure HTML + CSS + Vanilla JS (no frameworks)
- Animations via Intersection Observer API + CSS transitions/animations
- No build step required

## Design System

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#F5F0E8` | Page background (warm cream) |
| `--surface` | `#FFFFFF` | Card backgrounds |
| `--text` | `#000000` | Primary text + borders |
| `--text-muted` | `#555555` | Secondary text |
| `--accent-orange` | `#FF6B35` | Primary accent — LUQ LABS, CTAs |
| `--accent-teal` | `#2EC4B6` | Secondary accent — Contact, highlights |
| `--accent-yellow` | `#FFBF69` | Tertiary accent — Nav, tags |
| `--shadow` | `#000000` | Offset shadow color |

### Typography

- **Headings**: `Space Grotesk`, 900 weight, tight letter-spacing (-2px to -3px), uppercase
- **Body**: `Inter`, 400/500/600 weight, normal letter-spacing
- **Labels/Tags**: `Inter`, 700 weight, uppercase, letter-spacing 1-3px

### Borders & Shadows

- All containers: `border: 3px solid #000` (4px for hero-level elements)
- Border radius: `0` everywhere (sharp corners)
- Shadow: `box-shadow: 4px 4px 0 #000` (offset shadow, Brutalist signature)
- Hover shadow: shifts to `2px 2px 0 #000` (pressed-down feel)

### Buttons

- Border: 3px solid #000
- Padding: 10px 24px
- Font: 11px, 800 weight, uppercase, letter-spacing 1px
- Shadow: 4px 4px 0 #000
- Hover: shadow reduces to 2px 2px, translateY(2px) — "press" effect
- Variants: orange fill (primary), white fill (secondary), black fill (tertiary)

## Page Structure: index.html

### Section 1: Hero (100vh)

- **Nav bar**: Sticky top. Yellow (#FFBF69) background, 3px black bottom border. Logo "MQ." left, nav links right. Links: About, LUQ LABS, Experience, Education, Photos, Contact. Active link has bottom border.
- **Content**: Centered vertically.
  - Small label badge: "Portfolio — 2025" in bordered pill
  - Title: "MARK QIU" — 64px+ bold, letter-spacing -3px
  - Color divider: three bars (orange, teal, yellow)
  - Subtitle: "Founder · Developer · Photographer" — uppercase, letter-spacing 4px
  - CTA buttons row: "LUQ LABS ↗" (orange), "MY WORK ↓" (white), "GITHUB ↗" (black)
- **Scroll indicator**: "Scroll ↓" at bottom, pulsing animation
- **Motion**: Letters stagger in (spring), divider slides from center, subtitle fades up, buttons pop with staggered delay

### Section 2: About

- Full-width card (white bg, 3px black border)
- Two-column layout:
  - Left: Brief personal intro (2-3 sentences — CS grad from UCI, building tools at LUQ LABS, backend systems, photography)
  - Right: Skills tag grid — each tag is a small bordered box. Tags: Go, Python, JavaScript, React, MySQL, Redis, Hive, HTML/CSS, Git
- **Motion**: Card slides up on scroll. Tags cascade in sequence (50ms stagger each)

### Section 3: LUQ LABS

- Outer container: 4px black border
- **Header bar**: Orange (#FF6B35) background, 4px bottom border. "LUQ LABS" title (32px bold) + mission text left, "luqlabs.com ↗" button right
- **Products area**: Cream background, two-column grid
  - **CitizenReady AI** card: Teal (#2EC4B6) top bar labeled "AI-Powered", white body with title, description, tech tags (AI/ML, 9 Languages, SM-2)
  - **Rental Note** card: Yellow (#FFBF69) top bar labeled "Mobile App", white body with title, description, tech tags (Mobile, Finance, Tracking)
- **Motion**: Header slides in from left. Product cards pop in with staggered spring (150ms delay). Tags cascade.

### Section 4: Experience

- Section title with left-aligned orange accent bar
- Vertical timeline with left border line
- Two timeline entries, each a white card with 3px border + offset shadow:
  - **Bilibili** — Backend Developer Intern, Shanghai, 2024. Key bullets with bold metrics ("80% query reduction"). Tech tags: Go, MySQL, Redis, Hive, Kratos.
  - **SOCCCD** — Project Specialist, Mission Viejo, 2022-2023. Key bullets.
- **Notable Projects** subsection below timeline: compact grid of 1-2 cards for non-LUQ-LABS projects (LicenseLink — licensing platform for musical theatre). Same card style, smaller scale.
- Timeline markers: colored circles (orange for Bilibili, yellow for SOCCCD) on the left line
- **Motion**: Timeline line draws downward on scroll. Cards slide in from right, staggered.

### Section 5: Education

- Two side-by-side cards (same border + shadow system)
  - **UCI**: Logo, "B.S. Informatics", GPA 3.7, 2025, relevant coursework
  - **WCHS**: Logo, 2020, Economics medal achievement
- **Motion**: Cards pop in simultaneously with spring bounce

### Section 6: Photography

- **Full-width black background** — breaks the cream rhythm for visual impact
- Section header: "PHOTOGRAPHY" white text + "40+ PHOTOS · 10+ DESTINATIONS" orange accent text
- Photo grid: 1 large featured image (span 2 columns) + 4-5 smaller images. Use actual photos from `pictures/` directory (Yosemite, Osaka, Dali, Joshua Tree, Cancun — best shots)
- Each photo: 2px white/light border, hover: scale(1.03) + border color change to orange
- CTA: "EXPLORE FULL GALLERY →" button with orange border
- **Motion**: Photos float in with staggered parallax (alternating left/right translateX). Featured photo has slow zoom.

### Section 7: Contact

- Full-width teal (#2EC4B6) background block
- Centered: "LET'S CONNECT" large bold text
- Row of white Brutalist buttons: Email, LinkedIn, GitHub
- Each button has offset shadow, hover press effect
- **Motion**: Text slides up, buttons pop in staggered

### Footer

- Minimal black bar at bottom
- "© 2026 Mark Qiu" centered, small text
- No redundant navigation (single-page handles all)

## Page Structure: gallery.html

- Same sticky nav bar (yellow, Brutalist style)
- Page header: "PHOTOGRAPHY" large title + "Capturing moments across 10+ destinations" subtitle
- **Destination groups**: Photos grouped by location with section labels ("JAPAN", "CALIFORNIA", "CHINA", "MEXICO", etc.) — each label is a bordered tag
- **Masonry grid**: Variable-height photo tiles with 3px black borders
- **Lightbox**: Click photo → full-screen overlay (black bg, white border around photo, close button). Navigation arrows for prev/next.
- **Motion**: Photos stagger in on scroll. Grid items have hover lift effect.

## Animation Implementation

All animations use Intersection Observer with `threshold: 0.1` and `rootMargin: '0px 0px -50px 0px'`.

### CSS Classes

```
.reveal          — base: opacity:0, translateY(40px)
.reveal.visible  — opacity:1, translateY(0), transition with spring bezier
.reveal-left     — base: opacity:0, translateX(-40px)
.reveal-right    — base: opacity:0, translateX(40px)
.stagger-N       — transition-delay: N*50ms (N = 1-10)
```

### Spring Curve

`cubic-bezier(0.34, 1.56, 0.64, 1)` — slight overshoot for bouncy feel.

Duration: 600ms for sections, 400ms for individual elements.

## Responsive Behavior

- **Desktop (>1024px)**: Full grid layouts, side-by-side cards
- **Tablet (768-1024px)**: Two-column grids collapse to single column where needed, nav remains horizontal
- **Mobile (<768px)**: All single column, nav collapses to hamburger menu (animated), photo grid becomes 2-column, reduced animation intensity (respect `prefers-reduced-motion`)

## Files Changed

| File | Action |
|------|--------|
| `index.html` | Rewrite — single-page with all 7 sections |
| `style.css` | Rewrite — Neo-Brutalist design system |
| `script.js` | Create — Intersection Observer animations, nav scroll spy, lightbox |
| `gallery.html` | Rewrite — Brutalist gallery with masonry + lightbox |
| `about.html` | Delete — content merged into index.html |
| `projects.html` | Delete — content merged into index.html (LUQ LABS section) |

## Out of Scope

- No framework migration (stays pure HTML/CSS/JS)
- No CMS or dynamic content
- No contact form backend
- No image optimization pipeline (existing JPEGs used as-is)
