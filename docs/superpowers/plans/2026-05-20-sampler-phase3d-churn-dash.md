# Sampler — Phase 3d Implementation Plan (Churn Dash / Thursday block + winter-forest palette)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Final repo location:** save this file as `docs/superpowers/plans/2026-05-20-sampler-phase3d-churn-dash.md` when execution begins.

## Context

Phases 3a (Rail Fence + foundational refactors) and 3b/3c (multi-solution UX + Log Cabin) have shipped. The engine supports:

- `slotPath(i)` returning `rect | polygon | path` geometry — Churn Dash is the **first real consumer of `{type:'polygon'}`** (the renderer's polygon branch existed since 3a but no shipped block used it).
- `solutionTarget: { min, max }` + multi-solution rule kinds (`all-same`, `all-different`, `alternating`) — Thu targets `{4, 6}` per the calibration table in the design notes.
- Weekday-pool template selection: `pickTemplateForDate` filters by `BLOCKS[t.block].dayOfWeek === weekday`. Setting `dayOfWeek: 4` on the new block + shipping templates that reference `block: 'churn-dash'` is enough for Thursdays to route automatically.
- Decorative rules (`decorative: true`) — used by all three Phase 3d templates to surface Churn Dash's symmetry properties without constraining the solver.

**This plan is Phase 3d:** add the **Thursday block (Churn Dash)** plus a **second palette family (winter-forest)** plus **three multi-solution templates**. No engine refactors — purely content authoring on top of the foundations already in place. The plan ships:

1. `winter-forest` palette with 7 new fabrics (gets the slipping palette-growth commitment back on track; Mon–Wed all shipped on heritage-warm and the week was getting visually monotonous).
2. A new entry in `BLOCKS` (`'churn-dash'`) implementing the full block interface, including 17 slots (9 rects + 8 polygons), X-bowtie HST geometry, and full V+H+diagonal reflection symmetry plus 180° rotational symmetry.
3. Three Churn Dash templates, each landing exactly at 6 solutions per date.
4. End-to-end verification that 2026-05-21 (the first Thursday after launch) now serves a Churn Dash puzzle.

**Goal:** Sampler now has four playable weekdays (Mon Nine-Patch, Tue Rail Fence, Wed Log Cabin, Thu Churn Dash). Foundations stay stable; this phase is "extend the cookbook" — one new palette + one new block + three new templates.

**Architecture:** Single static file `sampler.html`. Vanilla HTML/CSS/JS, no build step. Changes are additive — one new palette family, one new block, three new templates. The renderer, solver, storage, and UI need zero changes.

**Spec:** `docs/superpowers/specs/2026-05-18-sampler-design.md`
**Running notes:** `docs/superpowers/notes/sampler-design-notes.md` (UPDATE at end per cross-task verification)
**Prior phase plan (style reference):** `docs/superpowers/plans/2026-05-19-sampler-phase3c-log-cabin.md`
**Throwaway preview:** `sketches/churn-dash-preview.html` (gitignored) — open in a browser to visualize the 17-slot geometry and named-slot groups.

---

## Testing approach (read first)

Same as prior phases: no test framework, no build. Each task ends with **manual browser verification** at `http://localhost:8000/sampler.html`.

```bash
python3 -m http.server 8000
```

Open DevTools → Application → Local Storage to inspect `sampler_daily_v2`. Use `localStorage.clear()` between tasks if needed. Open DevTools Console for `verifyTemplate(...)` and ad-hoc inspection.

**Commit after each verified task.** Each task is a clean atomic commit on `claude/compassionate-mccarthy-96496d` (the current branch).

---

## Design — Churn Dash geometry

**Cell layout: 3×3 in a 200×200 viewBox** with `PAD = 8`, `CELL = 60`, `GAP = 2` (total: 8 + 60 + 2 + 60 + 2 + 60 + 8 = 200). The existing `.slot` stroke (1.5px, `--ink-soft`) draws the seams between sub-slots within a cell — no inter-slot gaps inside a cell. Outer triangles only have neighbors via their HST diagonal seam (their other two sides are on the block boundary).

**17 slots, indexed by structural group**:

| # | Slot | Type | Geometry |
|---|------|------|----------|
| 0  | C (center)       | rect    | x=70, y=70, w=60, h=60 |
| 1  | N handle         | rect    | x=70, y=38, w=60, h=30 |
| 2  | E handle         | rect    | x=132, y=70, w=30, h=60 |
| 3  | S handle         | rect    | x=70, y=132, w=60, h=30 |
| 4  | W handle         | rect    | x=38, y=70, w=30, h=60 |
| 5  | N bg             | rect    | x=70, y=8, w=60, h=30 |
| 6  | E bg             | rect    | x=162, y=70, w=30, h=60 |
| 7  | S bg             | rect    | x=70, y=162, w=60, h=30 |
| 8  | W bg             | rect    | x=8, y=70, w=30, h=60 |
| 9  | TL inner △       | polygon | (68,8) (68,68) (8,68) |
| 10 | TR inner △       | polygon | (132,8) (132,68) (192,68) |
| 11 | BR inner △       | polygon | (132,132) (192,132) (132,192) |
| 12 | BL inner △       | polygon | (8,132) (68,132) (68,192) |
| 13 | TL outer △       | polygon | (8,8) (68,8) (8,68) |
| 14 | TR outer △       | polygon | (132,8) (192,8) (192,68) |
| 15 | BR outer △       | polygon | (192,132) (192,192) (132,192) |
| 16 | BL outer △       | polygon | (8,132) (8,192) (68,192) |

**X-bowtie chirality** (chosen over pinwheel — see design notes):

- TL cell has `/` diagonal (BL → TR): outer triangle (13) in upper-left, inner triangle (9) in lower-right.
- TR cell has `\` diagonal (TL → BR): outer (14) in upper-right, inner (10) in lower-left.
- BR cell has `/` diagonal (BL → TR): outer (15) in lower-right, inner (11) in upper-left.
- BL cell has `\` diagonal (TL → BR): outer (16) in lower-left, inner (12) in upper-right.

The 4 inner triangles point toward the center; the 4 outer triangles tuck into block corners. The whole "Churn Dash" motif is the 4 handles + 4 inner triangles (the `dash` group below); the rest is background field.

**Edge-adjacency (neighbors) table** — two slots are neighbors iff they share a cell-edge segment (the 2-unit GAP is treated as adjacency since cells align):

| Slot | Neighbors | Slot | Neighbors |
|------|-----------|------|-----------|
| 0 (C)        | 1, 2, 3, 4         | 9  (TL inner △) | 1, 4, 5, 8, 13 |
| 1 (N handle) | 0, 5, 9, 10        | 10 (TR inner △) | 1, 2, 5, 6, 14 |
| 2 (E handle) | 0, 6, 10, 11       | 11 (BR inner △) | 2, 3, 6, 7, 15 |
| 3 (S handle) | 0, 7, 11, 12       | 12 (BL inner △) | 3, 4, 7, 8, 16 |
| 4 (W handle) | 0, 8, 9, 12        | 13 (TL outer △) | 9 |
| 5 (N bg)     | 1, 9, 10           | 14 (TR outer △) | 10 |
| 6 (E bg)     | 2, 10, 11          | 15 (BR outer △) | 11 |
| 7 (S bg)     | 3, 11, 12          | 16 (BL outer △) | 12 |
| 8 (W bg)     | 4, 9, 12           |                 |    |

**Symmetry pairs** — X-bowtie has full reflection symmetry on all three classical axes:

- `vertical`: `[[2,4],[6,8],[9,10],[11,12],[13,14],[15,16]]` (center column 0,1,3,5,7 self-maps)
- `horizontal`: `[[1,3],[5,7],[9,12],[10,11],[13,16],[14,15]]`
- `diagonal`: `[[1,4],[2,3],[5,8],[6,7],[10,12],[14,16]]` (corners 0,9,11,13,15 self-map)

**Rotational symmetry — order 2 only** (X-bowtie isn't pinwheel, so order 4 returns `[]`):

- `rotationalSymmetryGroups(2)`: `[[1,3],[2,4],[5,7],[6,8],[9,11],[10,12],[13,15],[14,16]]`

**`ring(i)`** — Churn Dash has no concentric rings. Returns `undefined` (like Rail Fence).

**Named slots:**

| Name | Slots | Visual meaning |
|------|-------|---------------|
| `center` | 0 | the middle square |
| `handles` | [1, 2, 3, 4] | the 4 inner edge bars ("churn dash handles") |
| `bgs` | [5, 6, 7, 8] | the 4 outer edge bars (background behind handles) |
| `innerTriangles` | [9, 10, 11, 12] | inner-corner triangles (the X pointing in) |
| `outerTriangles` | [13, 14, 15, 16] | outer-corner triangles (in block corners) |
| `allTriangles` | [9..16] | both inner and outer triangle groups |
| `allEdges` | [1..8] | all 8 edge rects (handles + bgs) |
| `dash` | [1, 2, 3, 4, 9, 10, 11, 12] | the visible Churn Dash motif (handles + inner △; no center) |
| `field` | [0, 5, 6, 7, 8, 13, 14, 15, 16] | center + bgs + outer △ — the background field |
| `frame` | [5, 6, 7, 8, 13, 14, 15, 16] | field minus center (for templates that pin center separately) |
| `cross` | [0, 1, 2, 3, 4] | center + handles — the "+" shape (for non-canonical templates) |
| `foreground` | [0, 1, 2, 3, 4, 9, 10, 11, 12] | cross + inner △ (for "center matches the X" templates) |
| `northSide` | [1, 5, 9, 10, 13, 14] | everything in the top row of cells |
| `southSide` | [3, 7, 11, 12, 15, 16] | everything in the bottom row |
| `eastSide` | [2, 6, 10, 11, 14, 15] | everything in the right column |
| `westSide` | [4, 8, 9, 12, 13, 16] | everything in the left column |

`dash` and `field` are the canonical Churn Dash quilter terms — the visible motif vs. the background field. They're the workhorses for Templates A and C below. `foreground` / `cross` are kept for non-canonical templates that want the center to read with the X.

---

## Tasks

### T1: Add `winter-forest` palette (7 new fabrics)

**Files:** `sampler.html`

The new palette mirrors heritage-warm's shape (1 light, 2 mediums, 3 darks, balanced across warm/cool/neutral) but leans cool/dark. The 7th fabric (`F_OAT`) gives a second warm-light option so templates can choose between two lights without pinning a specific ID.

| ID | Name | Hex | Motif | Scale | Hue | Value |
|----|------|-----|-------|-------|-----|-------|
| `F_SNOW`     | Snow Linen     | `#f4f3ed` | solid  | large  | neutral | light  |
| `F_OAT`      | Oat Dot        | `#d8c8a8` | dot    | small  | warm    | light  |
| `F_SLATE`    | Slate Wash     | `#5a6a78` | solid  | large  | cool    | medium |
| `F_RUST`     | Rust Floral    | `#a05030` | floral | small  | warm    | medium |
| `F_PINE`     | Pine Vine      | `#1c3a28` | vine   | medium | cool    | dark   |
| `F_CHARCOAL` | Charcoal Dot   | `#2a2a2a` | dot    | small  | neutral | dark   |
| `F_OXBLOOD`  | Oxblood Solid  | `#5a1a1c` | solid  | large  | warm    | dark   |

All have `direction: null` (no stripes yet — direction-aware fabrics remain a Rail-Fence-only thing for now).

- [ ] **Step 1. Append to `FABRICS`** (after `F_WALNUT`, ~[sampler.html:780](sampler.html:780)):

  ```js
  // ─── winter-forest palette (Phase 3d) ───
  // Mirrors heritage-warm's distribution (1 light / 2 mediums / 3 darks)
  // but leans cool/dark. F_OAT gives a second warm-light option so the
  // 4-6 solution targets land cleanly on Thursday templates.
  F_SNOW:     { id: 'F_SNOW',     name: 'Snow Linen',      hex: '#f4f3ed',
                motif: 'solid',  scale: 'large',  hue: 'neutral', value: 'light',  direction: null },
  F_OAT:      { id: 'F_OAT',      name: 'Oat Dot',         hex: '#d8c8a8',
                motif: 'dot',    scale: 'small',  hue: 'warm',    value: 'light',  direction: null },
  F_SLATE:    { id: 'F_SLATE',    name: 'Slate Wash',      hex: '#5a6a78',
                motif: 'solid',  scale: 'large',  hue: 'cool',    value: 'medium', direction: null },
  F_RUST:     { id: 'F_RUST',     name: 'Rust Floral',     hex: '#a05030',
                motif: 'floral', scale: 'small',  hue: 'warm',    value: 'medium', direction: null },
  F_PINE:     { id: 'F_PINE',     name: 'Pine Vine',       hex: '#1c3a28',
                motif: 'vine',   scale: 'medium', hue: 'cool',    value: 'dark',   direction: null },
  F_CHARCOAL: { id: 'F_CHARCOAL', name: 'Charcoal Dot',    hex: '#2a2a2a',
                motif: 'dot',    scale: 'small',  hue: 'neutral', value: 'dark',   direction: null },
  F_OXBLOOD:  { id: 'F_OXBLOOD',  name: 'Oxblood Solid',   hex: '#5a1a1c',
                motif: 'solid',  scale: 'large',  hue: 'warm',    value: 'dark',   direction: null },
  ```

- [ ] **Step 2. Append to `PALETTES`** (~[sampler.html:785](sampler.html:785)):

  ```js
  'winter-forest':  ['F_SNOW', 'F_OAT', 'F_SLATE', 'F_RUST', 'F_PINE', 'F_CHARCOAL', 'F_OXBLOOD'],
  ```

- [ ] **Step 3. Append `<pattern>` definitions to `FABRIC_SVG`** (inside the `<defs>` block before `</defs>`, ~[sampler.html:824](sampler.html:824)). Each pattern mirrors the construction style of its heritage-warm analog (linen → cream, dot → weld, floral → madder, vine → forest, solid → walnut), retuned for cool/dark mood:

  ```html
      <pattern id="F_SNOW" patternUnits="userSpaceOnUse" width="20" height="20">
        <rect width="20" height="20" fill="#f4f3ed"/>
        <circle cx="3" cy="3" r="0.6" fill="#dad6c8" opacity="0.6"/>
        <circle cx="14" cy="11" r="0.5" fill="#dad6c8" opacity="0.5"/>
      </pattern>
      <pattern id="F_OAT" patternUnits="userSpaceOnUse" width="14" height="14">
        <rect width="14" height="14" fill="#d8c8a8"/>
        <circle cx="3.5" cy="3.5" r="1.2" fill="#a89060" opacity="0.45"/>
        <circle cx="10.5" cy="10.5" r="1.2" fill="#a89060" opacity="0.45"/>
      </pattern>
      <pattern id="F_SLATE" patternUnits="userSpaceOnUse" width="20" height="20">
        <rect width="20" height="20" fill="#5a6a78"/>
        <rect width="20" height="0.6" y="4" fill="#9aaab8" opacity="0.4"/>
        <rect width="20" height="0.6" y="14" fill="#9aaab8" opacity="0.4"/>
      </pattern>
      <pattern id="F_RUST" patternUnits="userSpaceOnUse" width="22" height="22">
        <rect width="22" height="22" fill="#a05030"/>
        <circle cx="11" cy="11" r="3.5" fill="none" stroke="#f4e8d8" stroke-width="0.9" opacity="0.85"/>
        <circle cx="11" cy="11" r="1.2" fill="#f4e8d8" opacity="0.8"/>
        <circle cx="2" cy="2" r="0.7" fill="#f4e8d8" opacity="0.6"/>
        <circle cx="20" cy="20" r="0.7" fill="#f4e8d8" opacity="0.6"/>
      </pattern>
      <pattern id="F_PINE" patternUnits="userSpaceOnUse" width="20" height="20">
        <rect width="20" height="20" fill="#1c3a28"/>
        <path d="M2 10 Q 6 4 10 10 T 18 10" stroke="#9ab490" stroke-width="0.9" fill="none" opacity="0.7"/>
        <circle cx="6" cy="7" r="0.6" fill="#9ab490" opacity="0.75"/>
        <circle cx="14" cy="13" r="0.6" fill="#9ab490" opacity="0.75"/>
      </pattern>
      <pattern id="F_CHARCOAL" patternUnits="userSpaceOnUse" width="14" height="14">
        <rect width="14" height="14" fill="#2a2a2a"/>
        <circle cx="3.5" cy="3.5" r="1.4" fill="#6a6a6a" opacity="0.55"/>
        <circle cx="10.5" cy="10.5" r="1.4" fill="#6a6a6a" opacity="0.55"/>
      </pattern>
      <pattern id="F_OXBLOOD" patternUnits="userSpaceOnUse" width="20" height="20">
        <rect width="20" height="20" fill="#5a1a1c"/>
        <rect x="0" y="0" width="20" height="20" fill="#3a0a0c" opacity="0.18"/>
      </pattern>
  ```

- [ ] **Step 4. Verify in DevTools console** (no templates use these fabrics yet — this is sanity-only):

  ```js
  Object.keys(FABRICS).length             // 13 (was 6, added 7)
  FABRICS.F_SNOW.value                    // 'light'
  FABRICS.F_RUST.hue                      // 'warm'
  PALETTES['winter-forest'].length        // 7
  PALETTES['winter-forest'][0]            // 'F_SNOW'
  // Eyeball a swatch:
  document.querySelector('pattern#F_RUST') // <pattern> element exists
  ```

- [ ] **Step 5. Smoke-test the patterns** by temporarily rendering a swatch grid. From the console:

  ```js
  // Render 7 swatches in a row inside the existing block host. Don't commit this.
  const host = document.getElementById('blockHost');
  const ids = PALETTES['winter-forest'];
  host.innerHTML = `<svg viewBox="0 0 ${ids.length*40} 40" class="block-svg">${
    ids.map((id, i) => `<rect x="${i*40}" y="0" width="40" height="40" fill="url(#${id})" stroke="#6a5d44" stroke-width="1.5"/>`).join('')
  }</svg>`;
  ```

  Visual check: 7 swatches in order SNOW, OAT, SLATE, RUST, PINE, CHARCOAL, OXBLOOD. Each pattern tiles cleanly (no seams visible inside a swatch). The motifs read as: SNOW = pale linen with faint flecks; OAT = warm tan with two darker dots; SLATE = blue-grey with thin horizontal stripes; RUST = warm red-brown with floral medallions; PINE = dark green with vine wave; CHARCOAL = near-black with grey dots; OXBLOOD = dark red with subtle darkening overlay. Reload to restore the actual puzzle.

- [ ] **Step 6. Commit.** Message: `Add winter-forest palette (7 fabrics; second palette family alongside heritage-warm)`

---

### T2: Add `churn-dash` to `BLOCKS`

**Files:** `sampler.html`

- [ ] **Step 1.** In `BLOCKS` (after `log-cabin`, ~[sampler.html:1090](sampler.html:1090) — find the closing `},` of the log-cabin entry and append before the `};` that ends the `BLOCKS` const):

  ```js
  'churn-dash': {
    id: 'churn-dash',
    displayName: 'Churn Dash',
    slotCount: 17,
    dayOfWeek: 4, // Thursday (0=Sun..6=Sat)
    // Churn Dash: 3×3 cell layout (PAD=8, CELL=60, GAP=2 in 200×200
    // viewBox). 4 corner HSTs with X-bowtie diagonals (inner triangles
    // point toward the center, outer triangles tuck into block corners).
    // 4 edge cells each split into two parallel rectangles ("handle"
    // closer to center, "bg" against the block edge). 1 center square.
    // Total 17 slots.
    //
    // X-bowtie has full V+H+diagonal reflection symmetry plus 180°
    // rotational symmetry. Rotational order 4 is NOT available — that
    // would be a pinwheel block, not a Churn Dash.
    //
    // Slot indices, by structural group:
    //   0:     C (center)
    //   1-4:   handles — N, E, S, W (clockwise from top)
    //   5-8:   bgs     — N, E, S, W
    //   9-12:  inner triangles — TL, TR, BR, BL (clockwise from TL)
    //   13-16: outer triangles — TL, TR, BR, BL
    //
    // First real consumer of `{type:'polygon'}` from the slotPath
    // contract (the renderer's polygon branch has existed since Phase 3a
    // but no shipped block used it before now).
    slotPath(i) {
      const SLOTS = [
        { type: 'rect',    x: 70,  y: 70,  w: 60, h: 60 },                    // 0  C
        { type: 'rect',    x: 70,  y: 38,  w: 60, h: 30 },                    // 1  N handle
        { type: 'rect',    x: 132, y: 70,  w: 30, h: 60 },                    // 2  E handle
        { type: 'rect',    x: 70,  y: 132, w: 60, h: 30 },                    // 3  S handle
        { type: 'rect',    x: 38,  y: 70,  w: 30, h: 60 },                    // 4  W handle
        { type: 'rect',    x: 70,  y: 8,   w: 60, h: 30 },                    // 5  N bg
        { type: 'rect',    x: 162, y: 70,  w: 30, h: 60 },                    // 6  E bg
        { type: 'rect',    x: 70,  y: 162, w: 60, h: 30 },                    // 7  S bg
        { type: 'rect',    x: 8,   y: 70,  w: 30, h: 60 },                    // 8  W bg
        { type: 'polygon', points: [[68,8],   [68,68],  [8,68]]    },         // 9  TL inner
        { type: 'polygon', points: [[132,8],  [132,68], [192,68]]  },         // 10 TR inner
        { type: 'polygon', points: [[132,132],[192,132],[132,192]] },         // 11 BR inner
        { type: 'polygon', points: [[8,132],  [68,132], [68,192]]  },         // 12 BL inner
        { type: 'polygon', points: [[8,8],    [68,8],   [8,68]]    },         // 13 TL outer
        { type: 'polygon', points: [[132,8],  [192,8],  [192,68]]  },         // 14 TR outer
        { type: 'polygon', points: [[192,132],[192,192],[132,192]] },         // 15 BR outer
        { type: 'polygon', points: [[8,132],  [8,192],  [68,192]]  },         // 16 BL outer
      ];
      return SLOTS[i];
    },
    // Edge-adjacency: two slots are neighbors iff they share at least
    // one cell-edge segment. The 2-unit GAP between cells is treated as
    // adjacency (cells align). Outer triangles only touch their sibling
    // inner triangle across the diagonal seam — their other two sides
    // are on the block boundary.
    neighbors(i) {
      const ADJ = [
        [1, 2, 3, 4],            // 0  C
        [0, 5, 9, 10],           // 1  N handle
        [0, 6, 10, 11],          // 2  E handle
        [0, 7, 11, 12],          // 3  S handle
        [0, 8, 9, 12],           // 4  W handle
        [1, 9, 10],              // 5  N bg
        [2, 10, 11],             // 6  E bg
        [3, 11, 12],             // 7  S bg
        [4, 9, 12],              // 8  W bg
        [1, 4, 5, 8, 13],        // 9  TL inner △
        [1, 2, 5, 6, 14],        // 10 TR inner △
        [2, 3, 6, 7, 15],        // 11 BR inner △
        [3, 4, 7, 8, 16],        // 12 BL inner △
        [9],                     // 13 TL outer △
        [10],                    // 14 TR outer △
        [11],                    // 15 BR outer △
        [12],                    // 16 BL outer △
      ];
      return ADJ[i].slice();
    },
    // X-bowtie has full reflection symmetry on V, H, and main diagonal.
    symmetryPairs(axis) {
      if (axis === 'vertical')   return [[2,4],[6,8],[9,10],[11,12],[13,14],[15,16]];
      if (axis === 'horizontal') return [[1,3],[5,7],[9,12],[10,11],[13,16],[14,15]];
      if (axis === 'diagonal')   return [[1,4],[2,3],[5,8],[6,7],[10,12],[14,16]];
      return [];
    },
    // 180° rotational symmetry. Order 4 not available (would require
    // pinwheel chirality, which we explicitly didn't choose).
    rotationalSymmetryGroups(order) {
      if (order === 2) return [[1,3],[2,4],[5,7],[6,8],[9,11],[10,12],[13,15],[14,16]];
      return [];
    },
    // Churn Dash has no concentric rings (that's a Log Cabin / Dresden
    // Plate concept). Stay consistent with Rail Fence and return undefined.
    ring(_i) {
      return undefined;
    },
    namedSlot(name) {
      const map = {
        center: 0,
        handles:        [1, 2, 3, 4],
        bgs:            [5, 6, 7, 8],
        innerTriangles: [9, 10, 11, 12],
        outerTriangles: [13, 14, 15, 16],
        allTriangles:   [9, 10, 11, 12, 13, 14, 15, 16],
        allEdges:       [1, 2, 3, 4, 5, 6, 7, 8],
        // dash = visible Churn Dash motif (handles + inner △, no center).
        // Canonical quilter terminology; pairs with `field` below.
        dash:           [1, 2, 3, 4, 9, 10, 11, 12],
        // field = the background (center + bgs + outer △).
        field:          [0, 5, 6, 7, 8, 13, 14, 15, 16],
        // frame = field minus center (for templates that pin center separately).
        frame:          [5, 6, 7, 8, 13, 14, 15, 16],
        // cross = center + handles ("+" shape, for non-canonical templates).
        cross:          [0, 1, 2, 3, 4],
        // foreground = cross + inner △ ("center matches the X" templates).
        foreground:     [0, 1, 2, 3, 4, 9, 10, 11, 12],
        // Per-side groups (6 slots each) — top row, etc. Useful for
        // axial-split templates if/when authored.
        northSide:      [1, 5, 9, 10, 13, 14],
        southSide:      [3, 7, 11, 12, 15, 16],
        eastSide:       [2, 6, 10, 11, 14, 15],
        westSide:       [4, 8, 9, 12, 13, 16],
      };
      return map[name];
    },
  },
  ```

- [ ] **Step 2. Verify in DevTools console** (Thursdays still route to `null` because no templates ship yet — this is sanity-only):

  ```js
  BLOCKS['churn-dash'].slotCount                        // 17
  BLOCKS['churn-dash'].slotPath(0)                      // { type: 'rect', x: 70, y: 70, w: 60, h: 60 }
  BLOCKS['churn-dash'].slotPath(9)                      // { type: 'polygon', points: [[68,8],[68,68],[8,68]] }
  BLOCKS['churn-dash'].slotPath(16)                     // { type: 'polygon', points: [[8,132],[8,192],[68,192]] }
  BLOCKS['churn-dash'].neighbors(0).sort()              // [1, 2, 3, 4]
  BLOCKS['churn-dash'].neighbors(9).sort()              // [1, 4, 5, 8, 13]
  BLOCKS['churn-dash'].neighbors(13)                    // [9]
  BLOCKS['churn-dash'].symmetryPairs('vertical')        // [[2,4],[6,8],[9,10],[11,12],[13,14],[15,16]]
  BLOCKS['churn-dash'].rotationalSymmetryGroups(2)      // [[1,3],[2,4],[5,7],[6,8],[9,11],[10,12],[13,15],[14,16]]
  BLOCKS['churn-dash'].rotationalSymmetryGroups(4)      // []
  BLOCKS['churn-dash'].ring(0)                          // undefined
  BLOCKS['churn-dash'].namedSlot('dash')                // [1, 2, 3, 4, 9, 10, 11, 12]
  BLOCKS['churn-dash'].namedSlot('field')               // [0, 5, 6, 7, 8, 13, 14, 15, 16]
  BLOCKS['churn-dash'].namedSlot('northSide')           // [1, 5, 9, 10, 13, 14]
  ```

- [ ] **Step 3. Smoke-test the renderer** with a synthetic fabric assignment. Don't commit this — it's a one-shot console probe. Confirms `createSlotElement()` handles the polygon branch on a real block for the first time.

  ```js
  // From the console, against a freshly loaded page:
  const host = document.getElementById('blockHost');
  // Dash = oxblood; field = snow.
  const fbs = new Array(17).fill('F_SNOW');
  for (const i of [1, 2, 3, 4, 9, 10, 11, 12]) fbs[i] = 'F_OXBLOOD';
  renderBlock(host, BLOCKS['churn-dash'], fbs, {});
  ```

  Visual check:
  - 17 shapes arranged in the Churn Dash layout: 1 center square, 8 edge rects (4 inner "handles", 4 outer "bgs"), 8 corner triangles (4 inner pointing toward center, 4 outer in block corners).
  - The 4 inner triangles + 4 handles together form a "Churn Dash" motif (visible "+" with bowtie wings) in oxblood.
  - The center + 4 bgs + 4 outer triangles form a snow background field.
  - HST diagonals run pinwheel-bowtie style: TL `/`, TR `\`, BR `/`, BL `\` — outer triangles tucked into block corners.
  - No overlap, no gaps inside cells; the `.slot` stroke draws the seams.
  - Compare against `sketches/churn-dash-preview.html` to confirm geometry matches.
  - Reload the page to restore the actual puzzle.

- [ ] **Step 4. Verify Thursdays still return `null`** until templates land (so today's Wednesday Log Cabin puzzle is untouched):

  ```js
  pickTemplateForDate('2026-05-21')  // null — no churn-dash templates yet
  pickTemplateForDate('2026-05-20')  // still a log-cabin template (today, Wed)
  ```

- [ ] **Step 5. Commit.** Message: `Add Churn Dash block (17 slots, X-bowtie HSTs, split-handle edges; first polygon-slot block)`

---

### T3: Author Churn Dash Template A — "Bowtie"

The canonical Churn Dash look: light background field, dark contrast motif. Each group is monochrome (`all-same`), and the value contrast does the visual heavy lifting. A decorative `symmetry` rule teaches the player that the block has vertical reflection symmetry (which is always true here by construction).

**Files:** `sampler.html`

- [ ] **Step 1. Append to `TEMPLATES`** (after the Log Cabin templates, ~[sampler.html:1310](sampler.html:1310) — find the closing `},` of the `log-cabin-cross-v1` entry and append before the `];` that ends the `TEMPLATES` array):

  ```js
  // ─── Churn Dash templates (Phase 3d) ───
  // All three use the winter-forest palette and target 4-6 solutions.
  // The decorative rule on each surfaces a different symmetry property
  // of the X-bowtie block; they're true by construction so they never
  // constrain the solver or trigger violation highlights.

  // Template A: "Bowtie" — canonical Churn Dash. Field (center + bgs +
  // outer triangles) all one light fabric. Dash (handles + inner
  // triangles, the visible motif) all one dark fabric. The contrast
  // does the heavy lifting visually.
  //
  // Six solutions: 2 lights (SNOW, OAT) × 3 darks (PINE, CHARCOAL, OXBLOOD).
  {
    id: 'churn-dash-bowtie-v1',
    block: 'churn-dash',
    paletteFamily: 'winter-forest',
    paletteSize: 7,
    solutionTarget: { min: 4, max: 6 },
    fabricRoles: {},
    rules: [
      { kind: 'all-same',   slot: 'field' },
      { kind: 'positional', slot: 'field', constraint: { value: 'light' } },
      { kind: 'all-same',   slot: 'dash' },
      { kind: 'positional', slot: 'dash',  constraint: { value: 'dark' } },
      { kind: 'symmetry',   axis: 'vertical', decorative: true },
    ],
  },
  ```

- [ ] **Step 2. Verify uniqueness range.** In the console:

  ```js
  verifyTemplate('churn-dash-bowtie-v1', ['2026-05-21', '2027-05-20'])
  // Expect: 53/53 Thursdays "in-range" (4-6 solutions; should report 6 per date),
  // 0 too-few, 0 too-many.
  console.time('cd-bowtie'); verifyTemplate('churn-dash-bowtie-v1', ['2026-05-21', '2027-05-20']); console.timeEnd('cd-bowtie');
  // Should complete well under 30s — but Churn Dash is 17 slots × 7 fabrics,
  // larger than Log Cabin's 13 × 6. If a single template takes > 5s for the
  // year, surface it in the commit message — it's an early signal Sawtooth Star
  // (16 slots, Phase 3e) will need per-rule forward-pruning beyond what's there.
  ```

  If any date reports outside the target range, tighten or loosen a rule and re-verify.

- [ ] **Step 3. Verify in browser.** Start a fresh browser session (`localStorage.clear()`), then load `http://localhost:8000/sampler.html?date=2026-05-21` (the first Thursday after launch). Today's actual Wednesday Log Cabin puzzle (`?date=2026-05-20` or no `?date`) is unaffected.
  - The puzzle renders as a Churn Dash: center square + 4 handles + 4 bgs + 8 triangles in the X-bowtie layout.
  - Rules panel shows 5 rules in human language (no `[object Object]`). The decorative `symmetry` rule should render in the decorative style (italic / muted per the existing CSS — verify by inspecting how the Phase 3a/3c decorative rules render).
  - Paint mode works: tap a fabric in the palette, tap a slot, fill. Triangle slots accept clicks (the SVG `<polygon>` is clickable just like a rect).
  - Provoke a violation: paint two `dash` slots different fabrics → both filled `dash` slots get `.violation` styling (red outline on triangles + rects alike — class-based CSS already in place).
  - Solve to completion; reveal animation runs (works on polygons since the `.slot` class drives the transition); completion overlay reads "You found pattern N of 6 — a Thursday Churn Dash in M:SS."
  - Click "Find another pattern" → board clears, timer resets, found-solutions count goes to 1.

