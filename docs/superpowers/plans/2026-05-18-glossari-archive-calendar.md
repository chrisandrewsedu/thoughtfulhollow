# Glossari Archive Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players access prior daily puzzles via a month-grid calendar overlay. First-time archive plays count toward stats and avg-time but not streak; completed days are replayable read-only.

**Architecture:** All changes in the single-file static page `glossari.html`. Storage schema migrates from a flat "last play" record to a `byDate` map plus aggregate counters. Game flow is parameterized by `dateStr` so the same code path handles live daily and archive plays.

**Tech Stack:** Vanilla HTML/CSS/JS. No build, no framework, no test runner. Verification is manual browser testing via `python3 -m http.server 8000`.

**Spec:** `docs/superpowers/specs/2026-05-18-glossari-archive-calendar-design.md`

## Testing approach (read first)

This project has no test framework and no build step. Each task ends with **manual browser verification** at `http://localhost:8000/glossari.html`. Steps are explicit about what to click and what to check (visually + via DevTools localStorage). Commit after each verified task.

Start the server once at the beginning:

```bash
python3 -m http.server 8000
```

Open DevTools → Application → Local Storage to inspect `glossari_daily_v1` / `glossari_daily_v2` as you go.

Reset between tasks (when needed) by clearing the keys in DevTools and reloading.

---

### Task 1: Add date helpers and storage migration

**Files:**
- Modify: `glossari.html` around line 810–822 (storage helpers)

- [ ] **Step 1: Add the new key constant and helpers**

Find the existing block at lines 810–822:

```js
const STORAGE_KEY = 'glossari_daily_v1';
const LAUNCH_DATE = '2026-05-17';

function dailyIndex(dateStr) {
  const ms = Date.parse(dateStr + 'T00:00:00Z') - Date.parse(LAUNCH_DATE + 'T00:00:00Z');
  const days = Math.floor(ms / 86400000);
  if (days < 0) return 0;
  return days % PUZZLES.length;
}

function todayStr() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date()); }
function loadStorage() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } }
function saveStorage(data) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {} }
```

Replace with:

```js
const STORAGE_KEY_V1 = 'glossari_daily_v1';
const STORAGE_KEY = 'glossari_daily_v2';
const LAUNCH_DATE = '2026-05-17';

function dailyIndex(dateStr) {
  const ms = Date.parse(dateStr + 'T00:00:00Z') - Date.parse(LAUNCH_DATE + 'T00:00:00Z');
  const days = Math.floor(ms / 86400000);
  if (days < 0) return 0;
  return days % PUZZLES.length;
}

function todayStr() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date()); }

function etDateOffset(dateStr, offsetDays) {
  const base = Date.parse(dateStr + 'T12:00:00Z');
  const shifted = new Date(base + offsetDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(shifted);
}
function prevEtDate(dateStr) { return etDateOffset(dateStr, -1); }

function migrateStorageIfNeeded() {
  try {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (!rawV1) return;
    const v1 = JSON.parse(rawV1) || {};
    const v2 = {
      byDate: {},
      streak: v1.streak || 0,
      bestStreak: v1.bestStreak || 0,
      lastPlayedDate: v1.lastPlayedDate || null,
      totalPlayed: v1.totalPlayed || 0,
      totalSolved: v1.totalSolved || 0,
      totalFlawless: v1.totalFlawless || 0,
      totalSolveSeconds: 0,
      solvedTimedCount: 0,
    };
    if (v1.lastPlayedDate && v1.lastResult) {
      v2.byDate[v1.lastPlayedDate] = {
        puzzleIdx: v1.lastPlayedIndex ?? 0,
        result: v1.lastResult,
        completedAt: Date.now(),
        source: 'live',
      };
      if (v1.lastResult.allSolved && typeof v1.lastResult.elapsedSeconds === 'number') {
        v2.totalSolveSeconds = v1.lastResult.elapsedSeconds;
        v2.solvedTimedCount = 1;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v2));
  } catch {}
}

function loadStorage() {
  migrateStorageIfNeeded();
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function saveStorage(data) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {} }
```

- [ ] **Step 2: Verify migration on a v1-shaped record**

In DevTools console:

```js
localStorage.clear();
localStorage.setItem('glossari_daily_v1', JSON.stringify({
  lastPlayedDate: '2026-05-17',
  lastPlayedIndex: 0,
  lastResult: { marks: ['solved','solved','solved','solved'], elapsedSeconds: 95, mistakesUsed: 0, allSolved: true, flawless: true },
  streak: 1, bestStreak: 1, totalPlayed: 1, totalSolved: 1, totalFlawless: 1
}));
location.reload();
```

After reload, in console:

```js
JSON.parse(localStorage.getItem('glossari_daily_v2'))
```

Expected: object with `byDate['2026-05-17']` populated, `totalSolveSeconds: 95`, `solvedTimedCount: 1`, aggregates carried over, `v1` key still present.

- [ ] **Step 3: Verify clean install creates no v2 prematurely**

```js
localStorage.clear();
location.reload();
```

After reload:

```js
localStorage.getItem('glossari_daily_v2')
```

Expected: `null` (no record exists yet because no game has been played — migration only fires when v1 exists or saveStorage runs).

