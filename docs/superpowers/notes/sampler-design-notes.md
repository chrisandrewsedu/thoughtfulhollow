# Sampler — Running Design Notes

Cross-phase decisions and discoveries that affect future phases. The canonical design lives in [the spec](../specs/2026-05-18-sampler-design.md); this file captures execution-time learnings the spec didn't (and shouldn't) anticipate.

## How to use

- When working in any Sampler phase, if a decision has **ripple effects** on later phases, append a dated one-liner to the relevant section below.
- When starting a new phase's implementation plan, read in this order: **spec → all prior phase plans → this file → the actual code on `main`.**
- Resolve each note as it's addressed: prefix with ✓ when handled, ✗ when explicitly rejected, leave bare when still open.
- Date format: `YYYY-MM-DD`.

---

## Phase 3 candidates (Rail Fence · Log Cabin · Churn Dash · Sawtooth Star)

### Block-renderer contract — extension required

The Nine-Patch block in Phase 1 defines this interface:

```js
{
  id, displayName, slotCount,
  slotRect(i),            // returns {x, y, w, h}
  neighbors(i),           // returns int[]
  symmetryPairs(axis),    // returns [[a,b], ...]
  namedSlot(name),        // returns int or int[]
}
```

`slotRect` works for grid blocks but **breaks at Churn Dash** (introduces half-square triangles) and **completely fails at Dresden Plate** (radial wedges). Likely needed before merging Phase 3:

- ✓ 2026-05-19 — Phase 3a refactored `slotRect(i)` → `slotPath(i)` returning `{type:'rect'|'polygon'|'path', ...}`. `renderBlock` switches on type via `createSlotElement()` helper. CSS already class-only.
- ✓ 2026-05-19 — Selection/violation CSS is class-only (`.slot.selected`/`.slot.violation`), so it works uniformly across rect/polygon/path slots.

### Direction-aware fabrics — Rail Fence is the first user

Fabric metadata already includes `direction: 'horizontal' | 'vertical' | 'diagonal' | null`. Phase 1 has it on `F_INDIGO` (vertical stripe). No rule kind uses it yet.

- ✓ 2026-05-19 — Phase 3a settled this: fabric carries intrinsic `direction`, slot carries `rotation(i)` returning 0 or 90, renderer overlays 2 thin stripe-divider `<line>` elements per slot. Effective direction = `effectiveDirection(fabric.direction, slot.rotation)` (XOR of the two). New `pattern-property` rule kind with `effective-direction` operator consumes this. Per-row alternation chosen for Rail Fence; checkerboard preserved as a one-line swap in the block's `rotation(i)` body.

### Concentric / non-orthogonal neighbors

Log Cabin's natural adjacency is *radial*: each strip's neighbors are the previous and next ring, plus left/right within the ring. The `neighbors(i)` interface still works — it just returns a non-grid topology.

- 2026-05-18 — Log Cabin also wants a `ring(i)` accessor (`namedSlot('ring0')` returns center, `namedSlot('ring1')` returns the first ring, etc.) so rules like "ring 2 is all warm" are expressible. Add to the block interface as an optional method.
- partial ✓ 2026-05-19 — Phase 3a added `ring(i)` as an optional method on the block interface (Rail Fence returns `undefined`). Real implementation ships with Log Cabin in Phase 3b.

### Symmetry pairs — what's "symmetric" for radial blocks?

Nine-Patch has clean reflective symmetry (vertical/horizontal/diagonal). Log Cabin has rotational symmetry. Dresden Plate has rotational symmetry of order N (number of petals).

- ✓ 2026-05-19 — Phase 3a added `rotationalSymmetryGroups(order)` to both Nine-Patch (returns `[]`) and Rail Fence (order=2 returns 180° pairs). New `rotational-symmetry` rule kind consumes it. Templates with rotational symmetry now expressible.

### Spicy-tier rules — pattern-property and connectivity

Spec §6 defines these for Wed+ blocks but they don't exist yet. Implementation thoughts:

- **Pattern-property** (e.g., "all stripes must run the same direction"): scan filled slots, gather fabrics matching the constraint, check the named property is consistent. Same structure as `count` but the predicate is "values of property X are all equal" instead of "count is N."
- **Connectivity** (e.g., "warm colors form one connected region"): for each filled slot matching constraint, do a BFS over `neighbors(i)` restricted to other matching slots; assert exactly one component (and no isolated singletons unless explicitly allowed).
  - 2026-05-18 — Connectivity rules are nondeterministic during partial fill — an empty slot might or might not eventually contribute. The `evaluateRules` contract right now returns `{satisfied, violatingSlots}`; connectivity needs to gracefully say "not yet decidable" when partial. Suggest a third state: `{satisfied: false, violatingSlots, indeterminate: true}` and only highlight violations when `!indeterminate`.