- [ ] **Step 4. Commit.** Message: `Add Churn Dash Template A (Bowtie — canonical light field / dark dash)`

---

### T4: Author Churn Dash Template B — "Locket"

Center pinned to snow as a fixed light anchor; dash is a uniform medium, frame (field minus center) is a uniform dark. Reads as a small light "stone" set in a layered backing — different visual character from Template A. Decorative horizontal-axis symmetry rule.

**Files:** `sampler.html`

- [ ] **Step 1. Append to `TEMPLATES`** (immediately after the Bowtie template added in T3):

  ```js
  // Template B: "Locket" — center pinned to F_SNOW; dash all-same medium;
  // frame (field minus center) all-same dark. The pinned center reads as
  // a snow "stone" set in a layered backing of darker fabrics.
  //
  // Six solutions: 1 pinned center × 2 mediums (SLATE, RUST) × 3 darks
  // (PINE, CHARCOAL, OXBLOOD).
  {
    id: 'churn-dash-locket-v1',
    block: 'churn-dash',
    paletteFamily: 'winter-forest',
    paletteSize: 7,
    solutionTarget: { min: 4, max: 6 },
    fabricRoles: { CENTER: 'F_SNOW' },
    rules: [
      { kind: 'positional', slot: 'center', constraint: { fabricId: 'ROLE:CENTER' } },
      { kind: 'all-same',   slot: 'dash' },
      { kind: 'positional', slot: 'dash',   constraint: { value: 'medium' } },
      { kind: 'all-same',   slot: 'frame' },
      { kind: 'positional', slot: 'frame',  constraint: { value: 'dark' } },
      { kind: 'symmetry',   axis: 'horizontal', decorative: true },
    ],
  },
  ```