- [ ] **Step 4: Commit**

```bash
git add glossari.html
git commit -m "Add v2 storage schema with byDate map and v1 migration"
```

---

### Task 2: Thread date through `startDailyGame` and `loadPuzzle`

**Files:**
- Modify: `glossari.html` lines 826–832 (state), 858–875 (startDailyGame), 877–892 (loadPuzzle)

- [ ] **Step 1: Add `playDate` and `replay` to state**

Find lines 826–832:

```js
let state = {
  puzzleIdx: 0, mode: 'daily', puzzleMarksByEntry: [],
  items: [], selectedIds: new Set(), solvedSets: [], revealedSets: [],
  mistakes: 0, puzzlesSolved: 0, flawless: 0, totalMistakes: 0,
  locked: false, timerStart: null, timerInterval: null, elapsed: 0,
  guessLog: [],
};
```

Replace with:

```js
let state = {
  puzzleIdx: 0, mode: 'daily', puzzleMarksByEntry: [],
  items: [], selectedIds: new Set(), solvedSets: [], revealedSets: [],
  mistakes: 0, puzzlesSolved: 0, flawless: 0, totalMistakes: 0,
  locked: false, timerStart: null, timerInterval: null, elapsed: 0,
  guessLog: [],
  playDate: null, replay: false,
};
```

- [ ] **Step 2: Parameterize `startDailyGame`**

Find lines 858–863:

```js
function startDailyGame() {
  const stored = loadStorage(); const today = todayStr();
  if (stored.lastPlayedDate === today) { showAlreadyPlayed(stored); return; }
  state.mode = 'daily'; state.puzzleIdx = dailyIndex(today);
  resetGameState(); document.getElementById('intro').classList.remove('show'); loadPuzzle();
}
```

Replace with:

```js
function startDailyGame(dateStr, opts) {
  dateStr = dateStr || todayStr();
  const replay = !!(opts && opts.replay);
  const stored = loadStorage();
  const existing = stored.byDate && stored.byDate[dateStr];
  if (existing && !replay) {
    if (dateStr === todayStr()) { showAlreadyPlayed(stored); return; }
    // shouldn't normally happen — archive cell click for completed day always passes replay:true
    showAlreadyPlayed(stored); return;
  }
  state.mode = 'daily';
  state.playDate = dateStr;
  state.replay = replay;
  state.puzzleIdx = dailyIndex(dateStr);
  resetGameState();
  document.getElementById('intro').classList.remove('show');
  document.getElementById('alreadyPlayed').classList.remove('show');
  document.getElementById('reveal').classList.remove('show');
  loadPuzzle();
}
```

- [ ] **Step 3: Use `state.playDate` for subbar date + archive label**

Find lines 877–892 (`loadPuzzle`):

```js
function loadPuzzle() {
  document.getElementById('practiceLink').style.display = 'none';
  const puzzle = PUZZLES[state.puzzleIdx];
  state.mistakes = 0; state.locked = false; state.selectedIds = new Set();
  state.guessLog = [];
  state.items = []; let id = 0;
  puzzle.sets.forEach((s, si) => { state.items.push({ id: id++, type: 'clue', clueObj: s, setIdx: si }); });
  const tileItems = [];
  puzzle.sets.forEach((s, si) => { s.parts.forEach(p => { tileItems.push({ id: id++, type: 'tile', text: p, setIdx: si }); }); });
  state.items.push(...shuffle(tileItems));
  state.solvedSets = puzzle.sets.map(_ => false); state.revealedSets = puzzle.sets.map(_ => false);
  document.getElementById('puzzleName').textContent = puzzle.name;
  const d = new Date();
  document.getElementById('subbarDate').textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  renderMistakes(); renderAll(); updateSubmit(); startTimer();
}
```

Replace the date-display line and add archive label. Replace the body of `loadPuzzle` keeping logic intact:

```js
function loadPuzzle() {
  document.getElementById('practiceLink').style.display = 'none';
  const puzzle = PUZZLES[state.puzzleIdx];
  state.mistakes = 0; state.locked = false; state.selectedIds = new Set();
  state.guessLog = [];
  state.items = []; let id = 0;
  puzzle.sets.forEach((s, si) => { state.items.push({ id: id++, type: 'clue', clueObj: s, setIdx: si }); });
  const tileItems = [];
  puzzle.sets.forEach((s, si) => { s.parts.forEach(p => { tileItems.push({ id: id++, type: 'tile', text: p, setIdx: si }); }); });
  state.items.push(...shuffle(tileItems));
  state.solvedSets = puzzle.sets.map(_ => false); state.revealedSets = puzzle.sets.map(_ => false);
  document.getElementById('puzzleName').textContent = puzzle.name;
  const playDate = state.playDate || todayStr();
  const isLive = playDate === todayStr();
  const d = new Date(playDate + 'T12:00:00Z');
  const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  document.getElementById('subbarDate').textContent = isLive ? dateLabel : 'Archive · ' + dateLabel;
  renderMistakes(); renderAll(); updateSubmit(); startTimer();
}
```

- [ ] **Step 4: Manually verify live daily still works**

