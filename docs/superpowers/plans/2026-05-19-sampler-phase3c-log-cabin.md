# Sampler — Phase 3c Implementation Plan (Log Cabin / Wednesday block)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Final repo location:** save this file as `docs/superpowers/plans/2026-05-19-sampler-phase3c-log-cabin.md` when execution begins.

## Context

Phases 3a (Rail Fence + foundational refactors) and 3b (multi-solution UX) have shipped. The engine now supports:

- `slotPath(i)` returning `rect | polygon | path` geometry — Log Cabin's logs are all rects.
- `solutionTarget: { min, max }` + multi-solution rule kinds (`all-same`, `all-different`, `alternating`) — Wed targets `{4, 6}` per the design notes.
- Weekday-pool template selection: `pickTemplateForDate` filters by `BLOCKS[t.block].dayOfWeek === weekday`. Setting `dayOfWeek: 3` on the new block + shipping templates that reference `block: 'log-cabin'` is enough for Wednesdays to route automatically.
- `ring(i)` is an optional interface method stubbed `undefined` on Nine-Patch and Rail Fence. Log Cabin is the first block where it returns real ring indices.

**This plan is Phase 3c:** add the **Wednesday block (Log Cabin)** plus three multi-solution templates. No engine refactors — purely content authoring on top of the foundations already in place. The plan ships:

1. A new entry in `BLOCKS` (`'log-cabin'`) implementing the full block interface, including the first real `ring(i)`.
2. Three Log Cabin templates, each landing in the 4–6 solutions/date range across a year of Wednesdays.
3. End-to-end verification that 2026-05-20 (the first Wednesday after launch) now serves a Log Cabin puzzle.

**Goal:** Sampler now has three playable weekdays (Mon Nine-Patch, Tue Rail Fence, Wed Log Cabin). Foundations stay stable; this phase is "extend the cookbook," not "rebuild the kitchen."

**Architecture:** Single static file `sampler.html`. Vanilla HTML/CSS/JS, no build step. Changes are additive — one new block, three new templates.

**Spec:** `docs/superpowers/specs/2026-05-18-sampler-design.md`
**Running notes:** `docs/superpowers/notes/sampler-design-notes.md` (UPDATE at end per cross-task verification)
**Prior phase plan (style reference):** `docs/superpowers/plans/2026-05-19-sampler-phase3a-rail-fence.md`

---

## Testing approach (read first)

Same as prior phases: no test framework, no build. Each task ends with **manual browser verification** at `http://localhost:8000/sampler.html`.

```bash
python3 -m http.server 8000
```

Open DevTools → Application → Local Storage to inspect `sampler_daily_v2`. Use `localStorage.clear()` between tasks if needed. Open DevTools Console for `verifyTemplate(...)` and ad-hoc inspection.

**Commit after each verified task.** Each task is a clean atomic commit on `claude/compassionate-mccarthy-96496d` (the current branch).

---

## Design — Log Cabin geometry

Traditional Log Cabin is a spiral: a center "hearth," then concentric rings of four logs each. Each ring's four logs are different lengths (the spiral construction). We ship **3 rings = 13 slots** in a 7×7 cell grid — visually substantial for mid-week, comparable in slot count to Sawtooth Star (Fri, 16) but with simpler topology.

**Cell ownership** (7×7 grid, rows 0..6 top→bottom, cols 0..6 left→right):

```
W3 N3 N3 N3 N3 N3 E3      row 0
W3 W2 N2 N2 N2 E2 E3      row 1
W3 W2 W1 N1 E1 E2 E3      row 2
W3 W2 W1 C  E1 E2 E3      row 3
W3 W2 W1 S1 S1 E2 E3      row 4
W3 W2 S2 S2 S2 S2 E3      row 5
W3 S3 S3 S3 S3 S3 S3      row 6
```

Cells per slot (canonical):