- [ ] **Step 2. Verify uniqueness range:**

  ```js
  verifyTemplate('churn-dash-locket-v1', ['2026-05-21', '2027-05-20'])
  // Expect: 53/53 in-range (target 4-6; should report 6 per date).
  ```

- [ ] **Step 3. Verify in browser.** The first Thursday picks Template A (pool index 0, week 0). To play Template B before week 1, jump forward via the archive UI to the second Thursday after launch (2026-05-28), or temporarily comment out Template A and reload `?date=2026-05-21`.
  - Center is snow on every play (regardless of date seed).
  - The 8 `dash` slots all match one medium fabric (slate or rust).
  - The 8 `frame` slots all match one dark fabric (pine, charcoal, or oxblood).
  - Rules panel reads naturally — "Center must be a Snow Linen fabric," "Dash slots must all be the same fabric," etc.
  - Verify the decorative `symmetry` rule renders in the decorative style and doesn't trigger violations.

- [ ] **Step 4. Commit.** Message: `Add Churn Dash Template B (Locket — pinned center, dash/frame distinct)`

---

### T5: Author Churn Dash Template C — "Night"

Inverts Template A's value relationship: dark field, light dash. Visually striking — the foreground motif reads as a stained-glass effect against a dark ground. Decorative `rotational-symmetry` (order 2) teaches the player that Churn Dash has 180° rotational symmetry, which is true by construction here.

