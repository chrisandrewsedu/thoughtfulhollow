# Glossari Difficulty Tiers — Design

**Date:** 2026-05-20
**Status:** Approved (pending written review)
**Scope:** Add three difficulty tiers (Easy / Medium / Hard) to Glossari, sharing a daily theme.

## Summary

Glossari today ships one daily puzzle at college/graduate vocabulary level (e.g. *perfidious*, *obsequious*, *effulgent*). This design adds two lower tiers — **Easy** (4th–8th grade, productive English affixes) and **Medium** (high school / early college, transparent Latin/Greek roots) — alongside the existing **Hard** tier. All three tiers share a daily theme; a player picks their tier from the landing page and can play any or all three on the same day.

The mechanic, scoring, share format, and visual design stay unchanged. The change is content + landing UX + per-tier state.

## Goals

- Make Glossari accessible to a wider audience without diluting the existing Hard experience.
- Preserve the daily ritual: one theme per day, three difficulty windows into it.
- Keep existing players' experience and streaks intact through migration.

## Non-Goals (v1)

- Morpheme tagging or curriculum-style browsing (noted as a possible future feature).
- Teacher-specific affordances (class codes, printable handouts, etc.) — pedagogical use is an incidental bonus, not a focus.
- Cross-tier achievements, combined streaks, or "play all three today" prompts.
- Any change to mechanics, scoring, share symbols, or visual identity.

## Tier Definitions

All three tiers use the same mechanic: four entries per puzzle, each headword assembled from **exactly three parts**.

| Tier   | Audience           | Morpheme system                                                  | Example headwords                       |
| ------ | ------------------ | ---------------------------------------------------------------- | --------------------------------------- |
| Easy   | 4th–8th grade      | Productive English affixes (`un-`, `re-`, `pre-`, `-able`, `-tion`, `-ing`) | `mis + understand + ing`, `un + predict + able` |
| Medium | High school / early college | Transparent Latin/Greek combining forms                  | `con + struct + ion`, `bene + vol + ent` |
| Hard   | College / grad     | Current vocabulary (unchanged)                                   | `per + fid + ious`, `ob + sequ + ious` |

**Authoring constraint:** within a single tier puzzle, vary the affixes/roots across the four words — don't make every word end in `-tion` or start with `un-`, even though that would be on-tier. Variety preserves the game feel.

## Daily Rotation and Theme Parity

The existing rotation logic stays. `dailyIndex(today)` maps the calendar date to a theme via `(daysSinceLaunch) % puzzleCount` against the puzzle catalog. The catalog is now indexed by theme rather than by tier — each entry holds up to three tier variants.

A player's tier selection picks which variant of today's theme to play. Today's theme is the same across tiers; the vocabulary differs.

If a theme has no variant for a chosen tier, that tier's button is disabled for that day. (Launch criterion below makes this irrelevant for v1, but the safety net is built.)

## Data Model

`glossari.json` changes from a flat array of puzzle objects to an array of theme objects, each with a `tiers` map.

**Before:**

```json
[
  {
    "name": "Light & Shadow",
    "sets": [ { "type": "definition", "clue": "...", "parts": ["ef","fulg","ent"], ... }, ... ]
  },
  ...
]
```

**After:**

```json
[
  {
    "name": "Light & Shadow",
    "tiers": {
      "easy":   { "sets": [ ... 4 entries, parts always length 3 ... ] },
      "medium": { "sets": [ ... ] },
      "hard":   { "sets": [ ... ] }
    }
  },
  ...
]
```