| Slot | Index | Cells |
|------|-------|-------|
| C (center)    | 0  | (3,3) |
| N1 (north r1) | 1  | (2,3) |
| E1 (east r1)  | 2  | (2,4),(3,4) |
| S1 (south r1) | 3  | (4,3),(4,4) |
| W1 (west r1)  | 4  | (2,2),(3,2),(4,2) |
| N2 (north r2) | 5  | (1,2),(1,3),(1,4) |
| E2 (east r2)  | 6  | (1,5),(2,5),(3,5),(4,5) |
| S2 (south r2) | 7  | (5,2),(5,3),(5,4),(5,5) |
| W2 (west r2)  | 8  | (1,1),(2,1),(3,1),(4,1),(5,1) |
| N3 (north r3) | 9  | (0,1),(0,2),(0,3),(0,4),(0,5) |
| E3 (east r3)  | 10 | (0,6),(1,6),(2,6),(3,6),(4,6),(5,6) |
| S3 (south r3) | 11 | (6,1),(6,2),(6,3),(6,4),(6,5),(6,6) |
| W3 (west r3)  | 12 | (0,0),(1,0),(2,0),(3,0),(4,0),(5,0),(6,0) |

Each slot's cells form a rectangle (column-stack or row-stack), so `slotPath(i)` returns one `rect`.

**Geometry params:** `PAD = 2`, `CELL = 28`, `GAP = 0` in the 200×200 viewBox. Cells touch; the existing `.slot` stroke (1.5px, `--ink-soft`) draws log seams. Total: 2 + 7·28 + 2 = 200.

**Rect per slot** (`x = PAD + col*CELL`, `w = (cols)*CELL`, etc.):

| # | Slot | x | y | w | h |
|---|------|---|---|---|---|
| 0 | C   | 86  | 86  | 28  | 28  |
| 1 | N1  | 86  | 58  | 28  | 28  |
| 2 | E1  | 114 | 58  | 28  | 56  |
| 3 | S1  | 86  | 114 | 56  | 28  |
| 4 | W1  | 58  | 58  | 28  | 84  |
| 5 | N2  | 58  | 30  | 84  | 28  |
| 6 | E2  | 142 | 30  | 28  | 112 |
| 7 | S2  | 58  | 142 | 112 | 28  |
| 8 | W2  | 30  | 30  | 28  | 140 |
| 9 | N3  | 30  | 2   | 140 | 28  |
| 10| E3  | 170 | 2   | 28  | 168 |
| 11| S3  | 30  | 170 | 168 | 28  |
| 12| W3  | 2   | 2   | 28  | 196 |

**Edge-adjacency (neighbors) table** — two slots are neighbors if any cell of one shares an edge with any cell of the other:

| Slot | Neighbors |
|------|-----------|
| 0 (C)   | 1, 2, 3, 4 |
| 1 (N1)  | 0, 2, 4, 5 |
| 2 (E1)  | 0, 1, 3, 5, 6 |
| 3 (S1)  | 0, 2, 4, 6, 7 |
| 4 (W1)  | 0, 1, 3, 5, 7, 8 |
| 5 (N2)  | 1, 2, 4, 6, 8, 9 |
| 6 (E2)  | 2, 3, 5, 7, 9, 10 |
| 7 (S2)  | 3, 4, 6, 8, 10, 11 |
| 8 (W2)  | 4, 5, 7, 9, 11, 12 |
| 9 (N3)  | 5, 6, 8, 10, 12 |
| 10 (E3) | 6, 7, 9, 11 |
| 11 (S3) | 7, 8, 10, 12 |
| 12 (W3) | 8, 9, 11 |

> Note the asymmetry — inner-ring east logs have one more neighbor than north logs because the spiral makes each log one cell longer on its long axis than the previous. This is intrinsic to Log Cabin and not a bug; rules that care about per-slot neighbor counts (e.g. future connectivity) will see it.

**Named slots:**

| Name | Slots |
|------|-------|
| `center` | 0 |
| `ring1` | [1, 2, 3, 4] |
| `ring2` | [5, 6, 7, 8] |
| `ring3` | [9, 10, 11, 12] |
| `northLogs` | [1, 5, 9] |
| `eastLogs` | [2, 6, 10] |
| `southLogs` | [3, 7, 11] |
| `westLogs` | [4, 8, 12] |
| `northSouthLogs` | [1, 3, 5, 7, 9, 11] |
| `eastWestLogs` | [2, 4, 6, 8, 10, 12] |
| `northeastSide` | [1, 2, 5, 6, 9, 10] |
| `southwestSide` | [3, 4, 7, 8, 11, 12] |
| `allLogs` | [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] |

