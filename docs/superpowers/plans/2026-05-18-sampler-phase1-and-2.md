# Sampler — Phase 1 + Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Sampler v0.1 — a new daily quilt-block puzzle game at `sampler.html`, with one playable block (Nine-Patch), three hand-authored templates, paint-mode input, four core rule kinds, a backtracking solver for uniqueness verification, NYT-shaped completion screen, full localStorage, and an archive calendar matching Glossari's.

**Architecture:** Single static file `sampler.html` at repo root. Vanilla HTML/CSS/JS, no build step, no framework, no test runner. Mirrors Glossari's overall shape: theme bootstrap, header, overlays for intro / completion / archive, ET-midnight daily index, localStorage with `byDate` map. Templates and fabric SVG patterns live inline as JS data. The constraint solver verifies template-uniqueness on demand; the gameplay loop only needs the rule `verify()` functions.

**Tech Stack:** Vanilla HTML/CSS/JS. SVG fabric `<pattern>` definitions. localStorage for state. Verification is manual browser testing via `python3 -m http.server 8000`.

**Spec:** `docs/superpowers/specs/2026-05-18-sampler-design.md`

**Reference patterns:** `glossari.html` (storage / overlays / typography); `docs/superpowers/specs/2026-05-18-glossari-archive-calendar-design.md` + `docs/superpowers/plans/2026-05-18-glossari-archive-calendar.md` (archive system precedent — Sampler mirrors this exactly).

---

## Testing approach (read first)

This project has no test framework and no build step. Each task ends with **manual browser verification** at `http://localhost:8000/sampler.html`. Steps are explicit about what to click and what to check (visually + via DevTools localStorage).

Start the server once at the beginning:

```bash
python3 -m http.server 8000
```

Open DevTools → Application → Local Storage to inspect `sampler_daily_v1` as you go.

Reset between tasks (when needed) by clearing the key in DevTools and reloading.

Commit after each verified task.

---

## User decision points (placeholders used throughout — replace at launch)

These are explicit placeholders the spec flagged in §13. Plan uses sensible defaults; replace before public launch:

| Placeholder | Value used in plan | When to replace |
|---|---|---|
| Final game name | "Sampler" (working name) | Just before launch |
| `LAUNCH_DATE` | `'2026-06-01'` placeholder | At deploy |
| Completion icon | Simple SVG star-in-square (similar to NYT) | Before launch polish |
| Reveal animation | Scale bounce (0.97 → 1.0) + accent flash only; no stitching-along-seams | OK as-is for v1 |
| Share-emoji rendering | 3×3 grid by fabric hue (Nine-Patch only) | OK for Phase 1+2; revisit when non-grid blocks ship |

---

## Phase 1 — Engine + Monday (Tasks 1–12)

End-of-phase-1 deliverable: a working `sampler.html` with one Nine-Patch puzzle per day, three templates that rotate by date, paint-mode input, rules panel with live feedback, completion screen with stats and share, full localStorage. No archive yet.

---

### Task 1: Scaffold `sampler.html` with shared site chrome

**Files:**
- Create: `sampler.html`

- [ ] **Step 1: Create the file with theme bootstrap, fonts, root CSS variables, and an empty `<body>`**

Create `sampler.html` at the repo root:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Sampler · Daily</title>
<script>
  (function () {
    try {
      var t = localStorage.getItem('th_theme');
      var resolved = (t === 'light' || t === 'dark')
        ? t
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', resolved);
    } catch (e) {}
  })();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Lora:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
<style>
/* Sampler — shares Glossari's typographic / dictionary voice */
:root {
  --paper: #ffffff;
  --paper-deep: #f7f7f5;
  --paper-shadow: #e8e8e4;
  --ink: #111111;
  --ink-soft: #444444;
  --ink-faint: #888888;
  --ink-ghost: #cccccc;
  --accent: #c01818;
  --accent-bright: #d83030;
  --accent-deep: #8a0f0f;
  --gold: #8a6c18;
  --gold-bright: #b08c30;
  --green: #1a6630;
  --green-bright: #2e8a4a;
}
:root[data-theme="dark"] {
  --paper: #111111;
  --paper-deep: #181818;
  --paper-shadow: #222222;
  --ink: #f0f0ee;
  --ink-soft: #c0c0bc;
  --ink-faint: #787878;
  --ink-ghost: #333333;
  --accent: #e04040;
  --accent-bright: #ee6060;
  --accent-deep: #c01818;
  --gold: #c09040;
  --gold-bright: #d4a850;
  --green: #3a9a58;
  --green-bright: #58b870;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  background: var(--paper);
  color: var(--ink);
  font-family: 'Lora', Georgia, serif;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.app {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  max-width: 560px;
  margin: 0 auto;
}

@media (min-width: 560px) {
  .app { border-left: 1px solid var(--paper-shadow); border-right: 1px solid var(--paper-shadow); }
}
@media (min-width: 700px) {
  html { font-size: 120%; }
  .app { max-width: 620px; }
}
@media (min-width: 1000px) {
  html { font-size: 130%; }
  .app { max-width: 660px; }
}

.header {
  padding: 0.9rem 1rem 0.7rem;
  border-bottom: 1px solid var(--ink);
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.brand { display: flex; align-items: baseline; gap: 0.5rem; }
.title {
  font-family: 'DM Serif Display', serif;
  font-weight: 400; font-style: italic;
  font-size: 1.5rem; color: var(--ink);
  letter-spacing: -0.01em; line-height: 1;
}
.title-mark { color: var(--accent); font-style: normal; }
.vol {
  font-family: 'Lora', serif; font-style: italic;
  font-size: 0.6rem; letter-spacing: 0.08em; color: var(--ink-faint);
}
.header-actions { display: flex; align-items: center; gap: 0.35rem; }
.header-icon-btn {
  background: transparent; border: 1px solid var(--ink-ghost);
  border-radius: 50%; width: 26px; height: 26px;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--ink-faint); padding: 0;
  transition: color 0.15s, border-color 0.15s;
}
.header-icon-btn:hover { color: var(--accent); border-color: var(--accent); }
.theme-toggle .theme-icon { display: none; }
:root[data-theme="light"] .theme-icon-light { display: block; }
:root[data-theme="dark"]  .theme-icon-dark  { display: block; }

.subbar {
  display: grid; grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0.3rem 1rem 0.32rem;
  border-bottom: 1px solid var(--paper-shadow);
  gap: 0.5rem;
}
.subbar-date {
  font-family: 'Lora', serif; font-style: italic;
  font-size: 0.55rem; color: var(--ink-faint);
  letter-spacing: 0.04em;
}
.block-name {
  grid-column: 2; justify-self: center;
  font-family: 'DM Serif Display', serif;
  font-style: italic; font-size: 0.85rem;
  color: var(--ink-soft); text-align: center;
}
.timer {
  font-family: 'Lora', serif; font-style: italic;
  font-size: 0.6rem; color: var(--ink-faint);
  min-width: 2.4rem; text-align: right; justify-self: end;
}

.main {
  flex: 1; display: flex; flex-direction: column;
  min-height: 0; overflow-y: auto;
  padding: 0.4rem 1rem 1rem;
}

html, body { transition: background 0.25s, color 0.25s; }
</style>
</head>
<body>
<div class="app">
  <header class="header">
    <div class="brand">
      <div class="title">Sam<span class="title-mark">·</span>pler</div>
      <div class="vol">daily</div>
    </div>
    <div class="header-actions">
      <button class="theme-toggle header-icon-btn" id="themeToggle" aria-label="Toggle theme" type="button">
        <svg class="theme-icon theme-icon-light" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>
        <svg class="theme-icon theme-icon-dark" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
      </button>
    </div>
  </header>

  <div class="subbar">
    <div class="subbar-date" id="subbarDate"></div>
    <div class="block-name" id="blockName">—</div>
    <div class="timer" id="timer">—</div>
  </div>

  <main class="main" id="main"></main>
</div>

<script>
// Theme toggle (shared site idiom)
document.getElementById('themeToggle').addEventListener('click', function () {
  var cur = document.documentElement.getAttribute('data-theme') || 'light';
  var next = cur === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('th_theme', next); } catch (e) {}
});

// Date / storage constants (placeholders — see plan header for replacements)
const STORAGE_KEY = 'sampler_daily_v1';
const LAUNCH_DATE = '2026-06-01';

function todayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}
function etDateOffset(dateStr, offsetDays) {
  const base = Date.parse(dateStr + 'T12:00:00Z');
  const shifted = new Date(base + offsetDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(shifted);
}
function prevEtDate(dateStr) { return etDateOffset(dateStr, -1); }

function loadStorage() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } }
function saveStorage(data) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {} }

function formatTime(seconds) {
  const m = Math.floor(seconds / 60); const s = seconds % 60;
  return m + ':' + String(s).padStart(2, '0');
}

// Initial subbar render
document.getElementById('subbarDate').textContent =
  new Date(todayStr() + 'T12:00:00Z')
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
</script>
</body>
</html>
```

- [ ] **Step 2: Verify the page loads cleanly in the browser**

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/sampler.html`. Expected:
- Page renders with "Sam·pler · daily" header in DM Serif Display.
- Subbar shows today's date on the left, "—" in the middle, "—" on the right.
- Main body is empty.
- Theme toggle (sun icon) works — click flips to dark mode and persists.
- No console errors.

- [ ] **Step 3: Commit**

```bash
git add sampler.html
git commit -m "Scaffold sampler.html with shared theme + header chrome"
```

---

### Task 2: Define fabric metadata and inline SVG patterns

**Files:**
- Modify: `sampler.html` (add fabric definitions before the closing `</script>`, add CSS for fabric tiles)

- [ ] **Step 1: Add the `FABRICS` registry**

Insert at the bottom of the existing `<script>` block (after the subbar render):

```js
// ─── Fabrics ──────────────────────────────────────────────────────────
// Each fabric: id, name, hex (base color for emoji/legend), and an SVG <pattern>
// definition (id matches `id` field, used as fill="url(#<id>)").
// Semantic tags drive rule evaluation: motif | scale | hue | value | direction.

const FABRICS = {
  F_CREAM:    { id: 'F_CREAM',    name: 'Cream',           hex: '#f3e9d2',
                motif: 'solid',  scale: 'large',  hue: 'neutral', value: 'light',  direction: null },
  F_MADDER:   { id: 'F_MADDER',   name: 'Madder Floral',   hex: '#a83838',
                motif: 'floral', scale: 'small',  hue: 'warm',    value: 'medium', direction: null },
  F_INDIGO:   { id: 'F_INDIGO',   name: 'Indigo Stripe',   hex: '#2a416d',
                motif: 'stripe', scale: 'small',  hue: 'cool',    value: 'dark',   direction: 'vertical' },
  F_WELD:     { id: 'F_WELD',     name: 'Weld Dot',        hex: '#c9a838',
                motif: 'dot',    scale: 'small',  hue: 'warm',    value: 'medium', direction: null },
  F_FOREST:   { id: 'F_FOREST',   name: 'Forest Vine',     hex: '#3a5a3a',
                motif: 'vine',   scale: 'medium', hue: 'cool',    value: 'medium', direction: null },
  F_WALNUT:   { id: 'F_WALNUT',   name: 'Walnut Solid',    hex: '#5a3a25',
                motif: 'solid',  scale: 'large',  hue: 'warm',    value: 'dark',   direction: null },
};

// Palette family — for Phase 1, only one family ("heritage-warm"). Templates can name it.
const PALETTES = {
  'heritage-warm': ['F_CREAM', 'F_MADDER', 'F_INDIGO', 'F_WELD', 'F_FOREST', 'F_WALNUT'],
};

// SVG <pattern> definitions. Inserted once into a hidden <svg> in the DOM.
const FABRIC_SVG = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <pattern id="F_CREAM" patternUnits="userSpaceOnUse" width="20" height="20">
      <rect width="20" height="20" fill="#f3e9d2"/>
      <circle cx="3" cy="3" r="0.6" fill="#e0d4b6" opacity="0.6"/>
      <circle cx="14" cy="11" r="0.5" fill="#e0d4b6" opacity="0.5"/>
    </pattern>
    <pattern id="F_MADDER" patternUnits="userSpaceOnUse" width="22" height="22">
      <rect width="22" height="22" fill="#a83838"/>
      <circle cx="11" cy="11" r="3.5" fill="none" stroke="#f3e9d2" stroke-width="0.9" opacity="0.85"/>
      <circle cx="11" cy="11" r="1.2" fill="#f3e9d2" opacity="0.8"/>
      <circle cx="2" cy="2" r="0.7" fill="#f3e9d2" opacity="0.6"/>
      <circle cx="20" cy="20" r="0.7" fill="#f3e9d2" opacity="0.6"/>
    </pattern>
    <pattern id="F_INDIGO" patternUnits="userSpaceOnUse" width="10" height="20">
      <rect width="10" height="20" fill="#2a416d"/>
      <rect x="3" width="1.3" height="20" fill="#f0ead8" opacity="0.55"/>
      <rect x="7" width="0.6" height="20" fill="#f0ead8" opacity="0.3"/>
    </pattern>
    <pattern id="F_WELD" patternUnits="userSpaceOnUse" width="14" height="14">
      <rect width="14" height="14" fill="#c9a838"/>
      <circle cx="3.5" cy="3.5" r="1.4" fill="#5a3a25" opacity="0.55"/>
      <circle cx="10.5" cy="10.5" r="1.4" fill="#5a3a25" opacity="0.55"/>
    </pattern>
    <pattern id="F_FOREST" patternUnits="userSpaceOnUse" width="20" height="20">
      <rect width="20" height="20" fill="#3a5a3a"/>
      <path d="M2 10 Q 6 4 10 10 T 18 10" stroke="#c0d8b0" stroke-width="0.9" fill="none" opacity="0.75"/>
      <circle cx="6" cy="7" r="0.6" fill="#c0d8b0" opacity="0.8"/>
      <circle cx="14" cy="13" r="0.6" fill="#c0d8b0" opacity="0.8"/>
    </pattern>
    <pattern id="F_WALNUT" patternUnits="userSpaceOnUse" width="20" height="20">
      <rect width="20" height="20" fill="#5a3a25"/>
      <rect x="0" y="0" width="20" height="20" fill="#3a2415" opacity="0.18"/>
    </pattern>
  </defs>
</svg>
`;

