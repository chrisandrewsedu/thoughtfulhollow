# Glossari UI Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all vertical scrolling via new CSS breakpoints, fix tier button sizing and state indicators, update instruction copy, and add a Playwright size-checker script.

**Architecture:** All CSS and JS lives in the single file `glossari.html`. Tasks touch that file directly plus a new `scripts/check-sizes.js`. No build step — changes are visible immediately by opening the file in a browser.

**Tech Stack:** Vanilla HTML/CSS/JS, Playwright (Node.js) for the size-checker script.

---

## Files

- Modify: `glossari.html` (CSS section lines ~22–810, HTML section lines ~883–1000, JS section lines ~1545–1572 and ~1500–1508)
- Create: `scripts/check-sizes.js`
- Create: `package.json` (needed for Playwright)

---

### Task 1: Write the size-checker script

**Files:**
- Create: `package.json`
- Create: `scripts/check-sizes.js`

This is the verification tool used after every subsequent task. Build it first so it can catch regressions immediately.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "thoughtfulhollow",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "check-sizes": "node scripts/check-sizes.js"
  }
}
```

- [ ] **Step 2: Install Playwright**

```bash
npm install -D playwright
npx playwright install chromium
```

Expected: chromium browser downloaded, no errors.

- [ ] **Step 3: Create scripts/check-sizes.js**

```js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SIZES = [
  { label: 'iPhone SE',      w: 375,  h: 667  },
  { label: 'iPhone 14',      w: 390,  h: 844  },
  { label: 'iPhone 14 Plus', w: 430,  h: 932  },
  { label: 'Android mid',    w: 360,  h: 780  },
  { label: 'iPad portrait',  w: 768,  h: 1024 },
  { label: 'iPad landscape', w: 1024, h: 768  },
  { label: 'Laptop small',   w: 1280, h: 800  },
  { label: 'Laptop short',   w: 1280, h: 600  },
  { label: 'Desktop',        w: 1440, h: 900  },
  { label: 'Wide',           w: 1920, h: 1080 },
];

