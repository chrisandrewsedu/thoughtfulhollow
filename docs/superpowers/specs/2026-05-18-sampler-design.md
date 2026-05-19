# Sampler — Design

**Date:** 2026-05-18
**Working name:** Sampler (final name TBD; "Samplari" / "Esemplari" are in the running)
**Scope:** New daily puzzle game for Thoughtful Hollow, shipping as a sibling to `glossari.html`
**Status:** Design draft — awaiting user review before implementation plan

---

## 1. Problem & premise

Thoughtful Hollow currently has one daily puzzle (Glossari, words). We want a second daily that is **non-word, craft-rooted, visually rich**, and a clear sibling — same site voice, same daily rhythm, distinct mechanic and aesthetic vocabulary.

**Premise:** A daily quilt-block puzzle. The player places fabric swatches into the slots of a real quilt block so that all stated rules are satisfied. The finished block is the reward — a small piece of pieced beauty the player made. Difficulty climbs Monday → Saturday in NYT-crossword fashion. Sunday is a marquee multi-block sampler quilt — the format the game is named after.

**Non-goals (v1):**

- Multiplayer / leaderboards
- Account system / cloud sync (localStorage only, same as Glossari)
- User-authored puzzles
- Photographic fabric textures (future direction — see §11)
- Mariner's Compass block (future direction)
- Animation beyond a simple reveal

---

## 2. Player experience (the daily loop)

A player visits `sampler.html` (or whatever URL convention matches Glossari).

1. Intro overlay introduces the day's block by name ("Today's block: **Log Cabin**").
2. Player taps **Begin**.
3. The empty quilt block appears at center. To one side: a fabric palette of N swatches. Above: the day's rules in plain language.
4. **Paint mode input:** tap a fabric to select it; tap any slot to fill it with the selected fabric. Tap a different fabric to switch. Tap a filled slot with the current fabric to erase. Long-press or undo-button to erase.
5. As fabric goes in, each rule gets a live ✓ when satisfied, · when not. Slot(s) that *break* a rule glow softly (matching the violation-highlight idiom from the sketch).
6. When every slot is filled and every rule satisfied, a brief reveal animation runs (quilting stitches stitch around the block edges; see §9), then the completion overlay appears: time, block name, streak, share.
7. Completion writes to localStorage. Archive cell for that date flips to "solved."

Failure mode: there is no "submit" button — the puzzle resolves the moment all rules are satisfied. The player can step away with an unsolved block at any time and resume mid-state (see §10).

---

## 3. Weekly format

Sampler follows the NYT crossword weekly shape, adapted:

| Day | Block | Approx. slot count | Difficulty character |
|---|---|---|---|
| Mon | **Nine-Patch** | 9 | Trainer-wheels. Few rules, explicit, no entanglement. |
| Tue | **Rail Fence** | 12 | Introduces *direction* as a rule axis (strip orientation). |
| Wed | **Log Cabin** | 13 | Concentric rings. Introduces *ring/distance from center* as a rule axis. Iconic block. |
| Thu | **Churn Dash** | 9–13 | Introduces half-square triangles. |
| Fri | **Sawtooth Star** | 16 | Eight-pointed star. Triangles take the lead role. |
| Sat | **Dresden Plate** | 16–24 | Radial petal block. Showpiece. Most entangled rules. |
| Sun | **Sampler quilt** | ~50 | 2×2 of mixed blocks separated by sashing. Marquee. Includes a cross-block rule. |

**Mariner's Compass** is held back from launch (see §11 future work).

**Why this lineup, in one line each:**
- Nine-Patch and Rail Fence are the simplest real blocks; Nine-Patch establishes the grid; Rail Fence introduces direction.
- Log Cabin is the most beloved American quilt block; its concentric structure is fundamentally different from a flat grid, so it earns its slot on Wednesday.
- Churn Dash introduces half-square triangles — the building block of most "star" patterns. It belongs before Sawtooth Star.
- Sawtooth Star is the first block where the geometry alone says *quilt*, not *grid*.
- Dresden Plate is the radial showpiece — a finished one looks like nothing else.
- Sunday's sampler ties the week together. Multiple blocks, sashing, and at least one rule that crosses block boundaries.

---

## 4. Difficulty model

Difficulty climbs through three independent knobs, all stackable:

1. **Block size (slot count)** — grows with the day (table above).
2. **Rule entanglement** — Monday has 3–4 independent rules; Saturday has 6+ rules where satisfying one constrains another.
3. **Rule subtlety** — Monday's rules are explicit and positional ("center must be Cream"); Saturday's rules are implicit / derived ("the block has vertical reflection symmetry," "florals form one connected region").

**Palette growth** is *not* a difficulty knob — it's an aesthetic knob that scales with slot count to keep the finished block visually rich. (5 fabrics for 9 slots feels sparse; 12 fabrics for 24 slots feels lush.)

**Hard requirement: every daily puzzle has exactly one solution.** This is a quality bar, not a difficulty knob. A puzzle with multiple solutions is an arrangement exercise, not a puzzle.

---

## 5. Visual & fabric system

Fabrics are **hand-drawn SVG patterns**, not photographic textures. Each fabric is an SVG `<pattern>` that tiles at the block's scale.

### Fabric metadata (the engine's view)

Each fabric has both visual properties (used to render) and **semantic tags** (used by rules):

```js
{
  id: 'F12',
  name: 'Madder Floral',          // human-readable
  svg: '<pattern>...</pattern>',  // tiling pattern definition
  motif:    'floral',             // floral | stripe | dot | solid | check | paisley | vine
  scale:    'small',              // small | medium | large
  hue:      'warm',               // warm | cool | neutral
  value:    'medium',             // light | medium | dark
  direction: null,                // for stripes: 'horizontal' | 'vertical' | 'diagonal'
}
```

The semantic tags are the connective tissue between fabric and rule — they're what let a rule say "no two florals may touch" without naming specific fabric IDs.

### Palette curation per day

Each day's template specifies a *palette family* (e.g., "earth-warm" or "winter-forest") plus a slot count. The generator picks the day's fabrics from that family. This keeps daily aesthetics coherent without hand-picking N fabrics per puzzle.

### Aesthetic ambition

The finished block on Saturday should make the player say *oh*. Acceptable visual signals: fabrics catch light differently (subtle SVG noise/fiber overlays), the block "settles" into place at reveal, the quilting-stitch animation traces real quilting paths.

---

## 6. Rule vocabulary

Three tiers. The generator picks rules from tiers appropriate to the day's difficulty.

### Core tier (Mon–Fri can use these freely; Sat uses them as supporting cast)

- **Count** — "Exactly 4 Cardinal fabrics" / "At least 2 Marigolds"
- **Positional** — "Center must be Cream" / "Slot 3 must not be a stripe"
- **Adjacency** — "No two florals may touch" / "Every Madder must touch a Cream"
- **Symmetry** — "Block has vertical reflection symmetry" / "Block has rotational symmetry of order 4"

### Spicy tier (Wed onward; defines Saturday)

- **Pattern-property** — "All stripes must run the same direction" / "All florals must be the same scale"
- **Connectivity** — "All warm-hued fabrics form one connected region" / "No isolated single-fabric island"

### Sunday-only

- **Cross-block** — "The center fabric of Block 1 must reappear in Block 3" / "Block 2 and Block 4 must share at least 3 fabric IDs"
- **Sashing** — "The sashing fabric must contrast (different hue) with every block's outer ring"

### Authoring constraints on the rule engine

Every rule must be:

- **Checkable in O(slots)** at most — rules run live every input
- **Stateable in one human sentence** — the rules panel reads like a recipe, not a logic class
- **Independently verifiable** — the engine evaluates each rule on the current state and returns `{ satisfied: bool, violatingSlots: Set<int> }`

---

## 7. Puzzle generation (template hybrid)

The user has explicitly named the goal: **collaborate with the algorithm**. The author writes templates; the engine instantiates puzzles from them.

### Template shape

```js
{
  id: 'log-cabin-warm-cottage-easy',
  block: 'log-cabin',
  difficultyTier: 'wednesday',  // monday | tuesday | ... | sunday
  paletteFamily: 'earth-warm',
  paletteSize: 6,
  rules: [
    { kind: 'positional', slot: 'center', constraint: { motif: 'solid', value: 'light' } },
    { kind: 'symmetry', axis: 'vertical' },
    { kind: 'count', constraint: { hue: 'warm' }, min: 4, max: 6 },
    // …
  ],
  // optional: hand-pinned fabric for a specific slot to lock visual character
  fabricPins: { 0: 'F03' }
}
```

### Generation pipeline (per daily seed)

