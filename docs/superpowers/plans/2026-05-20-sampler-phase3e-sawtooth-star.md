# Sampler — Phase 3e Implementation Plan (Sawtooth Star / Friday block + summer-meadow palette)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Branching:** Phase 3d (PR #9) is still open; this plan does NOT depend on it merging. Branch from `main` into a fresh worktree at execution time — the engine surface needed for Phase 3e is already on `main`.

## Context

Phases 3a (Rail Fence + foundational refactors), 3b (multi-solution UX), 3c (Log Cabin), and 3d (Churn Dash — in-flight on PR #9) shipped or are shipping the full block-renderer contract Phase 3e needs: `slotPath` polygon support, `solutionTarget`, named slots, all-same / all-different / alternating / rotational-symmetry rule kinds, decorative-rule short-circuit, and weekday-pool template selection. **This plan is purely content authoring on top of those foundations** — no engine refactors.

Phase 3e ships:

1. `summer-meadow` palette family with 7 new fabrics — the **third palette family** alongside heritage-warm (Mon–Wed) and winter-forest (Thu, per PR #9). Friday gets its own light/airy summer aesthetic; the week now reads as palette-varied Mon→Fri.
2. A new entry in `BLOCKS` (`'sawtooth-star'`) implementing the full block interface: 17 slots (5 rects + 12 polygons), 1 large center + 4 corner squares + 4 large isoceles point-triangles + 8 flying-geese-style background triangles. Full V+H+diagonal reflection symmetry **and** order-4 rotational symmetry (the first shipped block with order-4 rotation — Phase 3d's Churn Dash X-bowtie gave us order-2 only).
3. Three Sawtooth Star templates targeting 4–6 solutions per Friday. Templates lean on **`all-different`** and **`alternating`** — both shipped in Phase 3b but unused by any template until now — to deliver the **structural-variety** quality bar from the Phase 3d retrospective: solutions vary by *fabric arrangement*, not just by *fabric color in fixed positions*.
4. End-to-end verification that 2026-05-22 (the first Friday after launch) serves a Sawtooth Star puzzle.

**Goal:** Sampler now has five playable weekdays (Mon Nine-Patch, Tue Rail Fence, Wed Log Cabin, Thu Churn Dash, Fri Sawtooth Star). Foundations stay stable.

**Architecture:** Single static file `sampler.html`. Vanilla HTML/CSS/JS, no build step. Changes are additive — one new palette family, one new block, three new templates. Renderer, solver, storage, and UI need zero changes.

**Spec:** `docs/superpowers/specs/2026-05-18-sampler-design.md` (§3, §14)
**Running notes:** `docs/superpowers/notes/sampler-design-notes.md` (UPDATE at end per cross-task verification)
**Prior phase plan (style reference):** `docs/superpowers/plans/2026-05-20-sampler-phase3d-churn-dash.md` (on the open PR #9 branch; the analog this plan mirrors)
**Throwaway preview:** `sketches/sawtooth-star-preview.html` (gitignored) — open in a browser to visualize the 17-slot geometry and named-slot groups.

---

## Testing approach (read first)

Same as prior phases: no test framework, no build. Each task ends with **manual browser verification** at `http://localhost:8000/sampler.html`.

```bash
python3 -m http.server 8000
```

Open DevTools → Application → Local Storage to inspect `sampler_daily_v2`. Use `localStorage.clear()` between tasks if needed. Open DevTools Console for `verifyTemplate(...)` and ad-hoc inspection.

**Commit after each verified task.** Each task is a clean atomic commit on the Phase 3e branch.

**Solver perf budget:** Phase 3d's 17-slot × 7-fabric × 53-Fridays verifyTemplate runs landed at 74–267 ms per template. Sawtooth Star is also 17 slots × 7 fabrics; expect similar. If any Phase 3e template's full-year verify exceeds 5s, surface it in the commit message — that's the early signal Dresden Plate (Phase 4) will need beyond-permanent-violation forward pruning on more rule kinds.

---

## Design — Sawtooth Star geometry

**Cell layout: 4×4 in a 200×200 viewBox** with `PAD = 4`, `CELL = 48`, `GAP = 0` (the `.slot` stroke draws the seams — same idiom as Log Cabin and Churn Dash). Total: 4 + 4×48 + 4 = 200. Corners are simple 1-cell squares; the center occupies the inner 2×2 as a single 96×96 slot; each mid-edge is a 2×1 "flying geese" rectangle split into 1 large isoceles point triangle + 2 small right-triangle backgrounds.

**17 slots, indexed by structural group**:

| # | Slot | Type | Geometry |
|---|------|------|----------|
| 0  | C (center)        | rect    | x=52, y=52, w=96, h=96 |
| 1  | TL corner         | rect    | x=4, y=4, w=48, h=48 |
| 2  | TR corner         | rect    | x=148, y=4, w=48, h=48 |
| 3  | BR corner         | rect    | x=148, y=148, w=48, h=48 |
| 4  | BL corner         | rect    | x=4, y=148, w=48, h=48 |
| 5  | N point △         | polygon | (52,4) (148,4) (100,52) |
| 6  | E point △         | polygon | (196,52) (196,148) (148,100) |
| 7  | S point △         | polygon | (148,196) (52,196) (100,148) |
| 8  | W point △         | polygon | (4,148) (4,52) (52,100) |
| 9  | N-left bg △       | polygon | (52,4) (52,52) (100,52) |
| 10 | N-right bg △      | polygon | (148,4) (148,52) (100,52) |
| 11 | E-top bg △        | polygon | (148,52) (196,52) (148,100) |
| 12 | E-bot bg △        | polygon | (148,148) (196,148) (148,100) |
| 13 | S-right bg △      | polygon | (148,148) (148,196) (100,148) |
| 14 | S-left bg △       | polygon | (52,148) (52,196) (100,148) |
| 15 | W-bot bg △        | polygon | (4,148) (52,148) (52,100) |
| 16 | W-top bg △        | polygon | (4,52) (52,52) (52,100) |

The 4 large point triangles (5–8) are isoceles, each with base = the outer edge of one side and tip = center-side mid-point. The 8 bg triangles (9–16) are the right-triangle complements within each mid-edge's 2×1 rect — 2 per side, one on each flank of the point.

**Edge-adjacency (neighbors)** — two slots are neighbors iff they share an edge segment of nonzero length. Each point triangle touches only its two flanking bg triangles along their hypotenuses (its other two sides are on the block boundary). Each corner touches only its two flanking bg triangles. The center touches all 8 bg triangles along its perimeter.

| Slot | Neighbors | Slot | Neighbors |
|------|-----------|------|-----------|
| 0 (C)            | 9, 10, 11, 12, 13, 14, 15, 16 | 9  (N-left bg △) | 0, 1, 5 |
| 1 (TL corner)    | 9, 16                          | 10 (N-right bg △)| 0, 2, 5 |
| 2 (TR corner)    | 10, 11                         | 11 (E-top bg △)  | 0, 2, 6 |
| 3 (BR corner)    | 12, 13                         | 12 (E-bot bg △)  | 0, 3, 6 |
| 4 (BL corner)    | 14, 15                         | 13 (S-right bg △)| 0, 3, 7 |
| 5 (N point △)    | 9, 10                          | 14 (S-left bg △) | 0, 4, 7 |
| 6 (E point △)    | 11, 12                         | 15 (W-bot bg △)  | 0, 4, 8 |
| 7 (S point △)    | 13, 14                         | 16 (W-top bg △)  | 0, 1, 8 |
| 8 (W point △)    | 15, 16                         |                  |   |

**Reflection symmetry — full V+H+main-diagonal**:

- `vertical` (across x=100): `[[1,2],[4,3],[6,8],[9,10],[11,16],[12,15],[13,14]]` (slots 0, 5, 7 are self-symmetric)
- `horizontal` (across y=100): `[[1,4],[2,3],[5,7],[9,14],[10,13],[11,12],[16,15]]` (slots 0, 6, 8 are self-symmetric)
- `diagonal` (TL→BR, across y=x): `[[2,4],[5,8],[6,7],[9,16],[10,15],[11,14],[12,13]]` (slots 0, 1, 3 are self-symmetric)

**Rotational symmetry — orders 2 and 4** (first shipped block with order-4 rotation; Phase 3d's X-bowtie was order-2 only):

- `rotationalSymmetryGroups(2)` (180°): `[[1,3],[2,4],[5,7],[6,8],[9,13],[10,14],[11,15],[12,16]]`
- `rotationalSymmetryGroups(4)` (90° rotation orbits, 4 slots per group): `[[1,2,3,4],[5,6,7,8],[9,11,13,15],[10,12,14,16]]`

The 8 bg triangles split into TWO order-4 rotation orbits: the "leading" orbit `[9,11,13,15]` (each is the bg to the clockwise-left of its point's tip when viewed from outside the block) and the "trailing" orbit `[10,12,14,16]`. Templates wanting a pinwheel effect distinguish the orbits.

**`ring(i)`** — Sawtooth Star has no concentric rings (a Log Cabin / Dresden Plate concept). Returns `undefined` (like Rail Fence and Churn Dash).

**Named slots:**

| Name | Slots | Visual meaning |
|------|-------|---------------|
| `center` | 0 | the large center square |
| `corners` | [1, 2, 3, 4] | 4 corner squares (cw from TL) |
| `points` | [5, 6, 7, 8] | 4 large isoceles point triangles (N, E, S, W) |
| `bgs` | [9, 10, 11, 12, 13, 14, 15, 16] | all 8 background triangles |
| `bgsCyclic` | [9, 10, 11, 12, 13, 14, 15, 16] | same slots, ordered clockwise around block — used by `alternating` rules to produce pinwheel effects |
| `bgsLeading` | [9, 11, 13, 15] | the leading bg of each point (one order-4 orbit) |
| `bgsTrailing` | [10, 12, 14, 16] | the trailing bg of each point (the other order-4 orbit) |
| `star` | [0, 5, 6, 7, 8] | center + 4 points — the visible star silhouette |
| `field` | [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16] | corners + bgs — the entire background |
| `pointsNS` | [5, 7] | top and bottom points |
| `pointsEW` | [6, 8] | left and right points |
| `mainDiagonalCorners` | [1, 3] | TL and BR (on the y=x diagonal) |
| `antiDiagonalCorners` | [2, 4] | TR and BL (on the anti-diagonal) |
| `pointArea_N` | [5, 9, 10] | N point + its 2 flanking bgs (the full "flying geese" unit on the top edge) |
| `pointArea_E` | [6, 11, 12] | E flying-geese unit |
| `pointArea_S` | [7, 13, 14] | S flying-geese unit |
| `pointArea_W` | [8, 15, 16] | W flying-geese unit |

`points`, `corners`, `bgs`, and the `star` / `field` split are the workhorses. `bgsCyclic` + `bgsLeading` / `bgsTrailing` are the new groups Phase 3e introduces specifically for `alternating` + rotational-orbit templates. `pointsNS` / `pointsEW` and the diagonal-corner pairs give the `all-different` templates clean per-axis constraints.

---

## Tasks

### T1: Add `summer-meadow` palette (7 new fabrics)

**Files:** `sampler.html`

The third palette family. Mirrors winter-forest's 7-fabric shape (1 light + 4 mediums + 2 darks) but leans warm/airy, evoking a sun-faded summer sampler. Two hue-balanced medium pairs (2 warm-medium, 2 cool-medium) give `all-different` templates a 4-fabric medium pool to permute across the 4 star points.

| ID | Name | Hex | Motif | Scale | Hue | Value |
|----|------|-----|-------|-------|-----|-------|
| `F_DOVE`     | Dove Linen      | `#e8e4d8` | solid  | large  | neutral | light  |
| `F_HONEY`    | Honey Dot       | `#c9a060` | dot    | small  | warm    | medium |
| `F_FERN`     | Fern Vine       | `#7a9070` | vine   | medium | cool    | medium |
| `F_PEACH`    | Peach Floral    | `#c47860` | floral | small  | warm    | medium |
| `F_LAVENDER` | Lavender Dot    | `#7a7090` | dot    | small  | cool    | medium |
| `F_PLUM`     | Plum Solid      | `#5a2a40` | solid  | large  | warm    | dark   |
| `F_NIGHT`    | Night Vine      | `#2a3a4a` | vine   | medium | cool    | dark   |

All have `direction: null` (stripes remain a Rail-Fence-only thing for now). Names do not collide with heritage-warm (`F_CREAM` etc.) or winter-forest from PR #9 (`F_SNOW` etc.).

- [ ] **Step 1. Append to `FABRICS`** (after `F_WALNUT`, [sampler.html:782](sampler.html:782) — find the closing `};` of the FABRICS const and insert before it):

  ```js
    // ─── summer-meadow palette (Phase 3e) ───
    // Mirrors winter-forest's distribution (1 light / 4 mediums / 2 darks)
    // but leans warm/airy: a sun-faded summer feel that contrasts visually
    // with heritage-warm's autumnal moodand winter-forest's cool depth.
    // The 4 mediums split 2 warm (HONEY, PEACH) + 2 cool (FERN, LAVENDER),
    // giving `all-different` over the 4 star points a clean 4! permutation
    // space pinned via hue-axis positional rules.
    F_DOVE:     { id: 'F_DOVE',     name: 'Dove Linen',      hex: '#e8e4d8',
                  motif: 'solid',  scale: 'large',  hue: 'neutral', value: 'light',  direction: null },
    F_HONEY:    { id: 'F_HONEY',    name: 'Honey Dot',       hex: '#c9a060',
                  motif: 'dot',    scale: 'small',  hue: 'warm',    value: 'medium', direction: null },
    F_FERN:     { id: 'F_FERN',     name: 'Fern Vine',       hex: '#7a9070',
                  motif: 'vine',   scale: 'medium', hue: 'cool',    value: 'medium', direction: null },
    F_PEACH:    { id: 'F_PEACH',    name: 'Peach Floral',    hex: '#c47860',
                  motif: 'floral', scale: 'small',  hue: 'warm',    value: 'medium', direction: null },
    F_LAVENDER: { id: 'F_LAVENDER', name: 'Lavender Dot',    hex: '#7a7090',
                  motif: 'dot',    scale: 'small',  hue: 'cool',    value: 'medium', direction: null },
    F_PLUM:     { id: 'F_PLUM',     name: 'Plum Solid',      hex: '#5a2a40',
                  motif: 'solid',  scale: 'large',  hue: 'warm',    value: 'dark',   direction: null },
    F_NIGHT:    { id: 'F_NIGHT',    name: 'Night Vine',      hex: '#2a3a4a',
                  motif: 'vine',   scale: 'medium', hue: 'cool',    value: 'dark',   direction: null },
  ```

- [ ] **Step 2. Append to `PALETTES`** ([sampler.html:785](sampler.html:785) — inside the const, after `'heritage-warm'`):

  ```js
    'summer-meadow':  ['F_DOVE', 'F_HONEY', 'F_FERN', 'F_PEACH', 'F_LAVENDER', 'F_PLUM', 'F_NIGHT'],
  ```

- [ ] **Step 3. Append `<pattern>` definitions to `FABRIC_SVG`** (inside the `<defs>` block before `</defs>`, ~[sampler.html:824](sampler.html:824)). Each pattern mirrors the construction style of its heritage-warm analog (linen → cream, dot → weld, floral → madder, vine → forest, solid → walnut), retuned for the summer-meadow palette:

  ```html
      <pattern id="F_DOVE" patternUnits="userSpaceOnUse" width="20" height="20">
        <rect width="20" height="20" fill="#e8e4d8"/>
        <circle cx="3" cy="3" r="0.6" fill="#cdc6b4" opacity="0.55"/>
        <circle cx="14" cy="11" r="0.5" fill="#cdc6b4" opacity="0.5"/>
      </pattern>
      <pattern id="F_HONEY" patternUnits="userSpaceOnUse" width="14" height="14">
        <rect width="14" height="14" fill="#c9a060"/>
        <circle cx="3.5" cy="3.5" r="1.4" fill="#8a6a30" opacity="0.55"/>
        <circle cx="10.5" cy="10.5" r="1.4" fill="#8a6a30" opacity="0.55"/>
      </pattern>
      <pattern id="F_FERN" patternUnits="userSpaceOnUse" width="20" height="20">
        <rect width="20" height="20" fill="#7a9070"/>
        <path d="M2 10 Q 6 4 10 10 T 18 10" stroke="#d4e0c8" stroke-width="0.9" fill="none" opacity="0.7"/>
        <circle cx="6" cy="7" r="0.6" fill="#d4e0c8" opacity="0.75"/>
        <circle cx="14" cy="13" r="0.6" fill="#d4e0c8" opacity="0.75"/>
      </pattern>
      <pattern id="F_PEACH" patternUnits="userSpaceOnUse" width="22" height="22">
        <rect width="22" height="22" fill="#c47860"/>
        <circle cx="11" cy="11" r="3.5" fill="none" stroke="#f6e8d8" stroke-width="0.9" opacity="0.85"/>
        <circle cx="11" cy="11" r="1.2" fill="#f6e8d8" opacity="0.8"/>
        <circle cx="2" cy="2" r="0.7" fill="#f6e8d8" opacity="0.6"/>
        <circle cx="20" cy="20" r="0.7" fill="#f6e8d8" opacity="0.6"/>
      </pattern>
      <pattern id="F_LAVENDER" patternUnits="userSpaceOnUse" width="14" height="14">
        <rect width="14" height="14" fill="#7a7090"/>
        <circle cx="3.5" cy="3.5" r="1.4" fill="#bcb0d4" opacity="0.55"/>
        <circle cx="10.5" cy="10.5" r="1.4" fill="#bcb0d4" opacity="0.55"/>
      </pattern>
      <pattern id="F_PLUM" patternUnits="userSpaceOnUse" width="20" height="20">
        <rect width="20" height="20" fill="#5a2a40"/>
        <rect x="0" y="0" width="20" height="20" fill="#3a1a28" opacity="0.18"/>
      </pattern>
      <pattern id="F_NIGHT" patternUnits="userSpaceOnUse" width="20" height="20">
        <rect width="20" height="20" fill="#2a3a4a"/>
        <path d="M2 10 Q 6 4 10 10 T 18 10" stroke="#7a90a8" stroke-width="0.9" fill="none" opacity="0.6"/>
        <circle cx="6" cy="7" r="0.6" fill="#7a90a8" opacity="0.65"/>
        <circle cx="14" cy="13" r="0.6" fill="#7a90a8" opacity="0.65"/>
      </pattern>
  ```

- [ ] **Step 4. Verify in DevTools console** (no templates use these fabrics yet — sanity-only):

  ```js
  Object.keys(FABRICS).length             // 13 (was 6, added 7)
  FABRICS.F_DOVE.value                    // 'light'
  FABRICS.F_PEACH.hue                     // 'warm'
  FABRICS.F_FERN.motif                    // 'vine'
  PALETTES['summer-meadow'].length        // 7
  PALETTES['summer-meadow'][0]            // 'F_DOVE'
  // Eyeball a swatch:
  document.querySelector('pattern#F_PEACH') // <pattern> element exists
  ```

- [ ] **Step 5. Smoke-test the patterns** by temporarily rendering a swatch grid in the console. Don't commit this:

  ```js
  const host = document.getElementById('blockHost');
  const ids = PALETTES['summer-meadow'];
  host.innerHTML = `<svg viewBox="0 0 ${ids.length*40} 40" class="block-svg">${
    ids.map((id, i) => `<rect x="${i*40}" y="0" width="40" height="40" fill="url(#${id})" stroke="#6a5d44" stroke-width="1.5"/>`).join('')
  }</svg>`;
  ```

  Visual check: 7 swatches in order DOVE, HONEY, FERN, PEACH, LAVENDER, PLUM, NIGHT. Each pattern tiles cleanly (no seams visible inside a swatch). Reload to restore the actual puzzle.

- [ ] **Step 6. Commit.** Message: `Add summer-meadow palette (7 fabrics; third palette family, Phase 3e)`

---

### T2: Add `sawtooth-star` to `BLOCKS`

**Files:** `sampler.html`

- [ ] **Step 1.** In `BLOCKS` (after `log-cabin`, [sampler.html:1090](sampler.html:1090) — find the closing `},` of the log-cabin entry and append before the `};` that ends the `BLOCKS` const). If Phase 3d's `churn-dash` has already merged when this task runs, append after `churn-dash` instead:

  ```js
    'sawtooth-star': {
      id: 'sawtooth-star',
      displayName: 'Sawtooth Star',
      slotCount: 17,
      dayOfWeek: 5, // Friday (0=Sun..6=Sat)
      // Sawtooth Star: 4×4 cell layout (PAD=4, CELL=48, GAP=0 in 200×200
      // viewBox). 1 large center square (2×2 cells, 96×96) + 4 corner
      // squares (48×48 each) + 4 mid-edge "flying geese" units, each
      // composed of 1 large isoceles point triangle (pointing inward
      // toward center) + 2 small right-triangle backgrounds on either
      // flank of the point. Total 17 slots.
      //
      // First shipped block with order-4 rotational symmetry (Phase 3d's
      // X-bowtie Churn Dash was order-2 only; Log Cabin's spiral is chiral).
      // Also full reflection on V, H, and main-diagonal axes.
      //
      // Slot indices, by structural group:
      //   0:     C (center, the large 96×96 square)
      //   1-4:   corners — TL, TR, BR, BL (cw from TL)
      //   5-8:   point triangles — N, E, S, W (cw from N)
      //   9-16:  bg triangles around the points, 2 per side:
      //          9 N-left, 10 N-right; 11 E-top, 12 E-bot;
      //          13 S-right, 14 S-left; 15 W-bot, 16 W-top.
      //          The 8 bgs split into two order-4 rotation orbits:
      //          "leading" [9,11,13,15] and "trailing" [10,12,14,16].
      //
      // The polygon-slot pipeline (shipped Phase 3a, first used by Churn
      // Dash in Phase 3d) handles all 12 triangle slots; no renderer
      // changes needed.
      slotPath(i) {
        const SLOTS = [
          { type: 'rect',    x: 52,  y: 52,  w: 96, h: 96 },                    // 0  C
          { type: 'rect',    x: 4,   y: 4,   w: 48, h: 48 },                    // 1  TL corner
          { type: 'rect',    x: 148, y: 4,   w: 48, h: 48 },                    // 2  TR corner
          { type: 'rect',    x: 148, y: 148, w: 48, h: 48 },                    // 3  BR corner
          { type: 'rect',    x: 4,   y: 148, w: 48, h: 48 },                    // 4  BL corner
          { type: 'polygon', points: [[52,4],   [148,4],  [100,52]]    },       // 5  N point △
          { type: 'polygon', points: [[196,52], [196,148],[148,100]]   },       // 6  E point △
          { type: 'polygon', points: [[148,196],[52,196], [100,148]]   },       // 7  S point △
          { type: 'polygon', points: [[4,148],  [4,52],   [52,100]]    },       // 8  W point △
          { type: 'polygon', points: [[52,4],   [52,52],  [100,52]]    },       // 9  N-left bg △
          { type: 'polygon', points: [[148,4],  [148,52], [100,52]]    },       // 10 N-right bg △
          { type: 'polygon', points: [[148,52], [196,52], [148,100]]   },       // 11 E-top bg △
          { type: 'polygon', points: [[148,148],[196,148],[148,100]]   },       // 12 E-bot bg △
          { type: 'polygon', points: [[148,148],[148,196],[100,148]]   },       // 13 S-right bg △
          { type: 'polygon', points: [[52,148], [52,196], [100,148]]   },       // 14 S-left bg △
          { type: 'polygon', points: [[4,148],  [52,148], [52,100]]    },       // 15 W-bot bg △
          { type: 'polygon', points: [[4,52],   [52,52],  [52,100]]    },       // 16 W-top bg △
        ];
        return SLOTS[i];
      },
      // Edge-adjacency: two slots are neighbors iff they share an edge
      // segment of nonzero length. Each point triangle touches only its
      // two flanking bg triangles (other two sides are on the block
      // boundary). Each corner touches only its two flanking bg
      // triangles (the corner's other two sides are also on the block
      // boundary). The center touches all 8 bg triangles around its
      // perimeter. The 4 corners and 4 points never touch each other
      // (the 8 bgs sit between them everywhere).
      neighbors(i) {
        const ADJ = [
          [9, 10, 11, 12, 13, 14, 15, 16], // 0  C
          [9, 16],                          // 1  TL corner
          [10, 11],                         // 2  TR corner
          [12, 13],                         // 3  BR corner
          [14, 15],                         // 4  BL corner
          [9, 10],                          // 5  N point △
          [11, 12],                         // 6  E point △
          [13, 14],                         // 7  S point △
          [15, 16],                         // 8  W point △
          [0, 1, 5],                        // 9  N-left bg △
          [0, 2, 5],                        // 10 N-right bg △
          [0, 2, 6],                        // 11 E-top bg △
          [0, 3, 6],                        // 12 E-bot bg △
          [0, 3, 7],                        // 13 S-right bg △
          [0, 4, 7],                        // 14 S-left bg △
          [0, 4, 8],                        // 15 W-bot bg △
          [0, 1, 8],                        // 16 W-top bg △
        ];
        return ADJ[i].slice();
      },
      // Full reflection symmetry on V, H, and main-diagonal axes.
      symmetryPairs(axis) {
        if (axis === 'vertical')   return [[1,2],[4,3],[6,8],[9,10],[11,16],[12,15],[13,14]];
        if (axis === 'horizontal') return [[1,4],[2,3],[5,7],[9,14],[10,13],[11,12],[16,15]];
        if (axis === 'diagonal')   return [[2,4],[5,8],[6,7],[9,16],[10,15],[11,14],[12,13]];
        return [];
      },
      // 180° AND 90° rotational symmetry. First shipped block with order 4.
      // Order 4: 4-slot rotation orbits.
      // Order 2: pairs (subset of order-4 orbits).
      rotationalSymmetryGroups(order) {
        if (order === 4) return [[1,2,3,4],[5,6,7,8],[9,11,13,15],[10,12,14,16]];
        if (order === 2) return [[1,3],[2,4],[5,7],[6,8],[9,13],[10,14],[11,15],[12,16]];
        return [];
      },
      // Sawtooth Star has no concentric rings (a Log Cabin / Dresden
      // Plate concept). Stay consistent with Rail Fence and Churn Dash
      // and return undefined.
      ring(_i) {
        return undefined;
      },
      namedSlot(name) {
        const map = {
          center: 0,
          corners: [1, 2, 3, 4],
          points:  [5, 6, 7, 8],
          bgs:     [9, 10, 11, 12, 13, 14, 15, 16],
          // Same 8 slots as `bgs` but with cyclic clockwise ordering
          // explicit — used by `alternating` rules to produce pinwheel
          // patterns. The order is N-left, N-right, E-top, E-bot,
          // S-right, S-left, W-bot, W-top.
          bgsCyclic: [9, 10, 11, 12, 13, 14, 15, 16],
          // The 8 bgs split into two order-4 rotation orbits — the
          // "leading" bg of each point (clockwise-leading) and the
          // "trailing" bg. Under order-4 rotation 9→11→13→15→9 and
          // 10→12→14→16→10. Templates use these for rotational-pinwheel
          // looks where the two orbits carry different fabrics.
          bgsLeading:  [9, 11, 13, 15],
          bgsTrailing: [10, 12, 14, 16],
          // The visible star silhouette: center + 4 points.
          star:  [0, 5, 6, 7, 8],
          // The entire background: corners + bgs (everything not in `star`).
          field: [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16],
          // Per-axis point pairs (for `all-different`-with-hue-axis templates).
          pointsNS: [5, 7],
          pointsEW: [6, 8],
          // Diagonal corner pairs (TL+BR on main diagonal, TR+BL on anti-diagonal).
          mainDiagonalCorners: [1, 3],
          antiDiagonalCorners: [2, 4],
          // Per-point "flying geese" units — the full mid-edge region:
          // 1 point + its 2 flanking bgs. Useful for templates that want
          // the whole geese unit to share a property.
          pointArea_N: [5, 9, 10],
          pointArea_E: [6, 11, 12],
          pointArea_S: [7, 13, 14],
          pointArea_W: [8, 15, 16],
        };
        return map[name];
      },
    },
  ```

- [ ] **Step 2. Verify in DevTools console** (Fridays still return `null` because no templates ship yet — sanity-only):

  ```js
  BLOCKS['sawtooth-star'].slotCount                     // 17
  BLOCKS['sawtooth-star'].slotPath(0)                   // { type: 'rect', x: 52, y: 52, w: 96, h: 96 }
  BLOCKS['sawtooth-star'].slotPath(5)                   // { type: 'polygon', points: [[52,4],[148,4],[100,52]] }
  BLOCKS['sawtooth-star'].slotPath(16)                  // { type: 'polygon', points: [[4,52],[52,52],[52,100]] }
  BLOCKS['sawtooth-star'].neighbors(0).sort((a,b)=>a-b) // [9, 10, 11, 12, 13, 14, 15, 16]
  BLOCKS['sawtooth-star'].neighbors(5).sort()           // [9, 10]
  BLOCKS['sawtooth-star'].neighbors(9).sort()           // [0, 1, 5]
  BLOCKS['sawtooth-star'].symmetryPairs('vertical')     // [[1,2],[4,3],[6,8],[9,10],[11,16],[12,15],[13,14]]
  BLOCKS['sawtooth-star'].rotationalSymmetryGroups(4)   // [[1,2,3,4],[5,6,7,8],[9,11,13,15],[10,12,14,16]]
  BLOCKS['sawtooth-star'].rotationalSymmetryGroups(2)   // [[1,3],[2,4],[5,7],[6,8],[9,13],[10,14],[11,15],[12,16]]
  BLOCKS['sawtooth-star'].ring(0)                       // undefined
  BLOCKS['sawtooth-star'].namedSlot('star')             // [0, 5, 6, 7, 8]
  BLOCKS['sawtooth-star'].namedSlot('bgsLeading')       // [9, 11, 13, 15]
  BLOCKS['sawtooth-star'].namedSlot('pointArea_N')      // [5, 9, 10]
  BLOCKS['sawtooth-star'].namedSlot('mainDiagonalCorners') // [1, 3]
  ```

- [ ] **Step 3. Smoke-test the renderer** with a synthetic fabric assignment. Don't commit this — it's a one-shot console probe:

  ```js
  // From the console, against a freshly loaded page:
  const host = document.getElementById('blockHost');
  // Star = night vine; field (corners + bgs) = dove linen.
  const fbs = new Array(17).fill('F_DOVE');
  for (const i of [0, 5, 6, 7, 8]) fbs[i] = 'F_NIGHT';
  renderBlock(host, BLOCKS['sawtooth-star'], fbs, {});
  ```

  Visual check:
  - 17 shapes arranged in the Sawtooth Star layout: 1 large center square, 4 corner squares, 4 large isoceles point triangles pointing inward to the center, and 8 small right-triangle backgrounds flanking each point.
  - The center + 4 points are NIGHT (dark cool); the corners + bgs are DOVE (light neutral). Reads as an 8-acute-point silhouette star against a light field.
  - Each point's tip touches the center's outer edge cleanly (no gap, no overlap). The bgs fill the rectangles between points and corners.
  - The 4 corners are 48×48 squares at the block corners. The center is a 96×96 square.
  - No overlap, no gaps; the `.slot` stroke draws the seams.
  - Compare against `sketches/sawtooth-star-preview.html` to confirm geometry matches.
  - Reload the page to restore the actual puzzle.

- [ ] **Step 4. Verify Fridays still return `null`** until templates land (so today's Wed/Thu puzzles are untouched):

  ```js
  pickTemplateForDate('2026-05-22')  // null — no sawtooth-star templates yet
  pickTemplateForDate('2026-05-20')  // still a log-cabin template (today, Wed)
  pickTemplateForDate('2026-05-21')  // null if branched from main; churn-dash if rebased on PR #9
  ```

- [ ] **Step 5. Commit.** Message: `Add Sawtooth Star block (17 slots, flying-geese mid-edges; first block with order-4 rotational symmetry)`

---

### T3: Author Sawtooth Star Template A — "Compass"

The canonical Sawtooth Star look: rotationally symmetric, light center + cool-dark corners + warm star points + cool-medium bgs. Decorative `rotational-symmetry` (order 4) surfaces the 4-fold symmetry the all-same-per-group construction already guarantees. Solutions vary by point hue (3 warm options) × bg cool-medium (2 options).

**Files:** `sampler.html`

- [ ] **Step 1. Append to `TEMPLATES`** (after the last existing template — find the closing `},` of the most-recent entry and append before the `];` that ends the `TEMPLATES` array):

  ```js
    // ─── Sawtooth Star templates (Phase 3e) ───
    // All three use the summer-meadow palette and target 4-6 solutions.
    // Templates B (Quartet) and C (Pinwheel) intentionally exercise the
    // `all-different` and `alternating` rule kinds — shipped in Phase 3b
    // but unused by any prior template — to deliver structural variety
    // (solutions vary by fabric *arrangement*, not just fabric color in
    // fixed positions). Template A is the canonical rotationally
    // symmetric Sawtooth Star, anchoring the pool with a familiar look.

    // Template A: "Compass" — canonical Sawtooth Star. Light center,
    // cool-dark corners, warm star points (all-same), cool-medium bgs
    // (all-same). The 4-group construction is rotationally symmetric by
    // construction; the decorative rule surfaces it to the player.
    //
    // Six solutions: 3 warm fabrics for points (HONEY, PEACH medium;
    // PLUM dark) × 2 cool-medium fabrics for bgs (FERN, LAVENDER).
    {
      id: 'sawtooth-star-compass-v1',
      block: 'sawtooth-star',
      paletteFamily: 'summer-meadow',
      paletteSize: 7,
      solutionTarget: { min: 4, max: 6 },
      fabricRoles: {},
      rules: [
        { kind: 'positional', slot: 'center',  constraint: { value: 'light' } },
        { kind: 'all-same',   slot: 'corners' },
        { kind: 'positional', slot: 'corners', constraint: { value: 'dark', hue: 'cool' } },
        { kind: 'all-same',   slot: 'points' },
        { kind: 'positional', slot: 'points',  constraint: { hue: 'warm' } },
        { kind: 'all-same',   slot: 'bgs' },
        { kind: 'positional', slot: 'bgs',     constraint: { value: 'medium', hue: 'cool' } },
        { kind: 'rotational-symmetry', order: 4, decorative: true },
      ],
    },
  ```

- [ ] **Step 2. Verify uniqueness range.** In the console:

  ```js
  verifyTemplate('sawtooth-star-compass-v1', ['2026-05-22', '2027-05-21'])
  // Expect: 53/53 Fridays "in-range" (4-6 solutions; should report 6 per
  // date), 0 too-few, 0 too-many.
  console.time('ss-compass'); verifyTemplate('sawtooth-star-compass-v1', ['2026-05-22', '2027-05-21']); console.timeEnd('ss-compass');
  // Should complete well under 5s — same 17×7 problem size as Churn
  // Dash (Phase 3d landed at 74-267 ms per template). If any single
  // Phase 3e template takes > 5s for the year, surface it in the commit
  // message — it's the early signal Dresden Plate (Phase 4) will need
  // beyond-permanent-violation forward pruning on more rule kinds.
  ```

  If any date reports outside the target range, tighten or loosen a rule and re-verify.

- [ ] **Step 3. Verify in browser.** Start a fresh browser session (`localStorage.clear()`), then load `http://localhost:8000/sampler.html?date=2026-05-22` (the first Friday after launch). Today's actual Wednesday Log Cabin puzzle is unaffected.
  - The puzzle renders as a Sawtooth Star: large center + 4 corners + 4 large points + 8 small bg triangles.
  - Rules panel shows 8 rules (7 active + 1 decorative `rotational-symmetry`). The decorative rule renders in the decorative style (italic / muted per existing CSS — verify against Phase 3a/3c decorative-rule styling).
  - Paint mode works on all 17 slots: tap a fabric in the palette, tap a slot (rect or polygon), fill. Polygon slots are clickable just like rects.
  - Provoke a violation: paint two `points` slots with different fabrics → both filled `points` slots get `.violation` styling (red outline on triangles).
  - Solve to completion; reveal animation runs across all 17 slots; completion overlay reads "You found pattern N of 6 — a Friday Sawtooth Star in M:SS."
  - Click "Find another pattern" → board clears, timer resets, found-solutions count goes to 1.

- [ ] **Step 4. Commit.** Message: `Add Sawtooth Star Template A (Compass — canonical rotational, warm points / cool bgs)`

---

### T4: Author Sawtooth Star Template B — "Quartet"

The structural-variety play: `all-different` over the 4 star points + per-axis hue constraints (NS cool, EW warm). With exactly 4 mediums in summer-meadow split 2 warm + 2 cool, the 4 points use all 4 mediums — but the player picks WHICH cool goes north vs south, and WHICH warm goes east vs west. Four solutions, each a structurally distinct arrangement of the same fabric set.

**Files:** `sampler.html`

- [ ] **Step 1. Append to `TEMPLATES`** (immediately after the Compass template added in T3):

  ```js
    // Template B: "Quartet" — `all-different` across the 4 star points
    // forces 4 distinct fabrics. The `pointsNS`/`pointsEW` positional
    // rules split the points by hue: north+south cool-medium,
    // east+west warm-medium. With exactly 2 cool-mediums (FERN,
    // LAVENDER) and 2 warm-mediums (HONEY, PEACH) in summer-meadow,
    // all four mediums are placed at points — but the player chooses
    // which cool goes N vs S and which warm goes E vs W.
    //
    // Four solutions: 2 (N/S cool perms) × 2 (E/W warm perms). All four
    // are STRUCTURALLY distinct — different fabric arrangements, not
    // just different colors in fixed positions. Solves the Phase 3d
    // retrospective's "structural variety" quality bar.
    {
      id: 'sawtooth-star-quartet-v1',
      block: 'sawtooth-star',
      paletteFamily: 'summer-meadow',
      paletteSize: 7,
      solutionTarget: { min: 4, max: 6 },
      fabricRoles: {},
      rules: [
        { kind: 'positional',    slot: 'center',   constraint: { value: 'light' } },
        { kind: 'all-different', slot: 'points' },
        { kind: 'positional',    slot: 'points',   constraint: { value: 'medium' } },
        { kind: 'positional',    slot: 'pointsNS', constraint: { hue: 'cool' } },
        { kind: 'positional',    slot: 'pointsEW', constraint: { hue: 'warm' } },
        { kind: 'all-same',      slot: 'corners' },
        { kind: 'positional',    slot: 'corners',  constraint: { value: 'dark', hue: 'cool' } },
        { kind: 'all-same',      slot: 'bgs' },
        { kind: 'positional',    slot: 'bgs',      constraint: { value: 'light' } },
        { kind: 'symmetry',      axis: 'vertical', decorative: true },
      ],
    },
  ```

- [ ] **Step 2. Verify uniqueness range:**

  ```js
  verifyTemplate('sawtooth-star-quartet-v1', ['2026-05-22', '2027-05-21'])
  // Expect: 53/53 in-range (target 4-6; should report 4 per date — at
  // the floor of the target range, which is intentional: 4
  // structurally-distinct solutions beats 6 fabric-color-only variants).
  ```

  If any date reports < 4 or > 6, the template is broken — the most likely cause is summer-meadow's medium split being off (should be exactly 2 warm + 2 cool mediums). Re-check T1.

- [ ] **Step 3. Verify in browser.** The first Friday picks Template A (pool index 0, week 0). To play Template B, jump to the second Friday after launch (2026-05-29) via the archive UI, or temporarily comment out Template A and reload `?date=2026-05-22`.
  - Center is the lone light fabric (F_DOVE) every play.
  - The 4 points each show ONE of the 4 mediums; no two points match (`all-different` enforces).
  - North + south points are visually cool (fern / lavender greens-purples); east + west are visually warm (honey / peach golds-corals).
  - The decorative `symmetry` rule on vertical axis is HONEST under any all-different valid assignment — vertical reflection swaps E ↔ W, both warm; verify it never triggers a `.violation` highlight regardless of the player's partial state.
  - Rules panel reads naturally — "The corners must be the same fabric.", "All points must be different fabrics.", "The points must be medium-value fabrics.", "The points n s must be cool fabrics.", "The points e w must be warm fabrics." (Note: `humanizeSlotName` will render `pointsNS` as `points n s` — acceptable; consider renaming to `pointsNorthSouth` if it reads poorly when viewed in the live UI. Decide based on the in-browser render.)
  - Solve a permutation; "Find another pattern" should let you find the other 3.

- [ ] **Step 4. Commit.** Message: `Add Sawtooth Star Template B (Quartet — all-different points, structural variety)`

---

### T5: Author Sawtooth Star Template C — "Pinwheel"

The other structural-variety play: `alternating` over the 8 bgs in cyclic order creates a pinwheel that rotates warm/cool around the block. Combined with hard `rotational-symmetry` order 4 (which forces the leading and trailing bg orbits to each be uniform internally), the player picks which warm fabric fills the 4 leading bgs and which cool fills the 4 trailing bgs. Four solutions, exercising two rule kinds (`alternating` + hard `rotational-symmetry`).

**Files:** `sampler.html`

- [ ] **Step 1. Append to `TEMPLATES`** (immediately after the Quartet template added in T4):

  ```js
    // Template C: "Pinwheel" — `alternating` on bgsCyclic forces the 8
    // bg triangles to alternate warm-medium / cool-medium going
    // clockwise around the block, creating a visual pinwheel. Hard
    // `rotational-symmetry` order 4 forces the two order-4 bg orbits
    // (bgsLeading [9,11,13,15], bgsTrailing [10,12,14,16]) to each be
    // internally uniform, plus corners + points each uniform across
    // their 4-slot orbits. So the alternation collapses to: leading
    // orbit = one warm-medium fabric, trailing orbit = one cool-medium.
    //
    // Four solutions: 2 warm-mediums (HONEY, PEACH) for leading bgs × 2
    // cool-mediums (FERN, LAVENDER) for trailing bgs. Center and
    // corners are pinned by role (CORE = the lone light, F_DOVE),
    // points pinned to cool-dark via constraint.
    //
    // Exercises both `alternating` and hard `rotational-symmetry` in a
    // template for the first time. Note: the alternating arrangement
    // BREAKS reflection symmetry — vertical reflection would map a warm
    // leading bg to a cool trailing position. So this template
    // intentionally has NO `symmetry`-axis decorative rule.
    {
      id: 'sawtooth-star-pinwheel-v1',
      block: 'sawtooth-star',
      paletteFamily: 'summer-meadow',
      paletteSize: 7,
      solutionTarget: { min: 4, max: 6 },
      fabricRoles: { CORE: 'F_DOVE' },
      rules: [
        { kind: 'positional',          slot: 'center',  constraint: { fabricId: 'ROLE:CORE' } },
        { kind: 'rotational-symmetry', order: 4 },
        { kind: 'positional',          slot: 'corners', constraint: { fabricId: 'ROLE:CORE' } },
        { kind: 'positional',          slot: 'points',  constraint: { value: 'dark', hue: 'cool' } },
        { kind: 'alternating',         slot: 'bgsCyclic', between: [
          { hue: 'warm', value: 'medium' },
          { hue: 'cool', value: 'medium' },
        ]},
      ],
    },
  ```

- [ ] **Step 2. Verify uniqueness range:**

  ```js
  verifyTemplate('sawtooth-star-pinwheel-v1', ['2026-05-22', '2027-05-21'])
  // Expect: 53/53 in-range (target 4-6; should report 4 per date).
  ```

- [ ] **Step 3. Verify in browser.** Jump to the third Friday after launch (2026-06-05) for week 2 (`weeksSince % pool.length === 2`), or comment out earlier templates briefly to force Template C on 2026-05-22.
  - Center and 4 corners are F_DOVE (light dove linen) every play (CORE role pinned).
  - The 4 points are F_NIGHT (cool-dark blue-grey-green).
  - The 8 bgs alternate clockwise: positions 0,2,4,6 (slots 9, 11, 13, 15 — the leading orbit) are one warm-medium fabric; positions 1,3,5,7 (slots 10, 12, 14, 16 — the trailing orbit) are one cool-medium fabric.
  - Hard `rotational-symmetry` order 4 means rotating the filled block by 90° produces a visually identical block. Confirm this by mental rotation.
  - Provoke a `rotational-symmetry` violation: paint slot 9 with one warm and slot 11 with a different warm → both filled bgs in the leading orbit get `.violation` styling. Same goes for any rotation-pair mismatch.
  - Provoke an `alternating` violation: paint slot 9 (idx 0 in bgsCyclic, expected warm) with a cool fabric → slot 9 highlights as violation.
  - Solve and "Find another pattern" should produce 4 distinct arrangements.

- [ ] **Step 4. Commit.** Message: `Add Sawtooth Star Template C (Pinwheel — alternating bgs + hard rotational symmetry)`

---

## Cross-task verification (after T5)

End-to-end smoke check on a fresh browser:

1. `localStorage.clear()`; reload `?date=2026-05-20` (today, Wednesday). Today's Log Cabin puzzle plays normally — Phases 3a/3b/3c unaffected.
2. Reload `?date=2026-05-19` (Tuesday). Rail Fence plays normally.
3. Reload `?date=2026-05-25` (first Monday after launch). Nine-Patch plays normally.
4. Reload `?date=2026-05-21` (Thursday). If Phase 3d (PR #9) has merged, Churn Dash plays normally; if branched from `main` without #9 merged, the date shows "no puzzle yet."
5. Reload `?date=2026-05-22` (first Friday after launch). The puzzle is now Sawtooth Star Template A ("Compass"). Block renders as 17 slots in the star layout. **First shipped block with order-4 rotational symmetry.**
6. Paint mode works: select fabric → tap any slot (rect or polygon) → fill. The 8 rules describe the constraints in natural English (7 active + 1 decorative).
7. Provoke an `all-same` violation (paint two `points` slots with different fabrics) → both filled `points` slots get the `.violation` styling. Confirm violation visuals work on the large isoceles `<polygon>` slots.
8. Solve the puzzle. Reveal animation runs across all 17 slots (verify polygons animate correctly). Completion overlay reads "You found pattern N of 6 — a Friday Sawtooth Star in M:SS."
9. Trigger find-another → board clears, timer resets, prior solution preserved in `game.solutionsFound`. Find a second solution; overlay updates to "pattern 2 of 6."
10. Open the archive overlay. Friday cells from 2026-05-22 onward are clickable (no "no puzzle yet" overlay). Mon–Thu cells continue to work; Sat/Sun cells continue to show "no puzzle yet."
11. Share → clipboard contains "Sampler · May 22, 2026 · Sawtooth Star — pattern N of 6 · M:SS".
12. Inspect storage: `JSON.parse(localStorage.sampler_daily_v2).byDate['2026-05-22']` has `block: 'sawtooth-star'`, `templateId: 'sawtooth-star-compass-v1'`, `totalSolutions: 6`, `solutionsFound: [...]`.
13. Cycle through Fridays via the archive (2026-05-22, 2026-05-29, 2026-06-05, 2026-06-12) — pool cycles A → B → C → A. The 2026-05-29 puzzle (Quartet) has 4 distinct mediums at points and uniform corners; the 2026-06-05 puzzle (Pinwheel) shows the alternating bg pinwheel.
14. **Structural-variety spot-check** on 2026-05-29 (Quartet): solve it once, click "Find another pattern", and confirm at least 3 more solutions are findable. Each should place the 4 mediums at points in a different arrangement — not just swap colors in fixed positions.
15. Open `sketches/sawtooth-star-preview.html` in a second tab; confirm the rendered geometry in the live game matches the sketch for slot indices, named-slot groups, and point/bg layout.

**Update the running design notes** at `docs/superpowers/notes/sampler-design-notes.md`:

- In the "Current status" section, mark Phase 3e shipped: `✓ **Phase 3e — Sawtooth Star + summer-meadow** (shipped: 17-slot block with first shipped order-4 rotational symmetry, 7-fabric summer-meadow palette, three templates including `all-different` and `alternating`'s first real uses)`.
- Set "next up" to **Phase 4 — Dresden Plate (Saturday block)**.
- Add a new subsection above "Phase 4 (Saturday — Dresden Plate)": `### Sawtooth Star retrospective (Phase 3e, 2026-05-20)` — record that the 17-slot construction was chosen over a hypothetical 16-slot variant (the 2 flanking bg triangles per side give templates 4 distinct mid-edge regions per side to constrain, vs a degenerate single-triangle-per-side construction), that this is the first block to express order-4 rotation, and that Templates B (Quartet) and C (Pinwheel) are the first templates exercising `all-different` and `alternating` respectively — closing the Phase 3d retrospective's "structural variety" gap.
- Add three rows to the engine-state table under §"Multi-solution puzzles" for Fri w0–w2 (Compass / Quartet / Pinwheel), at 6 / 4 / 4 solutions per date.
- In §"Palette growth", strike or update the candidate `summer-meadow` line to reflect that it's now shipped and document the 7-fabric composition (1 light, 4 mediums split 2 warm + 2 cool, 2 darks — the 2/2 medium split is what makes Quartet's `all-different`-points-with-hue-axis math land cleanly at 4 solutions).
- Under "Solver scaling," append: `✓ 2026-05-20 — Phase 3e Sawtooth Star verifyTemplate over a year of Fridays lands at [REPLACE WITH MEASURED RANGE] ms per template. Same 17×7 problem size as Churn Dash; no new rule kinds needed forward-pruning beyond what Phase 3a/3b shipped. Dresden Plate (Phase 4) is the next place to revisit if performance degrades.`
- In §"Existing-file impact", no changes — Phase 3e touches `sampler.html` only.

Commit the notes update with message: `Phase 3e retrospective: Sawtooth Star + summer-meadow shipped; next up Dresden Plate`.

---

## Critical files reference

- [sampler.html](sampler.html) — entire game (modify in place)
  - FABRICS: [sampler.html:769](sampler.html:769)–782 (append 7 new entries before the closing `};`)
  - PALETTES: [sampler.html:785](sampler.html:785)–787 (append `'summer-meadow'` entry)
  - FABRIC_SVG: [sampler.html:790](sampler.html:790)–827 (append 7 `<pattern>` definitions before `</defs>`)
  - BLOCKS: [sampler.html:836](sampler.html:836)–1091 (append `sawtooth-star` after `log-cabin`, or after `churn-dash` if PR #9 has merged)
  - TEMPLATES: [sampler.html:1101](sampler.html:1101)+ (append three new templates after the last existing template)
  - createSlotElement / slotCenter / renderBlock: [sampler.html:1487](sampler.html:1487)–1555 (no changes — polygon branch in place since Phase 3a; first used by Churn Dash in Phase 3d, second consumer is Sawtooth Star)
  - pickTemplateForDate: [sampler.html:1366](sampler.html:1366)–1386 (no changes — already filters by `dayOfWeek`)
  - solve / verifyTemplate: [sampler.html:1401](sampler.html:1401)–1474 (no changes)
  - RULE_KINDS: [sampler.html:1886](sampler.html:1886)–2216 (no changes — `all-same`, `all-different`, `alternating`, `positional`, `rotational-symmetry`, `symmetry` all in place; `decorative: true` short-circuit honored)
- [docs/superpowers/specs/2026-05-18-sampler-design.md](docs/superpowers/specs/2026-05-18-sampler-design.md) — full spec (§3 weekly format, §14 phasing)
- [docs/superpowers/notes/sampler-design-notes.md](docs/superpowers/notes/sampler-design-notes.md) — running notes (UPDATE per cross-task verification)
- [docs/superpowers/plans/2026-05-20-sampler-phase3d-churn-dash.md](docs/superpowers/plans/2026-05-20-sampler-phase3d-churn-dash.md) — prior plan style reference (on PR #9 branch)
- [sketches/sawtooth-star-preview.html](sketches/sawtooth-star-preview.html) — gitignored throwaway preview of the 17-slot geometry

## Out of scope (later phases)

- Dresden Plate (Phase 4), Sampler quilt (Phase 5).
- New fabrics beyond summer-meadow's 7. The user will iterate on hex colors / SVG pattern detail post-launch (the seven values shipped here are the "good enough" first pass; F_LAVENDER's hex in particular is a candidate for hue tuning once it's seen against F_FERN in the same render).
- Templates exercising `count`, `adjacency`, `connectivity`, or `pattern-property` rule kinds. `count` is well-trodden by Phase 1-2 Nine-Patch templates; `adjacency` ships but no current Phase 3 template uses it; `connectivity` and harder `pattern-property` await Dresden Plate or Sunday's sampler quilt.
- A fourth palette family. Three is enough for visual variety across Mon-Fri; if Saturday wants its own palette, author it with Dresden Plate in Phase 4. Otherwise hold until Phase 6 polish.
- Cross-block rule kinds or sashing — those are Sunday (Phase 5) concerns.
- Refinements to the rules-panel rendering for `all-different` and `alternating` (Phase 3e's first real consumers). The existing `describe` implementations produce acceptable English ("All [name] must be different fabrics." / "The [name] alternate between X and Y."); if the in-browser render reads awkwardly (e.g., `humanizeSlotName('pointsNS')` → "points n s"), rename the named slot to `pointsNorthSouth` / `pointsEastWest` in T2 rather than touching the rule-kind `describe()` functions.
- Re-evaluating per-rule forward-pruning. Phase 3e is the spot Phase 3a flagged for revisiting, but Phase 3d's measurements (74-267 ms per template year) suggest the existing permanent-violation pruning is still adequate at 17×7. Dresden Plate (Phase 4 — 16–24 slots and potentially 8+ rules per template) is the next checkpoint.