Clear storage, reload, click "Begin". Expect the puzzle to load normally with today's date in the subbar (no "Archive" prefix). Solve or quit — leave that for Task 3 to verify completion writes.

- [ ] **Step 5: Manually verify archive-style invocation shows label**

In console (with a fresh puzzle loaded, before completion):

```js
startDailyGame('2026-05-17')
```

Expect the subbar to read `Archive · May 17, 2026` and the first puzzle to load (puzzleIdx 0). Don't complete — we'll wire completion writes next.

- [ ] **Step 6: Commit**

```bash
git add glossari.html
git commit -m "Thread playDate through startDailyGame and loadPuzzle"
```

---

### Task 3: Replace inline completion write with `recordCompletion`

**Files:**
- Modify: `glossari.html` lines 1131–1147 (`finishPuzzle`)

- [ ] **Step 1: Extract `recordCompletion` and call from `finishPuzzle`**

Find the existing `finishPuzzle` (lines 1131–1147):

```js
function finishPuzzle(success) {
  stopTimer();
  const clueItems = state.items.filter(it => it.type === 'clue').sort((a, b) => a.id - b.id);
  state.puzzleMarksByEntry = clueItems.map(it => state.solvedSets[it.setIdx] ? 'solved' : 'revealed');
  if (success) { state.puzzlesSolved++; if (state.mistakes === 0) state.flawless++; showBadge('correct', 'Puzzle Solved', 'on to the next'); }
  else { state.solvedSets.forEach((s, i) => { if (!s) state.revealedSets[i] = true; }); renderAll(); showBadge('wrong', 'Solutions', 'revealed above'); }
  state.locked = true;
  if (state.mode === 'daily') {
    const stored = loadStorage(); const allSolved = state.puzzleMarksByEntry.every(m => m === 'solved');
    const result = { marks: state.puzzleMarksByEntry, elapsedSeconds: state.elapsed, mistakesUsed: state.mistakes, allSolved, flawless: allSolved && state.mistakes === 0 };
    const yesterday = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(Date.now() - 86400000));
    const streakBase = stored.lastPlayedDate === yesterday ? (stored.streak || 0) : 0;
    const newStreak = allSolved ? streakBase + 1 : 0;
    saveStorage({ lastPlayedDate: todayStr(), lastPlayedIndex: state.puzzleIdx, lastResult: result, streak: newStreak, bestStreak: Math.max(newStreak, stored.bestStreak || 0), totalPlayed: (stored.totalPlayed || 0) + 1, totalSolved: (stored.totalSolved || 0) + (allSolved ? 1 : 0), totalFlawless: (stored.totalFlawless || 0) + (result.flawless ? 1 : 0) });
  }
  setTimeout(() => showReveal(), success ? 1900 : 3500);
}
```

Replace with:

```js
function finishPuzzle(success) {
  stopTimer();
  const clueItems = state.items.filter(it => it.type === 'clue').sort((a, b) => a.id - b.id);
  state.puzzleMarksByEntry = clueItems.map(it => state.solvedSets[it.setIdx] ? 'solved' : 'revealed');
  if (success) { state.puzzlesSolved++; if (state.mistakes === 0) state.flawless++; showBadge('correct', 'Puzzle Solved', 'on to the next'); }
  else { state.solvedSets.forEach((s, i) => { if (!s) state.revealedSets[i] = true; }); renderAll(); showBadge('wrong', 'Solutions', 'revealed above'); }
  state.locked = true;
  if (state.mode === 'daily') recordCompletion();
  setTimeout(() => showReveal(), success ? 1900 : 3500);
}

function recordCompletion() {
  if (state.replay) return;
  const playDate = state.playDate || todayStr();
  const isLive = playDate === todayStr();
  const allSolved = state.puzzleMarksByEntry.every(m => m === 'solved');
  const result = {
    marks: state.puzzleMarksByEntry,
    elapsedSeconds: state.elapsed,
    mistakesUsed: state.mistakes,
    allSolved,
    flawless: allSolved && state.mistakes === 0,
  };
  const data = loadStorage();
  if (!data.byDate) data.byDate = {};
  data.byDate[playDate] = {
    puzzleIdx: state.puzzleIdx,
    result,
    completedAt: Date.now(),
    source: isLive ? 'live' : 'archive',
  };
  data.totalPlayed = (data.totalPlayed || 0) + 1;
  if (allSolved) {
    data.totalSolved = (data.totalSolved || 0) + 1;
    data.totalSolveSeconds = (data.totalSolveSeconds || 0) + state.elapsed;
    data.solvedTimedCount = (data.solvedTimedCount || 0) + 1;
    if (result.flawless) data.totalFlawless = (data.totalFlawless || 0) + 1;
  }
  if (isLive) {
    const yesterday = prevEtDate(todayStr());
    const streakBase = data.lastPlayedDate === yesterday ? (data.streak || 0) : 0;
    const newStreak = allSolved ? streakBase + 1 : 0;
    data.streak = newStreak;
    data.bestStreak = Math.max(newStreak, data.bestStreak || 0);
    data.lastPlayedDate = todayStr();
  }
  saveStorage(data);
}
```

- [ ] **Step 2: Update `showReveal` to read from `byDate` and use playDate for the date string**