1. **Pick template.** From the day's difficulty tier, deterministically select one template from the candidate set using the date as RNG seed.
2. **Resolve palette.** Draw `paletteSize` fabrics from the named palette family, seeded by date. Apply any `fabricPins`.
3. **Solve.** Run a constraint solver (backtracking + arc-consistency propagation) over the slots, given the rules and palette, to find solutions.
4. **Uniqueness check.** If the solver finds 0 or 2+ solutions, the template-fabric combination is invalid for today — fall through to the next candidate. (In practice this should be rare with well-tested templates.)
5. **Cache.** The verified puzzle is stored in memory for the session.

### Solver

Vanilla JS backtracking solver with two-watched-literal style arc consistency. Estimated 200–400 lines. Each rule contributes a propagator that prunes the domain of each unfilled slot.

**Performance budget:** under 100ms to find first solution + verify uniqueness on the largest weekday block. Sunday may take up to 500ms (acceptable as a one-time cost behind the intro overlay).

### Authoring workflow (the "collaboration")

A template is invalid if it can't produce unique-solution puzzles. The engine must surface this to the author. Modes the author needs:

- **Verify-template mode** — given a template, the engine runs it across all date-seeds in a year and reports: % of seeds producing a unique solution; example failing seeds; rule(s) most often violated.
- **Failure surface** — when a template fails, the engine names *which rule* over-constrains, or *which rule pair* contradicts. So the author can adjust.

This is the "collaboration" — the author's job is to write rules that *feel like a good puzzle*; the engine's job is to keep them honest about whether the rules actually produce solvable, unique puzzles.

### Launch content target

- **3–5 templates per weekday block** (Mon–Sat) = 18–30 templates
- **3 templates for Sunday sampler** = 3 templates
- **Total launch authoring**: ~25 templates

Once authored, the date-seeding produces effectively-different puzzles for years. New templates can be added any time as JSON.

---

## 8. Input model

**Paint mode.**

- Tap a fabric in the palette → that fabric is **selected**.
- Tap any slot → that slot is filled with the selected fabric.
- Tap a slot already filled with the selected fabric → that slot is erased.
- Tap a slot filled with a *different* fabric → it's overwritten.
- An explicit **Erase** brush (or long-press) is available for clearing.
- An **Undo** button steps back through the move history.

**Why paint mode** (vs tap-slot-then-tap-fabric, vs drag-and-drop):

- Fastest on mobile. The repeating pattern in quilt blocks means many slots take the same fabric; paint mode collapses that into one fabric tap + N slot taps.
- Most natural mental model for craft: "I'm working with the green floral right now, placing it here, here, here."
- Drag-and-drop is heavier on touch surfaces and slower for repeated fabric.

**Selected fabric indication:** the palette swatch lifts slightly + grows a clear outline. The cursor/pointer takes on the fabric's tile pattern (desktop) or the slot preview shows the fabric ghosted on hover (mobile: visible on touch-down).

---

## 9. Completion screen, share & reveal

Modeled directly on the NYT crossword completion screen.

### Reveal animation

When the final slot satisfies the final rule:

