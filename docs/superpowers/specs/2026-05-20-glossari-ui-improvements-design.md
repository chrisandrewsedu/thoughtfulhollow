# Glossari UI Improvements Design

**Date:** 2026-05-20
**Status:** Approved

## Overview

Four targeted improvements to glossari.html: eliminate all vertical scrolling via viewport-height-aware CSS, fix tier button sizing and state indicators, update the instruction copy, and add an automated multi-viewport size checker script.

---

## 1. No-Scroll Viewport Sizing

**Goal:** The game always fits entirely within the browser viewport height. No overlay or game screen ever scrolls. Below ~500px the layout is at its minimum size and we accept that it may not be usable — that is the floor.

**Approach:** CSS-only (Option A). No JS scaling.

**Changes:**
- Switch `html, body { height: 100% }` to `height: 100dvh` to correctly account for mobile browser chrome (address bar).
- Set `overflow-y: hidden` (or `overflow: clip`) on `.overlay` — currently `auto`, which allows scroll to escape.
- Add four new `max-height` breakpoints on top of the existing 780px and 680px ones:

| Breakpoint | What compresses |
|---|---|
| `max-height: 840px` | Header/subbar padding, intro headword font size |
| `max-height: 720px` | Clue card `min-height`, tile padding, section label margins |
| `max-height: 620px` | Controls margin, intro rule font size, legend, go-rule margin |
| `max-height: 540px` | Absolute minimums — smallest legible sizes across all elements |

- The intro overlay is the most content-heavy screen and gets the most attention across breakpoints (dictionary headword, rule divider, rules list, legend, buttons).

---

## 2. Tier Buttons

**Goal:** All three buttons (Easy / Medium / Hard) are exactly equal width. State is communicated visually with no text sub-label.

**Changes:**

- **Equal width fix:** Change `.tier-btn` from `flex: 1 1 auto` to `flex: 1 1 0`. This makes all buttons start from zero intrinsic width and grow equally, so "Medium"'s longer text no longer pushes it wider.
- **Remove text state:** Remove `.tier-state` span from all three tier button groups (intro, practice picker, archive picker) and the JS that sets its text content.
- **Visual state indicators:** A small indicator element (0.45rem, centered) is added inside each button below the label:
  - **Unplayed:** no indicator — button is clean
  - **In-progress / Resume:** small hollow dot `◌` in `--gold`
  - **Completed:** small solid dot `●` in `--green`
- The JS that currently updates `.tier-state` text is updated to instead toggle a data attribute (`data-state="fresh|resume|done"`) on the button, and CSS handles the indicator display via `::after` or a child span.

---

## 3. Instructions Copy

**Goal:** Clearer rule #1, remove the redundant rule #3, and make legend symbols legible.

**Rule changes (intro overlay):**

| # | Before | After |
|---|---|---|
| 1 | "Each puzzle has four dictionary entries — clues like definitions, synonyms, antonyms, and examples." | "Each puzzle has four clues drawn from dictionary entries — definitions, synonyms, antonyms, and examples." |
| 2 | "Pick one clue card and three word segments in order to assemble the headword that entry describes." | Unchanged |
| 3 | "Right segments, wrong order? You'll be told — like Wordle's yellow." | **Cut** |
| 4 → 3 | "You have four mistakes per puzzle." | Renumbered to 3, unchanged |

**Legend symbols:**
- Symbols (❦ ¶ ≡ ≠) get an explicit `font-size: 1rem` — currently they inherit a size that renders them too small to distinguish.
- Label text (`.lbl`) bumped slightly from `0.62rem` to `0.68rem` for balance.

---

## 4. Automated Size Checker

**Goal:** A single command that checks glossari.html at 10 common viewport sizes, detects any overflow, and saves screenshots for visual review.

**File:** `scripts/check-sizes.js`

**Viewport sizes tested:**

| Label | Width × Height |
|---|---|
| iPhone SE | 375 × 667 |
| iPhone 14 | 390 × 844 |
| iPhone 14 Plus | 430 × 932 |
| Android mid | 360 × 780 |
| iPad portrait | 768 × 1024 |
| iPad landscape | 1024 × 768 |
| Laptop small | 1280 × 800 |
| Laptop short | 1280 × 600 |
| Desktop | 1440 × 900 |
| Wide | 1920 × 1080 |

**Behavior:**
- Opens `glossari.html` via `file://` absolute path — no local server required.
- For each size: resizes viewport, waits for load, checks `document.body.scrollHeight > document.body.clientHeight` and also checks `.overlay.show` scroll height if an overlay is visible.
- Takes a screenshot saved to `scripts/size-check-output/<width>x<height>.png`.
- Prints a pass/fail table to stdout on completion.

**Dependencies:** Uses Playwright Node API (`npm install -D playwright` + `npx playwright install chromium` if not present).

**Usage:** `node scripts/check-sizes.js`

---

## Out of Scope

- No changes to game logic, puzzle data, or scoring.
- No changes to the archive, tutorial, or already-played overlays beyond what the sizing breakpoints naturally fix.
- The size checker does not run in CI — it is a local dev tool.