document.body.insertAdjacentHTML('afterbegin', FABRIC_SVG);
```

- [ ] **Step 2: Add a quick visual fabric-strip preview for sanity (will be removed in Task 3)**

Append to the same `<script>` block:

```js
// Temporary fabric strip — verifies SVG patterns render. Removed in Task 3.
const stripHost = document.createElement('div');
stripHost.id = 'fabricStrip';
stripHost.style.cssText = 'display:flex; gap:6px; padding:1rem; justify-content:center; flex-wrap:wrap;';
Object.values(FABRICS).forEach(f => {
  stripHost.insertAdjacentHTML('beforeend',
    `<svg width="64" height="64" aria-label="${f.name}">
       <rect width="64" height="64" fill="url(#${f.id})"/>
     </svg>
     <div style="font-size:0.6rem; align-self:center; max-width:80px; line-height:1.2;">${f.name}</div>`);
});
document.getElementById('main').appendChild(stripHost);
```

- [ ] **Step 3: Verify each fabric renders**

Reload `http://localhost:8000/sampler.html`. Expected: six 64×64 swatches in the main area, each showing its named pattern (cream-with-flecks, madder floral, indigo stripe, weld dot, forest vine, walnut solid). Names labelled beside each.

If a pattern shows as a solid color or transparent, the `<pattern>` id likely has a typo or the `url(#...)` ref doesn't match.

- [ ] **Step 4: Commit**

```bash
git add sampler.html
git commit -m "Add fabric metadata registry and SVG pattern definitions"
```

---

### Task 3: Render the Nine-Patch block (static, fixed assignment)

**Files:**
- Modify: `sampler.html` (replace the temporary fabric strip with a real block renderer)

- [ ] **Step 1: Add CSS for the block**

Append to the `<style>` block (right before `</style>`):

```css
.block-stage {
  display: flex; flex-direction: column; align-items: center;
  padding: 0.8rem 0 0.4rem;
}
.block-svg {
  width: 100%; max-width: 360px; aspect-ratio: 1 / 1;
  display: block;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.08));
}
:root[data-theme="dark"] .block-svg { filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4)); }
.slot {
  cursor: pointer;
  transition: stroke 0.15s, stroke-width 0.15s;
}
.slot.selected { stroke: var(--accent); stroke-width: 3; }
.slot.violation { stroke: var(--accent-bright); stroke-width: 4; stroke-dasharray: 4 3; }
.slot-empty-fill { fill: var(--paper-deep); }
.slot-label {
  font-family: 'Lora', serif; font-size: 9px; fill: var(--ink-faint);
  pointer-events: none;
}
```

- [ ] **Step 2: Define the Nine-Patch block geometry**

Append to the `<script>` block, before the temporary fabric-strip code:

```js
// ─── Blocks ──────────────────────────────────────────────────────────
// Each block: id, displayName, slotCount, render(svg, fabricBySlot, options) → svg DOM.
// Slots are indexed 0..slotCount-1. The block defines geometry (positions of slots
// in a 200×200 viewBox) and adjacency relationships.

const BLOCKS = {
  'nine-patch': {
    id: 'nine-patch',
    displayName: 'Nine-Patch',
    slotCount: 9,
    // Slot layout: 3×3 grid. Row-major. Each slot is a 60×60 cell with 4px gap.
    slotRect(i) {
      const r = Math.floor(i / 3), c = i % 3;
      const SIZE = 60, GAP = 4, OFFSET = 10;
      return { x: OFFSET + c * (SIZE + GAP), y: OFFSET + r * (SIZE + GAP), w: SIZE, h: SIZE };
    },
    // Edge-adjacency: which slots share a side?
    neighbors(i) {
      const r = Math.floor(i / 3), c = i % 3;
      const out = [];
      if (r > 0) out.push(i - 3);
      if (r < 2) out.push(i + 3);
      if (c > 0) out.push(i - 1);
      if (c < 2) out.push(i + 1);
      return out;
    },
    // Symmetry pairs for vertical-axis reflection. For nine-patch:
    // 0↔2, 3↔5, 6↔8 (center column 1,4,7 unchanged).
    symmetryPairs(axis) {
      if (axis === 'vertical')   return [[0,2],[3,5],[6,8]];
      if (axis === 'horizontal') return [[0,6],[1,7],[2,8]];
      if (axis === 'diagonal')   return [[1,3],[2,6],[5,7]]; // main diagonal (TL→BR)
      return [];
    },
    // Named positions for positional rules
    namedSlot(name) {
      const map = {
        center: 4,
        corners: [0, 2, 6, 8],
        edges: [1, 3, 5, 7],
        topLeft: 0, topRight: 2,
        bottomLeft: 6, bottomRight: 8,
      };
      return map[name];
    },
  },
};

// ─── Block renderer ──────────────────────────────────────────────────
// Renders a block as an SVG inside the host element. Updates slot fills
// based on fabricBySlot (array of fabric-IDs or nulls). Calls onSlotClick(i)
// when a slot is tapped.

function renderBlock(host, block, fabricBySlot, opts) {
  opts = opts || {};
  host.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('class', 'block-svg');
  for (let i = 0; i < block.slotCount; i++) {
    const r = block.slotRect(i);
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', r.x); rect.setAttribute('y', r.y);
    rect.setAttribute('width', r.w); rect.setAttribute('height', r.h);
    rect.setAttribute('class', 'slot' + (opts.selectedSlot === i ? ' selected' : '') + (opts.violations && opts.violations.has(i) ? ' violation' : ''));
    rect.setAttribute('stroke', 'var(--ink-soft)');
    rect.setAttribute('stroke-width', '1.5');
    const fid = fabricBySlot[i];
    if (fid) {
      rect.setAttribute('fill', 'url(#' + fid + ')');
    } else {
      rect.setAttribute('fill', 'var(--paper-deep)');
      rect.classList.add('slot-empty');
    }
    rect.dataset.slot = i;
    if (opts.onSlotClick) {
      rect.addEventListener('click', () => opts.onSlotClick(i));
    }
    svg.appendChild(rect);
    if (!fid) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', r.x + r.w / 2);
      label.setAttribute('y', r.y + r.h / 2 + 3);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', 'slot-label');
      label.textContent = i + 1;
      svg.appendChild(label);
    }
  }
  host.appendChild(svg);
}
```

- [ ] **Step 3: Replace the temporary fabric strip with a static Nine-Patch render**

Find and remove the entire temporary fabric-strip block (the `// Temporary fabric strip` comment and the lines after it through the `document.getElementById('main').appendChild(stripHost);` line).

In its place, append:

```js
// Initial Nine-Patch with a hand-picked fabric set for visual sanity.
// Replaced by template-driven init in Task 7.
const STAGE_HTML = `
  <div class="block-stage">
    <div id="blockHost"></div>
  </div>
`;
document.getElementById('main').innerHTML = STAGE_HTML;

const _initialFabrics = ['F_MADDER','F_CREAM','F_MADDER','F_CREAM','F_INDIGO','F_CREAM','F_MADDER','F_CREAM','F_MADDER'];
renderBlock(document.getElementById('blockHost'), BLOCKS['nine-patch'], _initialFabrics);

document.getElementById('blockName').textContent = BLOCKS['nine-patch'].displayName;
```

- [ ] **Step 4: Verify the Nine-Patch renders**

Reload. Expected:
- A 9-slot quilt block centered in the main area, ~360px wide on desktop.
- Pattern: madder corners + indigo center + cream edges (a classic Nine-Patch "Greek cross" arrangement).
- "Nine-Patch" appears in the subbar block-name slot.
- Each slot has a thin ink-soft outline.

- [ ] **Step 5: Commit**

```bash
git add sampler.html
git commit -m "Render static Nine-Patch block with fabric SVG patterns"
```

---

### Task 4: Add fabric palette + paint-mode input

**Files:**
- Modify: `sampler.html` (add palette CSS, palette markup, state, paint logic)

- [ ] **Step 1: Add CSS for the palette and undo/erase controls**

Append to `<style>`:

```css
.palette {
  display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;
  padding: 0.6rem 0.4rem 0.2rem;
}
.palette-swatch {
  width: 44px; height: 44px;
  border: 2px solid var(--ink-ghost); border-radius: 4px;
  cursor: pointer; padding: 0;
  display: block; position: relative;
  transition: transform 0.12s, border-color 0.15s, box-shadow 0.15s;
}
.palette-swatch:hover { border-color: var(--ink-faint); }
.palette-swatch.selected {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 0 0 1px var(--accent);
}
.palette-swatch svg { display: block; width: 100%; height: 100%; }
.palette-swatch.erase { border-style: dashed; background: transparent; color: var(--ink-faint); font-size: 1.1rem; line-height: 1; display: flex; align-items: center; justify-content: center; }
.palette-swatch.erase.selected { color: var(--accent); }

.toolbar {
  display: flex; gap: 0.5rem; justify-content: center;
  padding: 0.4rem 0;
}
.toolbar-btn {
  font-family: 'Lora', serif; font-style: italic;
  font-size: 0.75rem;
  padding: 0.45rem 0.95rem;
  background: transparent; color: var(--ink-soft);
  border: 1px solid var(--ink-ghost); border-radius: 3px;
  cursor: pointer;
}
.toolbar-btn:hover { border-color: var(--ink-faint); color: var(--ink); }
.toolbar-btn:disabled { opacity: 0.3; cursor: default; }
```

- [ ] **Step 2: Replace the initial-fabrics demo with real state + paint logic**

Find the block from Task 3 starting `const STAGE_HTML = \`...` and ending at the bottom of the file's `<script>`. Replace from `const STAGE_HTML = ...` onward (everything below it including the `_initialFabrics` demo) with:

```js
// ─── Game state ──────────────────────────────────────────────────────
let game = {
  block: null,             // BLOCKS[id]
  paletteIds: [],          // fabric IDs in palette order
  fabricBySlot: [],        // length = block.slotCount, fabric ID or null
  selectedFabric: null,    // fabric ID or 'ERASE'
  history: [],             // for undo: array of {slot, prev}
  playDate: null,
  replay: false,
  timerStart: null,
  timerInterval: null,
  elapsed: 0,
  locked: false,
};

const STAGE_HTML = `
  <div class="block-stage">
    <div id="blockHost"></div>
  </div>
  <div class="palette" id="palette"></div>
  <div class="toolbar">
    <button class="toolbar-btn" id="undoBtn" onclick="undoMove()" disabled>Undo</button>
  </div>