Find the line near the top of `showReveal` (was line 1156 before Task 2 shifts):

```js
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
```

Replace with:

```js
  const playDate = state.playDate || todayStr();
  const dateStr = new Date(playDate + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/New_York' });
```

Next, find:

```js
  const result = state.mode === 'daily' ? (stored.lastResult || buildCurrentResult()) : buildCurrentResult();
```

Replace with:

```js
  const persisted = stored.byDate && stored.byDate[playDate];
  const result = state.mode === 'daily' ? (persisted ? persisted.result : buildCurrentResult()) : buildCurrentResult();
```

Next, find:

```js
    const puzzleNum = dailyIndex(todayStr()) + 1;
```

Replace with:

```js
    const puzzleNum = dailyIndex(playDate) + 1;
```

Finally, find (further down in `showReveal`):

```js
  const puzzleNum = state.mode === 'daily' ? dailyIndex(todayStr()) + 1 : null;
```

Replace with:

```js
  const puzzleNum = state.mode === 'daily' ? dailyIndex(state.playDate || todayStr()) + 1 : null;
```

- [ ] **Step 3: Manually verify a live completion writes v2 correctly**

Reset storage, reload, play and solve today's puzzle (or click each tile through to completion). After the reveal screen:

```js
JSON.parse(localStorage.getItem('glossari_daily_v2'))
```

Expected: `byDate[<today>]` populated with `source: 'live'`, `streak: 1`, `totalPlayed: 1`, `totalSolved: 1`, `totalSolveSeconds` equals your solve time, `solvedTimedCount: 1`. (`totalFlawless: 1` if zero mistakes.)

- [ ] **Step 4: Manually verify an archive completion does NOT bump streak**

Reset storage. In console:

```js
startDailyGame('2026-05-17')
```

Play through to completion. Then:

```js
JSON.parse(localStorage.getItem('glossari_daily_v2'))
```

Expected: `byDate['2026-05-17']` with `source: 'archive'`, `totalPlayed: 1`, `totalSolved: 1` if solved, **`streak: 0`** (or undefined), `lastPlayedDate` not set (or null).

- [ ] **Step 5: Manually verify a replay does NOT write**

After Task 3 Step 4, snapshot the storage state. Then:

```js
startDailyGame('2026-05-17', { replay: true })
```

Play through. After completion:

```js
JSON.parse(localStorage.getItem('glossari_daily_v2'))
```

Expected: identical to snapshot. `byDate['2026-05-17'].result` unchanged; `totalPlayed` unchanged.

- [ ] **Step 6: Commit**

```bash
git add glossari.html
git commit -m "Route completion writes through recordCompletion with archive-aware logic"
```

---

### Task 4: Add average-time stat to existing displays

**Files:**
- Modify: `glossari.html` ~line 1232 (share stats), ~line 1280 (alreadyStats)

- [ ] **Step 1: Add a helper for avg time formatting**

Insert immediately after `formatTime` (around line 843):

```js
function formatAvgTime(data) {
  if (!data || !data.solvedTimedCount) return '—';
  const avg = Math.round(data.totalSolveSeconds / data.solvedTimedCount);
  return formatTime(avg);
}
```

- [ ] **Step 2: Add Avg to share block stats**

Find lines 1231–1235:

```js
    <div class="share-stats">
      <div class="share-stat"><div class="share-stat-num">${stored.streak || 0}</div><div class="share-stat-lbl">Streak</div></div>
      <div class="share-stat"><div class="share-stat-num">${stored.totalPlayed || 0}</div><div class="share-stat-lbl">Played</div></div>
      <div class="share-stat"><div class="share-stat-num">${stored.totalFlawless || 0}</div><div class="share-stat-lbl">Flawless</div></div>
    </div>
```

Replace with:

```js
    <div class="share-stats">
      <div class="share-stat"><div class="share-stat-num">${stored.streak || 0}</div><div class="share-stat-lbl">Streak</div></div>
      <div class="share-stat"><div class="share-stat-num">${stored.totalPlayed || 0}</div><div class="share-stat-lbl">Played</div></div>
      <div class="share-stat"><div class="share-stat-num">${stored.totalFlawless || 0}</div><div class="share-stat-lbl">Flawless</div></div>
      <div class="share-stat"><div class="share-stat-num">${formatAvgTime(stored)}</div><div class="share-stat-lbl">Avg</div></div>
    </div>
```

- [ ] **Step 3: Add Avg to `alreadyPlayed` stats**

Find lines 1280:

```js
  [['Streak', stored.streak || 0], ['Played', stored.totalPlayed || 0], ['Flawless', stored.totalFlawless || 0]].forEach(([label, val]) => {
```

Replace with:

```js
  [['Streak', stored.streak || 0], ['Played', stored.totalPlayed || 0], ['Flawless', stored.totalFlawless || 0], ['Avg', formatAvgTime(stored)]].forEach(([label, val]) => {
```

- [ ] **Step 4: Manually verify Avg appears and computes correctly**

Reset storage. Play today's puzzle to solve in (say) ~30s. After the reveal screen, the share block should display a 4th stat "Avg" showing a `m:ss` value matching your solve time. Reload → click Begin → the `alreadyPlayed` screen should show Avg too.

