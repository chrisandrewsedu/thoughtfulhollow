# Sampler — Phase 3a Implementation Plan (Rail Fence + foundations)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Final repo location:** save this file as `docs/superpowers/plans/2026-05-19-sampler-phase3a-rail-fence.md` when execution begins.

## Context

Phase 1+2 shipped Nine-Patch (Mon block), three templates, archive calendar, and full daily/storage parity with Glossari. The Sampler design (`docs/superpowers/specs/2026-05-18-sampler-design.md` §14) plans Phase 3 as four mid-week blocks (Rail Fence, Log Cabin, Churn Dash, Sawtooth Star) plus the `pattern-property` rule kind.

**This plan is Phase 3a:** the smallest meaningful slice — **Rail Fence only**, gated behind three foundational refactors flagged in `docs/superpowers/notes/sampler-design-notes.md`:

1. `slotRect → slotPath` (renderer can emit non-rect geometry; required before Churn Dash).
2. Solver pruning via `stillPossible` (current "cheap prune" doesn't catch under-budget count rules; required before 16-slot Sawtooth Star to keep `verifyTemplate` fast).
3. `rotationalSymmetryGroups(order)` + `ring(i)` block-interface additions (required before Log Cabin / Dresden Plate).

Phase 3b (Log Cabin + Churn Dash + Sawtooth Star, plus their templates) is deferred to a separate plan. The point of 3a is to prove the new interfaces by extending the game to **one** new block end-to-end. Rail Fence is the lowest-risk extension (still a grid; introduces direction-aware fabric rendering).

**Goal:** Ship Sampler with two playable days — Mondays continue to serve Nine-Patch templates; Tuesdays serve Rail Fence templates. Foundations land cleanly enough that Phase 3b is a content-authoring exercise, not another refactor.

**Architecture:** Single static file `sampler.html`. Vanilla HTML/CSS/JS, no build step. All changes are additive to the existing file, plus three targeted refactors at the interface boundary.

**Spec:** `docs/superpowers/specs/2026-05-18-sampler-design.md`
**Running notes:** `docs/superpowers/notes/sampler-design-notes.md`
**Prior phase plan (reference style):** `docs/superpowers/plans/2026-05-18-sampler-phase1-and-2.md`

---

## Testing approach (read first)

Same as Phase 1+2: no test framework, no build. Each task ends with **manual browser verification** at `http://localhost:8000/sampler.html`.

```bash
python3 -m http.server 8000
```

Open DevTools → Application → Local Storage to inspect `sampler_daily_v1`. Use `localStorage.clear()` between tasks if needed. Open DevTools Console for `verifyTemplate(...)` and ad-hoc inspection.

**Commit after each verified task.** Each task is a clean atomic commit on `claude/compassionate-mccarthy-96496d` (the current branch).

---

## Ordering constraint (load-bearing)

The user picked: **weekday-pool refactor (T10) lands LAST**, after Rail Fence templates exist. Today (2026-05-19) is `LAUNCH_DATE` and a Tuesday — if T10 lands before T7–T9, today has no puzzle.

Foundations and Rail Fence build-out are interleaved so each refactor gets verified against working content before the next refactor lands. The strict order:

```
T1 slotPath refactor   →  Nine-Patch still renders
T2 pruning stillPossible →  Nine-Patch templates still verify-unique
T3 Rail Fence skeleton →  proves slotPath is generic
T4 Rail Fence stripes  →  rendering target validated
T5 rotational-symmetry rule (uses new block method)
T6 pattern-property rule (effective-direction operator only)
T7 Template A          →  verifyTemplate passes
T8 Template B          →  verifyTemplate passes
T9 Template C          →  verifyTemplate passes
T10 weekday-pool refactor + dayOfWeek on blocks  ← only now do Tuesdays start mapping to Rail Fence
```

---

## Tasks

### T1: Refactor `slotRect → slotPath`; update renderer; class-only CSS

**Files:** `sampler.html`

- [ ] **Step 1.** In `BLOCKS['nine-patch']` ([sampler.html:710](sampler.html:710)–751), rename `slotRect(i)` → `slotPath(i)` returning `{ type: 'rect', x, y, w, h }`. Keep the same coordinate math.
- [ ] **Step 2.** In `renderBlock` ([sampler.html:956](sampler.html:956)–992), switch on `slotPath(i).type`:
  - `'rect'` → emit `<rect>` (existing path).
  - `'polygon'` → emit `<polygon points="x1,y1 x2,y2 ...">` (uses `path.points`).
  - `'path'` → emit `<path d="...">` (uses `path.d`).
  All three carry the same `.slot` class, `data-slot-index`, event wiring, and `fill="url(#fabricId)"` (or empty-state fill).
- [ ] **Step 3.** Update CSS at [sampler.html:185](sampler.html:185)–194:
  - `.slot { ... }` (base) — no element selector.
  - `.slot.selected { ... }`, `.slot.violation { ... }` — class-only so they target `<rect>`, `<polygon>`, and `<path>` uniformly.
  - `.slot-label` rules ([sampler.html:194](sampler.html:194)) stay as-is.
- [ ] **Step 4. Verify.** Reload `localhost:8000/sampler.html`. Play today's puzzle:
  - All 9 Nine-Patch slots render.
  - Selecting a fabric and clicking a slot fills it with the pattern.
  - Tapping an empty slot shows the selected highlight (stroke style).
  - Provoke a violation (paint two centers wrong — break a positional rule) and confirm the violation highlight renders.
- [ ] **Step 5. Commit.** Message: `Refactor BLOCKS slot geometry: slotRect → slotPath`

---

### T2: Solver pruning via `stillPossible` (count rule only)

**Files:** `sampler.html`

- [ ] **Step 1. Document the pruning contract.** Add a block comment above `RULE_KINDS` (~[sampler.html:1250](sampler.html:1250)):

  ```
  // Rule verify() contract:
  //   verify(rule, fabricBySlot, block, fabricsById) →
  //     { satisfied: bool, violatingSlots: Set<int>, stillPossible: bool }
  //
  // stillPossible = false means "no completion of fabricBySlot can satisfy this rule."
  // The solver uses this for forward pruning. Rules that can't cheaply look ahead
  // should return stillPossible: true (a safe default — equivalent to no extra pruning).
  ```

- [ ] **Step 2. Update existing rule kinds.** Each `verify` in `RULE_KINDS` ([sampler.html:1251](sampler.html:1251)–1363) returns `stillPossible: true` for now, except `count`:
  - `count.verify` ([sampler.html:1261](sampler.html:1261)) computes `slotsRemaining = block.slotCount − filledCount`.
  - If `rule.max !== undefined && matched > rule.max` → `stillPossible: false`.
  - If `rule.min !== undefined && matched + slotsRemaining < rule.min` → `stillPossible: false`.
  - Otherwise `stillPossible: true`.
- [ ] **Step 3. Wire into `solve`** ([sampler.html:887](sampler.html:887)–918). After the existing violation check at line ~906, also check `if (!result.stillPossible) return; // prune` for each rule's result. Don't add `stillPossible` checks inside `evaluateRules` for the live UI — pruning is solver-only. Easiest pattern: have `solve` re-evaluate rules itself (it already does for the violation check) and inspect both flags.
- [ ] **Step 4. Verify.**
  - In console: `verifyTemplate('nine-patch-greek-cross-v1', ['2026-06-01','2026-06-30'])` → must still report all-unique (no regressions).
  - Repeat for `nine-patch-diagonal-v1` and `nine-patch-warm-cool-v1`.
  - Time at least one with `console.time('verify')`/`console.timeEnd('verify')` — expect equal-or-faster than before (don't optimize harder unless trivially obvious).
- [ ] **Step 5. Commit.** Message: `Solver pruning: rule verify() returns stillPossible (count rule only)`

---

### T3: Rail Fence block skeleton

**Files:** `sampler.html`

- [ ] **Step 1. Add `'rail-fence'` to `BLOCKS`** ([sampler.html:710](sampler.html:710)–751 region). Block shape:
  - `id: 'rail-fence'`, `displayName: 'Rail Fence'`, `slotCount: 12`.
  - **Layout: 4 rows × 3 cols** in the 200×200 viewBox. Slot width 60, gap 4, x-offset 10, y-offset 10. (4 rows × (45+4) = 196 ≈ viewBox; tune the heights to fit cleanly — recommend slot height 45 to keep the block tighter vertically, or 4 rows of 47 slot height with 2px gap. Pick visually balanced; not load-bearing.)
  - `slotPath(i)` → `{ type: 'rect', x, y, w, h }`.
  - `neighbors(i)` → standard grid 4-connectivity (up/down/left/right within 4×3).
  - `rotation(i)` → **per-row alternation:** rows 0 and 2 return `0` (horizontal stripes); rows 1 and 3 return `90` (vertical stripes). Row of slot `i` = `Math.floor(i / 3)`.

    > **Future note:** if play-testing shows per-row stripes feel monotonous, switch to per-cell checkerboard rotation: `rotation = ((row + col) % 2) * 90`. Keep this rotation function localized to the block definition so the swap is one-line.
  - `symmetryPairs(axis)` → vertical reflection mirrors col-0 with col-2 each row; horizontal mirrors row-0 with row-3 and row-1 with row-2.
  - `rotationalSymmetryGroups(order)` → for `order === 2` only, return pairs of slots related by 180° rotation around block center: `[[0,11],[1,10],[2,9],[3,8],[4,7],[5,6]]`. For other orders, return `[]` (4×3 has no clean rotational symmetry of order > 2).
  - `namedSlot(name)` → support `'leftColumn'` → `[0,3,6,9]`, `'rightColumn'` → `[2,5,8,11]`, `'middleColumn'` → `[1,4,7,10]`, `'topRow'` → `[0,1,2]`, `'bottomRow'` → `[9,10,11]`. Add 'corners' → `[0,2,9,11]` and 'center' (skip — no single center in a 4×3).
  - `ring(i)` → return `undefined` (Rail Fence has no rings; real impl ships with Log Cabin).
- [ ] **Step 2. Verify.** In DevTools console:
  ```js
  BLOCKS['rail-fence'].slotCount  // 12
  BLOCKS['rail-fence'].slotPath(0).type  // 'rect'
  BLOCKS['rail-fence'].rotation(0)  // 0
  BLOCKS['rail-fence'].rotation(3)  // 90
  BLOCKS['rail-fence'].rotationalSymmetryGroups(2)  // [[0,11],[1,10],...]
  BLOCKS['rail-fence'].namedSlot('leftColumn')  // [0,3,6,9]
  ```
- [ ] **Step 3. Commit.** Message: `Add Rail Fence block skeleton (geometry + interface, no rendering yet)`

---

### T4: Rail Fence stripe renderer

**Files:** `sampler.html`

- [ ] **Step 1. Extend `renderBlock`** ([sampler.html:956](sampler.html:956)–992) so after the slot's filled shape is drawn, *if `block.rotation` exists*, overlay 2 thin stripe-divider `<line>`s inside the slot's bounding box:
  - Determine effective direction: `slotRotation = block.rotation(i)`. Fabric direction is already in metadata. The **stripe orientation** the player perceives = the slot's `rotation` (the slot decides whether stripes are horizontal or vertical). Fabric direction is a separate concept used by rules (T6).
  - For `rotation === 0` (horizontal stripes): two horizontal `<line>` at y = slot.y + h/3 and y = slot.y + 2h/3, from x to x+w.
  - For `rotation === 90` (vertical stripes): two vertical `<line>` at x = slot.x + w/3 and x = slot.x + 2w/3, from y to y+h.
  - Stroke: `var(--ink-soft)`, stroke-width `0.75`, opacity `0.6`. Tweak visually. CSS class `.stripe-divider`.
- [ ] **Step 2. Add CSS** near the existing `.slot` rules:
  ```css
  .stripe-divider { pointer-events: none; }
  ```
- [ ] **Step 3. Manual smoke test.** Use the console to swap the live block: open a Nine-Patch puzzle, then run:
  ```js
  // ad-hoc: do not commit any wiring change in this step
  const blk = BLOCKS['rail-fence'];
  const fbs = Array(12).fill('F_MADDER');
  renderBlock(document.querySelector('.block'), blk, fbs, {});
  ```
  Visual check: 12 madder rectangles in 4×3 grid with stripe dividers; rows 0 and 2 have horizontal divider lines; rows 1 and 3 have vertical divider lines. After confirming, reload to restore Nine-Patch.
- [ ] **Step 4. Verify Nine-Patch is unaffected.** Nine-Patch's `BLOCKS['nine-patch']` has no `rotation` method, so the stripe overlay must be conditional on `typeof block.rotation === 'function'`. Reload, play Nine-Patch — no stripe lines should appear over Nine-Patch slots.
- [ ] **Step 5. Commit.** Message: `Render Rail Fence stripe overlays in renderBlock (gated on block.rotation)`

---

### T5: `rotational-symmetry` rule kind

**Files:** `sampler.html`

- [ ] **Step 1. Add to `RULE_KINDS`** ([sampler.html:1250](sampler.html:1250)–1364, append after `symmetry` at ~1363):
  ```js
  'rotational-symmetry': {
    describe(rule) {
      return `Block has ${rule.order}-fold rotational symmetry.`;
    },
    verify(rule, fabricBySlot, block) {
      const groups = block.rotationalSymmetryGroups
        ? block.rotationalSymmetryGroups(rule.order) : [];
      const violations = new Set();
      let satisfied = true;
      for (const group of groups) {
        const fabrics = group.map(i => fabricBySlot[i]);
        const filled = fabrics.filter(Boolean);
        if (filled.length < 2) continue;
        const allSame = filled.every(f => f === filled[0]);
        if (!allSame) {
          satisfied = false;
          group.forEach(i => violations.add(i));
        }
      }
      return { satisfied, violatingSlots: violations, stillPossible: true };
    }
  }
  ```
- [ ] **Step 2. Verify.** In console after loading a Nine-Patch puzzle:
  ```js
  // Nine-Patch is square — synthetic 4-fold corners group works
  const blk = BLOCKS['nine-patch'];
  blk.rotationalSymmetryGroups = (order) => order === 4 ? [[0,2,8,6]] : [];
  const rk = RULE_KINDS['rotational-symmetry'];
  rk.verify({order:4}, ['F_A',null,'F_A',null,null,null,'F_A',null,'F_A'], blk);
  // → { satisfied: true, ... }
  rk.verify({order:4}, ['F_A',null,'F_B',null,null,null,'F_A',null,'F_A'], blk);
  // → { satisfied: false, violatingSlots: Set{0,2,6,8} }
  ```
  Then reload to clear the monkey-patch.
- [ ] **Step 3. Commit.** Message: `Add rotational-symmetry rule kind using block.rotationalSymmetryGroups`

---

### T6: `pattern-property` rule kind (effective-direction operator)

**Files:** `sampler.html`

- [ ] **Step 1. Add to `RULE_KINDS`.** Initial scope: one operator — `effective-direction`. The effective direction = direction the player visually sees, which is the slot's rotation if the fabric carries a `direction`; null if the fabric has no direction property (rule treats null-direction fabrics as not constrained).
  ```js
  'pattern-property': {
    describe(rule) {
      if (rule.property === 'effective-direction') {
        const target = rule.value;
        return `All ${describeConstraint(rule.slotConstraint)} must run ${target}.`;
      }
      return 'Pattern-property rule.';
    },
    verify(rule, fabricBySlot, block, fabricsById) {
      if (rule.property !== 'effective-direction') {
        return { satisfied: true, violatingSlots: new Set(), stillPossible: true };
      }
      const violations = new Set();
      let satisfied = true;
      for (let i = 0; i < block.slotCount; i++) {
        const fid = fabricBySlot[i];
        if (!fid) continue;
        if (!slotMatchesConstraint(i, rule.slotConstraint, fabricBySlot, block, fabricsById)) continue;
        const fabric = fabricsById[fid];
        if (!fabric.direction) continue; // unconstrained
        // Effective direction = the rotation of stripes the player sees in this slot.
        // For Rail Fence: slot.rotation() (0 means horizontal stripes, 90 means vertical).
        // Fabric direction is "horizontal" or "vertical" (intrinsic to the SVG pattern).
        // Effective = fabric.direction rotated by slot.rotation.
        const slotRot = (block.rotation ? block.rotation(i) : 0);
        const eff = effectiveDirection(fabric.direction, slotRot);
        if (eff !== rule.value) {
          satisfied = false;
          violations.add(i);
        }
      }
      return { satisfied, violatingSlots: violations, stillPossible: true };
    }
  }
  ```
- [ ] **Step 2. Add helpers** near the rule kinds:
  ```js
  function effectiveDirection(fabricDir, slotRotationDeg) {
    // fabricDir: 'horizontal' | 'vertical' | 'diagonal' | null
    // slotRotationDeg: 0 or 90 (only values used today)
    if (!fabricDir) return null;
    if (slotRotationDeg === 0) return fabricDir;
    if (slotRotationDeg === 90) {
      if (fabricDir === 'horizontal') return 'vertical';
      if (fabricDir === 'vertical') return 'horizontal';
      return fabricDir; // diagonal stays diagonal (approximation)
    }
    return fabricDir;
  }
  function slotMatchesConstraint(i, constraint, fabricBySlot, block, fabricsById) {
    // Existing constraint-matcher logic — extract from count.verify if needed,
    // or call shared helper if one already exists. Same shape: matches by motif/hue/value/etc.
  }
  ```
  Check if a constraint-matcher helper already exists in sampler.html (likely inline in `count` and `positional`). If yes, refactor that into a shared `slotMatchesConstraint` used by all three rule kinds in this step. If no, inline a minimal version that handles `{hue, motif, value, scale}` keys.
- [ ] **Step 3. Verify.** Console smoke test against a hand-built fabric assignment.
- [ ] **Step 4. Commit.** Message: `Add pattern-property rule kind (effective-direction operator only)`

---

### T7: Author Rail Fence Template A (warm-cool by column)

**Files:** `sampler.html`

- [ ] **Step 1. Add to `TEMPLATES`** ([sampler.html:761](sampler.html:761)–823 region):
  ```js
  {
    id: 'rail-fence-warm-cool-columns-v1',
    block: 'rail-fence',
    paletteFamily: 'heritage-warm',
    paletteSize: 6,
    fabricRoles: { WARM_A: null, WARM_B: null, COOL_A: null, COOL_B: null },
    rules: [
      { kind: 'positional', slot: 'leftColumn', constraint: { hue: 'warm' } },
      { kind: 'positional', slot: 'rightColumn', constraint: { hue: 'cool' } },
      { kind: 'count', constraint: { hue: 'warm' }, exact: 8 },
      // Add one more constraint as needed to force uniqueness — author-tune.
    ]
  }
  ```
- [ ] **Step 2. Tune rules until unique.** Use the console:
  ```js
  verifyTemplate('rail-fence-warm-cool-columns-v1', ['2026-05-19','2027-05-19'])
  ```
  Iterate: if any date shows `multiple` solutions, tighten a rule. If any shows `none`, loosen. Goal: **all dates unique.**
- [ ] **Step 3. Verify in browser.** Temporarily wire a route to force this template — easiest via console: `localStorage.setItem('sampler_force_template','rail-fence-warm-cool-columns-v1')` and add a 3-line bootstrap override (don't commit this override; just play once to confirm visual + completion flow). Or open `?date=2026-05-26` (which will route to Rail Fence after T10 lands) and verify after T10.
- [ ] **Step 4. Commit.** Message: `Add Rail Fence Template A (warm-cool by column)`

---

### T8: Author Rail Fence Template B (direction-aware)

**Files:** `sampler.html`

- [ ] **Step 1. Add a Template B** using the new `pattern-property` rule. Example shape:
  ```js
  {
    id: 'rail-fence-stripe-direction-v1',
    block: 'rail-fence',
    paletteFamily: 'heritage-warm',
    paletteSize: 6,
    fabricRoles: { ANCHOR: null },
    rules: [
      { kind: 'pattern-property', property: 'effective-direction',
        slotConstraint: { motif: 'stripe' }, value: 'vertical' },
      { kind: 'count', constraint: { motif: 'stripe' }, min: 4, max: 6 },
      { kind: 'symmetry', axis: 'vertical' },
    ]
  }
  ```
  > **Note:** F_INDIGO is currently the only striped fabric. If templates need richer striped fabrics, that's Phase 3b territory — for Phase 3a, ensure paletteFamily contains at least one striped fabric and let other Rail Fence templates lean on count/positional/symmetry rules. Author-tune the rule set to taste.
- [ ] **Step 2. Verify uniqueness.** `verifyTemplate('rail-fence-stripe-direction-v1', ...)` across a year of Tuesdays.
- [ ] **Step 3. Commit.** Message: `Add Rail Fence Template B (effective-direction)`

---

### T9: Author Rail Fence Template C (2-fold rotational symmetry)

**Files:** `sampler.html`

- [ ] **Step 1. Add a Template C** using `rotational-symmetry`:
  ```js
  {
    id: 'rail-fence-rotational-v1',
    block: 'rail-fence',
    paletteFamily: 'heritage-warm',
    paletteSize: 6,
    fabricRoles: { ANCHOR: null },
    rules: [
      { kind: 'rotational-symmetry', order: 2 },
      { kind: 'count', constraint: { hue: 'warm' }, exact: 6 },
      { kind: 'positional', slot: 'corners', constraint: { motif: 'solid' } },
    ]
  }
  ```
- [ ] **Step 2. Verify uniqueness** across a year of Tuesdays.
- [ ] **Step 3. Commit.** Message: `Add Rail Fence Template C (rotational symmetry order 2)`

---

### T10: Weekday-pool selection in `pickTemplateForDate` + `dayOfWeek` on blocks

**Files:** `sampler.html`

- [ ] **Step 1. Add `dayOfWeek` to each block definition.**
  - `BLOCKS['nine-patch'].dayOfWeek = 1` (Monday).
  - `BLOCKS['rail-fence'].dayOfWeek = 2` (Tuesday).
- [ ] **Step 2. Refactor `pickTemplateForDate`** ([sampler.html:868](sampler.html:868)–877):
  ```js
  function pickTemplateForDate(dateStr) {
    if (dateStr < LAUNCH_DATE) return null;
    const weekday = new Date(dateStr + 'T00:00:00Z').getUTCDay(); // 0=Sun..6=Sat
    const pool = TEMPLATES.filter(t => BLOCKS[t.block]?.dayOfWeek === weekday);
    if (pool.length === 0) return null;
    // Cycle within pool by weeks-since-launch
    const daysSince = dailyIndex(dateStr);
    const weeksSince = Math.floor(daysSince / 7);
    return pool[weeksSince % pool.length];
  }
  ```
- [ ] **Step 3. Update `hasPuzzleForDate`** so it returns `pickTemplateForDate(dateStr) !== null` (it may already do this — confirm; if not, align). Archive UI uses this to decide which calendar cells are clickable; it must not assume consecutive `dailyIndex` covers everything anymore.
- [ ] **Step 4. Verify across multiple weekdays:**
  - Today (`2026-05-19`, Tue) → must now return a Rail Fence template, not a Nine-Patch.
  - `2026-05-18` (Mon) → Nine-Patch.
  - `2026-05-20` (Wed) → `null` (no Wed templates yet — expected).
  - `2026-05-21` (Thu), `2026-05-22` (Fri), `2026-05-23` (Sat), `2026-05-24` (Sun) → all `null`.
  - `2026-05-25` (Mon, week 2) → next Nine-Patch in pool (different from 2026-05-18).
- [ ] **Step 5. Verify archive.** Open archive overlay; calendar cells for Mon/Tue dates should be playable, Wed–Sun should show "no puzzle yet" overlay (existing affordance from Phase 2). No JS errors in console while navigating months.
- [ ] **Step 6. Verify in-flight game.** Open `?date=2026-05-19` in a fresh browser (or after `localStorage.clear()`). Today's puzzle is now Rail Fence. Play to completion. Completion overlay shows "Tuesday Rail Fence" in the message body. Storage record at `sampler_daily_v1.byDate['2026-05-19']` has `block: 'rail-fence'`.
- [ ] **Step 7. Commit.** Message: `Weekday-pool template selection; Tuesdays now serve Rail Fence`

---

## Cross-task verification (after T10)

End-to-end smoke check on a fresh browser:

1. `localStorage.clear()`; reload.
2. Intro overlay → Begin → today's Rail Fence puzzle appears.
3. Block renders as 4×3 grid with stripe overlays alternating per row.
4. Paint mode works: select fabric, tap slot, fill spreads, rules panel updates live.
5. Rules panel describes the current template's rules in human language (no `[object Object]` etc).
6. Provoke a violation, confirm violation styling on `<rect>` slots (and confirm same styling would work on `<polygon>` if there were any).
7. Solve the puzzle; reveal animation runs; completion overlay shows "Tuesday Rail Fence" in headline.
8. Share → clipboard contains expected text with block name "Rail Fence."
9. Reload → already-played overlay appears with correct stats.
10. Open archive → today's cell shows Rail Fence completion; previous Monday's cells show Nine-Patch.

Update the running design notes at `docs/superpowers/notes/sampler-design-notes.md`:
- Mark "Phase 3 candidates §slotPath" as ✓ (handled).
- Mark "Solver scaling 2026-05-19" entry as ✓ (count rule covered; symmetry/positional/adjacency deferred to Phase 3b if profiling shows need).
- Mark "Concentric / non-orthogonal neighbors §ring(i)" as partially ✓ (interface stub added; real impl ships with Log Cabin).
- Add a note under "Phase 3 candidates §Direction-aware fabrics": "✓ 2026-05-19 — per-row rotation alternation chosen. `effective-direction = fabric.direction XOR slot.rotation`. Per-cell checkerboard option preserved as a one-line swap in `BLOCKS['rail-fence'].rotation`."

---

## Critical files reference

- [sampler.html](sampler.html) — entire game (modify in place)
  - Block defs: [sampler.html:710](sampler.html:710)–751
  - Fabric registry: [sampler.html:643](sampler.html:643)–656
  - Palette families: [sampler.html:659](sampler.html:659)–661
  - TEMPLATES: [sampler.html:761](sampler.html:761)–823
  - resolveRoleRefs: [sampler.html:825](sampler.html:825)–840
  - pickTemplateForDate: [sampler.html:868](sampler.html:868)–877
  - solve / verifyTemplate: [sampler.html:887](sampler.html:887)–947
  - renderBlock: [sampler.html:956](sampler.html:956)–992
  - renderAll: [sampler.html:1099](sampler.html:1099)–1112
  - RULE_KINDS: [sampler.html:1250](sampler.html:1250)–1364
  - evaluateRules: [sampler.html:1366](sampler.html:1366)–1378
  - CSS .slot rules: [sampler.html:185](sampler.html:185)–194
- [docs/superpowers/specs/2026-05-18-sampler-design.md](docs/superpowers/specs/2026-05-18-sampler-design.md) — full spec
- [docs/superpowers/notes/sampler-design-notes.md](docs/superpowers/notes/sampler-design-notes.md) — running notes (UPDATE at end per cross-task verification)
- [docs/superpowers/plans/2026-05-18-sampler-phase1-and-2.md](docs/superpowers/plans/2026-05-18-sampler-phase1-and-2.md) — prior plan style reference

## Out of scope (Phase 3b and later)

- Log Cabin, Churn Dash, Sawtooth Star blocks and templates.
- Real `ring(i)` implementation (returns indices of concentric Log Cabin rings).
- `connectivity` rule kind (BFS-based; needs `indeterminate` state for partial fill).
- Additional `pattern-property` operators beyond `effective-direction` (scale-uniformity, motif-uniformity, etc.).
- Rule-specific pruning for `positional`, `adjacency`, `symmetry`, `rotational-symmetry`, `pattern-property`. Add if Sawtooth Star's `verifyTemplate` is too slow.
- New palette families. `heritage-warm` continues to serve Phase 3a.
- Templates-identity shuffle (deferred — user did not pick it).
