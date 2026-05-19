# Home Navigation & Puzzle Pause Design

**Date:** 2026-05-18
**Status:** Approved

## Overview

Add the ability to navigate back to the home screen from within a puzzle by clicking the Glossari title. If the puzzle is in progress, the timer pauses and the player can resume later without losing time or progress.

## State Changes

Add `inProgress: false` to the `state` object alongside the existing timer fields.

- Set `inProgress = true` in `loadPuzzle()` (when any puzzle starts)
- Set `inProgress = false` in `showReveal()` (when puzzle completes)

## Timer

Add `resumeTimer()`: starts a new interval from `state.elapsed` rather than resetting to zero. `stopTimer()` already captures `state.elapsed` correctly — no changes needed there.

```
resumeTimer():
  clear any existing interval
  record offset = Date.now() - (state.elapsed * 1000)
  start interval: timer display = formatTime(floor((Date.now() - offset) / 1000))
  update state.timerStart = offset  (so stopTimer() keeps working)
```

`startTimer()` remains unchanged (resets elapsed to 0 for fresh starts).

## Navigation

Add a `goHome()` function:

```
goHome():
  if not state.inProgress: return
  stopTimer()
  updateStartBtn()
  show #intro (add .show class)
```

Attach `goHome` as an `onclick` on the `.brand` div in the header. Add `cursor: pointer` to `.brand` CSS. Add a hover style on `.title` (e.g. `color: var(--accent)`) to signal interactivity.

## Intro Button

Add `updateStartBtn()`:

```
updateStartBtn():
  btn = document.getElementById('startBtn')
  btn.textContent = state.inProgress ? 'Resume' : 'Begin'
```

Modify `startGame()`:

```
startGame():
  if state.inProgress:
    hide #intro
    resumeTimer()
    return
  startDailyGame()
```

Call `updateStartBtn()` on page load so the label is correct from the start.

The intro "Begin" button gets `id="startBtn"` and `onclick="startGame()"` (replacing the current direct `startDailyGame()` call if one exists).

## Scope

Applies to daily, archive, and practice puzzles — all go through `loadPuzzle()` and `showReveal()`, so the `inProgress` flag works uniformly.

## Out of Scope

- Persisting in-progress state across page reloads (state lives in memory only)
- Any changes to the archive panel, tutorial, or results screen