Then in console, play and solve an archive day:

```js
startDailyGame('2026-05-17')
```

After completion, the Avg displayed on the share block should equal the average of both solves.

- [ ] **Step 5: Verify "—" displays when no solved games exist**

Reset storage. Reload. In console:

```js
saveStorage({ byDate: {}, totalPlayed: 1, totalSolved: 0, solvedTimedCount: 0, totalSolveSeconds: 0 });
// Then trigger alreadyPlayed via:
showAlreadyPlayed(loadStorage());
```

Expected: Avg stat shows `—`.

- [ ] **Step 6: Commit**

```bash
git add glossari.html
git commit -m "Add Avg solve-time stat to share block and alreadyPlayed"
```

---

### Task 5: Add secondary-button style and restructure intro actions

**Files:**
- Modify: `glossari.html` CSS block (around the existing `.btn` / `.intro-practice-btn` rules), markup at lines 737–740 (`introActions`)

- [ ] **Step 1: Add CSS for `.btn-secondary` and the action row**

Locate the CSS section. Find a free spot near the existing `.btn` rules and add:

```css
.intro-actions-row {
  display: flex; gap: 0.6rem; justify-content: center; align-items: center;
  flex-wrap: wrap; margin-top: 0.6rem;
}
.btn-secondary {
  font-family: 'Lora', serif; font-style: italic; font-size: 0.85rem;
  padding: 0.5rem 1.1rem; border-radius: 4px;
  background: transparent; color: var(--ink-soft);
  border: 1px solid var(--ink-faint); cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.btn-secondary:hover { background: var(--paper-shadow); color: var(--ink); border-color: var(--ink-soft); }
```

(If `--paper-shadow` is not defined in the file, substitute the nearest equivalent token — check `:root` declarations in the existing CSS first.)

- [ ] **Step 2: Restructure `introActions` markup**

Find lines 737–740:

```html
    <div class="intro-actions" id="introActions">
      <button class="btn" id="beginBtn" onclick="startGame()">Begin</button>
      <button class="intro-practice-btn" id="introPracticeBtn" onclick="startPracticeGame()">or try practice mode</button>
    </div>
```

Replace with:

```html
    <div class="intro-actions" id="introActions">
      <button class="btn" id="beginBtn" onclick="startGame()">Begin</button>
      <div class="intro-actions-row">
        <button class="btn-secondary" id="introPracticeBtn" onclick="startPracticeGame()">Practice</button>
        <button class="btn-secondary" id="introArchiveBtn" onclick="openArchive()">Archive</button>
      </div>
    </div>
```

- [ ] **Step 3: Add a stub `openArchive` so the button doesn't error**

Insert near `startPracticeGame` (around line 865):

```js
function openArchive() {
  // Will be implemented in Task 7
  console.log('archive open (stub)');
}
```

- [ ] **Step 4: Manually verify intro layout**

Reset storage, reload. Expect: "Begin" prominent, "Practice" and "Archive" side-by-side beneath it, visibly smaller and lighter. Clicking Practice still starts practice mode. Clicking Archive logs to console (no error).

- [ ] **Step 5: Commit**

```bash
git add glossari.html
git commit -m "Add secondary button style and Archive entry on intro screen"
```

---

### Task 6: Restructure `alreadyPlayed` actions

**Files:**
- Modify: `glossari.html` lines 775–782 (`alreadyPlayed` overlay)

- [ ] **Step 1: Replace the existing "Practice Mode" button with paired secondaries**

Find lines 775–782:

```html
  <div class="overlay" id="alreadyPlayed">
    <div class="go-mark">— Daily Complete —</div>
    <div class="go-title">Come Back Tomorrow</div>
    <div class="go-rule"></div>
    <div class="intro-rules" style="margin-bottom:1.1rem">You've already played today's puzzle. New puzzle at midnight.</div>
    <div class="go-stats" id="alreadyStats"></div>
    <button class="btn" style="margin-bottom:0.8rem" onclick="startPracticeGame()">Practice Mode</button>
  </div>
```

Replace with:

```html
  <div class="overlay" id="alreadyPlayed">
    <div class="go-mark">— Daily Complete —</div>
    <div class="go-title">Come Back Tomorrow</div>
    <div class="go-rule"></div>
    <div class="intro-rules" style="margin-bottom:1.1rem">You've already played today's puzzle. New puzzle at midnight.</div>
    <div class="go-stats" id="alreadyStats"></div>
    <div class="intro-actions-row" style="margin-bottom:0.8rem">
      <button class="btn-secondary" onclick="startPracticeGame()">Practice</button>
      <button class="btn-secondary" onclick="openArchive()">Archive</button>
    </div>
  </div>
```

- [ ] **Step 2: Manually verify**

Reset storage, reload, play today's puzzle to completion. After the reveal closes and the alreadyPlayed screen displays (or trigger directly via reload after a completion), expect the 4 stats including Avg, plus Practice + Archive secondary buttons side-by-side. Clicking each behaves as in Task 5.

- [ ] **Step 3: Commit**

```bash
git add glossari.html
git commit -m "Restructure alreadyPlayed actions with secondary buttons"
```