**Files:** `sampler.html`

- [ ] **Step 1. Append to `TEMPLATES`** (immediately after the Locket template added in T4):

  ```js
  // Template C: "Night" — inverts Bowtie. Dark field, light dash. The
  // foreground motif reads as a stained-glass effect against a dark
  // ground. The decorative rotational-symmetry rule teaches the player
  // about the block's 180° symmetry (always true here by construction).
  //
  // Six solutions: 3 darks × 2 lights.
  {
    id: 'churn-dash-night-v1',
    block: 'churn-dash',
    paletteFamily: 'winter-forest',
    paletteSize: 7,
    solutionTarget: { min: 4, max: 6 },
    fabricRoles: {},
    rules: [
      { kind: 'all-same',            slot: 'field' },
      { kind: 'positional',          slot: 'field', constraint: { value: 'dark' } },
      { kind: 'all-same',            slot: 'dash' },
      { kind: 'positional',          slot: 'dash',  constraint: { value: 'light' } },
      { kind: 'rotational-symmetry', order: 2, decorative: true },
    ],
  },
  ```

- [ ] **Step 2. Verify uniqueness range:**

  ```js
  verifyTemplate('churn-dash-night-v1', ['2026-05-21', '2027-05-20'])
  // Expect: 53/53 in-range (target 4-6; should report 6 per date).
  ```