- Each set within a tier keeps its current shape: `type`, `clue`, `parts`, `pos`, `definition`, `etymology`, `example`, `synonyms`, `antonyms`.
- `tiers.easy` and `tiers.medium` are optional in the schema (to support future days where they're not yet authored); `tiers.hard` is required.
- `parts` array is always exactly length 3 in every tier — enforced by an admin-side validator.

**Migration:** the existing 16 puzzles are mechanically rewritten so each puzzle's current `sets` array moves under `tiers.hard`. No content changes during migration.

## Landing Page

The landing page replaces its single primary CTA (`Begin` / `Resume`) with three tier buttons. The page's existing layout — wordmark, rules card, clue-type legend, `Practice` and `Archive` buttons — stays intact.

```
Glos·sa·ri
n. /ˈglä-sə-rē/
A DAILY WORD PUZZLE
─────
1. Each puzzle has four dictionary entries — clues like definitions, synonyms, antonyms, and examples.
2. Pick one clue card and three word segments in order to assemble the headword that entry describes.
3. Right segments, wrong order? You'll be told — like Wordle's yellow.
4. You have four mistakes per puzzle.

❦ DEFINITION   ¶ EXAMPLE
≡ SYNONYM       ≠ ANTONYM

┌─────────┐  ┌─────────┐  ┌─────────┐
│  Easy   │  │ Medium  │  │  Hard   │
└─────────┘  └─────────┘  └─────────┘

[ Practice ]   [ Archive ]
```

**Button labels are tiers only.** No grade-level hints, no recommendation badges, no first-visit nudge. The three buttons are self-explanatory.

**Per-tier button state** (each tier independent for the current day):

| State                             | Visual                                       |
| --------------------------------- | -------------------------------------------- |
| Available, not started today      | Default active button.                       |
| Available, in progress            | Active with a "Resume" label.                |
| Available, completed today        | Active with a played indicator (e.g., `✓ played`). Clicking opens the post-game results screen. |
| Unavailable for today's theme     | Grayed out, not clickable. Small caption: "Not available for today's theme." |

The day's theme name appears above the buttons so players see the shared theme regardless of which tier they pick.

## In-Puzzle UX

Once a tier is picked, the puzzle plays exactly as it does today. The only addition: a static tier label in the subbar (alongside the existing date and theme name) so the player always knows which tier they're playing. **No mid-game tier switching.** To switch tiers, the player backs out to the landing page and picks again.

The header path back to landing uses the existing back affordance (preserve whatever pattern is already in place; do not introduce a new one).

## Per-Tier State

Every piece of state that today represents "your daily Glossari" is namespaced per tier.

**localStorage keys** become tier-scoped. Conceptually:

```
glossari.state.easy    → { playDate, sets played, guesses, completion, ... }
glossari.state.medium  → { ... }
glossari.state.hard    → { ... }
```

(Exact key names and structure are an implementation detail; the planning phase will design the concrete schema and migration code.)

**Streaks and stats** are tracked independently per tier. A 30-day Hard streak does not affect Easy or Medium streaks; playing Easy once starts a separate Easy streak. The stats screen shows all three tier rows always — even tiers the user has never played — so other tiers stay discoverable from inside the stats UI.

**Migration on launch:** existing `glossari.*` keys (representing today's hard-tier game) are read once at startup, copied into the `hard` namespace, then the old keys are removed. Silent migration, no prompt, no data loss.

## Share Format

Share text includes the tier name as a disambiguator. The day number stays tied to days-since-launch (matching Wordle's convention) and is shared across tiers — it's a calendar-day identifier, not a puzzle counter.

```
Glossari #17 · Medium · 3/4
❦ ❧ ❧ ❧
≡ ❧ ❧ ❧
≠ · ◆ ❧
¶ ❧ ❧ ❧
```

Share-symbol vocabulary (`❧`, `◆`, `·`) and clue-type glyphs (`❦`, `≡`, `≠`, `¶`) are unchanged.

## Archive

The archive grid stays one cell per day, showing the theme name (as today). Tapping a cell opens a small per-date tier picker — the same three-button affordance from the landing page, with grayed-out for tiers that lacked content on that date. Archive cells do not triple in size.

## Practice Mode

Today Practice picks a random puzzle from the full catalog and plays it untimed and outside daily state. Under tiers:

- The Practice button opens a tier picker (same three-button affordance as the landing page).
- Selecting a tier loads a random puzzle from that tier's available content.
- Tiers with no authored content (none expected at v1 launch, but possible if a tier is ever introduced with empty inventory) are grayed out.
- Practice plays remain outside per-tier stats and streaks, matching current behavior.

## Admin / Authoring (`admin/glossari-admin.html`)

Today's admin lets you browse and preview all puzzles via the `?puzzle=` override. Extend it:

- Each puzzle in the admin view shows three editable slots: Easy / Medium / Hard. Each slot can be edited and previewed independently.
- The `?puzzle=` and `?preview=` URL overrides gain a `&tier=easy|medium|hard` companion so any specific tier can be previewed in isolation.
- Validator: flag any tier with a set whose `parts.length !== 3`. Surfaces in the admin UI; does not block the live site (which will only load published content).

## Rollout

**Scope of v1 launch content:** Easy and Medium variants are authored for **all 16 existing themes** before launch. Only four daily slots have actually run live, so the remaining twelve are pre-launch content authoring that aligns naturally with the new tier work. No grayed-out tier buttons on launch day for any past or current puzzle.

**The grayed-out / unavailable state still gets built.** It's the safety net for future days where Hard ships before Easy/Medium are ready.

**Launch sequence:**

1. Schema migration: convert `glossari.json` to the new shape (Hard-only, no content changes).
2. Code changes: tier-aware loader, landing-page three-button UX, in-puzzle tier label, per-tier localStorage with one-time migration from old keys, per-tier stats/share, archive tier picker.
3. Admin: per-tier editing slots and `&tier=` override.
4. Content authoring: 16 themes × 2 new tiers = 32 new puzzles (4 entries each, 3 parts each).
5. Ship.

The order between (2), (3), and (4) is flexible — (3) unlocks (4), and (4) is the long pole. The planning phase will sequence them concretely.

## Open Questions / Notes

- **Morpheme tagging** is a deliberate future feature. The data schema does not preclude adding a `morphemes: [...]` array to each set later; the planning phase should be aware of this so we don't make schema choices that make tagging harder than necessary.
- **Tier color/visual treatment** for the three buttons (e.g., should they share styling or have subtle differentiation?) is left to implementation — the existing dictionary aesthetic should guide the choice.