---

### Task 7: Build the archive overlay scaffold

**Files:**
- Modify: `glossari.html` — add overlay markup near the other overlays (around line 782, after `alreadyPlayed`), add CSS, add `openArchive`/`closeArchive` JS

- [ ] **Step 1: Add overlay markup**

Insert after the closing `</div>` of `alreadyPlayed` (around line 782, before the final container `</div>`):

```html
  <div class="overlay" id="archive">
    <button class="archive-close" type="button" onclick="closeArchive()" aria-label="Close archive">✕</button>
    <div class="archive-header">
      <div class="archive-title">Archive</div>
      <div class="archive-subtitle"><em>Glossari · since May 17, 2026</em></div>
    </div>
    <div class="archive-monthnav">
      <button class="archive-navbtn" type="button" id="archivePrevBtn" onclick="archiveShiftMonth(-1)">‹</button>
      <div class="archive-monthlabel" id="archiveMonthLabel">—</div>
      <button class="archive-navbtn" type="button" id="archiveNextBtn" onclick="archiveShiftMonth(1)">›</button>
    </div>
    <div class="archive-weekhead">
      <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
    </div>
    <div class="archive-grid" id="archiveGrid"></div>
    <div class="archive-stats" id="archiveStats"></div>
  </div>
```

- [ ] **Step 2: Add CSS**

Add to the CSS block (anywhere reasonable):

```css
#archive { padding: 1.6rem 1rem; }
.archive-close {
  position: absolute; top: 0.8rem; right: 0.9rem;
  background: transparent; border: none; color: var(--ink-faint);
  font-size: 1.2rem; cursor: pointer; padding: 0.2rem 0.5rem;
}
.archive-close:hover { color: var(--ink); }
.archive-header { text-align: center; margin-bottom: 1.1rem; }
.archive-title {
  font-family: 'DM Serif Display', serif; font-style: italic;
  font-size: 1.85rem; line-height: 1;
}
.archive-subtitle {
  font-family: 'Lora', serif; font-size: 0.7rem; color: var(--ink-faint);
  margin-top: 0.25rem;
}
.archive-monthnav {
  display: flex; justify-content: center; align-items: center; gap: 1.2rem;
  margin-bottom: 0.7rem;
}
.archive-navbtn {
  background: transparent; border: none; color: var(--ink-soft);
  font-size: 1.2rem; cursor: pointer; padding: 0.2rem 0.6rem;
}
.archive-navbtn:disabled { color: var(--ink-ghost); cursor: default; }
.archive-monthlabel {
  font-family: 'Lora', serif; font-style: italic; font-size: 0.95rem;
  min-width: 8rem; text-align: center;
}
.archive-weekhead, .archive-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem; max-width: 22rem; margin: 0 auto;
}
.archive-weekhead > div {
  font-family: 'Lora', serif; font-size: 0.55rem; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--ink-faint); text-align: center;
  padding: 0.3rem 0;
}
.archive-cell {
  aspect-ratio: 1 / 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-family: 'Lora', serif; font-size: 0.95rem;
  border: 1px solid transparent; border-radius: 4px;
  background: transparent; color: var(--ink); cursor: pointer;
  position: relative;
}
.archive-cell.empty { visibility: hidden; }
.archive-cell.future { color: var(--ink-ghost); cursor: default; }
.archive-cell.today { border-color: var(--accent); }
.archive-cell.available:hover { background: var(--paper-shadow); }
.archive-cell.completed { cursor: pointer; }
.archive-cell .archive-mark {
  font-size: 0.7rem; line-height: 1; margin-top: 0.05rem;
}
.archive-cell.solved .archive-mark { color: var(--green); }
.archive-cell.revealed .archive-mark { color: var(--gold); }
.archive-stats {
  display: flex; justify-content: center; gap: 1.6rem;
  margin-top: 1.2rem; max-width: 22rem; margin-left: auto; margin-right: auto;
}
.archive-stats .archive-stat { text-align: center; }
.archive-stats .archive-stat-num {
  font-family: 'DM Serif Display', serif; font-size: 1.1rem; line-height: 1;
}
.archive-stats .archive-stat-lbl {
  font-family: 'Lora', serif; font-size: 0.55rem; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--ink-faint); margin-top: 0.18rem;
}
```