- [ ] **Step 3. Verify in browser.** Same approach as T4 — jump to the third Thursday after launch (2026-06-04) for week 2 (`weeksSince % pool.length === 2`), or comment out earlier templates briefly to force Template C on 2026-05-21.
  - Block renders with dark field (center + bgs + outer triangles all one dark) and light dash (handles + inner triangles all one light).
  - The visual is the inverse of Template A — same structure, opposite value contrast.
  - Rules panel shows the decorative `rotational-symmetry` rule labeled as such; it never triggers a violation even when the block is partially filled.

- [ ] **Step 4. Commit.** Message: `Add Churn Dash Template C (Night — inverse Bowtie, dark field / light dash)`

---

## Cross-task verification (after T5)

End-to-end smoke check on a fresh browser:

1. `localStorage.clear()`; reload `?date=2026-05-20` (today, Wednesday). Today's Log Cabin puzzle plays normally — Phases 3a/3b/3c unaffected.
2. Reload `?date=2026-05-19` (Tuesday). Rail Fence plays normally.
3. Reload `?date=2026-05-25` (first Monday after launch). Nine-Patch plays normally.
4. Reload `?date=2026-05-21` (first Thursday after launch). The puzzle is now Churn Dash Template A ("Bowtie"). Block renders as 17 slots in the X-bowtie layout. **First polygon-slot block to ship.**
5. Paint mode works: select fabric → tap any slot (rect or polygon) → fill. The 5 rules describe the constraints in natural English (4 active + 1 decorative).
6. Provoke an `all-same` violation (paint two `dash` slots different fabrics) → both filled `dash` slots get the `.violation` styling. Confirm violation visuals work on `<polygon>` elements (the triangle slots) as well as `<rect>` elements.
7. Solve the puzzle. Reveal animation runs across all 17 slots (verify polygons animate correctly). Completion overlay reads "You found pattern N of 6 — a Thursday Churn Dash in M:SS."
8. Trigger find-another → board clears, timer resets, prior solution preserved in `game.solutionsFound`. Find a second solution; overlay updates to "pattern 2 of 6."
9. Open the archive overlay. Thursday cells from 2026-05-21 onward are clickable (no "no puzzle yet" overlay). Mon/Tue/Wed cells continue to work; Fri/Sat/Sun cells continue to show "no puzzle yet."
10. Share → clipboard contains "Sampler · May 21, 2026 · Churn Dash — pattern N of 6 · M:SS".
11. Inspect storage: `JSON.parse(localStorage.sampler_daily_v2).byDate['2026-05-21']` has `block: 'churn-dash'`, `templateId: 'churn-dash-bowtie-v1'`, `totalSolutions: 6`, `solutionsFound: [...]`.
12. Cycle through Thursdays via the archive (2026-05-21, 2026-05-28, 2026-06-04, 2026-06-11) — pool cycles A → B → C → A. The 2026-06-04 puzzle visually inverts (dark ground); the 2026-05-28 puzzle has the pinned snow center.
13. Open `sketches/churn-dash-preview.html` in a second tab; confirm the rendered geometry in the live game matches the sketch for slot indices, named-slot groups, and HST chirality.