const FILE = path.resolve(__dirname, '..', 'glossari.html');
const OUT  = path.resolve(__dirname, 'size-check-output');

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const results = [];

  for (const { label, w, h } of SIZES) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`file://${FILE}`);
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(() => {
      const body = document.body;
      const bodyOverflows = body.scrollHeight > body.clientHeight;
      const overlay = document.querySelector('.overlay.show');
      const overlayOverflows = overlay
        ? overlay.scrollHeight > overlay.clientHeight
        : false;
      return { body: bodyOverflows, overlay: overlayOverflows };
    });

    const pass = !overflow.body && !overflow.overlay;
    const screenshotPath = path.join(OUT, `${w}x${h}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    results.push({ label, w, h, pass, overflow });
    await page.close();
  }

  await browser.close();

  console.log('\n── Glossari Size Check ─────────────────────────────');
  for (const { label, w, h, pass, overflow } of results) {
    const icon = pass ? '✓' : '✗';
    const detail = pass
      ? ''
      : ` (body:${overflow.body} overlay:${overflow.overlay})`;
    console.log(`  ${icon} ${label.padEnd(16)} ${String(w).padStart(4)}×${h}${detail}`);
  }
  const allPass = results.every(r => r.pass);
  console.log(
    `\n  ${allPass
      ? 'All sizes pass.'
      : 'Some sizes FAILED — check scripts/size-check-output/ for screenshots'}`
  );
  process.exit(allPass ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 4: Run the script (baseline — expect failures)**

```bash
node scripts/check-sizes.js
```

Expected: script runs, prints a table, some sizes likely show ✗. Screenshots appear in `scripts/size-check-output/`. This is the baseline before any CSS fixes.

- [ ] **Step 5: Add size-check output dir to .gitignore**

Open `.gitignore` and add this line at the end:
```
scripts/size-check-output/
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json scripts/check-sizes.js .gitignore
git commit -m "Add Playwright size-checker script (check-sizes.js)"
```

---

### Task 2: No-scroll viewport sizing

**Files:**
- Modify: `glossari.html` (CSS only — lines ~58–68, ~369–371, ~770–781)

- [ ] **Step 1: Switch html/body to 100dvh**

In the `html, body { ... }` block (around line 58), change:
```css
  height: 100%;
```
to:
```css
  height: 100dvh;
```

The `.app` block below it has its own `height: 100%` — leave that alone, it inherits correctly from the parent.

- [ ] **Step 2: Set overlays to overflow hidden, restore for reveal and archive**

Find the `.overlay { ... }` block (around line 364). Change `overflow-y: auto` to `overflow-y: hidden`:

```css
.overlay {
  position: absolute; inset: 0;
  background: var(--paper);
  display: none; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 1.6rem 1.3rem;
  z-index: 10; text-align: center; overflow-y: hidden;
}
```

Then immediately after the existing `#archive { ... }` block (around line 374), add overrides to keep the reveal and archive screens scrollable since they contain more content than can fit on any screen:

```css
#reveal  { overflow-y: auto; }
#archive { overflow-y: auto; }
```

- [ ] **Step 3: Add four new max-height breakpoints**

Find the existing `@media (max-height: 780px)` block (around line 770). Insert the following four new blocks **before** it:

```css
@media (max-height: 840px) {
  .header { padding: 0.65rem 1rem 0.5rem; }
  .dict-headword-large { font-size: clamp(1.9rem, 5.5vw, 2.8rem); }
  .go-rule { margin: 0.6rem auto 0.85rem; }
  .intro-rules { margin-bottom: 0.7rem; }
  .legend { margin-bottom: 0.8rem; }
}
@media (max-height: 720px) {
  .header { padding: 0.45rem 1rem 0.4rem; }
  .dict-headword-large { font-size: clamp(1.6rem, 4.5vw, 2.2rem); }
  .dict-pron { margin-bottom: 0.2rem; }
  .go-rule { margin: 0.45rem auto 0.6rem; }
  .intro-rules { font-size: 0.8rem; margin-bottom: 0.5rem; }
  .legend { margin-bottom: 0.5rem; font-size: 0.66rem; }
  .tier-buttons { margin-bottom: 0.35rem; }
  .controls { margin-top: 0.5rem; }
  .main { padding: 0.25rem 1rem 0; }
  .section-label { margin: 0.35rem 0 0.3rem; }
}
@media (max-height: 620px) {
  .header { padding: 0.35rem 1rem 0.3rem; }
  .title { font-size: 1.25rem; }
  .dict-headword-large { font-size: clamp(1.35rem, 4vw, 1.8rem); }
  .go-rule { margin: 0.3rem auto 0.4rem; }
  .intro-rules { font-size: 0.74rem; line-height: 1.5; margin-bottom: 0.35rem; }
  .legend { gap: 0.12rem 0.5rem; margin-bottom: 0.3rem; }
  .controls { margin-top: 0.35rem; }
  .main { padding: 0.15rem 1rem 0; }
}
@media (max-height: 540px) {
  .header { padding: 0.25rem 1rem 0.22rem; }
  .title { font-size: 1.1rem; }
  .subbar { padding: 0.1rem 1rem 0.12rem; }
  .dict-headword-large { font-size: 1.2rem; }
  .go-rule { margin: 0.2rem auto 0.3rem; }
  .intro-rules { font-size: 0.68rem; line-height: 1.38; margin-bottom: 0.2rem; }
  .legend { gap: 0.1rem 0.35rem; margin-bottom: 0.22rem; font-size: 0.58rem; }
  .tier-buttons { gap: 0.3rem; margin-bottom: 0.22rem; }
  .btn { padding: 0.5rem 1.2rem; font-size: 0.78rem; }
  .intro-actions-row { margin-top: 0.3rem; }
  .btn-secondary { padding: 0.32rem 0.7rem; font-size: 0.74rem; }
  .controls { margin-top: 0.25rem; }
  .main { padding: 0.1rem 1rem 0; }
}
```

- [ ] **Step 4: Open glossari.html in a browser and resize the window**

Drag the window shorter. Verify:
- The intro screen shrinks gracefully without scrolling at any height above ~500px.
- The game screen shrinks without scrolling.
- The reveal and archive screens still scroll (they're expected to — they have too much content to fit on screen).

- [ ] **Step 5: Run the size checker**

```bash
node scripts/check-sizes.js
```

Expected: all intro/game sizes pass. The reveal overlay check may still flag — that's acceptable since it's intentionally scrollable.

- [ ] **Step 6: Commit**

```bash
git add glossari.html
git commit -m "Fix no-scroll sizing: 100dvh + 4 new max-height breakpoints"
```

---

### Task 3: Tier button equal sizing and visual state indicators

**Files:**
- Modify: `glossari.html` (CSS lines ~544–556, HTML lines ~903–907 and ~966–970 and ~997–1001, JS lines ~1500–1507 and ~1547–1571)

- [ ] **Step 1: Fix .tier-btn CSS — equal width and remove .tier-state**

Find the `.tier-btn` rule (around line 548). Change:
```css
.tier-btn { min-width: 5.5rem; flex: 1 1 auto; max-width: 8rem; }
```
to:
```css
.tier-btn { min-width: 5.5rem; flex: 1 1 0; max-width: 8rem; }
```

Find the `.tier-btn .tier-state { ... }` block (lines ~552–557) and **delete it entirely**:
```css
.tier-btn .tier-state {
  display: block;
  font-family: 'Lora', serif; font-style: italic; font-weight: 400;
  font-size: 0.55rem; letter-spacing: 0.06em; text-transform: lowercase;
  color: var(--ink-faint); margin-top: 0.15rem;
}
```

In its place, add the visual indicator styles:
```css
.tier-btn .tier-indicator {
  display: block;
  height: 0.65rem;
  font-size: 0.5rem;
  line-height: 1;
  margin-top: 0.12rem;
  color: transparent;
}
.tier-btn[data-state="done"]   .tier-indicator { color: var(--green); }
.tier-btn[data-state="resume"] .tier-indicator { color: var(--gold); }
```

- [ ] **Step 2: Update tier button HTML — intro overlay**

Find the three intro tier buttons (around lines 903–906):
```html
        <button class="btn tier-btn" data-tier="easy"   onclick="startGame('easy')">Easy</button>
        <button class="btn tier-btn" data-tier="medium" onclick="startGame('medium')">Medium</button>
        <button class="btn tier-btn" data-tier="hard"   onclick="startGame('hard')">Hard</button>
```

Replace with:
```html
        <button class="btn tier-btn" data-tier="easy"   data-state="fresh" onclick="startGame('easy')">Easy<span class="tier-indicator" aria-hidden="true"></span></button>
        <button class="btn tier-btn" data-tier="medium" data-state="fresh" onclick="startGame('medium')">Medium<span class="tier-indicator" aria-hidden="true"></span></button>
        <button class="btn tier-btn" data-tier="hard"   data-state="fresh" onclick="startGame('hard')">Hard<span class="tier-indicator" aria-hidden="true"></span></button>
```

- [ ] **Step 3: Update tier button HTML — practice picker**

Find the practice picker tier buttons (around lines 966–969):
```html
      <button class="btn tier-btn" data-tier="easy"   onclick="startPracticeGame('easy')">Easy</button>
      <button class="btn tier-btn" data-tier="medium" onclick="startPracticeGame('medium')">Medium</button>
      <button class="btn tier-btn" data-tier="hard"   onclick="startPracticeGame('hard')">Hard</button>
```

Replace with:
```html
      <button class="btn tier-btn" data-tier="easy"   data-state="fresh" onclick="startPracticeGame('easy')">Easy<span class="tier-indicator" aria-hidden="true"></span></button>
      <button class="btn tier-btn" data-tier="medium" data-state="fresh" onclick="startPracticeGame('medium')">Medium<span class="tier-indicator" aria-hidden="true"></span></button>
      <button class="btn tier-btn" data-tier="hard"   data-state="fresh" onclick="startPracticeGame('hard')">Hard<span class="tier-indicator" aria-hidden="true"></span></button>
```

- [ ] **Step 4: Update tier button HTML — archive picker**

Find the archive picker tier buttons (around lines 997–1000):
```html
          <button class="btn tier-btn" data-tier="easy"   onclick="archiveTierPick('easy')">Easy</button>
          <button class="btn tier-btn" data-tier="medium" onclick="archiveTierPick('medium')">Medium</button>
```
(and the hard button on the next line). Replace all three with:
```html
          <button class="btn tier-btn" data-tier="easy"   data-state="fresh" onclick="archiveTierPick('easy')">Easy<span class="tier-indicator" aria-hidden="true"></span></button>
          <button class="btn tier-btn" data-tier="medium" data-state="fresh" onclick="archiveTierPick('medium')">Medium<span class="tier-indicator" aria-hidden="true"></span></button>
          <button class="btn tier-btn" data-tier="hard"   data-state="fresh" onclick="archiveTierPick('hard')">Hard<span class="tier-indicator" aria-hidden="true"></span></button>
```

- [ ] **Step 5: Update refreshIntroButtons() JS**

Find `refreshIntroButtons()` (around line 1547). Replace the entire function body with:

```js
function refreshIntroButtons() {
  const themeIdx = dailyIndex(todayStr());
  const today = todayStr();
  for (const tier of TIERS) {
    const btn = document.querySelector(`.tier-btn[data-tier="${tier}"]`);
    if (!btn) continue;
    const available = tierAvailable(themeIdx, tier);
    const tierState = getTierDayState(tier, today);
    const label = tier.charAt(0).toUpperCase() + tier.slice(1);
    let dataState = 'fresh';
    let indicator = '';
    if (!available) {
      btn.disabled = true;
    } else if (tierState && tierState.result) {
      btn.disabled = false;
      dataState = 'done';
      indicator = tierState.result.allSolved ? '●' : '◌';
    } else if (tierState && tierState.inProgress) {
      btn.disabled = false;
      dataState = 'resume';
      indicator = '◌';
    } else {
      btn.disabled = false;
    }
    btn.setAttribute('data-state', dataState);
    btn.innerHTML = `${label}<span class="tier-indicator" aria-hidden="true">${indicator}</span>`;
  }
}
```

- [ ] **Step 6: Update archiveCellClick() JS**

Find the `for (const tier of TIERS)` loop inside `archiveCellClick()` (around line 1500). Replace all five lines of the loop body:

Current code to replace (lines ~1503–1507):
```js
    const available = tierAvailable(themeIdx, tier);
    const tEntry = all.tiers[tier].byDate && all.tiers[tier].byDate[dateStr];
    const sub = !available ? 'unavailable' : (tEntry ? (tEntry.result.allSolved ? '✓ played' : '◊ played') : 'play');
    btn.disabled = !available;
    btn.innerHTML = `${tier.charAt(0).toUpperCase() + tier.slice(1)}<span class="tier-state">${sub}</span>`;
```

Replace with:
```js
    const available = tierAvailable(themeIdx, tier);
    const tEntry = all.tiers[tier].byDate && all.tiers[tier].byDate[dateStr];
    const dataState = !available ? 'fresh' : (tEntry ? 'done' : 'fresh');
    const indicator = tEntry ? (tEntry.result.allSolved ? '●' : '◌') : '';
    const label = tier.charAt(0).toUpperCase() + tier.slice(1);
    btn.disabled = !available;
    btn.setAttribute('data-state', dataState);
    btn.innerHTML = `${label}<span class="tier-indicator" aria-hidden="true">${indicator}</span>`;
```

- [ ] **Step 7: Verify in browser**

Open `glossari.html`. On the landing screen:
- All three buttons (Easy / Medium / Hard) should be identical width.
- No sub-label text visible (no "Begin", "Resume", "Complete").
- If you have a completed tier in localStorage, that button should show a small green ● below the label; an in-progress tier shows a gold ◌.

- [ ] **Step 8: Commit**

```bash
git add glossari.html
git commit -m "Fix tier buttons: equal width, visual-only state indicators"
```

---

### Task 4: Instructions copy and legend symbol sizing

**Files:**
- Modify: `glossari.html` (CSS lines ~526–533, HTML lines ~890–895)

- [ ] **Step 1: Update legend symbol and label CSS**

Find these two lines in the `.legend` block (around lines 532–533):
```css
.legend .sym { color: var(--accent); margin-right: 0.28rem; }
.legend .lbl { font-family: 'Lora', serif; font-style: italic; font-size: 0.62rem; letter-spacing: 0.14em; text-transform: uppercase; }
```

Replace with:
```css
.legend .sym { color: var(--accent); margin-right: 0.28rem; font-size: 1rem; }
.legend .lbl { font-family: 'Lora', serif; font-style: italic; font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; }
```

- [ ] **Step 2: Update intro rules HTML**

Find the four `.rules-row` divs (around lines 891–894):
```html
      <div class="rules-row"><span class="rules-num">1.</span><span>Each puzzle has four dictionary entries — clues like <b>definitions, synonyms, antonyms,</b> and <b>examples</b>.</span></div>
      <div class="rules-row"><span class="rules-num">2.</span><span>Pick <b>one clue card</b> and <b>three word segments in order</b> to assemble the headword that entry describes.</span></div>
      <div class="rules-row"><span class="rules-num">3.</span><span>Right segments, wrong order? <b>You'll be told</b> — like Wordle's yellow.</span></div>
      <div class="rules-row"><span class="rules-num">4.</span><span>You have <b>four mistakes</b> per puzzle.</span></div>
```

Replace with:
```html
      <div class="rules-row"><span class="rules-num">1.</span><span>Each puzzle has four clues drawn from dictionary entries — <b>definitions, synonyms, antonyms,</b> and <b>examples</b>.</span></div>
      <div class="rules-row"><span class="rules-num">2.</span><span>Pick <b>one clue card</b> and <b>three word segments in order</b> to assemble the headword that entry describes.</span></div>
      <div class="rules-row"><span class="rules-num">3.</span><span>You have <b>four mistakes</b> per puzzle.</span></div>
```

- [ ] **Step 3: Verify in browser**

Open `glossari.html`. On the landing screen:
- Legend symbols (❦ ¶ ≡ ≠) should be clearly legible at ~1rem.
- Only three numbered rules visible (the Wordle rule is gone).
- Rule 1 reads "Each puzzle has four clues drawn from dictionary entries…"

- [ ] **Step 4: Run the size checker one final time**

```bash
node scripts/check-sizes.js
```

Expected: all intro/game sizes pass. Screenshots are in `scripts/size-check-output/`.

- [ ] **Step 5: Commit**

```bash
git add glossari.html
git commit -m "Update instructions copy and enlarge legend symbols"
```