`;
document.getElementById('main').innerHTML = STAGE_HTML;

function startTimer() {
  stopTimer();
  game.timerStart = Date.now(); game.elapsed = 0;
  document.getElementById('timer').textContent = '0:00';
  game.timerInterval = setInterval(() => {
    game.elapsed = Math.floor((Date.now() - game.timerStart) / 1000);
    document.getElementById('timer').textContent = formatTime(game.elapsed);
  }, 1000);
}
function stopTimer() {
  if (game.timerInterval) clearInterval(game.timerInterval);
  game.timerInterval = null;
}

function initGame(blockId, paletteIds) {
  game.block = BLOCKS[blockId];
  game.paletteIds = paletteIds.slice();
  game.fabricBySlot = new Array(game.block.slotCount).fill(null);
  game.selectedFabric = paletteIds[0] || null;
  game.history = [];
  game.locked = false;
  document.getElementById('blockName').textContent = game.block.displayName;
  renderAll();
  startTimer();
}

function renderAll() {
  renderPalette();
  renderBlock(document.getElementById('blockHost'), game.block, game.fabricBySlot, {
    onSlotClick: handleSlotClick,
    selectedSlot: null,
    violations: new Set(),
  });
  document.getElementById('undoBtn').disabled = game.history.length === 0 || game.locked;
}

function renderPalette() {
  const host = document.getElementById('palette');
  host.innerHTML = '';
  game.paletteIds.forEach(fid => {
    const f = FABRICS[fid];
    const btn = document.createElement('button');
    btn.className = 'palette-swatch' + (game.selectedFabric === fid ? ' selected' : '');
    btn.setAttribute('aria-label', f.name);
    btn.innerHTML = `<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="url(#${fid})"/></svg>`;
    btn.addEventListener('click', () => selectFabric(fid));
    host.appendChild(btn);
  });
  // Erase brush
  const erase = document.createElement('button');
  erase.className = 'palette-swatch erase' + (game.selectedFabric === 'ERASE' ? ' selected' : '');
  erase.setAttribute('aria-label', 'Erase');
  erase.textContent = '✕';
  erase.addEventListener('click', () => selectFabric('ERASE'));
  host.appendChild(erase);
}

function selectFabric(fid) {
  if (game.locked) return;
  game.selectedFabric = fid;
  renderAll();
}

function handleSlotClick(slotIdx) {
  if (game.locked) return;
  if (!game.selectedFabric) return;
  const prev = game.fabricBySlot[slotIdx];
  const next = game.selectedFabric === 'ERASE' ? null : game.selectedFabric;
  if (prev === next) {
    // Tap same fabric on already-filled slot = erase
    if (game.selectedFabric !== 'ERASE') {
      game.history.push({ slot: slotIdx, prev });
      game.fabricBySlot[slotIdx] = null;
      renderAll();
    }
    return;
  }
  game.history.push({ slot: slotIdx, prev });
  game.fabricBySlot[slotIdx] = next;
  renderAll();
}

function undoMove() {
  if (game.locked) return;
  const last = game.history.pop();
  if (!last) return;
  game.fabricBySlot[last.slot] = last.prev;
  renderAll();
}

// Boot: launch with the heritage-warm palette
initGame('nine-patch', PALETTES['heritage-warm']);
```

- [ ] **Step 3: Verify paint mode works**

Reload. Expected:
- Empty Nine-Patch (9 numbered slots).
- Below: 6 fabric swatches + a dashed "✕" erase brush. First swatch (Cream) selected.
- Tap a slot → it fills with the selected fabric (Cream). Selected swatch has a red border + slight lift.
- Tap a different swatch (e.g., Madder) → that swatch becomes selected.
- Tap an unfilled slot → fills with Madder.
- Tap a slot already filled with the currently-selected fabric → it erases.
- Tap the ✕ swatch → erase mode. Tap any filled slot → erases.
- Undo button enables after first move; tapping it reverts step by step.
- Timer in subbar counts up.

- [ ] **Step 4: Commit**

```bash
git add sampler.html
git commit -m "Add fabric palette and paint-mode input"
```

---

### Task 5: Add rule kinds (count, positional, adjacency, symmetry)

**Files:**
- Modify: `sampler.html` (add rule definitions + verify functions before `initGame` boot)

- [ ] **Step 1: Add the rule registry**

Insert before the `// Boot:` line at the bottom of `<script>`:

```js
// ─── Rules ───────────────────────────────────────────────────────────
// Each rule kind has:
//   - describe(rule, fabricsById) → human-readable text
//   - verify(rule, fabricBySlot, block, fabricsById) → { satisfied, violatingSlots: Set<int> }
//
// Rules in templates are objects: { kind, ...params }. The runtime resolves
// `kind` to the corresponding entry in RULE_KINDS.

function fabricMatches(fid, constraint, fabricsById) {
  if (!fid) return false;
  const f = fabricsById[fid];
  if (!f) return false;
  if (constraint.fabricId) return f.id === constraint.fabricId;
  return Object.entries(constraint).every(([k, v]) => {
    if (k === 'fabricId') return true;
    return f[k] === v;
  });
}

function describeConstraint(c, fabricsById) {
  if (c.fabricId) {
    const f = fabricsById[c.fabricId];
    return f ? f.name : c.fabricId;
  }
  const parts = [];
  if (c.motif) parts.push(c.motif);
  if (c.hue) parts.push(c.hue + ' fabrics');
  if (c.value) parts.push(c.value + '-value');
  if (c.scale) parts.push(c.scale + '-scale');
  return parts.length ? parts.join(' ') : 'any fabric';
}

const RULE_KINDS = {
  count: {
    describe(rule, fabricsById) {
      const c = describeConstraint(rule.constraint, fabricsById);
      if (rule.exact !== undefined) return `Exactly ${rule.exact} ${c}.`;
      const lo = rule.min, hi = rule.max;
      if (lo !== undefined && hi !== undefined) return `Between ${lo} and ${hi} ${c}.`;
      if (lo !== undefined) return `At least ${lo} ${c}.`;
      if (hi !== undefined) return `At most ${hi} ${c}.`;
      return '';
    },
    verify(rule, fabricBySlot, block, fabricsById) {
      const matchingSlots = [];
      fabricBySlot.forEach((fid, i) => {
        if (fid && fabricMatches(fid, rule.constraint, fabricsById)) matchingSlots.push(i);
      });
      const n = matchingSlots.length;
      let ok = true;
      if (rule.exact !== undefined) ok = n === rule.exact;
      else {
        if (rule.min !== undefined && n < rule.min) ok = false;
        if (rule.max !== undefined && n > rule.max) ok = false;
      }
      const violating = new Set();
      if (!ok && rule.max !== undefined && n > rule.max) {
        // All matching slots are over-budget; flag them all.
        matchingSlots.forEach(i => violating.add(i));
      }
      // For under-budget or exact-violations we don't flag specific slots —
      // every empty slot is a candidate.
      return { satisfied: ok, violatingSlots: violating };
    },
  },

  positional: {
    describe(rule, fabricsById) {
      const c = describeConstraint(rule.constraint, fabricsById);
      const where = typeof rule.slot === 'string' ? rule.slot : 'slot ' + (rule.slot + 1);
      const must = rule.must === false ? 'must NOT be' : 'must be';
      return `The ${where} ${must} ${c}.`;
    },
    verify(rule, fabricBySlot, block, fabricsById) {
      const target = typeof rule.slot === 'string' ? block.namedSlot(rule.slot) : rule.slot;
      const slots = Array.isArray(target) ? target : [target];
      const violating = new Set();
      let allFilled = true;
      let ok = true;
      slots.forEach(i => {
        const fid = fabricBySlot[i];
        if (!fid) { allFilled = false; return; }
        const matches = fabricMatches(fid, rule.constraint, fabricsById);
        const must = rule.must !== false;
        if (must && !matches) { ok = false; violating.add(i); }
        if (!must && matches) { ok = false; violating.add(i); }
      });
      // If not all required slots are filled yet, the rule is "not yet satisfied"
      // but we don't flag empty slots as violations.
      return { satisfied: allFilled && ok, violatingSlots: violating };
    },
  },

  adjacency: {
    describe(rule, fabricsById) {
      const a = describeConstraint(rule.a, fabricsById);
      const b = describeConstraint(rule.b, fabricsById);
      if (rule.relation === 'forbid') return `No ${a} may touch ${b}.`;
      if (rule.relation === 'require-each-a-touches-b') return `Every ${a} must touch a ${b}.`;
      return '';
    },
    verify(rule, fabricBySlot, block, fabricsById) {
      const violating = new Set();
      let ok = true;
      const matchA = i => fabricBySlot[i] && fabricMatches(fabricBySlot[i], rule.a, fabricsById);
      const matchB = i => fabricBySlot[i] && fabricMatches(fabricBySlot[i], rule.b, fabricsById);
      if (rule.relation === 'forbid') {
        for (let i = 0; i < fabricBySlot.length; i++) {
          if (!matchA(i)) continue;
          for (const n of block.neighbors(i)) {
            if (matchB(n)) { ok = false; violating.add(i); violating.add(n); }
          }
        }
      } else if (rule.relation === 'require-each-a-touches-b') {
        let allFilled = true;
        for (let i = 0; i < fabricBySlot.length; i++) {
          if (!matchA(i)) continue;
          const hasB = block.neighbors(i).some(n => matchB(n));
          // Only flag if neighbors are all filled — otherwise rule isn't decidable yet.
          const neighborsAllFilled = block.neighbors(i).every(n => fabricBySlot[n] !== null);
          if (!hasB && neighborsAllFilled) { ok = false; violating.add(i); }
          if (!neighborsAllFilled) allFilled = false;
        }
        return { satisfied: ok && allFilled, violatingSlots: violating };
      }
      return { satisfied: ok, violatingSlots: violating };
    },
  },

  symmetry: {
    describe(rule, fabricsById) {
      return `Block has ${rule.axis} reflection symmetry.`;
    },
    verify(rule, fabricBySlot, block, fabricsById) {
      const pairs = block.symmetryPairs(rule.axis);
      const violating = new Set();
      let ok = true;
      let allRelevantFilled = true;
      pairs.forEach(([a, b]) => {
        const fa = fabricBySlot[a], fb = fabricBySlot[b];
        if (fa === null || fb === null) { allRelevantFilled = false; return; }
        if (fa !== fb) { ok = false; violating.add(a); violating.add(b); }
      });
      return { satisfied: ok && allRelevantFilled, violatingSlots: violating };
    },
  },
};

function evaluateRules(rules, fabricBySlot, block, fabricsById) {
  return rules.map(rule => {
    const kind = RULE_KINDS[rule.kind];
    if (!kind) return { rule, satisfied: false, violatingSlots: new Set(), description: '(unknown rule)' };
    const result = kind.verify(rule, fabricBySlot, block, fabricsById);
    return {
      rule,
      satisfied: result.satisfied,
      violatingSlots: result.violatingSlots,
      description: kind.describe(rule, fabricsById),
    };
  });
}
```

- [ ] **Step 2: Add a temporary rules-test that logs evaluation to console**

Add immediately after the boot line (`initGame('nine-patch', PALETTES['heritage-warm']);`):

```js
// Temporary smoke test — removed in Task 6.
const _testRules = [
  { kind: 'positional', slot: 'center', constraint: { fabricId: 'F_CREAM' } },
  { kind: 'count', constraint: { hue: 'warm' }, min: 3, max: 5 },
  { kind: 'adjacency', a: { motif: 'floral' }, b: { motif: 'floral' }, relation: 'forbid' },
  { kind: 'symmetry', axis: 'vertical' },
];
window._evalRules = () => evaluateRules(_testRules, game.fabricBySlot, game.block, FABRICS);
console.log('Smoke test: call window._evalRules() in the console with the current board.');
```

- [ ] **Step 3: Verify rule evaluation**

Reload. Paint Cream into the center slot (slot 5). In console:

```js
window._evalRules()
```

Expected: an array of 4 result objects. With ONLY the center filled with Cream:
- `positional center=Cream` → `satisfied: true`
- `count warm 3-5` → `satisfied: false` (zero warm placed; not under min)
- `adjacency forbid floral-floral` → `satisfied: true` (no florals placed)
- `symmetry vertical` → `satisfied: false` (allRelevantFilled false — board mostly empty)

Now paint Madder into slots 1 (top center), 3 (left center), 5 (right center), 7 (bottom center). Call `_evalRules()` again.

Expected:
- `positional` → still true (slot 5 still has Cream? — wait, slot 5 is right-center per the index → re-check). Indices: 0=TL,1=TM,2=TR,3=LM,4=C,5=RM,6=BL,7=BM,8=BR. So center is 4. If you painted Cream into slot 4, it's center.
- After 4 Madder slots around the edges + Cream at center: `count warm 3-5` → satisfied (4 madder + cream warm? cream is `neutral` → 4 warm), `adjacency` → all florals (Madder is floral) touch each other only diagonally on a 3×3 (slot 1 neighbors 4 not 3, 5), so depends on adjacency. Slot 1 neighbors are 0,2,4 — Madder at 1, neighbors are empty empty cream — no floral-floral adjacency, OK satisfied.
- `symmetry vertical` → still not fully filled.

The exact values matter less than confirming **all four rule kinds produce coherent `{ satisfied, violatingSlots }` results**.

- [ ] **Step 4: Commit**

```bash
git add sampler.html
git commit -m "Add four core rule kinds (count, positional, adjacency, symmetry)"
```

---

### Task 6: Render the rules panel with live ✓/violation feedback

**Files:**
- Modify: `sampler.html` (add rules panel CSS + markup, wire into `renderAll`)

- [ ] **Step 1: Add rules-panel CSS**

Append to `<style>`:

```css
.rules-panel {
  margin: 0.6rem 0 0.4rem;
  padding: 0.7rem 0.9rem;
  background: var(--paper-deep);
  border: 1px solid var(--paper-shadow);
  border-radius: 4px;
}
.rules-panel-title {
  font-family: 'Lora', serif; font-style: italic;
  font-size: 0.5rem; letter-spacing: 0.28em; text-transform: uppercase;
  color: var(--ink-faint); margin-bottom: 0.4rem; text-align: center;
}
.rule-item {
  display: flex; align-items: baseline; gap: 0.5rem;
  font-family: 'Lora', serif;
  font-size: 0.78rem; line-height: 1.45;
  color: var(--ink-soft);
  padding: 0.12rem 0;
}
.rule-mark {
  font-family: 'DM Serif Display', serif;
  width: 0.95rem; text-align: center; flex-shrink: 0;
  color: var(--ink-ghost);
  font-style: normal;
}
.rule-item.satisfied .rule-mark { color: var(--green); }
.rule-item.satisfied .rule-text { color: var(--ink-soft); }
.rule-item.violating .rule-mark { color: var(--accent); }
.rule-item.violating .rule-text { color: var(--accent); }
```

- [ ] **Step 2: Add rules-panel markup and wire into render**

Modify `STAGE_HTML` (find the existing definition):

```js
const STAGE_HTML = `
  <div class="block-stage">
    <div id="blockHost"></div>
  </div>
  <div class="palette" id="palette"></div>
  <div class="toolbar">
    <button class="toolbar-btn" id="undoBtn" onclick="undoMove()" disabled>Undo</button>
  </div>
`;
```

Replace with:

```js
const STAGE_HTML = `
  <div class="block-stage">
    <div id="blockHost"></div>
  </div>
  <div class="palette" id="palette"></div>
  <div class="toolbar">
    <button class="toolbar-btn" id="undoBtn" onclick="undoMove()" disabled>Undo</button>
  </div>
  <div class="rules-panel">
    <div class="rules-panel-title">Rules</div>
    <div id="rulesList"></div>
  </div>
`;
```

Then update `renderAll`. Find:

```js
function renderAll() {
  renderPalette();
  renderBlock(document.getElementById('blockHost'), game.block, game.fabricBySlot, {
    onSlotClick: handleSlotClick,
    selectedSlot: null,
    violations: new Set(),
  });
  document.getElementById('undoBtn').disabled = game.history.length === 0 || game.locked;
}
```

Replace with:

```js
function renderAll() {
  renderPalette();
  const rules = game.rules || [];
  const evaluated = evaluateRules(rules, game.fabricBySlot, game.block, FABRICS);
  const violations = new Set();
  evaluated.forEach(r => r.violatingSlots.forEach(s => violations.add(s)));
  renderBlock(document.getElementById('blockHost'), game.block, game.fabricBySlot, {
    onSlotClick: handleSlotClick,
    selectedSlot: null,
    violations,
  });
  renderRules(evaluated);
  document.getElementById('undoBtn').disabled = game.history.length === 0 || game.locked;
  return evaluated;
}

function renderRules(evaluated) {
  const host = document.getElementById('rulesList');
  if (!host) return;
  host.innerHTML = '';
  evaluated.forEach(r => {
    const div = document.createElement('div');
    const isFilled = r.violatingSlots.size > 0;
    div.className = 'rule-item' + (r.satisfied ? ' satisfied' : (isFilled ? ' violating' : ''));
    div.innerHTML = `<span class="rule-mark">${r.satisfied ? '✓' : (isFilled ? '×' : '·')}</span><span class="rule-text">${r.description}</span>`;
    host.appendChild(div);
  });
}
```

- [ ] **Step 3: Set `game.rules` in `initGame`**

Find the `initGame` function:

```js
function initGame(blockId, paletteIds) {
  game.block = BLOCKS[blockId];
  game.paletteIds = paletteIds.slice();
  game.fabricBySlot = new Array(game.block.slotCount).fill(null);
  game.selectedFabric = paletteIds[0] || null;
  game.history = [];
  game.locked = false;
  document.getElementById('blockName').textContent = game.block.displayName;
  renderAll();
  startTimer();
}
```

Replace with:

```js
function initGame(blockId, paletteIds, rules) {
  game.block = BLOCKS[blockId];
  game.paletteIds = paletteIds.slice();
  game.fabricBySlot = new Array(game.block.slotCount).fill(null);
  game.selectedFabric = paletteIds[0] || null;
  game.history = [];
  game.locked = false;
  game.rules = rules || [];
  document.getElementById('blockName').textContent = game.block.displayName;
  renderAll();
  startTimer();
}
```

Then update the boot line. Find:

```js
initGame('nine-patch', PALETTES['heritage-warm']);
```

Replace with:

```js
initGame('nine-patch', PALETTES['heritage-warm'], [
  { kind: 'positional', slot: 'center', constraint: { fabricId: 'F_CREAM' } },
  { kind: 'count', constraint: { fabricId: 'F_MADDER' }, exact: 4 },
  { kind: 'symmetry', axis: 'vertical' },
  { kind: 'adjacency', a: { motif: 'stripe' }, b: { motif: 'stripe' }, relation: 'forbid' },
]);
```

Remove the temporary `_evalRules` smoke test block from Task 5 (the `const _testRules = [...]` and `window._evalRules = ...` lines).

- [ ] **Step 4: Verify rules panel renders and updates live**

Reload. Expected:
- Below the block, a "Rules" panel with 4 lines:
  - `· The center must be Cream.`
  - `· Exactly 4 Madder Floral.`
  - `· Block has vertical reflection symmetry.`
  - `· No stripe may touch stripe.`