**Update the running design notes** at `docs/superpowers/notes/sampler-design-notes.md`:

- In the "Current status" section, move `**Phase 3d — Churn Dash (Thursday block)** ← *next up*` to the shipped list and prefix with ✓: `✓ **Phase 3d — Churn Dash + winter-forest** (shipped: 17-slot X-bowtie block with first real `{type:'polygon'}` slots, 7-fabric winter-forest palette, three templates all at 6 solutions per date)`.
- Set "next up" to **Phase 3e — Sawtooth Star (Friday block)**.
- Add a new subsection under the "Phase 3 candidates" area (or directly above "Phase 4 (Saturday — Dresden Plate)"): `### Churn Dash retrospective (Phase 3d, 2026-05-20)` — record that the X-bowtie chirality was chosen over pinwheel (giving full reflection symmetry on V/H/diagonal axes plus 180° rotation, at the cost of order-4 rotation), that the 17-slot variant was chosen over 13-slot (preserving the authentic "handle" split on edges), that all three templates use decorative symmetry rules for pedagogy, and that winter-forest is the second palette family (palette-growth commitment back on track).
- Add three rows to the engine-state table under §"Multi-solution puzzles" for Thu w0–w2 (Bowtie / Locket / Night), each at 6 solutions per date.
- In §"Palette growth", strike or update the candidate `winter-forest` line to reflect that it's now shipped and document the 7-fabric composition (6 was the heritage-warm count; the 7th — `F_OAT` — gives a second warm-light option so the 2-light × 3-dark / 1-pinned × 2-med × 3-dark / 3-dark × 2-light template math lands cleanly at 6 solutions).
- In §"Existing-file impact", no changes — Phase 3d touches `sampler.html` only.