---

## Phase 4 (Saturday — Dresden Plate)

### Radial slot geometry

Dresden Plate = a center circle + N petal wedges arranged in a ring. Petals are typically 16–20 in number. Each petal is a curved polygon.

- 2026-05-18 — Plan to use SVG `<path>` with arc commands for petal slots. The `slotPath` extension from Phase 3 is a prerequisite. Slot 0 = center, slots 1..N = petals.
- 2026-05-18 — The `block-svg` CSS rule `width: 100%; max-width: 360px;` works for square blocks. Dresden Plate's bounding box should also be square — design petal geometry to fit a 200×200 viewBox like Nine-Patch.

### Petal-adjacency is circular

`neighbors(i)` for petal i: `[i-1, i+1]` modulo N (and the center connects to all petals).

### Rule expressivity check before commit

Once Dresden Plate's geometry lands, run `verifyTemplate` across the templates to confirm they admit unique solutions. Radial blocks with rotational symmetry rules can easily over- or under-constrain — the solver tells you which.

---

## Phase 5 (Sunday — sampler quilt with sashing)

### Multi-block state

Sunday's puzzle is 4 blocks in a 2×2 grid separated by sashing strips. Game state from Phase 1 has a single `fabricBySlot` array; Sunday needs nested state.

- 2026-05-18 — Two options: (a) treat the entire Sunday composition as one big "sampler-quilt" block with ~50 slots, where slots 0..8 belong to "block 1", 9..17 to "block 2", etc., plus sashing slots. Pro: minimal engine change. Con: rules need slot-range awareness. (b) Add a true multi-block layer with `fabricBySlot[blockIdx][slotIdx]`. Pro: cleaner. Con: invasive change to `evaluateRules`, `renderBlock`, `solve`, etc. **Suggest (a)** — namespace via slot ranges. The `nameSlot('block1.center')` syntax becomes natural.

### Cross-block and sashing rule kinds

Both are spec §6 Sunday-only. Implementation:

- **Cross-block** — needs a way to express "fabric at block-1 slot 4 must equal fabric at block-3 slot 4." Probably a new rule kind `equality` with `{ slots: [a, b], must: true|false }`.
- **Sashing** — sashing slots are part of the same `fabricBySlot` array (under option (a) above). Rules referring to sashing use `namedSlot('sashing')` returning the sashing slot indices.

### Storage record shape

The Phase 1 storage record has `block: game.block.id`. For Sunday, `block` would be e.g. `'sampler-quilt-001'`. The shape is forward-compatible — no migration needed. But consider adding a `composition` field to the per-date record for Sunday puzzles listing the sub-blocks for archive UI ("you solved a sampler with a Log Cabin, a Sawtooth Star, ...").

### Layout breakout

Phase 1's `.app` is `max-width: 560–660px`. Sunday's composition with 4 blocks + sashing probably wants more horizontal room, or a more compact per-block scale. Decide when designing the Sunday renderer.

### Share string for non-grid blocks

Phase 1's share emoji grid is 3×3 from fabric hue. Sunday doesn't have a clean 3×3 mapping. Spec §13 flagged this as an open question:
- (a) every block reduces to a 3×3 fabric-hue summary regardless of geometry — simple, consistent share format
- (b) per-block share shape

Suggest (a) for Sunday: render a coarse 3×3 hue summary from each of the 4 sub-blocks, or a 4×4 grid of dominant-fabric-per-sub-block. Decide before Sunday templates ship.

---

## Phase 6 (polish & launch)

### Decisions to lock before public release

- **Final game name.** "Sampler" is working name; "Samplari" / "Esemplari" are candidates.
- **`LAUNCH_DATE`.** Set to the actual deploy date (and update archive subtitle "Sampler · since {date}").
- **Completion icon.** Phase 1 uses a generic SVG star. Design a proper Sampler glyph (perhaps a small quilt block).
- **Tutorial overlay.** Glossari has one; Sampler doesn't. First-time-player onboarding teaches paint mode, rules panel, the win condition. Match Glossari's tutorial idiom (sessionStorage flag `sampler_tutorial_seen`).
- **Cross-promo card to Glossari** on the completion screen. Glossari has nothing back to Sampler; consider symmetric promo on Glossari completion when Sampler launches.

### Accessibility audit

- Keyboard nav: tab through palette swatches, arrow keys to move slot focus, enter to paint.
- ARIA: slot rects need `role="button"` + `aria-label`; palette buttons need `aria-pressed`.
- Reduced-motion: respect `prefers-reduced-motion` for the reveal animation.

### Performance audit