- Paint Cream into center (slot 4) → first rule's mark turns green ✓.
- Paint Madder into slots 0, 2, 6, 8 → second rule turns green ✓.
- Paint Madder into slot 1 also → second rule turns red × and slots 0,1,2,6,8 outlined in red (over-budget).
- Erase slot 1, paint Indigo (stripe) into slots 1 and 3 → fourth rule (no stripe touches stripe) — slot 1 and slot 3 are NOT neighbors (their neighbors are 0,2,4 and 0,4,6 respectively, so they don't touch), so still satisfied. Paint Indigo into slot 4 too (overwriting Cream) → now slots 1,3,4 are all stripe; 1↔4 and 3↔4 ARE neighbors → rule turns red × on slots 1, 3, 4.

- [ ] **Step 5: Commit**

```bash
git add sampler.html
git commit -m "Render rules panel with live satisfaction and violation highlighting"
```

---

### Task 7: Templates, date-seeded RNG, and template instantiation

**Files:**
- Modify: `sampler.html` (add templates + RNG + instantiation; swap demo boot for date-driven)

- [ ] **Step 1: Add a seeded PRNG**

Insert before the `// ─── Game state ───` block:

```js
// ─── Seeded RNG ──────────────────────────────────────────────────────
// mulberry32 — small, deterministic; good enough for shuffling palette
// and picking from a template pool given a date seed.
function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedFromDate(dateStr) {
  // Cheap hash of "YYYY-MM-DD" to a 32-bit int.
  let h = 2166136261 >>> 0;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seededShuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dailyIndex(dateStr) {
  const ms = Date.parse(dateStr + 'T00:00:00Z') - Date.parse(LAUNCH_DATE + 'T00:00:00Z');
  const days = Math.floor(ms / 86400000);
  return days < 0 ? 0 : days;
}
```

- [ ] **Step 2: Add the 3 launch templates for Nine-Patch**

Insert immediately after the `BLOCKS` definition (before the `renderBlock` function):

```js
// ─── Templates ───────────────────────────────────────────────────────
// Each template instantiates to a daily puzzle given a date seed.
// The runtime picks a template, then resolves the palette from the
// named family, then assigns fabrics to roles referenced by rules.
//
// Phase 1: 3 hand-authored Monday-tier Nine-Patch templates.
// Each template is constructed so it admits exactly one solution.

const TEMPLATES = [
  // Template 1: "Greek Cross" — classic. Madder at corners, Cream center,
  // edges all the same single fabric chosen from the palette by date.
  {
    id: 'nine-patch-greek-cross-v1',
    block: 'nine-patch',
    paletteFamily: 'heritage-warm',
    paletteSize: 6,
    // Fabric roles: ANCHOR_A = corners, ANCHOR_B = center, ANCHOR_C = edges.
    fabricRoles: {
      ANCHOR_A: 'F_MADDER',
      ANCHOR_B: 'F_CREAM',
      ANCHOR_C: null, // chosen from palette by date
    },
    rules: [
      { kind: 'positional', slot: 'center', constraint: { fabricId: 'ROLE:ANCHOR_B' } },
      { kind: 'positional', slot: 'corners', constraint: { fabricId: 'ROLE:ANCHOR_A' } },
      { kind: 'positional', slot: 'edges',   constraint: { fabricId: 'ROLE:ANCHOR_C' } },
      { kind: 'count', constraint: { fabricId: 'ROLE:ANCHOR_A' }, exact: 4 },
    ],
  },
  // Template 2: "Diagonal Stripes" — corners and center the same fabric,
  // edges alternate two stripe fabrics in a pattern enforced by symmetry.
  {
    id: 'nine-patch-diagonal-v1',
    block: 'nine-patch',
    paletteFamily: 'heritage-warm',
    paletteSize: 6,
    fabricRoles: {
      ANCHOR_A: 'F_CREAM',
      ANCHOR_B: 'F_INDIGO',
      ANCHOR_C: 'F_WALNUT',
    },
    rules: [
      { kind: 'count', constraint: { fabricId: 'ROLE:ANCHOR_A' }, exact: 5 },
      { kind: 'positional', slot: 'center', constraint: { fabricId: 'ROLE:ANCHOR_A' } },
      { kind: 'positional', slot: 'corners', constraint: { fabricId: 'ROLE:ANCHOR_A' } },
      { kind: 'symmetry', axis: 'vertical' },
      { kind: 'symmetry', axis: 'horizontal' },
      { kind: 'adjacency', a: { fabricId: 'ROLE:ANCHOR_B' }, b: { fabricId: 'ROLE:ANCHOR_C' }, relation: 'forbid' },
      { kind: 'count', constraint: { fabricId: 'ROLE:ANCHOR_B' }, exact: 2 },
      { kind: 'count', constraint: { fabricId: 'ROLE:ANCHOR_C' }, exact: 2 },
    ],
  },
  // Template 3: "Pinwheel-of-color" — every cell has a unique role-ish
  // but rules constrain hue counts and adjacency.
  {
    id: 'nine-patch-warm-cool-v1',
    block: 'nine-patch',
    paletteFamily: 'heritage-warm',
    paletteSize: 6,
    fabricRoles: {
      ANCHOR_A: 'F_CREAM',
    },
    rules: [
      { kind: 'positional', slot: 'center', constraint: { fabricId: 'ROLE:ANCHOR_A' } },
      { kind: 'count', constraint: { hue: 'warm' }, exact: 4 },
      { kind: 'count', constraint: { hue: 'cool' }, exact: 4 },
      { kind: 'symmetry', axis: 'diagonal' },
      { kind: 'adjacency', a: { hue: 'warm' }, b: { hue: 'warm' }, relation: 'forbid' },
    ],
  },
];

function resolveRoleRefs(rule, fabricRoles) {
  // Deep-clone rule and replace any "ROLE:NAME" strings with the resolved fabric ID.
  function resolveValue(v) {
    if (typeof v === 'string' && v.startsWith('ROLE:')) {
      const name = v.slice(5);
      return fabricRoles[name];
    }
    if (v && typeof v === 'object') {
      const out = Array.isArray(v) ? [] : {};
      for (const k of Object.keys(v)) out[k] = resolveValue(v[k]);
      return out;
    }
    return v;
  }
  return resolveValue(rule);
}

function instantiateTemplate(template, dateStr) {
  const rng = mulberry32(seedFromDate(dateStr + ':' + template.id));
  // Resolve unfilled fabricRoles by drawing from the palette.
  const family = PALETTES[template.paletteFamily];
  const used = new Set(Object.values(template.fabricRoles).filter(Boolean));
  const available = family.filter(fid => !used.has(fid));
  const shuffled = seededShuffle(available, rng);
  const resolvedRoles = Object.assign({}, template.fabricRoles);
  let cursor = 0;
  for (const k of Object.keys(resolvedRoles)) {
    if (resolvedRoles[k] === null) {
      resolvedRoles[k] = shuffled[cursor++];
    }
  }
  // Palette to show in UI: include all role fabrics + a few extras for choice.
  const roleFabrics = Object.values(resolvedRoles);
  const remaining = family.filter(fid => !roleFabrics.includes(fid));
  const extras = seededShuffle(remaining, rng).slice(0, Math.max(0, template.paletteSize - roleFabrics.length));
  const paletteIds = roleFabrics.concat(extras);
  // Shuffle the palette display order so it isn't a giveaway.
  const displayPalette = seededShuffle(paletteIds, mulberry32(seedFromDate(dateStr + ':display')));
  // Resolve rules.
  const rules = template.rules.map(r => resolveRoleRefs(r, resolvedRoles));
  return { template, resolvedRoles, paletteIds: displayPalette, rules };
}

function pickTemplateForDate(dateStr) {
  const idx = dailyIndex(dateStr) % TEMPLATES.length;
  return TEMPLATES[idx];
}
```

- [ ] **Step 3: Replace the demo boot with date-driven instantiation**

Find:

```js
initGame('nine-patch', PALETTES['heritage-warm'], [
  { kind: 'positional', slot: 'center', constraint: { fabricId: 'F_CREAM' } },
  { kind: 'count', constraint: { fabricId: 'F_MADDER' }, exact: 4 },
  { kind: 'symmetry', axis: 'vertical' },
  { kind: 'adjacency', a: { motif: 'stripe' }, b: { motif: 'stripe' }, relation: 'forbid' },
]);
```

Replace with:

```js
function startDailyGame(dateStr, opts) {
  dateStr = dateStr || todayStr();
  game.playDate = dateStr;
  game.replay = !!(opts && opts.replay);
  const template = pickTemplateForDate(dateStr);
  const instance = instantiateTemplate(template, dateStr);
  initGame(instance.template.block, instance.paletteIds, instance.rules);
  // Update subbar date for archive plays
  const isLive = dateStr === todayStr();
  const d = new Date(dateStr + 'T12:00:00Z');
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  document.getElementById('subbarDate').textContent = isLive ? label : 'Archive · ' + label;
}

startDailyGame();
```

- [ ] **Step 4: Verify three different templates over three dates**

Reload. Expected: today's puzzle loads, rules panel shows the template's rules with resolved fabric names (e.g., "The center must be Cream." for template 1).

In console:

```js
startDailyGame('2026-06-01')  // template 0
startDailyGame('2026-06-02')  // template 1
startDailyGame('2026-06-03')  // template 2
```

Each call should reload the page state with a different template's rules visible. The palettes should differ in display order from day to day (because of the display-shuffle seed).

- [ ] **Step 5: Verify each template is solvable (manual)**

For each of the three templates above, manually paint fabrics to satisfy all rules. Each should reach an all-✓ state:

- Template 0 (Greek Cross): corners = role A (Madder), center = role B (Cream), edges = role C (whichever fabric the day rolled). All 4 rules turn green.
- Template 1 (Diagonal): center + 4 corners = Cream; opposing edges = Indigo/Walnut paired symmetrically (e.g., slots 1,7 = Indigo and 3,5 = Walnut). All 8 rules turn green.
- Template 2 (Warm/Cool): center = Cream; 4 warm fabrics + 4 cool fabrics arranged so no two warm slots touch and the block has diagonal symmetry (1↔3, 2↔6, 5↔7).

If a template can't be solved with the current fabric assignments, note the failure — the solver in Task 8 will surface this systematically.

- [ ] **Step 6: Commit**

```bash
git add sampler.html
git commit -m "Add 3 Nine-Patch templates, seeded RNG, and date-driven instantiation"
```

---

### Task 8: Backtracking solver for template-uniqueness verification

**Files:**
- Modify: `sampler.html` (add solver, expose `window.verifyTemplate` for author use)

- [ ] **Step 1: Add the solver**

Insert immediately after `pickTemplateForDate`:

```js
// ─── Solver ──────────────────────────────────────────────────────────
// Backtracking with rule-evaluation pruning. Used by the author to verify
// a template has exactly one solution for a given fabric assignment.
//
// Returns { solutions: int, samples: Array<fabricBySlot> } where samples
// holds up to `cap` distinct found solutions (cap=2 is enough to detect
// non-uniqueness).

function solve(block, paletteIds, rules, fabricsById, cap) {
  cap = cap || 2;
  const N = block.slotCount;
  const solutions = [];
  const assignment = new Array(N).fill(null);
  function recurse(i) {
    if (solutions.length >= cap) return;
    if (i === N) {
      // Fully filled — verify all rules pass.
      const evaluated = evaluateRules(rules, assignment, block, fabricsById);
      if (evaluated.every(r => r.satisfied)) {
        solutions.push(assignment.slice());
      }
      return;
    }
    for (const fid of paletteIds) {
      assignment[i] = fid;
      // Cheap prune: only check rules whose violatingSlots indicate a
      // confirmed conflict given currently-assigned slots.
      const evaluated = evaluateRules(rules, assignment, block, fabricsById);
      const violatingAssigned = evaluated.some(r =>
        r.violatingSlots.size > 0 &&
        Array.from(r.violatingSlots).every(s => s <= i)
      );
      if (!violatingAssigned) recurse(i + 1);
      if (solutions.length >= cap) { assignment[i] = null; return; }
    }
    assignment[i] = null;
  }
  recurse(0);
  return { solutionCount: solutions.length, samples: solutions };
}

function verifyTemplate(templateId, dateRange) {
  const template = TEMPLATES.find(t => t.id === templateId);
  if (!template) { console.error('No template:', templateId); return; }
  dateRange = dateRange || ['2026-06-01', '2026-06-30'];
  const [start, end] = dateRange;
  const results = [];
  let d = start;
  while (d <= end) {
    const instance = instantiateTemplate(template, d);
    const block = BLOCKS[instance.template.block];
    const result = solve(block, instance.paletteIds, instance.rules, FABRICS, 2);
    results.push({ date: d, solutionCount: result.solutionCount });
    d = etDateOffset(d, 1);
  }
  const unique = results.filter(r => r.solutionCount === 1).length;
  const none = results.filter(r => r.solutionCount === 0).length;
  const many = results.filter(r => r.solutionCount >= 2).length;
  console.log(`Template ${templateId}: ${unique} unique / ${none} none / ${many} multiple (of ${results.length})`);
  if (none > 0 || many > 0) {
    console.log('First failing dates:',
      results.filter(r => r.solutionCount !== 1).slice(0, 5).map(r => `${r.date} (${r.solutionCount})`).join(', '));
  }
  return results;
}

window.verifyTemplate = verifyTemplate;
window.solve = solve;
window.instantiateTemplate = instantiateTemplate;
```

- [ ] **Step 2: Verify each of the 3 templates produces a unique solution across June 2026**

Reload. In console:

```js
verifyTemplate('nine-patch-greek-cross-v1', ['2026-06-01', '2026-06-30']);
verifyTemplate('nine-patch-diagonal-v1', ['2026-06-01', '2026-06-30']);
verifyTemplate('nine-patch-warm-cool-v1', ['2026-06-01', '2026-06-30']);
```

Expected: each should report `30 unique / 0 none / 0 multiple` (or similar — at minimum, zero `none` and zero `many`).

If a template reports `multiple` solutions, the rule set is under-constrained. If it reports `none`, the role assignment conflicts with the rules. The console output names the first failing dates — adjust that template's rules and re-run.

Acceptable v1 outcome: at least 28/30 unique across each template. If any template has 2+ failing dates, fix the template (likely by adding one more rule or tightening an existing one) and re-verify.

- [ ] **Step 3: Spot-check that the live game's daily puzzle has a unique solution**

In console:

```js
const t = pickTemplateForDate(todayStr());
const inst = instantiateTemplate(t, todayStr());
solve(BLOCKS[inst.template.block], inst.paletteIds, inst.rules, FABRICS, 2);
```

Expected: `{ solutionCount: 1, samples: [<one assignment>] }`.

- [ ] **Step 4: Commit**

```bash
git add sampler.html
git commit -m "Add backtracking solver and verifyTemplate author tool"
```

---

### Task 9: Win detection + reveal animation

**Files:**
- Modify: `sampler.html` (detect all-rules-satisfied, trigger reveal)

- [ ] **Step 1: Add CSS for the reveal animation**

Append to `<style>`:

```css
.block-svg.reveal-anim {
  animation: blockSettle 0.7s ease-out;
}
@keyframes blockSettle {
  0% { transform: scale(1); }
  35% { transform: scale(0.97); filter: drop-shadow(0 0 14px var(--accent-bright)); }
  100% { transform: scale(1); }
}
```

- [ ] **Step 2: Add win-detection to `renderAll` and `handleSlotClick`**

Modify `renderAll`. Find:

```js
function renderAll() {
  renderPalette();
  const rules = game.rules || [];
  const evaluated = evaluateRules(rules, game.fabricBySlot, game.block, FABRICS);
  const violations = new Set();
  evaluated.forEach(r => r.violatingSlots.forEach(s => violations.add(s)));
  renderBlock(document.getElementById('blockHost'), game.block, game.fabricBySlot, {
    onSlotClick: handleSlotClick,
    selectedSlot: null,
    violations,
  });
  renderRules(evaluated);
  document.getElementById('undoBtn').disabled = game.history.length === 0 || game.locked;
  return evaluated;
}
```

Replace with:

```js
function renderAll() {
  renderPalette();
  const rules = game.rules || [];
  const evaluated = evaluateRules(rules, game.fabricBySlot, game.block, FABRICS);
  const violations = new Set();
  evaluated.forEach(r => r.violatingSlots.forEach(s => violations.add(s)));
  renderBlock(document.getElementById('blockHost'), game.block, game.fabricBySlot, {
    onSlotClick: handleSlotClick,
    selectedSlot: null,
    violations,
  });
  renderRules(evaluated);
  document.getElementById('undoBtn').disabled = game.history.length === 0 || game.locked;
  // Win detection
  const allFilled = game.fabricBySlot.every(x => x !== null);
  const allSatisfied = evaluated.every(r => r.satisfied);
  if (!game.locked && allFilled && allSatisfied) {
    triggerWin();
  }
  return evaluated;
}

function triggerWin() {
  game.locked = true;
  stopTimer();
  // Add reveal animation class
  const svg = document.querySelector('.block-svg');
  if (svg) {
    svg.classList.add('reveal-anim');
    setTimeout(() => svg.classList.remove('reveal-anim'), 700);
  }
  // Show completion after the animation
  setTimeout(() => showCompletion(), 900);
}

function showCompletion() {
  // Stub — implemented in Task 10
  console.log('WIN! Time:', game.elapsed, 'seconds. Block:', game.block.displayName);
}
```

- [ ] **Step 3: Verify the win flow on template 0 (the easiest)**

In console:

```js
startDailyGame('2026-06-01')
```

Look at the rules panel. Solve manually:
- Center: Cream
- Corners (slots 0, 2, 6, 8): Madder
- Edges (slots 1, 3, 5, 7): whatever fabric template 0 assigned as ANCHOR_C (visible by reading the rules panel — the third rule shows the fabric name).

When the final slot satisfies the final rule:
- The block should briefly scale down to 97% and glow with the accent color (~0.7s).
- After ~0.9s, the console logs `WIN! Time: <N> seconds. Block: Nine-Patch`.
- The timer stops.
- Further slot/palette clicks do nothing (game is locked).

- [ ] **Step 4: Commit**

```bash
git add sampler.html
git commit -m "Add win detection and reveal animation"
```

---

### Task 10: Completion overlay (NYT-shaped)

**Files:**
- Modify: `sampler.html` (overlay markup, CSS, populate logic)

- [ ] **Step 1: Add overlay base CSS**

Append to `<style>`:

```css
.overlay {
  position: absolute; inset: 0;
  background: var(--paper);
  display: none; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 1.6rem 1.3rem;
  z-index: 10; text-align: center; overflow-y: auto;
}
.overlay.show { display: flex; }
.go-mark {
  font-family: 'Lora', serif; font-style: italic;
  font-size: 0.6rem; letter-spacing: 0.28em; text-transform: uppercase;
  color: var(--accent); margin-bottom: 0.4rem;
}
.go-title {
  font-family: 'DM Serif Display', serif; font-weight: 400; font-style: italic;
  font-size: 2.4rem; line-height: 1; margin-bottom: 0.3rem;
}
.go-rule {
  width: 32px; height: 1px; background: var(--ink);
  margin: 0.9rem auto 1.2rem;
}
.go-sub {
  font-family: 'Lora', serif; font-size: 1.05rem; line-height: 1.45;
  color: var(--ink-soft); max-width: 380px; margin-bottom: 1.1rem;
}
.go-sub b { color: var(--ink); font-weight: 600; }
.go-stats {
  display: flex; gap: 1.4rem;
  padding: 0.65rem 1.2rem;
  border-top: 1px solid var(--paper-shadow);
  border-bottom: 1px solid var(--paper-shadow);
  margin-bottom: 1.3rem;
}
.go-stat { text-align: center; }
.go-stat-num {
  font-family: 'DM Serif Display', serif; font-style: italic;
  font-size: 1.4rem; color: var(--ink); line-height: 1;
}
.go-stat-lbl {
  font-family: 'Lora', serif; font-style: italic;
  font-size: 0.5rem; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--ink-faint); margin-top: 3px;
}
.streak-pill {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.9rem;
  background: var(--gold);
  color: var(--paper);
  font-family: 'Lora', serif; font-weight: 600; font-size: 0.7rem;
  letter-spacing: 0.14em; text-transform: uppercase;
  border-radius: 999px;
  margin-bottom: 1.2rem;
}
:root[data-theme="dark"] .streak-pill { background: var(--gold-bright); color: var(--ink); }
.streak-pill .star { color: var(--paper); }
:root[data-theme="dark"] .streak-pill .star { color: var(--ink); }
.go-icon {
  width: 56px; height: 56px;
  background: var(--gold);
  border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center;
  margin-bottom: 0.9rem;
  color: var(--paper);
}
:root[data-theme="dark"] .go-icon { background: var(--gold-bright); color: var(--ink); }

.share-block {
  background: var(--paper);
  border: 1.5px solid var(--ink);
  border-radius: 4px;
  padding: 1rem 1.1rem 0.9rem;
  text-align: center;
  margin: 0 0 1rem;
  max-width: 360px;
  width: 100%;
}
:root[data-theme="dark"] .share-block { border-color: var(--ink-soft); }
.share-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 2px; max-width: 144px; margin: 0.8rem auto;
}
.share-grid-cell {
  aspect-ratio: 1 / 1;
  border-radius: 2px;
}
.share-line {
  font-family: 'Lora', serif; font-size: 0.7rem;
  color: var(--ink-soft); margin-top: 0.3rem;
}
.share-copy-btn {
  font-family: 'Lora', serif; font-style: italic; font-size: 0.85rem;
  padding: 0.55rem 1.6rem; margin-top: 0.7rem;
  background: var(--ink); color: var(--paper);
  border: none; border-radius: 3px; cursor: pointer; width: 100%;
}
.share-copy-btn:hover { background: var(--ink-soft); }

.btn {
  font-family: 'Lora', serif; font-style: italic; font-size: 0.9rem;
  padding: 0.8rem 2.2rem;
  background: var(--ink); color: var(--paper);
  border: none; border-radius: 3px; cursor: pointer;
}
.btn:hover { background: var(--ink-soft); }
```

- [ ] **Step 2: Add the completion overlay markup**

Just before `</div>` that closes `<div class="app">` (which is right above `<script>` in current file), insert:

```html
  <div class="overlay" id="completion">
    <div class="go-icon" aria-hidden="true">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"/></svg>
    </div>
    <div class="go-title">Congratulations!</div>
    <div class="go-rule"></div>
    <div class="go-sub" id="completionSub">—</div>
    <div class="streak-pill" id="completionStreak" style="display:none">
      <span class="star">★</span><span id="completionStreakText">—</span>
    </div>
    <div class="go-stats" id="completionStats"></div>
    <div class="share-block" id="completionShare"></div>
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap; justify-content:center">
      <button class="btn" onclick="closeCompletion()">Close</button>
    </div>
  </div>
```

- [ ] **Step 3: Implement `showCompletion` and `closeCompletion`**

Replace the stub `showCompletion` (defined in Task 9):

```js
function showCompletion() {
  console.log('WIN! Time:', game.elapsed, 'seconds. Block:', game.block.displayName);
}
```

With:

```js
function showCompletion() {
  // Record the result first (Task 11 wires the actual write)
  recordCompletion();
  const data = loadStorage();
  const playDate = game.playDate || todayStr();
  const d = new Date(playDate + 'T12:00:00Z');
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' });
  const blockName = game.block.displayName;
  const time = formatTime(game.elapsed);
  document.getElementById('completionSub').innerHTML =
    `You solved a <b>${dayName}</b> <b>${blockName}</b> in <b>${time}</b>.`;
  const streak = data.streak || 0;
  const pill = document.getElementById('completionStreak');
  if (streak > 0) {
    pill.style.display = 'inline-flex';
    document.getElementById('completionStreakText').textContent = `You have a ${streak}-day streak`;
  } else {
    pill.style.display = 'none';
  }
  // Stats row
  const statsHost = document.getElementById('completionStats');
  statsHost.innerHTML = '';
  [
    ['Streak', data.streak || 0],
    ['Played', data.totalPlayed || 0],
    ['Flawless', data.totalFlawless || 0],
    ['Avg', formatAvgTime(data)],
  ].forEach(([label, val]) => {
    const stat = document.createElement('div');
    stat.className = 'go-stat';
    stat.innerHTML = `<div class="go-stat-num">${val}</div><div class="go-stat-lbl">${label}</div>`;
    statsHost.appendChild(stat);
  });
  // Share block
  renderShareBlock(playDate, dayName, blockName, time);
  document.getElementById('completion').classList.add('show');
}

function formatAvgTime(data) {
  if (!data || !data.solvedTimedCount) return '—';
  const avg = Math.round(data.totalSolveSeconds / data.solvedTimedCount);
  return formatTime(avg);
}

function renderShareBlock(playDate, dayName, blockName, time) {
  const host = document.getElementById('completionShare');
  const dateLabel = new Date(playDate + 'T12:00:00Z')
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  const data = loadStorage();
  const streak = data.streak || 0;
  const flawless = game.fabricBySlot.length && (loadStorage().byDate?.[playDate]?.result?.flawless);
  // 3×3 emoji-ish grid using fabric hex
  const cells = game.fabricBySlot.map(fid => {
    if (!fid) return '<div class="share-grid-cell" style="background:var(--paper-shadow)"></div>';
    return `<div class="share-grid-cell" style="background:${FABRICS[fid].hex}"></div>`;
  }).join('');
  host.innerHTML = `
    <div style="font-family:'DM Serif Display',serif; font-style:italic; font-size:1.4rem; line-height:1;">Sam<span style="color:var(--accent); font-style:normal">·</span>pler</div>
    <div class="share-line" style="font-size:0.6rem; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-faint); margin-top:0.2rem;">${dateLabel} · ${blockName}</div>
    <div class="share-grid">${cells}</div>
    <div class="share-line"><b style="color:var(--ink)">${time}</b>${flawless ? ' · flawless' : ''}</div>
    ${streak > 0 ? `<div class="share-line">${streak}-day streak</div>` : ''}
    <button class="share-copy-btn" onclick="copyShareText()">Copy result</button>
  `;
}

function copyShareText() {
  const playDate = game.playDate || todayStr();
  const dateLabel = new Date(playDate + 'T12:00:00Z')
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
  const time = formatTime(game.elapsed);
  const data = loadStorage();
  const streak = data.streak || 0;
  const flawless = loadStorage().byDate?.[playDate]?.result?.flawless;
  // Hue-based emoji approximation for 3×3
  const hueToEmoji = { warm: '🟧', cool: '🟦', neutral: '⬜' };
  const valueToEmoji = { dark: '🟫', medium: null, light: null };
  function emojiFor(fid) {
    if (!fid) return '⬛';
    const f = FABRICS[fid];
    return valueToEmoji[f.value] || hueToEmoji[f.hue] || '🟩';
  }
  const rows = [];
  for (let r = 0; r < 3; r++) {
    rows.push([0,1,2].map(c => emojiFor(game.fabricBySlot[r*3+c])).join(''));
  }
  const lines = [
    `Sampler · ${dateLabel} · ${game.block.displayName}`,
    `${time}${flawless ? ' ★ flawless' : ''}`,
    ...rows,
  ];
  if (streak > 0) lines.push(`🔥 ${streak}-day streak`);
  const text = lines.join('\n');
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.share-copy-btn');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = orig; }, 1400);
    }
  });
}

function closeCompletion() {
  document.getElementById('completion').classList.remove('show');
}

function recordCompletion() {
  // Writes the completed daily to storage. Mirrors Glossari's
  // recordCompletion shape exactly (byDate map + aggregate counters).
  // Replays do not write.
  if (game.replay) return;
  const playDate = game.playDate || todayStr();
  const isLive = playDate === todayStr();
  const data = loadStorage();
  if (!data.byDate) data.byDate = {};
  data.byDate[playDate] = {
    puzzleIdx: dailyIndex(playDate),
    block: game.block.id,
    result: {
      elapsedSeconds: game.elapsed,
      allSolved: true,
      flawless: true, // no mistake system in v1
    },
    completedAt: Date.now(),
    source: isLive ? 'live' : 'archive',
  };
  data.totalPlayed = (data.totalPlayed || 0) + 1;
  data.totalSolved = (data.totalSolved || 0) + 1;
  data.totalFlawless = (data.totalFlawless || 0) + 1;
  data.totalSolveSeconds = (data.totalSolveSeconds || 0) + game.elapsed;
  data.solvedTimedCount = (data.solvedTimedCount || 0) + 1;
  if (isLive) {
    const yesterday = prevEtDate(todayStr());
    const streakBase = data.lastPlayedDate === yesterday ? (data.streak || 0) : 0;
    data.streak = streakBase + 1;
    data.bestStreak = Math.max(data.bestStreak || 0, data.streak);
    data.lastPlayedDate = todayStr();
  }
  saveStorage(data);
}
```

- [ ] **Step 4: Verify the completion overlay**

Clear localStorage. Reload. Solve template 0 (today's puzzle by default).

Expected after win:
- Block animates briefly.
- Completion overlay shows: gold star icon, "Congratulations!", subtitle reading "You solved a {weekday} Nine-Patch in {time}.", 1-day streak pill, 4 stats (Streak 1, Played 1, Flawless 1, Avg = your time), share block with 3×3 colored grid + Copy button.
- Click "Copy result" → button briefly reads "Copied!". Paste into a text editor — should look like the example in the spec.
- Click "Close" → overlay closes (the block remains, locked).

In console: `JSON.parse(localStorage.getItem('sampler_daily_v1'))` shows a `byDate` entry for today with `block: 'nine-patch'`, `streak: 1`, `totalSolved: 1`, etc.

- [ ] **Step 5: Commit**

```bash
git add sampler.html
git commit -m "Add NYT-shaped completion overlay with stats and share block"
```

---

### Task 11: Intro overlay and already-played routing

**Files:**
- Modify: `sampler.html` (intro overlay markup + open/close routing, alreadyPlayed)

- [ ] **Step 1: Add intro and alreadyPlayed overlays**

After the closing `</div>` of the `#completion` overlay (and before the closing `</div>` of `<div class="app">`), insert:

```html
  <div class="overlay" id="intro">
    <div class="dict-entry-head">
      <div style="font-family:'DM Serif Display',serif; font-weight:400; font-style:italic; font-size:clamp(2.2rem, 7vw, 3.4rem); line-height:1; color:var(--ink); margin-bottom:0.42rem;">Sam<span style="color:var(--accent); margin:0 1px; font-style:normal">·</span>pler</div>
      <div style="font-family:'Lora',serif; font-size:0.78rem; color:var(--ink-faint); margin-bottom:0.32rem;"><em>n.</em>&nbsp;<span style="color:var(--ink-soft)">/ˈsam-plər/</span></div>
      <div style="font-family:'Lora',serif; font-style:italic; font-size:0.7rem; letter-spacing:0.2em; text-transform:uppercase; color:var(--accent);">a daily quilt-block puzzle</div>
    </div>
    <div class="go-rule"></div>
    <div class="go-sub" style="text-align:left; max-width:380px;">
      <div style="display:flex; gap:0.55rem; align-items:baseline; margin-bottom:0.45rem;"><span style="font-family:'DM Serif Display',serif; font-style:italic; color:var(--accent); flex-shrink:0; min-width:1.1rem; font-size:1.05rem">1.</span><span>Each day you'll piece a real quilt block: today's is the <b>Nine-Patch</b>.</span></div>
      <div style="display:flex; gap:0.55rem; align-items:baseline; margin-bottom:0.45rem;"><span style="font-family:'DM Serif Display',serif; font-style:italic; color:var(--accent); flex-shrink:0; min-width:1.1rem; font-size:1.05rem">2.</span><span>Tap a fabric, then tap slots to <b>paint</b> them. Tap a different fabric to switch.</span></div>
      <div style="display:flex; gap:0.55rem; align-items:baseline; margin-bottom:0.45rem;"><span style="font-family:'DM Serif Display',serif; font-style:italic; color:var(--accent); flex-shrink:0; min-width:1.1rem; font-size:1.05rem">3.</span><span>Place fabrics so <b>every rule</b> in the panel is satisfied. Violations glow red.</span></div>
      <div style="display:flex; gap:0.55rem; align-items:baseline; margin-bottom:0.45rem;"><span style="font-family:'DM Serif Display',serif; font-style:italic; color:var(--accent); flex-shrink:0; min-width:1.1rem; font-size:1.05rem">4.</span><span>Each puzzle has <b>exactly one solution</b>. There's no submit button — it locks when you've got it.</span></div>
    </div>
    <button class="btn" id="beginBtn" onclick="beginDaily()" style="margin-top:0.6rem">Begin</button>
  </div>

  <div class="overlay" id="alreadyPlayed">
    <div class="go-mark">— Daily Complete —</div>
    <div class="go-title">Come Back Tomorrow</div>
    <div class="go-rule"></div>
    <div class="go-sub">You've already pieced today's block. New puzzle at midnight (Eastern).</div>
    <div class="go-stats" id="alreadyStats"></div>
  </div>
```

- [ ] **Step 2: Wire boot flow**

Find the current bottom of the script:

```js
function startDailyGame(dateStr, opts) {
  dateStr = dateStr || todayStr();
  game.playDate = dateStr;
  game.replay = !!(opts && opts.replay);
  const template = pickTemplateForDate(dateStr);
  const instance = instantiateTemplate(template, dateStr);
  initGame(instance.template.block, instance.paletteIds, instance.rules);
  const isLive = dateStr === todayStr();
  const d = new Date(dateStr + 'T12:00:00Z');
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  document.getElementById('subbarDate').textContent = isLive ? label : 'Archive · ' + label;
}

startDailyGame();
```

Replace with:

```js
function startDailyGame(dateStr, opts) {
  dateStr = dateStr || todayStr();
  game.playDate = dateStr;
  game.replay = !!(opts && opts.replay);
  const template = pickTemplateForDate(dateStr);
  const instance = instantiateTemplate(template, dateStr);
  initGame(instance.template.block, instance.paletteIds, instance.rules);
  const isLive = dateStr === todayStr();
  const d = new Date(dateStr + 'T12:00:00Z');
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  document.getElementById('subbarDate').textContent = isLive ? label : 'Archive · ' + label;
}

function beginDaily() {
  document.getElementById('intro').classList.remove('show');
  document.getElementById('alreadyPlayed').classList.remove('show');
  startDailyGame();
}

function showAlreadyPlayed(stored) {
  document.getElementById('intro').classList.remove('show');
  const host = document.getElementById('alreadyStats');
  host.innerHTML = '';
  [
    ['Streak', stored.streak || 0],
    ['Played', stored.totalPlayed || 0],
    ['Flawless', stored.totalFlawless || 0],
    ['Avg', formatAvgTime(stored)],
  ].forEach(([label, val]) => {
    const stat = document.createElement('div');
    stat.className = 'go-stat';
    stat.innerHTML = `<div class="go-stat-num">${val}</div><div class="go-stat-lbl">${label}</div>`;
    host.appendChild(stat);
  });
  document.getElementById('alreadyPlayed').classList.add('show');
}

function bootSampler() {
  const stored = loadStorage();
  const today = todayStr();
  if (stored.byDate && stored.byDate[today]) {
    showAlreadyPlayed(stored);
  } else {
    document.getElementById('intro').classList.add('show');
  }
  // Pre-load today's puzzle behind the overlay so Begin is instant
  startDailyGame(today);
}

bootSampler();
```

- [ ] **Step 3: Verify boot flow**

Clear storage. Reload.

Expected: Intro overlay shows on top of the puzzle (puzzle is pre-loaded but hidden). Click Begin → intro closes, puzzle becomes interactive. Solve it. Completion overlay appears. Close completion.

Reload. Expected: alreadyPlayed overlay shows with 4 stats. Below it (visible if you close): the (locked) finished puzzle.

In console:

```js
JSON.parse(localStorage.getItem('sampler_daily_v1'))
```

Expected: `byDate[<today>]` present, `streak: 1`, etc.

Clear storage again. Reload. Click Begin. Verify the puzzle is solvable today.

- [ ] **Step 4: Commit**

```bash
git add sampler.html
git commit -m "Add intro and alreadyPlayed overlays with boot routing"
```

---

### Task 12: Link Sampler from the site index

**Files:**
- Modify: `index.html` (add a Sampler card alongside the Glossari card)

- [ ] **Step 1: Inspect the existing index**

```bash
grep -n "glossari" index.html | head
```

Note: the existing `index.html` has a Glossari card pattern. We'll copy it for Sampler.

- [ ] **Step 2: Add a Sampler card**

Read `index.html`. Find the Glossari card markup — it's the `<a>` or `<div>` containing the Glossari title and "daily" tag. Duplicate it for Sampler. The exact markup depends on the existing structure; preserve the visual pattern.

Example insertion pattern (if the index uses `<a class="game-card">` style):

```html
    <a class="game-card" href="sampler.html">
      <div class="card-title">Sam<span class="card-mark">·</span>pler</div>
      <div class="card-tagline">a daily quilt-block puzzle</div>
      <div class="card-tag">daily</div>
    </a>
```

Match the existing Glossari card's class names exactly. If the index doesn't yet have any games beyond Glossari, the safer minimal change is appending a sibling link beneath Glossari's card and styling it identically.

- [ ] **Step 3: Verify the link works**

Reload `http://localhost:8000/`. Expected: site index shows both Glossari and Sampler cards. Click Sampler → navigates to `/sampler.html` and shows intro. Click site logo / browser back → returns to index.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Add Sampler link to site index"
```

---

## Phase 1 milestone

At this point, `sampler.html` is a complete, playable single-block daily game. Reset storage, reload, and confirm the full happy path works:

1. Site index shows Sampler card → click.
2. Sampler intro shows.
3. Click Begin → Nine-Patch puzzle loads with 3 templates rotating by date.
4. Paint fabrics; rules turn ✓/× live.
5. Solve → reveal animation → completion overlay with stats and share.
6. Close → block locked.
7. Reload → alreadyPlayed shows with stats.

If anything from steps 1–7 is broken, fix it now before moving to Phase 2.

---

## Phase 2 — Archive parity (Tasks 13–17)

End-of-phase-2 deliverable: archive calendar overlay accessible from intro and alreadyPlayed. Replays of completed days don't write storage. First-time archive plays count toward totals/avg but not streak. Visually and behaviorally identical to Glossari's archive.

---

### Task 13: Secondary button style + intro/alreadyPlayed restructuring

**Files:**
- Modify: `sampler.html` (CSS for `.btn-secondary` + action rows; restructure intro and alreadyPlayed actions)

- [ ] **Step 1: Add secondary-button CSS**

Append to `<style>`:

```css
.intro-actions-row {
  display: flex; gap: 0.6rem; justify-content: center; align-items: center;
  flex-wrap: wrap; margin-top: 0.6rem;
}
.btn-secondary {
  font-family: 'Lora', serif; font-style: italic; font-size: 0.85rem;
  padding: 0.5rem 1.1rem; border-radius: 4px;
  background: transparent; color: var(--ink-soft);
  border: 1px solid var(--ink-faint); cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.btn-secondary:hover { background: var(--paper-shadow); color: var(--ink); border-color: var(--ink-soft); }
```

- [ ] **Step 2: Restructure intro actions**

Find the existing Begin button in the intro overlay:

```html
    <button class="btn" id="beginBtn" onclick="beginDaily()" style="margin-top:0.6rem">Begin</button>
```

Replace with:

```html
    <div style="display:flex; flex-direction:column; align-items:center; gap:0.4rem; margin-top:0.6rem">
      <button class="btn" id="beginBtn" onclick="beginDaily()">Begin</button>
      <div class="intro-actions-row">
        <button class="btn-secondary" onclick="openArchive()">Archive</button>
      </div>
    </div>
```

- [ ] **Step 3: Add Archive button to alreadyPlayed**

Find the existing `alreadyPlayed` overlay. After `<div class="go-stats" id="alreadyStats"></div>` insert:

```html
    <div class="intro-actions-row" style="margin-top:1.2rem">
      <button class="btn-secondary" onclick="openArchive()">Archive</button>
    </div>
```

- [ ] **Step 4: Add stub `openArchive` so the button doesn't error**

Insert near the other game functions (e.g., right after `showAlreadyPlayed`):

```js
function openArchive() {
  // Implemented in Task 14
  console.log('archive open (stub)');
}
```

- [ ] **Step 5: Verify**

Reset storage, reload. Intro shows Begin + Archive (secondary style — smaller, transparent, ink-soft text). Solve the puzzle. Reload — alreadyPlayed shows Archive button below stats. Clicking Archive logs "archive open (stub)" — no error.

- [ ] **Step 6: Commit**

```bash
git add sampler.html
git commit -m "Add secondary button style and Archive entry on intro/alreadyPlayed"
```

---

### Task 14: Archive overlay scaffold

**Files:**
- Modify: `sampler.html` (overlay markup + CSS + open/close JS)

- [ ] **Step 1: Add archive overlay markup**

Just before the closing `</div>` that closes the `app` container (right after `#alreadyPlayed`), insert:

```html
  <div class="overlay" id="archive">
    <button class="archive-close" type="button" onclick="closeArchive()" aria-label="Close archive">✕</button>
    <div class="archive-header">
      <div class="archive-title">Archive</div>
      <div class="archive-subtitle"><em>Sampler · since June 1, 2026</em></div>
    </div>
    <div class="archive-monthnav">
      <button class="archive-navbtn" type="button" id="archivePrevBtn" onclick="archiveShiftMonth(-1)">‹</button>
      <div class="archive-monthlabel" id="archiveMonthLabel">—</div>
      <button class="archive-navbtn" type="button" id="archiveNextBtn" onclick="archiveShiftMonth(1)">›</button>
    </div>
    <div class="archive-weekhead">
      <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
    </div>
    <div class="archive-grid" id="archiveGrid"></div>
    <div class="archive-stats" id="archiveStats"></div>
  </div>
```

Note: the "since June 1, 2026" date in the subtitle should match `LAUNCH_DATE` — if you've already changed the constant, update this string to match.

- [ ] **Step 2: Add archive CSS**

Append to `<style>`:

```css
#archive { padding: 1.6rem 1rem; }
.archive-close {
  position: absolute; top: 0.8rem; right: 0.9rem;
  background: transparent; border: none; color: var(--ink-faint);
  font-size: 1.2rem; cursor: pointer; padding: 0.2rem 0.5rem;
}
.archive-close:hover { color: var(--ink); }
.archive-header { text-align: center; margin-bottom: 1.1rem; }
.archive-title {
  font-family: 'DM Serif Display', serif; font-style: italic;
  font-size: 1.85rem; line-height: 1;
}
.archive-subtitle {
  font-family: 'Lora', serif; font-size: 0.7rem; color: var(--ink-faint);
  margin-top: 0.25rem;
}
.archive-monthnav {
  display: flex; justify-content: center; align-items: center; gap: 1.2rem;
  margin-bottom: 0.7rem;
}
.archive-navbtn {
  background: transparent; border: none; color: var(--ink-soft);
  font-size: 1.2rem; cursor: pointer; padding: 0.2rem 0.6rem;
}
.archive-navbtn:disabled { color: var(--ink-ghost); cursor: default; }
.archive-monthlabel {
  font-family: 'Lora', serif; font-style: italic; font-size: 0.95rem;
  min-width: 8rem; text-align: center;
}
.archive-weekhead, .archive-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem; max-width: 22rem; margin: 0 auto;
}
.archive-weekhead > div {
  font-family: 'Lora', serif; font-size: 0.55rem; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--ink-faint); text-align: center;
  padding: 0.3rem 0;
}
.archive-cell {
  aspect-ratio: 1 / 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-family: 'Lora', serif; font-size: 0.95rem;
  border: 1px solid transparent; border-radius: 4px;
  background: transparent; color: var(--ink); cursor: pointer;
  position: relative;
}
.archive-cell.empty { visibility: hidden; }
.archive-cell.future { color: var(--ink-ghost); cursor: default; }
.archive-cell.today { border-color: var(--accent); }
.archive-cell.available:hover { background: var(--paper-shadow); }
.archive-cell.completed { cursor: pointer; }
.archive-cell .archive-mark {
  font-size: 0.7rem; line-height: 1; margin-top: 0.05rem;
}
.archive-cell.solved .archive-mark { color: var(--green); }
.archive-cell.revealed .archive-mark { color: var(--gold); }
.archive-stats {
  display: flex; justify-content: center; gap: 1.6rem;
  margin-top: 1.2rem; max-width: 22rem; margin-left: auto; margin-right: auto;
}
.archive-stats .archive-stat { text-align: center; }
.archive-stats .archive-stat-num {
  font-family: 'DM Serif Display', serif; font-size: 1.1rem; line-height: 1;
}
.archive-stats .archive-stat-lbl {
  font-family: 'Lora', serif; font-size: 0.55rem; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--ink-faint); margin-top: 0.18rem;
}
```

- [ ] **Step 3: Replace stub `openArchive` and add `closeArchive` + `archiveShiftMonth` + stub `renderArchive`**

Replace the Task 13 stub:

```js
function openArchive() {
  // Implemented in Task 14
  console.log('archive open (stub)');
}
```

With:

```js
let archiveViewMonth = null; // {year, month} 0-indexed

function openArchive() {
  document.getElementById('intro').classList.remove('show');
  document.getElementById('alreadyPlayed').classList.remove('show');
  document.getElementById('completion').classList.remove('show');
  const today = todayStr();
  const [y, m] = today.split('-').map(Number);
  archiveViewMonth = { year: y, month: m - 1 };
  renderArchive();
  document.getElementById('archive').classList.add('show');
}

function closeArchive() {
  document.getElementById('archive').classList.remove('show');
  const stored = loadStorage();
  const today = todayStr();
  if (stored.byDate && stored.byDate[today]) {
    showAlreadyPlayed(stored);
  } else {
    document.getElementById('intro').classList.add('show');
  }
}

function archiveShiftMonth(delta) {
  if (!archiveViewMonth) return;
  const d = new Date(archiveViewMonth.year, archiveViewMonth.month + delta, 1);
  archiveViewMonth = { year: d.getFullYear(), month: d.getMonth() };
  renderArchive();
}

function renderArchive() {
  if (!archiveViewMonth) return;
  document.getElementById('archiveMonthLabel').textContent =
    new Date(archiveViewMonth.year, archiveViewMonth.month, 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  document.getElementById('archiveGrid').innerHTML = '';
  document.getElementById('archiveStats').innerHTML = '';
}
```

- [ ] **Step 4: Verify open/close**

Reset storage, reload. Click Archive → overlay shows with title, current month label (e.g. "May 2026" or whatever today is), nav arrows, weekday header, empty grid. Click ✕ → overlay closes. Intro returns.

Solve today's puzzle. Reload → alreadyPlayed. Click Archive → opens. Click ✕ → returns to alreadyPlayed (not intro).

- [ ] **Step 5: Commit**

```bash
git add sampler.html
git commit -m "Add archive overlay scaffold (markup, CSS, open/close routing)"
```

---

### Task 15: Render the calendar grid with date-state styling

**Files:**
- Modify: `sampler.html` (fill in `renderArchive` + add `archiveCellClick`)

- [ ] **Step 1: Replace the stub `renderArchive`**

Replace:

```js
function renderArchive() {
  if (!archiveViewMonth) return;
  document.getElementById('archiveMonthLabel').textContent =
    new Date(archiveViewMonth.year, archiveViewMonth.month, 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  document.getElementById('archiveGrid').innerHTML = '';
  document.getElementById('archiveStats').innerHTML = '';
}
```

With:

```js
function renderArchive() {
  if (!archiveViewMonth) return;
  const { year, month } = archiveViewMonth;
  const firstOfMonth = new Date(year, month, 1);
  document.getElementById('archiveMonthLabel').textContent =
    firstOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const today = todayStr();
  const [launchY, launchM, launchD] = LAUNCH_DATE.split('-').map(Number);
  const launchDate = new Date(launchY, launchM - 1, launchD);
  const todayDate = new Date(today + 'T12:00:00');

  const prevBtn = document.getElementById('archivePrevBtn');
  const nextBtn = document.getElementById('archiveNextBtn');
  const lastOfPrevMonth = new Date(year, month, 0);
  const firstOfNextMonth = new Date(year, month + 1, 1);
  prevBtn.disabled = lastOfPrevMonth < launchDate;
  nextBtn.disabled = firstOfNextMonth > todayDate;

  const stored = loadStorage();
  const byDate = stored.byDate || {};

  const grid = document.getElementById('archiveGrid');
  grid.innerHTML = '';
  const firstWeekday = firstOfMonth.getDay();
  for (let i = 0; i < firstWeekday; i++) {
    const cell = document.createElement('div');
    cell.className = 'archive-cell empty';
    grid.appendChild(cell);
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const cell = document.createElement('div');
    cell.className = 'archive-cell';
    const numEl = document.createElement('div');
    numEl.textContent = day;
    cell.appendChild(numEl);

    const isBeforeLaunch = dateObj < launchDate;
    const isFuture = dateObj > todayDate;
    const isToday = dateStr === today;
    const entry = byDate[dateStr];

    if (isBeforeLaunch) {
      cell.classList.add('empty');
    } else if (isFuture) {
      cell.classList.add('future');
    } else {
      if (isToday) cell.classList.add('today');
      if (entry) {
        cell.classList.add('completed');
        const allSolved = entry.result && entry.result.allSolved;
        cell.classList.add(allSolved ? 'solved' : 'revealed');
        const mark = document.createElement('div');
        mark.className = 'archive-mark';
        mark.textContent = allSolved ? '✓' : '◊';
        cell.appendChild(mark);
        cell.onclick = () => archiveCellClick(dateStr, true);
      } else {
        cell.classList.add('available');
        cell.onclick = () => archiveCellClick(dateStr, false);
      }
    }
    grid.appendChild(cell);
  }

  const statsEl = document.getElementById('archiveStats');
  statsEl.innerHTML = '';
  [
    ['Streak', stored.streak || 0],
    ['Played', stored.totalPlayed || 0],
    ['Flawless', stored.totalFlawless || 0],
    ['Avg', formatAvgTime(stored)],
  ].forEach(([label, val]) => {
    const stat = document.createElement('div');
    stat.className = 'archive-stat';
    const num = document.createElement('div'); num.className = 'archive-stat-num'; num.textContent = val;
    const lbl = document.createElement('div'); lbl.className = 'archive-stat-lbl'; lbl.textContent = label;
    stat.appendChild(num); stat.appendChild(lbl); statsEl.appendChild(stat);
  });
}

function archiveCellClick(dateStr, isReplay) {
  document.getElementById('archive').classList.remove('show');
  startDailyGame(dateStr, { replay: isReplay });
}
```

- [ ] **Step 2: Verify the grid renders correctly**

Reset storage. Reload. Open archive.

Expected for the current month (assuming today is `2026-06-XX` after `LAUNCH_DATE = '2026-06-01'`):
- Days before launch: hidden (`empty`).
- Days from launch through today: visible, available (hover affordance), today has accent ring.
- Days after today: `future`, faint, not clickable.
- Prev arrow disabled (no months before June 2026 have in-range dates).
- Next arrow disabled (next month is fully future).
- Stats footer: 0s and Avg `—`.

If today is before LAUNCH_DATE (e.g., testing pre-launch), all cells will be empty/future. To test, temporarily override:

```js
// In console:
window.LAUNCH_DATE_OVERRIDE = '2026-05-01'  // not used by code — purely for your reference; for real testing, just commit a temporary LAUNCH_DATE change or test post-launch
```

Or simply test with a fixed past date in the past month by adjusting LAUNCH_DATE to e.g. `'2026-04-01'` during development.

- [ ] **Step 3: Verify a completed cell shows ✓**

Reset storage. Play today's puzzle, solve it cleanly. Reload → alreadyPlayed → Archive. Today's cell shows accent ring + green ✓.

- [ ] **Step 4: Commit**

```bash
git add sampler.html
git commit -m "Render archive calendar grid with date-state styling"
```

---

### Task 16: Wire archive cell clicks to live/archive/replay paths

**Files:**
- Modify: `sampler.html` (extend `startDailyGame` to gate replay, add archive label to subbar)

- [ ] **Step 1: Make `startDailyGame` aware of already-completed days**

Find the current `startDailyGame`:

```js
function startDailyGame(dateStr, opts) {
  dateStr = dateStr || todayStr();
  game.playDate = dateStr;
  game.replay = !!(opts && opts.replay);
  const template = pickTemplateForDate(dateStr);
  const instance = instantiateTemplate(template, dateStr);
  initGame(instance.template.block, instance.paletteIds, instance.rules);
  const isLive = dateStr === todayStr();
  const d = new Date(dateStr + 'T12:00:00Z');
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  document.getElementById('subbarDate').textContent = isLive ? label : 'Archive · ' + label;
}
```

Replace with:

```js
function startDailyGame(dateStr, opts) {
  dateStr = dateStr || todayStr();
  const replay = !!(opts && opts.replay);
  const stored = loadStorage();
  const existing = stored.byDate && stored.byDate[dateStr];
  // If you click today and you've already played, route through alreadyPlayed
  // (boot already does this, but archive-cell clicks reach here directly).
  if (existing && !replay && dateStr === todayStr()) {
    showAlreadyPlayed(stored);
    return;
  }
  game.playDate = dateStr;
  game.replay = replay;
  const template = pickTemplateForDate(dateStr);
  const instance = instantiateTemplate(template, dateStr);
  initGame(instance.template.block, instance.paletteIds, instance.rules);
  document.getElementById('intro').classList.remove('show');
  document.getElementById('alreadyPlayed').classList.remove('show');
  document.getElementById('completion').classList.remove('show');
  const isLive = dateStr === todayStr();
  const d = new Date(dateStr + 'T12:00:00Z');
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  document.getElementById('subbarDate').textContent = isLive ? label : 'Archive · ' + label;
}
```

- [ ] **Step 2: Verify "play today" via archive**

Reset storage, reload, open archive, click today's cell.

Expected: archive closes, puzzle is interactive, subbar shows today's date (no `Archive · ` prefix), `game.replay === false`. Solve — completion overlay shows. Storage: `byDate[<today>].source: 'live'`, `streak: 1`.

- [ ] **Step 3: Verify "play prior day, first time"**

Reset storage. The simplest test: temporarily set `LAUNCH_DATE` to `'2026-05-01'` in the script (and update the subtitle string in the archive overlay markup correspondingly) so there are some prior dates in-range. Reload, open archive, click May 2 (or any past available day).

Expected: archive closes, subbar reads `Archive · May 2, 2026`. Solve. Storage: `byDate['2026-05-02'].source: 'archive'`, `streak: 0` (unchanged), `totalPlayed: 1`.

Restore `LAUNCH_DATE` afterward.

(If you'd rather not temporarily edit the constant: write a record by hand into `byDate` for a fake past date via console, then test the cell click path on a different past date that's still uncompleted.)

- [ ] **Step 4: Verify "replay completed day"**

After Step 3, reload, open archive, click May 2 again (now ✓).

Expected: archive closes, plays as Archive · May 2, 2026. `game.replay === true`. Solve. Snapshot of `byDate['2026-05-02']` is unchanged (`completedAt` same, `source: 'archive'`). `totalPlayed` unchanged. `streak` unchanged.

- [ ] **Step 5: Verify close-archive routing one more time**

With storage as in Step 4, reload (alreadyPlayed shows because today might also be played — clear today's record if needed). Click Archive → opens. Click ✕ → returns to alreadyPlayed (today played) or intro (today not played).

- [ ] **Step 6: Commit Step 1's `startDailyGame` change**

```bash
git add sampler.html
git commit -m "Gate startDailyGame on already-played day and wire archive routing"
```

If you found any verification-time bugs and patched them, include those fixes in the same commit.

---

### Task 17: Final QA walkthrough

- [ ] **Step 1: Full happy path**

Reset storage. Reload `http://localhost:8000/sampler.html`.

1. Intro shows with Begin + Archive layout.
2. Click Begin → today's puzzle loads.
3. Paint fabrics to solve. Rules panel turns all green. Reveal animation. Completion overlay shows `You solved a {Day} Nine-Patch in {time}.`, streak pill, 4 stats, share block with 3×3 grid + Copy.
4. Click Copy → button reads "Copied!". Paste into a notes app — matches the format in the spec.
5. Close → block locked.
6. Reload → alreadyPlayed shows with stats.
7. Click Archive → calendar opens. Today shows ring + ✓.
8. Close archive → returns to alreadyPlayed.

- [ ] **Step 2: Archive-play stats**

(If your LAUNCH_DATE is in the past such that there are completable archive days available.) Open archive, click any uncompleted past cell. Subbar reads `Archive · ...`. Solve. Completion: streak unchanged from before. Storage: `totalPlayed` incremented, `totalSolved` incremented, that date's `source: 'archive'`.

- [ ] **Step 3: Replay sanity**

Open archive, click a completed (✓) day. Solve again. Storage `completedAt` and `source` for that date unchanged. `totalPlayed` unchanged.

- [ ] **Step 4: Mobile viewport**

In DevTools, switch to iPhone 12 viewport. Reset storage, reload. Confirm:
- Intro fits without scroll; Begin and Archive button row both visible.
- Nine-Patch block fills the width comfortably (~340px).
- Palette wraps to second row if necessary; swatches remain tappable.
- Rules panel readable.
- Archive grid fits without horizontal scroll; week headers don't wrap.

- [ ] **Step 5: Cross-template uniqueness check**

In console:

```js
verifyTemplate('nine-patch-greek-cross-v1');
verifyTemplate('nine-patch-diagonal-v1');
verifyTemplate('nine-patch-warm-cool-v1');
```

Expected: each prints `30 unique / 0 none / 0 multiple` (or close — at minimum 0 `multiple`).

- [ ] **Step 6: Final commit & log**

If any fix was needed during QA, commit with a short message. Otherwise no commit.

```bash
git status
git log --oneline -20
```

Expected: ~17 commits from this plan, clean working tree.

---

## Phase 2 milestone — done

`sampler.html` now ships as a complete tiny daily game with:
- One block (Nine-Patch), 3 templates rotating by date, paint-mode input, live rule feedback.
- Backtracking solver + `verifyTemplate` tool for authoring.
- NYT-shaped completion overlay with stats and share-text copy.
- Archive calendar that exactly mirrors Glossari's behavior (replay = no write; archive-first = totals but no streak).

The site index links to it alongside Glossari.

---

## Out of scope (per spec §11 future work, deferred to Phase 3+)

- Other block types (Rail Fence, Log Cabin, Churn Dash, Sawtooth Star, Dresden Plate)
- Sunday sampler quilt + cross-block / sashing rules
- Pattern-property and connectivity rule kinds (defined in spec §6 but not needed for Nine-Patch templates)
- Tutorial overlay (first-time player onboarding)
- Photographic / partnered fabric textures
- Mariner's Compass
- Stitching-along-seams reveal animation
- Cross-promo card to Glossari on completion screen (could be added in polish pass)
- Block portfolio view ("you've quilted N blocks")