`northeastSide` / `southwestSide` capture the classic Log Cabin diagonal split (the "light side" / "dark side" in quilt vernacular — but named structurally to avoid implying fabric properties).

**ring(i)** — returns the ring index (0 = center, 1 = innermost log ring, 3 = outermost). Used by future rule kinds; current templates rely on `namedSlot('ring1')` etc. but the method is mandated by the block interface and the design notes (§"Concentric / non-orthogonal neighbors").

**symmetryPairs(axis)** — Log Cabin's spiral is chiral (not reflection-symmetric). Return `[]` for all axes, like Rail Fence.

**rotationalSymmetryGroups(order)** — The spiral is also not geometrically rotational-symmetric (logs within a ring differ in shape/length). Omit the method entirely so the optional-method check in the rule kind treats it as "no groups." Templates use `all-same` per ring for the same effect, which reads honestly as a constraint instead of misnaming it as symmetry.

**rotation(i)** — Log Cabin has no stripe orientation (logs are solid-fill from the slot's fabric). Omit the method.

---

## Tasks

### T1: Add `log-cabin` to `BLOCKS`

**Files:** `sampler.html`

- [ ] **Step 1.** In `BLOCKS` ([sampler.html:819](sampler.html:819) — alongside `nine-patch` and `rail-fence`), append a new entry:

  ```js
  'log-cabin': {
    id: 'log-cabin',
    displayName: 'Log Cabin',
    slotCount: 13,
    dayOfWeek: 3, // Wednesday
    // Log Cabin: a center "hearth" + 3 concentric rings of 4 logs each.
    // The spiral construction makes each log one cell longer (on its long
    // axis) than the previous ring's log. 7×7 cell grid in 200×200 viewBox,
    // PAD=2, CELL=28, no gaps (the .slot stroke draws the log seams).
    //
    // Slot indices, by ring:
    //   0:  center C
    //   1-4: ring 1 — N1, E1, S1, W1 (1-cell, 2-cell, 2-cell, 3-cell)
    //   5-8: ring 2 — N2, E2, S2, W2 (3, 4, 4, 5 cells)
    //   9-12: ring 3 — N3, E3, S3, W3 (5, 6, 6, 7 cells)
    slotPath(i) {
      // Pre-computed rects per slot (see Phase 3c plan §Design for derivation).
      const RECTS = [
        { x: 86,  y: 86,  w: 28,  h: 28  }, // 0 C
        { x: 86,  y: 58,  w: 28,  h: 28  }, // 1 N1
        { x: 114, y: 58,  w: 28,  h: 56  }, // 2 E1
        { x: 86,  y: 114, w: 56,  h: 28  }, // 3 S1
        { x: 58,  y: 58,  w: 28,  h: 84  }, // 4 W1
        { x: 58,  y: 30,  w: 84,  h: 28  }, // 5 N2
        { x: 142, y: 30,  w: 28,  h: 112 }, // 6 E2
        { x: 58,  y: 142, w: 112, h: 28  }, // 7 S2
        { x: 30,  y: 30,  w: 28,  h: 140 }, // 8 W2
        { x: 30,  y: 2,   w: 140, h: 28  }, // 9 N3
        { x: 170, y: 2,   w: 28,  h: 168 }, // 10 E3
        { x: 30,  y: 170, w: 168, h: 28  }, // 11 S3
        { x: 2,   y: 2,   w: 28,  h: 196 }, // 12 W3
      ];
      return { type: 'rect', ...RECTS[i] };
    },
    // Edge-adjacency table (two slots are neighbors iff they share at
    // least one cell-edge). Note ring-1/ring-2 east logs touch one more
    // log than the corresponding north log — the spiral isn't symmetric.
    neighbors(i) {
      const ADJ = [
        [1, 2, 3, 4],          // 0  C
        [0, 2, 4, 5],          // 1  N1
        [0, 1, 3, 5, 6],       // 2  E1
        [0, 2, 4, 6, 7],       // 3  S1
        [0, 1, 3, 5, 7, 8],    // 4  W1
        [1, 2, 4, 6, 8, 9],    // 5  N2
        [2, 3, 5, 7, 9, 10],   // 6  E2
        [3, 4, 6, 8, 10, 11],  // 7  S2
        [4, 5, 7, 9, 11, 12],  // 8  W2
        [5, 6, 8, 10, 12],     // 9  N3
        [6, 7, 9, 11],         // 10 E3
        [7, 8, 10, 12],        // 11 S3
        [8, 9, 11],            // 12 W3
      ];
      return ADJ[i].slice();
    },
    // Log Cabin's spiral is chiral — no reflection symmetry.
    symmetryPairs(_axis) {
      return [];
    },
    // (no rotationalSymmetryGroups: the spiral isn't geometrically
    // rotation-symmetric either — logs in a ring have different shapes.
    // Templates that want "all logs in ring K same fabric" use the
    // all-same rule on namedSlot('ringK'), which reads honestly.)
    //
    // First real ring(i) implementation: center=0, inner ring=1, etc.
    ring(i) {
      if (i === 0) return 0;
      if (i <= 4)  return 1;
      if (i <= 8)  return 2;
      if (i <= 12) return 3;
      return undefined;
    },
    namedSlot(name) {
      const map = {
        center: 0,
        ring1: [1, 2, 3, 4],
        ring2: [5, 6, 7, 8],
        ring3: [9, 10, 11, 12],
        northLogs: [1, 5, 9],
        eastLogs:  [2, 6, 10],
        southLogs: [3, 7, 11],
        westLogs:  [4, 8, 12],
        // Cross axis groups (six logs each) — N+S, and E+W.
        northSouthLogs: [1, 3, 5, 7, 9, 11],
        eastWestLogs:   [2, 4, 6, 8, 10, 12],
        // Diagonal split (classic Log Cabin "light side" / "dark side").
        northeastSide: [1, 2, 5, 6, 9, 10],
        southwestSide: [3, 4, 7, 8, 11, 12],
        // Convenience: everything except the center.
        allLogs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      };
      return map[name];
    },
  },
  ```

- [ ] **Step 2. Verify in DevTools console** (before any template ships — Wednesdays still route to `null`, so this is sanity-only):

  ```js
  BLOCKS['log-cabin'].slotCount             // 13
  BLOCKS['log-cabin'].slotPath(0)           // { type: 'rect', x: 86, y: 86, w: 28, h: 28 }
  BLOCKS['log-cabin'].slotPath(12)          // { type: 'rect', x: 2, y: 2, w: 28, h: 196 }
  BLOCKS['log-cabin'].neighbors(0).sort()   // [1, 2, 3, 4]
  BLOCKS['log-cabin'].neighbors(4).sort()   // [0, 1, 3, 5, 7, 8]
  BLOCKS['log-cabin'].ring(0)               // 0
  BLOCKS['log-cabin'].ring(4)               // 1
  BLOCKS['log-cabin'].ring(12)              // 3
  BLOCKS['log-cabin'].namedSlot('ring2')    // [5, 6, 7, 8]
  BLOCKS['log-cabin'].namedSlot('northeastSide') // [1, 2, 5, 6, 9, 10]
  ```

- [ ] **Step 3. Smoke-test the renderer** with a synthetic fabric assignment. Don't commit this — it's a one-shot console probe.

  ```js
  // From the console, against a freshly loaded page:
  const host = document.getElementById('blockHost');
  const fbs = ['F_MADDER','F_CREAM','F_CREAM','F_CREAM','F_CREAM',
               'F_WELD','F_WELD','F_WELD','F_WELD',
               'F_WALNUT','F_WALNUT','F_WALNUT','F_WALNUT'];
  renderBlock(host, BLOCKS['log-cabin'], fbs, {});
  ```

  Visual check:
  - 13 rectangles arranged in the spiral pattern (center + 3 rings of 4 logs).
  - The center is a small square; logs grow outward in width/height per ring.
  - All four sides of the block touch the outer ring (logs N3/E3/S3/W3 form the outer frame).
  - No overlapping rectangles; no gaps inside the block; the slot strokes draw the log seams.
  - Reload to restore the actual puzzle.

- [ ] **Step 4. Verify Wednesdays still return `null`** until templates land (so today's Tuesday puzzle is untouched):

  ```js
  pickTemplateForDate('2026-05-20')  // null — no log-cabin templates yet
  pickTemplateForDate('2026-05-19')  // still a rail-fence template (today)
  ```

- [ ] **Step 5. Commit.** Message: `Add Log Cabin block (13 slots, 3 concentric rings, first real ring())`

---

### T2: Author Log Cabin Template A — "Hearth"

Three concentric rings around a warm center: warm hearth, cream halo, cool middle ring, dark outer. Solution family: 3 × 1 × 1 × 2 = **6 solutions**.

**Files:** `sampler.html`

- [ ] **Step 1. Append to `TEMPLATES`** (after the Rail Fence templates, ~[sampler.html:1125](sampler.html:1125)):

  ```js
  // Log Cabin Template A: "Hearth" — concentric ring values. The center
  // is a warm hearth, ring 1 is a cream halo around it, ring 2 is the
  // cool middle band (only forest qualifies as cool+medium), and ring 3
  // is dark (indigo or walnut). The player chooses which warm fabric
  // anchors the center and which dark fabric forms the outer wall.
  //
  // Six solutions: 3 warm × 1 light × 1 cool-medium × 2 dark.
  {
    id: 'log-cabin-hearth-v1',
    block: 'log-cabin',
    paletteFamily: 'heritage-warm',
    paletteSize: 6,
    solutionTarget: { min: 4, max: 6 },
    fabricRoles: {},
    rules: [
      { kind: 'positional', slot: 'center', constraint: { hue: 'warm' } },
      { kind: 'all-same',   slot: 'ring1' },
      { kind: 'positional', slot: 'ring1',  constraint: { value: 'light' } },
      { kind: 'all-same',   slot: 'ring2' },
      { kind: 'positional', slot: 'ring2',  constraint: { hue: 'cool', value: 'medium' } },
      { kind: 'all-same',   slot: 'ring3' },
      { kind: 'positional', slot: 'ring3',  constraint: { value: 'dark' } },
    ],
  },
  ```

- [ ] **Step 2. Verify uniqueness range.** In the console:

  ```js
  verifyTemplate('log-cabin-hearth-v1', ['2026-05-20', '2027-05-19'])
  // Expect: all 53 Wednesdays "in-range" (4–6 solutions), 0 too-few, 0 too-many.
  // Time it: console.time('lc-hearth'); verifyTemplate(...); console.timeEnd('lc-hearth');
  // Should complete in well under 30s for the year (13 slots × 6 fabrics with pruning).
  ```

  If any date reports `multiple` outside the target range, tighten or loosen a rule and re-verify. If the solver takes longer than a few seconds per template, surface that in the commit message — it's an early signal Sawtooth Star will need rule-specific pruning.

- [ ] **Step 3. Verify in browser.** Load `http://localhost:8000/sampler.html?date=2026-05-20` (the first Wednesday after launch) in a fresh browser (`localStorage.clear()` first). Today's Tuesday puzzle (Rail Fence) is unaffected.
  - The puzzle block should render as a Log Cabin spiral.
  - Rules panel shows the 7 rules in human language (no `[object Object]`).
  - Paint mode works: tap a fabric, tap a log, fill spreads.
  - Provoke a violation (paint two ring-1 logs different fabrics) → `.violation` styling applies to all filled ring-1 logs.
  - Solve to completion; reveal animation runs; completion overlay reads "You found pattern N of 6 — a Wednesday Log Cabin in M:SS."
  - Use the find-another flow to surface a second solution.

- [ ] **Step 4. Commit.** Message: `Add Log Cabin Template A (Hearth — concentric ring values)`

---

### T3: Author Log Cabin Template B — "Light/Dark Diagonal"

Classic Log Cabin two-tone: cream center, NE half all-same warm, SW half all-same cool. Solution family: 1 × 3 × 2 = **6 solutions**.

**Files:** `sampler.html`

- [ ] **Step 1. Append to `TEMPLATES`:**

  ```js
  // Log Cabin Template B: "Light/Dark Diagonal" — the classic two-tone
  // pattern. Cream anchors the center; the northeast diagonal half (N
  // and E logs across all three rings, 6 slots) is one warm fabric; the
  // southwest half (S and W logs, 6 slots) is one cool fabric. The
  // diagonal split is the signature Log Cabin look.
  //
  // Six solutions: 1 center × 3 warm × 2 cool.
  {
    id: 'log-cabin-light-dark-v1',
    block: 'log-cabin',
    paletteFamily: 'heritage-warm',
    paletteSize: 6,
    solutionTarget: { min: 4, max: 6 },
    fabricRoles: { CENTER: 'F_CREAM' },
    rules: [
      { kind: 'positional', slot: 'center', constraint: { fabricId: 'ROLE:CENTER' } },
      { kind: 'all-same',   slot: 'northeastSide' },
      { kind: 'positional', slot: 'northeastSide', constraint: { hue: 'warm' } },
      { kind: 'all-same',   slot: 'southwestSide' },
      { kind: 'positional', slot: 'southwestSide', constraint: { hue: 'cool' } },
    ],
  },
  ```

- [ ] **Step 2. Verify uniqueness range:**

  ```js
  verifyTemplate('log-cabin-light-dark-v1', ['2026-05-20', '2027-05-19'])
  // Expect: 53/53 in-range (target 4–6).
  ```

- [ ] **Step 3. Verify in browser.** The first Wednesday picks Template A (pool index 0, week 0). To play Template B before week 1, temporarily comment out Template A and reload `?date=2026-05-20`; or simply jump forward via the archive UI to the second Wednesday after launch (2026-05-27).
  - Block renders with NE half (N1+E1+N2+E2+N3+E3) all the same warm fabric and SW half (S1+W1+S2+W2+S3+W3) all the same cool fabric.
  - Rules panel reads naturally — "All northeast side must be warm fabrics," etc.

- [ ] **Step 4. Commit.** Message: `Add Log Cabin Template B (Light/Dark Diagonal — classic two-tone)`

---

### T4: Author Log Cabin Template C — "Cross"

N/S cross-axis vs E/W cross-axis differentiation: cream center, N+S logs dark, E+W logs medium. Solution family: 1 × 2 × 3 = **6 solutions**.

**Files:** `sampler.html`

- [ ] **Step 1. Append to `TEMPLATES`:**

  ```js
  // Log Cabin Template C: "Cross" — orthogonal cross-axis pattern. Cream
  // center; the six north-south logs (top + bottom across all three
  // rings) share one dark fabric; the six east-west logs share one
  // medium fabric. Reads as a plus sign through the block.
  //
  // Six solutions: 1 center × 2 dark × 3 medium.
  {
    id: 'log-cabin-cross-v1',
    block: 'log-cabin',
    paletteFamily: 'heritage-warm',
    paletteSize: 6,
    solutionTarget: { min: 4, max: 6 },
    fabricRoles: { CENTER: 'F_CREAM' },
    rules: [
      { kind: 'positional', slot: 'center', constraint: { fabricId: 'ROLE:CENTER' } },
      { kind: 'all-same',   slot: 'northSouthLogs' },
      { kind: 'positional', slot: 'northSouthLogs', constraint: { value: 'dark' } },
      { kind: 'all-same',   slot: 'eastWestLogs' },
      { kind: 'positional', slot: 'eastWestLogs',   constraint: { value: 'medium' } },
    ],
  },
  ```

- [ ] **Step 2. Verify uniqueness range:**

  ```js
  verifyTemplate('log-cabin-cross-v1', ['2026-05-20', '2027-05-19'])
  // Expect: 53/53 in-range (target 4–6).
  ```

- [ ] **Step 3. Verify in browser.** Same approach as T3 — jump to the third Wednesday after launch (2026-06-03) for week 2, or comment out earlier templates briefly to force Template C on 2026-05-20.
  - Block renders with N+S logs uniformly dark, E+W logs uniformly medium, center cream.
  - Confirm `medium` fabrics include `F_FOREST` (cool-medium) — players can pick forest for the E+W ring even though the broader template otherwise reads warm/neutral.

- [ ] **Step 4. Commit.** Message: `Add Log Cabin Template C (Cross — N/S vs E/W axis split)`

---

## Cross-task verification (after T4)

End-to-end smoke check on a fresh browser:

1. `localStorage.clear()`; reload `?date=2026-05-19` (today, Tuesday). Today's Rail Fence puzzle plays normally — Phase 3a/3b unaffected.
2. Reload `?date=2026-05-20` (first Wednesday after launch). The puzzle is now Log Cabin Template A ("Hearth"). Block renders as a 13-slot spiral.
3. Paint mode works: select fabric → tap log → fill. Rules panel describes 7 rules in natural English.
4. Provoke an `all-same` violation (paint two ring-1 logs different fabrics) → both filled ring-1 logs get the `.violation` styling on `<rect>` slots.
5. Solve the puzzle. Reveal animation runs. Completion overlay reads "You found pattern N of 6 — a Wednesday Log Cabin in M:SS."
6. Trigger find-another → board clears, timer resets, prior solution preserved in `game.solutionsFound`.
7. Open the archive overlay. Wednesday cells from 2026-05-20 onward are clickable (no "no puzzle yet" overlay). Mon/Tue cells continue to work; Thu–Sun cells continue to show "no puzzle yet."
8. Share → clipboard contains "Sampler · May 20, 2026 · Log Cabin — pattern N of 6 · M:SS".
9. Inspect storage: `JSON.parse(localStorage.sampler_daily_v2).byDate['2026-05-20']` has `block: 'log-cabin'`, `templateId: 'log-cabin-hearth-v1'`, `totalSolutions: 6`, `solutionsFound: [...]`.
10. Cycle through several Wednesdays via the archive (2026-05-20, 2026-05-27, 2026-06-03, ...) — each routes to the next template in the 3-template pool, returning to A on the fourth Wednesday.

**Update the running design notes** at `docs/superpowers/notes/sampler-design-notes.md`:

- Move the bullet "**Phase 3c — Log Cabin (Wednesday block)** ← *next up*" to the shipped list and prefix with ✓ (with a brief one-liner: "shipped: 13-slot spiral, 3 concentric-ring templates, first real `ring(i)`").
- Update §"Concentric / non-orthogonal neighbors" — mark the `ring(i)` partial-✓ as fully ✓ with a Phase 3c date stamp ("✓ 2026-05-19 — real `ring(i)` shipped with Log Cabin").
- In the engine-state table under §"Multi-solution puzzles", add three rows for Wed w0–w2 (Hearth / Light-Dark / Cross).
- Set "next up" to **Phase 3d — Churn Dash (Thursday block)** in the Current status section.

---

## Critical files reference

- [sampler.html](sampler.html) — entire game (modify in place)
  - BLOCKS: [sampler.html:819](sampler.html:819) (append `log-cabin` after `rail-fence`)
  - Fabric registry: [sampler.html:752](sampler.html:752)–765
  - Palette families: [sampler.html:768](sampler.html:768)–770
  - TEMPLATES: append after the Rail Fence templates (~[sampler.html:1125](sampler.html:1125))
  - pickTemplateForDate: [sampler.html:1170](sampler.html:1170)–1182 (no changes — already filters by `dayOfWeek`)
  - solve / verifyTemplate: [sampler.html:1197](sampler.html:1197)–1270
  - renderBlock: [sampler.html:1316](sampler.html:1316)–1351 (no changes — already handles rect slots)
  - RULE_KINDS: [sampler.html:1682](sampler.html:1682)–2012 (no changes — `all-same`, `positional`, `count` all in place)
- [docs/superpowers/specs/2026-05-18-sampler-design.md](docs/superpowers/specs/2026-05-18-sampler-design.md) — full spec
- [docs/superpowers/notes/sampler-design-notes.md](docs/superpowers/notes/sampler-design-notes.md) — running notes (UPDATE per cross-task verification)
- [docs/superpowers/plans/2026-05-19-sampler-phase3a-rail-fence.md](docs/superpowers/plans/2026-05-19-sampler-phase3a-rail-fence.md) — prior plan style reference

## Out of scope (later phases)

- Churn Dash, Sawtooth Star, Dresden Plate blocks and templates.
- `connectivity` rule kind (BFS-based with indeterminate state). Could give Log Cabin a "warm logs form one connected ring" template — but the design needs `indeterminate` support first.
- Rule-specific pruning for non-count rules. Phase 3c is a content phase; if `verifyTemplate` on Log Cabin templates is slow (>5s per template per year), surface it as a follow-up rather than fixing in this phase.
- A second palette family. Heritage-warm continues to serve all three weekday blocks. Plan to add winter-forest or summer-meadow once Sawtooth Star / Dresden Plate are in play and the week needs visual variety.
- Templates that exercise `ring(i)` directly (e.g. "fabric uniqueness across rings"). Templates here use `namedSlot('ringN')` which is sufficient.
