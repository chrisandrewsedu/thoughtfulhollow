# Glossari Archive Calendar — Design

**Date:** 2026-05-18
**Scope:** `glossari.html` (single-file static page)
**Status:** Design approved; ready for implementation plan

## Problem

Glossari currently exposes one puzzle per day, gated by ET midnight. Players who miss a day have no way to play it later. We want a calendar-based archive that lets users play any prior day they haven't completed yet, and replay any day they have completed (without affecting stats).

## Non-goals

- Unlimited / procedurally-generated puzzles
- Difficulty levels
- Multi-device sync of archive state (localStorage only, same as today)
- Mid-game persistence (current app doesn't save mid-game; not changing)
- Per-date leaderboards or social features

## Behavior summary

| Action | Streak | totalPlayed | totalSolved | totalFlawless | Avg time | Storage write |
|---|---|---|---|---|---|---|
| Play today's daily (live) | bump | +1 | if solved | if flawless | if solved | yes |
| Play prior day (archive, first time) | — | +1 | if solved | if flawless | if solved | yes |
| Replay a completed day | — | — | — | — | — | no |

A "replay" is any play of a date where `byDate[dateStr]` already exists. The puzzle plays normally (same UI, same reveal/share screen at the end), but no storage write occurs.

DNF (4 mistakes) on a first attempt of an archive day counts in `totalPlayed` but not in solved/flawless/avg-time. Replay is allowed afterward but still does not update the original DNF record.

## Storage migration: `glossari_daily_v1` → `glossari_daily_v2`

### v2 shape

```js
{
  byDate: {
    "2026-05-17": {
      puzzleIdx: 0,
      result: { /* same shape as existing lastResult */ },
      completedAt: 1747526400000,
      source: "live" | "archive"
    }
  },
  streak,                  // unchanged semantics; only live plays bump
  bestStreak,              // unchanged
  lastPlayedDate,          // unchanged; used for streak math
  totalPlayed,             // now includes archive plays
  totalSolved,             // now includes archive plays
  totalFlawless,           // now includes archive plays
  totalSolveSeconds,       // NEW — sum of elapsed seconds across solved completions
  solvedTimedCount         // NEW — count of solved completions (== totalSolved for v2-native users)
}
```

`solvedTimedCount` is tracked separately from `totalSolved` to keep the avg-time denominator honest in case future changes introduce solved-but-untimed records.

### Migration (one-time, on first load after deploy)

1. Read `glossari_daily_v1`. If absent, write empty `v2` and exit.
2. If `v2` already present, exit.
3. Build `v2` from `v1`:
   - `byDate[v1.lastPlayedDate] = { puzzleIdx: v1.lastPlayedIndex, result: v1.lastResult, completedAt: Date.now(), source: "live" }`
   - Copy `streak`, `bestStreak`, `lastPlayedDate`, `totalPlayed`, `totalSolved`, `totalFlawless`
   - If `v1.lastResult.allSolved`, seed `totalSolveSeconds = v1.lastResult.elapsed`, `solvedTimedCount = 1`. Otherwise both `0`.
4. Write `v2`. Leave `v1` key in place as a safety net (don't delete).

## Game-flow changes (in `glossari.html`)

### Date threading

- `startDailyGame(dateStr = todayStr())` — accept optional date; compute `puzzleIdx = dailyIndex(dateStr)`; stash `state.playDate = dateStr`.
- Branch on `loadStorage().byDate?.[dateStr]`:
  - **Exists, opened via archive cell click** → set `state.replay = true`, load puzzle, play normally, skip storage write.
  - **Exists, opened via default "Begin"** (only happens for today, after they've played) → `showAlreadyPlayed(byDate[dateStr])`. Same as today.
  - **Missing** → play normally, write on completion.
- `loadPuzzle()` — replace `new Date()` subbar text with the formatted `state.playDate`. When `state.playDate !== todayStr()`, render a small "Archive" label adjacent to the date so the player knows they're not in the live daily.

### Completion write

Replace the existing inline write with `recordCompletion()`:

```js
function recordCompletion() {
  if (state.replay) return;
  const isLive = state.playDate === todayStr();
  const result = buildCurrentResult();
  const data = loadStorage();
  data.byDate ||= {};
  data.byDate[state.playDate] = {
    puzzleIdx: state.puzzleIdx,
    result,
    completedAt: Date.now(),
    source: isLive ? 'live' : 'archive'
  };
  data.totalPlayed = (data.totalPlayed || 0) + 1;
  if (result.allSolved) {
    data.totalSolved = (data.totalSolved || 0) + 1;
    data.totalSolveSeconds = (data.totalSolveSeconds || 0) + result.elapsed;
    data.solvedTimedCount = (data.solvedTimedCount || 0) + 1;
    if (result.flawless) data.totalFlawless = (data.totalFlawless || 0) + 1;
  }
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

Helper `prevEtDate(dateStr)` returns the ISO date one day before, in ET. (Existing code computes `yesterday` inline; lift into a helper for reuse.)

### Avg-time display

Add an "Avg" stat alongside Streak / Played / Flawless wherever those stats render (`alreadyPlayed` overlay, share block, archive overlay footer). Format `m:ss`. Show `"—"` when `solvedTimedCount === 0`.

## Intro & Already-Played buttons

Restructure the action area on both the `intro` overlay and the `alreadyPlayed` overlay:

- **Primary CTA**: "Begin" — keep current prominent button style, unchanged size.
- **Secondary buttons**: "Practice" and "Archive" — equal weight to each other, visually subordinate to Begin (smaller font, lighter background or outlined style). Sit side-by-side (or stacked on narrow viewports) below Begin.
- The existing "Practice" text-link on `alreadyPlayed` is replaced by the same secondary-button treatment.

Exact pixel sizing falls out of matching the existing intro typography during implementation; the spec rule is **secondary < primary, secondaries equal to each other**.

## Calendar UI

### Container

New `<div class="overlay" id="archive">` modeled after existing `intro` / `alreadyPlayed` / `reveal` overlays. Opens via the secondary "Archive" button; closes via a ✕ in the corner matching the site's idiom.

### Header

- Title: "Archive" in the existing Lora / DM Serif Display style used by `puzzle-name` / `reveal-title`.
- Subtitle: small italic "Glossari · since May 17, 2026".

### Month nav

- `‹  May 2026  ›` row, centered.
- Default-opens to the current ET month.
- `‹` disabled when the previous month is entirely before `LAUNCH_DATE`.
- `›` disabled when the next month is entirely after today's ET date.

### Grid

Standard 7-column week layout, Sun–Sat header row. Each cell is a date number.

Cell states (visual treatment uses existing palette tokens — `--accent`, `--gold`, `--green`, `--ink-faint`, `--ink-ghost`):

| State | Visual | Clickable |
|---|---|---|
| Before LAUNCH_DATE (2026-05-17) | hidden / blank cell | no |
| Future | `--ink-ghost`, faint | no |
| Today, not played | `--accent` ring | yes → live daily |
| Today, played | `--accent` ring + ✓ mark | yes → replay |
| Past, not played | normal weight, hover affordance | yes → archive play (first time) |
| Past, played (solved) | green ✓ mark | yes → replay |
| Past, played (revealed / DNF) | gold ◊ mark | yes → replay |

Marks reuse symbols already in the codebase (✓ correct, ◊ revealed) for consistency.

### Footer

- Stats row inside the overlay: Streak / Played / Flawless / Avg time. Same data shown elsewhere; useful here as a scoreboard.
- Close button (or rely on overlay-✕ alone — implementation choice).

### Interactions

- Click an available cell → close overlay → `startDailyGame(dateStr)`. For a replay cell, also set `state.replay = true` before `startDailyGame` (or pass a second param `startDailyGame(dateStr, { replay: true })`).
- Hover/tap tooltip with theme name + time on played cells: nice-to-have; skip for v1 if it complicates mobile.

### Out of scope for v1

- Visual streak / heat-map styling beyond per-cell completion
- Filtering, search, jump-to-date
- Animation on month transitions

## File impact

All changes in `glossari.html`. Rough breakdown:

- ~30 lines: storage shape + migration + helpers
- ~25 lines: date-threading in `startDailyGame` / `loadPuzzle` / completion write
- ~15 lines: button restructure on `intro` and `alreadyPlayed` (markup + CSS)
- ~70 lines: archive overlay (markup, CSS, render JS, month nav)
- ~10 lines: avg-time stat wiring in existing stat displays

Estimated ~150 lines added, no new files, no build step.

## Open questions

None at design time. Implementation-time choices (exact spacing, exact secondary-button style, tooltip-or-not) deferred to the plan / build.