(If any palette token like `--green` / `--gold` / `--accent` / `--paper-shadow` / `--ink-ghost` / `--ink-faint` is missing in the file's `:root`, use the closest existing token — grep for `--` declarations to confirm.)

- [ ] **Step 3: Replace stub `openArchive` and add `closeArchive`**

Replace the stub from Task 5:

```js
function openArchive() {
  // Will be implemented in Task 7
  console.log('archive open (stub)');
}
```

With:

```js
let archiveViewMonth = null; // {year, month} where month is 0-indexed

function openArchive() {
  document.getElementById('intro').classList.remove('show');
  document.getElementById('alreadyPlayed').classList.remove('show');
  const today = todayStr();
  const [y, m] = today.split('-').map(Number);
  archiveViewMonth = { year: y, month: m - 1 };
  renderArchive();
  document.getElementById('archive').classList.add('show');
}

function closeArchive() {
  document.getElementById('archive').classList.remove('show');
  const stored = loadStorage();
  const today = todayStr();
  if (stored.byDate && stored.byDate[today]) {
    showAlreadyPlayed(stored);
  } else {
    document.getElementById('intro').classList.add('show');
  }
}

function archiveShiftMonth(delta) {
  if (!archiveViewMonth) return;
  const d = new Date(archiveViewMonth.year, archiveViewMonth.month + delta, 1);
  archiveViewMonth = { year: d.getFullYear(), month: d.getMonth() };
  renderArchive();
}

function renderArchive() {
  // implemented in Task 8
  document.getElementById('archiveMonthLabel').textContent =
    new Date(archiveViewMonth.year, archiveViewMonth.month, 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  document.getElementById('archiveGrid').innerHTML = '';
  document.getElementById('archiveStats').innerHTML = '';
}
```

- [ ] **Step 4: Manually verify the overlay opens/closes**

Reset storage, reload, click Archive. Expect: overlay shows with "Archive" title, current month label, nav arrows, weekday headers, empty grid. Click ✕ — overlay closes, intro returns.

After completing today's daily, reload (lands on alreadyPlayed), click Archive — overlay opens. Close — returns to alreadyPlayed (not intro).

- [ ] **Step 5: Commit**

```bash
git add glossari.html
git commit -m "Add archive overlay scaffold (markup, CSS, open/close)"
```

---

### Task 8: Render the calendar grid

**Files:**
- Modify: `glossari.html` — flesh out `renderArchive` from Task 7

- [ ] **Step 1: Replace `renderArchive` with full implementation**

Replace the stub `renderArchive` from Task 7 with:

```js
function renderArchive() {
  if (!archiveViewMonth) return;
  const { year, month } = archiveViewMonth;
  const firstOfMonth = new Date(year, month, 1);
  const monthLabel = firstOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  document.getElementById('archiveMonthLabel').textContent = monthLabel;

  const today = todayStr();
  const [launchY, launchM, launchD] = LAUNCH_DATE.split('-').map(Number);
  const launchDate = new Date(launchY, launchM - 1, launchD);
  const todayDate = new Date(today + 'T12:00:00');

  const prevBtn = document.getElementById('archivePrevBtn');
  const nextBtn = document.getElementById('archiveNextBtn');
  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);
  const lastOfPrevMonth = new Date(year, month, 0);
  const firstOfNextMonth = nextMonth;
  prevBtn.disabled = lastOfPrevMonth < launchDate;
  nextBtn.disabled = firstOfNextMonth > todayDate;

  const stored = loadStorage();
  const byDate = stored.byDate || {};

  const grid = document.getElementById('archiveGrid');
  grid.innerHTML = '';
  const firstWeekday = firstOfMonth.getDay();
  for (let i = 0; i < firstWeekday; i++) {
    const cell = document.createElement('div');
    cell.className = 'archive-cell empty';
    grid.appendChild(cell);
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const cell = document.createElement('div');
    cell.className = 'archive-cell';
    const numEl = document.createElement('div');
    numEl.textContent = day;
    cell.appendChild(numEl);

    const isBeforeLaunch = dateObj < launchDate;
    const isFuture = dateObj > todayDate;
    const isToday = dateStr === today;
    const entry = byDate[dateStr];

    if (isBeforeLaunch || isFuture) {
      cell.classList.add(isFuture ? 'future' : 'empty');
      if (isBeforeLaunch) cell.classList.add('empty');
    } else {
      if (isToday) cell.classList.add('today');
      if (entry) {
        cell.classList.add('completed');
        const allSolved = entry.result && entry.result.allSolved;
        cell.classList.add(allSolved ? 'solved' : 'revealed');
        const mark = document.createElement('div');
        mark.className = 'archive-mark';
        mark.textContent = allSolved ? '✓' : '◊';
        cell.appendChild(mark);
        cell.onclick = () => archiveCellClick(dateStr, true);
      } else {
        cell.classList.add('available');
        cell.onclick = () => archiveCellClick(dateStr, false);
      }
    }
    grid.appendChild(cell);
  }

  const statsEl = document.getElementById('archiveStats');
  statsEl.innerHTML = '';
  [
    ['Streak', stored.streak || 0],
    ['Played', stored.totalPlayed || 0],
    ['Flawless', stored.totalFlawless || 0],
    ['Avg', formatAvgTime(stored)],
  ].forEach(([label, val]) => {
    const stat = document.createElement('div');
    stat.className = 'archive-stat';
    const num = document.createElement('div'); num.className = 'archive-stat-num'; num.textContent = val;
    const lbl = document.createElement('div'); lbl.className = 'archive-stat-lbl'; lbl.textContent = label;
    stat.appendChild(num); stat.appendChild(lbl); statsEl.appendChild(stat);
  });
}

function archiveCellClick(dateStr, isReplay) {
  document.getElementById('archive').classList.remove('show');
  startDailyGame(dateStr, { replay: isReplay });
}
```

- [ ] **Step 2: Manually verify the grid renders correctly**

Reset storage, reload. Open archive.

Expected for May 2026 (current month):
- Days 1–16 visible but rendered as `empty` (before launch — hidden)
- Day 17 visible, available (clickable, hover affordance)
- Day 18 visible with `today` ring
- Days 19–31 future (faint, not clickable)
- Prev arrow disabled (no months before May 2026 have any in-range dates)
- Next arrow disabled (next month is fully in the future)
- Stats footer shows 0s and Avg `—`

- [ ] **Step 3: Manually verify a completed cell shows correct mark**

Reset storage. Play today's puzzle to completion (solve cleanly). Reload → open archive. Today's cell should show `today` ring + green `✓` mark and be clickable.

- [ ] **Step 4: Manually verify a DNF cell shows gold ◊**

Reset storage. In console:

```js
startDailyGame('2026-05-17')
```

Deliberately make 4 mistakes (click wrong tile combinations). After the reveal, reload, open archive. May 17 should show gold `◊` mark.

- [ ] **Step 5: Commit**

```bash
git add glossari.html
git commit -m "Render archive calendar grid with date-state styling"
```

---

### Task 9: Wire archive cell click to live / archive / replay paths

(Cell handlers are already wired in Task 8 via `archiveCellClick`. This task verifies all three paths end-to-end and adds nothing new beyond confirmation tests.)

- [ ] **Step 1: Verify "play today" via archive**

Reset storage, reload, open archive, click today's cell.

Expected: archive closes, puzzle loads, subbar shows today's date (NO "Archive · " prefix, because `playDate === today` and replay is false), `state.replay === false`. Complete it — storage shows `streak: 1`, etc.

- [ ] **Step 2: Verify "play prior day, first time"**

Reset storage, reload, open archive, click May 17.

Expected: archive closes, puzzle loads, subbar reads `Archive · May 17, 2026`. Complete it — `byDate['2026-05-17'].source === 'archive'`, `streak: 0`, `totalPlayed: 1`.

- [ ] **Step 3: Verify "replay completed day"**

After Step 2, reload, open archive, click May 17 again (now showing ✓).

Expected: archive closes, puzzle loads as Archive · May 17, 2026. `state.replay === true`. Complete it. Snapshot of `byDate['2026-05-17']` is unchanged (same `completedAt`, same `source`); `totalPlayed` unchanged.

- [ ] **Step 4: Verify close-archive routing**

With storage as in Step 3, reload (lands on alreadyPlayed). Click Archive → opens. Click ✕ → returns to alreadyPlayed (not intro), since today has been played.

Reset storage. Reload (lands on intro). Click Archive → opens. Click ✕ → returns to intro.

- [ ] **Step 5: Commit (no code change unless bugs found)**

If any bug surfaces, fix and commit. Otherwise no commit for this task.

---

### Task 10: Final QA walkthrough

- [ ] **Step 1: Full happy path**

Reset storage. Reload.

1. Intro shown with Begin / Practice / Archive layout.
2. Click Begin → today's puzzle loads. Solve cleanly.
3. Share block displays Streak 1 · Played 1 · Flawless 1 · Avg = your time.
4. Reload → alreadyPlayed shows the same stats with Practice + Archive buttons.
5. Click Archive → calendar opens. Today shows ring + ✓.
6. Click May 17 cell → archive closes, "Archive · May 17, 2026" shows. Solve.
7. After reveal, reload → alreadyPlayed. Stats: Streak 1 (unchanged), Played 2, Flawless 2, Avg = average of both times.
8. Open archive → both May 17 and today show ✓. Both clickable as replays.
9. Click May 17 → plays as replay (`state.replay` is true). Storage unchanged after completion.

- [ ] **Step 2: Migration sanity**

Reset storage, then in console:

```js
localStorage.setItem('glossari_daily_v1', JSON.stringify({
  lastPlayedDate: '2026-05-18',
  lastPlayedIndex: 1,
  lastResult: { marks: ['solved','solved','solved','revealed'], elapsedSeconds: 120, mistakesUsed: 4, allSolved: false, flawless: false },
  streak: 0, bestStreak: 2, totalPlayed: 3, totalSolved: 2, totalFlawless: 1
}));
location.reload();
```

Open archive. Expect:
- May 18 shows `◊` (DNF carried through).
- Stats: Streak 0, Played 3, Flawless 1, Avg = `—` (no solved time data — v1 didn't track totalSolveSeconds and the v1 record was DNF).

Then play May 17 fresh through archive. Stats update: Played 4, Solved 3, Avg shows the time of that one solve.

- [ ] **Step 3: Mobile viewport spot-check**

In DevTools, switch to a mobile viewport (e.g. iPhone 12). Open archive. Confirm the calendar grid stays within viewport, weekday headers don't wrap awkwardly, and the secondary buttons row wraps cleanly on intro / alreadyPlayed.

- [ ] **Step 4: Final commit**

If any fix was needed during QA, commit. Otherwise no commit.

```bash
git status
git log --oneline -15
```

Expected: ~8 commits from this plan, clean working tree.

---

## Out of scope (per spec)

- Unlimited / procedural puzzles, difficulty levels
- Mid-game persistence
- Tooltips on archive cells (deferred)
- Filter / jump-to-date / month-transition animation
- Per-date leaderboards