- Profile solver on the largest weekday block once Sawtooth Star and Dresden Plate land. Target: < 100ms first-solution + uniqueness check on a mid-range mobile device (use DevTools throttling).
- If brute-force backtracking is too slow, upgrade to forward-checking or full arc consistency. Templates with tight rule sets prune aggressively, so this may not be needed.

---

## Cross-phase decisions

### Solver scaling

Phase 1's solver is **naive backtracking with rule-evaluation pruning**. For 9 slots × 6 fabrics = 10M raw assignments, well-pruned by rule violations. For 16 slots × 8 fabrics = 280 billion raw; pruning helps but may not be enough.

- 2026-05-18 — Profile on Sawtooth Star (16 slots) in Phase 3. If verifyTemplate over a year of dates takes > 30s per template, switch to forward checking. Don't optimize before measuring.
- ✓ 2026-05-19 — Phase 3a implemented `stillPossible` on the `verify()` contract. `count` rule has real forward-pruning (`matched > max` or `matched + slotsRemaining < min`). Other rules (positional/adjacency/symmetry/rotational-symmetry/pattern-property) return `stillPossible: violating.size === 0` since assigned-slot violations are permanent in solver context. Measured: warm-cool Nine-Patch verifyTemplate dropped from ~99ms to ~43ms over June 2026. Add per-rule predicates for other kinds if Sawtooth Star is slow.

### Template assignment is rotation-by-date-index, not pool-pick

`pickTemplateForDate` currently returns `TEMPLATES[dailyIndex(dateStr)]` (no modulo). This means templates are handed out in array order, one per day. Players who solve today can predict tomorrow's template *identity* (but not its palette, which date-seeds shuffle within the template).

- 2026-05-19 — Phase 3 / 4 consideration: shuffle template assignment using a seeded RNG keyed off some stable epoch, so the daily-day-of-week → template mapping isn't deducible. Or accept that template identity is predictable but rule details aren't.

### PRNG and seeding stability

`seedFromDate(dateStr + ':' + template.id)` and `mulberry32` are stable. **Don't change the seeding scheme** — players' past archive plays would silently re-roll. If the scheme MUST change, version the storage record so old completions stay valid.

### Storage shape forward-compatibility

The `sampler_daily_v1` shape has a `block` field per-date entry. This is enough for now. If Sunday introduces a `composition` field or new rule kinds add new result keys, version the key (`sampler_daily_v2`) and write a migration like Glossari's archive migration.

### Palette growth

Phase 1 ships one palette family (`heritage-warm`). Plan to add at least one new family per block in Phase 3, so the week has visual variety across blocks. Candidate families to author:

- `heritage-warm` — madder, cream, indigo, weld, forest, walnut (current)
- `winter-forest` — slate, cream, pine, charcoal, snow, oxblood
- `summer-meadow` — buttercup, sky, fern, dove, sunset, cream
- `autumn-leaves` — rust, ochre, walnut, sage, cream, smoke

Each family has 6–10 fabrics with their own SVG patterns. Authoring fabric SVG is real work — budget time for it.

### Template-authoring workflow

The user explicitly named "collaboration with the algorithm" as the model: author writes rule templates, solver verifies uniqueness. The `verifyTemplate(id, dateRange)` console function is the current author tool.

- 2026-05-18 — Eventually this wants a richer authoring UI (in-browser template editor with live verification + failure diagnostics). Out of scope until at least Phase 6. For now, JSON editing + console tool is fine.
- 2026-05-18 — When verifyTemplate reports failures, the failure message should name **which rule** is over- or under-constraining. The current implementation just reports counts. Improve before Phase 4 (when Saturday templates with 6+ entangled rules become hard to debug).
- 2026-05-19 — **Open bug discovered during Phase 3a:** `nine-patch-diagonal-v1` and `nine-patch-warm-cool-v1` both report `0 unique / 0 none / 30 multiple` under `verifyTemplate`. The breakage pre-dates Phase 3a (confirmed by running verifyTemplate against `HEAD~10`). Templates were authored without verification or the rules drifted. Mon-week-1 and Mon-week-2 currently serve non-unique puzzles. **Action:** re-author or tighten the two templates before Phase 3b ships. `nine-patch-greek-cross-v1` still verifies unique, so Mon week 0 is fine.

### Existing-file impact (cross-phase)

Touching `glossari.html` to add a cross-promo or to update the site footer is fair game during Phase 6. Avoid changing `glossari.html` in Phases 1–5.

### Archive of *both* games

Once Sampler ships, the site has two daily games with independent archives. Consider in Phase 6 whether to add a *unified* archive that shows both games' completions on one calendar. Not required for launch, but a likely user-requested feature.