1. The rules panel ✓-collapses (each ✓ flashes once then the panel dims out).
2. Quilting stitches draw themselves around each fabric piece (animated SVG `stroke-dasharray` along the block's seam lines). ~600ms.
3. The block settles in place with a small scale bounce (transform: scale 0.97 → 1.0).
4. Completion overlay fades up.

### Completion overlay

Echoes NYT but tuned to Sampler. Reference image: NYT crossword "Congratulations!" overlay.

- Icon: a small Sampler glyph (star-in-square equivalent — TBD design).
- Headline: **"Congratulations!"** in display serif (same Lora / DM Serif Display family Glossari uses).
- Body: **"You solved a {Day} {BlockName} in {m:ss}."** — e.g., *"You solved a Wednesday Log Cabin in 3:42."* The block name being in the message is core; it teaches quilting vocabulary and makes the share feel earned.
- Streak badge: gold pill, **"YOU HAVE A {N}-DAY STREAK"** when N ≥ 1.
- Stats row: Streak / Played / Flawless / Avg Time (matching Glossari's archive footer stats exactly).
- Secondary CTAs: **View archive**, **Play Glossari** (cross-promo).
- Close ✕.

### Share

Tap **Share** → copy to clipboard a small text block. Examples:

```
Sampler · Wed May 20 · Log Cabin
3:42 ★ flawless
🟫🟧🟫
🟧🟨🟧
🟫🟧🟫
🔥 4-day streak
```

The emoji grid is a low-resolution rendering of the finished block — one emoji per major slot, using fabric hue/value as a proxy. (For non-grid blocks like Dresden Plate, fall back to a single fabric-color summary line.)

### Already-played and replay

If the player visits a date they've already played, they see the **already-played overlay** (matching Glossari's pattern) with the result, time, and options: **Replay** (no storage write) or **Archive** (open calendar).

---

## 10. Archive & persistence

**Mirror Glossari's archive system exactly.** Both games use the same shape; the only difference is the storage key.

### Storage key & shape

`STORAGE_KEY = 'sampler_daily_v1'`

```js
{
  byDate: {
    "2026-06-15": {
      puzzleIdx: 29,
      block: 'log-cabin',
      result: {
        allSolved: true,
        flawless: true,
        elapsedSeconds: 222,
        // …
      },
      completedAt: 1750000000000,
      source: "live" | "archive",
    }
  },
  streak, bestStreak, lastPlayedDate,
  totalPlayed, totalSolved, totalFlawless,
  totalSolveSeconds, solvedTimedCount
}
```

`block` is added to the per-date record (Glossari didn't need this since every Glossari puzzle is structurally identical; Sampler's vary). It's the block ID for that date — useful for the archive UI cell rendering and for showing "you solved 12 Log Cabins" stat ideas later.

### Behavior matrix

Same as Glossari's archive-design doc, applied to Sampler:

| Action | Streak | totalPlayed | totalSolved | totalFlawless | Avg time | Storage write |
|---|---|---|---|---|---|---|
| Play today (live) | bump | +1 | if solved | if flawless | if solved | yes |
| Play prior day (archive, first) | — | +1 | if solved | if flawless | if solved | yes |
| Replay a completed day | — | — | — | — | — | no |

### Daily index & date math

- `LAUNCH_DATE = '<TBD on ship>'` — fixed at launch.
- `dailyIndex(dateStr)` — same shape as Glossari (days since launch in ET).
- ET-midnight boundary, same as Glossari (now corrected after PR #2 / commit `8361b2a`).

### Archive calendar UI

Identical visual treatment to Glossari's archive calendar (see Glossari archive design spec dated 2026-05-18). Same cell states, same month nav, same launch-date gate. The only difference: hovering a cell shows the **block name** for that date in addition to time and result.

This is intentional: same UI, same code patterns. The two games' archive calendars should feel like the same component because they are.

---

## 11. Tech architecture

### Single-file shape

Sampler ships as a single `sampler.html` file at the site root, matching Glossari's pattern. No build step, no dependencies, vanilla JS, embedded SVG fabrics.

**Why single-file:**
- Matches Glossari.
- Plays offline once loaded.
- Trivial to host on the static site.
- Easy to mirror, archive, and grep.

**Estimated file size:** 50–80KB of code (more than Glossari, less than a single hi-res image), plus SVG fabric definitions (~5KB total — patterns are tiny). Well within reason.

### Internal structure (logical, not file-level)

```
sampler.html
├── fabrics/         (~30 SVG <pattern> definitions inline)
├── blocks/          (renderers + slot geometry for the 7 block types)
│   ├── nine-patch.js
│   ├── rail-fence.js
│   ├── log-cabin.js
│   ├── churn-dash.js
│   ├── sawtooth-star.js
│   ├── dresden-plate.js
│   └── sampler-quilt.js
├── rules/           (each rule kind is a small module with verify + propagate)
│   ├── count.js
│   ├── positional.js
│   ├── adjacency.js
│   ├── symmetry.js
│   ├── pattern-property.js
│   └── connectivity.js
├── solver/          (backtracking + propagation)
├── templates/       (JSON-shaped data, inline)
├── state/           (localStorage shape + migration)
├── ui/              (paint input, palette, rules panel, completion overlay)
└── archive/         (calendar overlay — same component pattern as Glossari)
```

This is *logical* structure; physically it all lives in one HTML file as IIFEs or namespaced under a single global. The intent is clear separation of concerns so the author can extend a single block without touching the rest.

### Date / RNG seeding

All randomness keyed by date string. `mulberry32(seed)` or similar tiny seeded PRNG. The same date always produces the same puzzle for every player.

---

## 12. Future work (explicitly out of v1 scope)

- **Mariner's Compass block.** Replaces Dresden Plate on Saturday or rotates with it. Requires radial-wedge slot system and rule support for "ring of points."
- **Photographic fabric textures.** A future "guest pattern designer" feature: a real textile designer contributes a fabric set for a special day, attribution + link back to their work. Stays under the same metadata schema; only the rendering changes.
- **Block archive / collection.** A "you've quilted N blocks" page that shows thumbnails of every completed block — like a personal portfolio of finished pieces.
- **Tutorial overlay.** Glossari has one; Sampler needs one for first-time players. Out of v1 because it's a polish task best done once the core feels right.
- **Theme variants.** Seasonal palette families ("autumn," "winter") that auto-rotate.
- **Hint system.** Some way for a stuck player to get a nudge without revealing.
- **Custom puzzle creator.** Author-mode in the browser; very-future.

---

## 13. Open questions & risks

### Open questions (for spec review)

1. **Game name.** "Sampler" is working name; "Samplari" is the leading candidate; "Esemplari" is the elegant alternative. Decision can wait until just before launch.
2. **Sunday cross-block rule design.** This spec commits to *having* cross-block rules but doesn't pin specific rule kinds. Worth nailing down before plan, or accepted as a Sunday-specific design pass during build.
3. **Reveal animation specifics.** Stitch-along-seam-lines feels right but is harder for Dresden Plate (curved seams). Acceptable to scope down to "block scales 0.97 → 1.0 + soft accent flash" for v1 and add stitching in v1.1.
4. **Block share-emoji rendering.** A 3×3 emoji grid works for Nine-Patch but doesn't obviously generalize to Dresden Plate or the Sunday sampler. Two options: (a) every block reduces to a 3×3 fabric-hue summary regardless of geometry; (b) each block defines its own shareable mini-shape. (a) is simpler and aligns with "every share looks like a Sampler share."

### Risks

- **Solver complexity.** Constraint solvers are well-understood but writing one in vanilla JS that's *fast enough on mobile* takes real care. Mitigation: write the solver early and benchmark on a Pixel-class device before committing to Saturday/Sunday content.
- **Authoring fatigue.** 25 templates is a lot of authoring work, even with engine support. Mitigation: ship with fewer templates per block (3 each = 18 templates) and add more over time. Players won't notice template reuse for the first many months because date-seeding shuffles fabric within each template.
- **Visual ceiling on Saturday/Sunday.** SVG patterns can look stunning or can look flat; the difference is in the patterns themselves. Mitigation: commit time to drawing the fabrics. This is a craft puzzle — the fabric is the art.

---

## 14. Implementation phasing (suggested)

This spec describes the full launch product, but its scope is large enough that a single implementation plan would be unwieldy. Suggested phasing for the implementation plan(s):

**Phase 1 — Engine + Monday.** Build the core engine end-to-end against Nine-Patch only: paint input, palette, rules panel, core-tier rules (count / positional / adjacency / symmetry), solver, template instantiation, completion overlay, storage. Ship one block, fully playable, with 3 templates. This proves the engine.

**Phase 2 — Archive parity.** Wire up the archive calendar overlay matching Glossari's exact pattern. At end of Phase 2, Sampler is a real-but-tiny game that can run for a few weeks on one block of content.

**Phase 3 — Mid-week blocks.** Add Rail Fence, Log Cabin, Churn Dash, Sawtooth Star. Each block adds its own renderer + slot geometry + 3–5 templates. Pattern-property rules added here (Saturday's tools begin to come online).

**Phase 4 — Saturday.** Dresden Plate renderer (the hardest geometry of the daily blocks). Connectivity rules. Saturday templates.

**Phase 5 — Sunday & cross-block.** Sampler-quilt composition (2×2 of blocks + sashing). Cross-block + sashing rule kinds. Sunday templates.

**Phase 6 — Polish & launch.** Tutorial, reveal animation, share string, cross-promo to Glossari, fabric tuning, accessibility audit, performance audit on mobile.

Each phase is its own implementation plan. Phase 1 + Phase 2 together is the smallest possible meaningful release; Phase 1–6 is the marquee launch.

---

## 15. Success criteria

The first release of Sampler succeeds if:

- A non-quilter can solve Monday's puzzle in under 2 minutes without instructions.
- A regular Glossari player picks up Sampler within two days of release and forms a daily habit.
- Saturday's puzzle takes most players 8+ minutes and feels earned, not punishing.
- Sunday's finished sampler quilt makes at least one player share it without prompting.
- The author can write a new template in under 90 minutes including engine verification.
- Sampler and Glossari feel like siblings — same site, same voice, recognizably the same hand.