Commit the notes update with message: `Phase 3d retrospective: Churn Dash + winter-forest shipped; next up Sawtooth Star`.

---

## Critical files reference

- [sampler.html](sampler.html) — entire game (modify in place)
  - FABRICS: [sampler.html:769](sampler.html:769)–782 (append 7 new entries before the closing `};`)
  - PALETTES: [sampler.html:785](sampler.html:785)–787 (append `'winter-forest'` entry)
  - FABRIC_SVG: [sampler.html:790](sampler.html:790)–827 (append 7 `<pattern>` definitions before `</defs>`)
  - BLOCKS: [sampler.html:836](sampler.html:836)–1091 (append `churn-dash` after `log-cabin`)
  - TEMPLATES: [sampler.html:1101](sampler.html:1101)–1312 (append three new templates after `log-cabin-cross-v1`)
  - createSlotElement / slotCenter / renderBlock: [sampler.html:1487](sampler.html:1487)–1555 (no changes — polygon branch already in place, first real consumer)
  - pickTemplateForDate: [sampler.html:1366](sampler.html:1366)–1386 (no changes — already filters by `dayOfWeek`)
  - solve / verifyTemplate: [sampler.html:1401](sampler.html:1401)–1469 (no changes)
  - RULE_KINDS: [sampler.html:1886](sampler.html:1886)–2200 (no changes — `all-same`, `positional`, `symmetry`, `rotational-symmetry` all in place; `decorative: true` short-circuit honored)
- [docs/superpowers/specs/2026-05-18-sampler-design.md](docs/superpowers/specs/2026-05-18-sampler-design.md) — full spec
- [docs/superpowers/notes/sampler-design-notes.md](docs/superpowers/notes/sampler-design-notes.md) — running notes (UPDATE per cross-task verification)
- [docs/superpowers/plans/2026-05-19-sampler-phase3c-log-cabin.md](docs/superpowers/plans/2026-05-19-sampler-phase3c-log-cabin.md) — prior plan style reference
- [sketches/churn-dash-preview.html](sketches/churn-dash-preview.html) — gitignored throwaway preview of the 17-slot geometry

## Out of scope (later phases)

- Sawtooth Star (Phase 3e), Dresden Plate (Phase 4), Sampler quilt (Phase 5).
- New fabrics beyond winter-forest's 7. The user will iterate on hex colors / SVG pattern detail post-launch (the seven values shipped here are the "good enough" first pass; the rust hex in particular is a candidate for hue tuning once it's seen against pine and oxblood in the same render).
- Templates exercising `all-different` or `alternating` rule kinds. Both ship in the engine since Phase 3b but no template uses them; deferred to a future template-variety phase. The three Phase 3d templates use `all-same` + `positional` + decorative `symmetry`/`rotational-symmetry`, which keeps the rule-structure surface area predictable.
- A third palette family. Plan to add one with Sawtooth Star (Phase 3e) if Friday is best served by a different aesthetic; otherwise hold until Phase 6 polish.
- `connectivity` rule kind. Spec §6 flags it as "Wed onward" but it requires the indeterminate state design from the design notes — out of scope until at least Sawtooth Star.
- Refinements to the rules-panel rendering for decorative rules. The existing decorative styling (set in Phase 3a) handles all three Phase 3d templates as-is.
- Cross-block rule kinds or sashing — those are Sunday (Phase 5) concerns.
