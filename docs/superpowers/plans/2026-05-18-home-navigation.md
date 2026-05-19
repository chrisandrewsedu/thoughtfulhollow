# Home Navigation & Puzzle Pause Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players click the Glossari title to return to the home screen mid-puzzle, pausing the timer and resuming it when they return.

**Architecture:** All changes are in a single file (`glossari.html`). We add an `inProgress` state flag, a `resumeTimer()` function, a `goHome()` function, and an `updateStartBtn()` helper. The `.brand` div in the header becomes a click target. The "Begin" button label switches to "Resume" when a puzzle is in progress.

**Tech Stack:** Vanilla HTML/CSS/JS in `glossari.html`. No build step, no test framework — verification is manual in a browser via `open glossari.html` (requires `glossari.json` in the same directory).

---

### Task 1: Add `inProgress` flag to state and set it in `loadPuzzle` / `showReveal`

**Files:**
- Modify: `glossari.html:987-994` (state object)
- Modify: `glossari.html:1188` (`loadPuzzle`)
- Modify: `glossari.html:1493` (`showReveal`)

- [ ] **Step 1: Add `inProgress: false` to the state object**

Find this block (around line 987):
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

Change to:
```js
let state = {
  puzzleIdx: 0, mode: 'daily', puzzleMarksByEntry: [],
  items: [], selectedIds: new Set(), solvedSets: [], revealedSets: [],
  mistakes: 0, puzzlesSolved: 0, flawless: 0, totalMistakes: 0,
  locked: false, timerStart: null, timerInterval: null, elapsed: 0,
  guessLog: [],
  playDate: null, replay: false, inProgress: false,
};
```

- [ ] **Step 2: Set `inProgress = true` at the top of `loadPuzzle`**

Find this line (around line 1191):
```js
  state.mistakes = 0; state.locked = false; state.selectedIds = new Set();
```

Add `state.inProgress = true;` on the line immediately before it:
```js
  state.inProgress = true;
  state.mistakes = 0; state.locked = false; state.selectedIds = new Set();
```

- [ ] **Step 3: Set `inProgress = false` at the top of `showReveal`**

Find this line (around line 1493):
```js
function showReveal() {
  const puzzle = PUZZLES[state.puzzleIdx]; const stored = loadStorage();
```

Add `state.inProgress = false;` immediately after the opening line:
```js
function showReveal() {
  state.inProgress = false;
  const puzzle = PUZZLES[state.puzzleIdx]; const stored = loadStorage();
```

- [ ] **Step 4: Verify in browser**

Open `glossari.html` in a browser. Open the browser console and run:
```js
startDailyGame(); console.log(state.inProgress); // should log: true
```
Then let the puzzle complete and check `state.inProgress` is false. (You can force completion by calling `showReveal()` in the console.)

- [ ] **Step 5: Commit**

```bash
git add glossari.html
git commit -m "feat: track inProgress state in puzzle lifecycle"
```

---

### Task 2: Add `resumeTimer()`

**Files:**
- Modify: `glossari.html:1021-1024` (after `stopTimer`)

- [ ] **Step 1: Add `resumeTimer` immediately after `stopTimer`**

Find this block (around line 1021):
```js
function stopTimer() {
  if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
  if (state.timerStart) { state.elapsed = Math.floor((Date.now() - state.timerStart) / 1000); }
}
```

Add the new function directly after it:
```js
function stopTimer() {
  if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
  if (state.timerStart) { state.elapsed = Math.floor((Date.now() - state.timerStart) / 1000); }
}

function resumeTimer() {
  if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
  const offset = Date.now() - state.elapsed * 1000;
  state.timerStart = offset;
  document.getElementById('timer').textContent = formatTime(state.elapsed);
  state.timerInterval = setInterval(() => {
    document.getElementById('timer').textContent = formatTime(Math.floor((Date.now() - offset) / 1000));
  }, 1000);
}
```

- [ ] **Step 2: Verify in browser console**

Open the page, start a puzzle, wait ~5 seconds, then run:
```js
stopTimer(); console.log(state.elapsed); // should be ~5
resumeTimer(); // timer display should continue counting from ~5
```

- [ ] **Step 3: Commit**

```bash
git add glossari.html
git commit -m "feat: add resumeTimer to continue from saved elapsed"
```

---

### Task 3: Add `goHome()` and `updateStartBtn()`

**Files:**
- Modify: `glossari.html:1186` (near `startGame`)

- [ ] **Step 1: Add `updateStartBtn` and `goHome` after `startGame`**

Find this line (around line 1186):
```js
function startGame() { startDailyGame(); }
```

Replace it with:
```js
function updateStartBtn() {
  document.getElementById('beginBtn').textContent = state.inProgress ? 'Resume' : 'Begin';
}

function goHome() {
  if (!state.inProgress) return;
  stopTimer();
  updateStartBtn();
  document.getElementById('intro').classList.add('show');
}

function startGame() {
  if (state.inProgress) {
    document.getElementById('intro').classList.remove('show');
    resumeTimer();
    return;
  }
  startDailyGame();
}
```

- [ ] **Step 2: Verify `goHome` guard in console**

Open the page (before starting a puzzle, on the intro screen). Run:
```js
goHome(); // should do nothing — intro stays visible, no errors
```
Then start a puzzle and run:
```js
goHome(); // intro should appear; timer display should freeze
startGame(); // intro should disappear; timer should resume counting
```

- [ ] **Step 3: Commit**

```bash
git add glossari.html
git commit -m "feat: add goHome and updateStartBtn helpers"
```

---

### Task 4: Wire up the title click and CSS

**Files:**
- Modify: `glossari.html:101` (`.brand` CSS)
- Modify: `glossari.html:749-752` (`.brand` HTML)
- Modify: `glossari.html:918` (page-load `updateStartBtn` call)

- [ ] **Step 1: Add `cursor: pointer` and hover style to `.brand` / `.title`**

Find this CSS (around line 101):
```css
.brand { display: flex; align-items: baseline; gap: 0.5rem; }
.title {
  font-family: 'DM Serif Display', serif;
  font-weight: 400;
  font-style: italic;
  font-size: 1.5rem;
  color: var(--ink);
  letter-spacing: -0.01em;
  line-height: 1;
}
```

Change to:
```css
.brand { display: flex; align-items: baseline; gap: 0.5rem; cursor: pointer; }
.title {
  font-family: 'DM Serif Display', serif;
  font-weight: 400;
  font-style: italic;
  font-size: 1.5rem;
  color: var(--ink);
  letter-spacing: -0.01em;
  line-height: 1;
  transition: color 0.15s;
}
.brand:hover .title { color: var(--accent); }
```

- [ ] **Step 2: Add `onclick="goHome()"` to the `.brand` div**

Find this HTML (around line 749):
```html
  <header class="header">
    <div class="brand">
      <div class="title">Glos<span class="title-mark">·</span>sa<span class="title-mark">·</span>ri</div>
      <div class="vol">daily</div>
    </div>
```

Change to:
```html
  <header class="header">
    <div class="brand" onclick="goHome()">
      <div class="title">Glos<span class="title-mark">·</span>sa<span class="title-mark">·</span>ri</div>
      <div class="vol">daily</div>
    </div>
```

- [ ] **Step 3: Call `updateStartBtn()` after showing the intro on page load**

Find this block (around line 916):
```js
    if (seenTutorial) { document.getElementById('intro').classList.add('show'); }
    else { openTutorial(); }
```

Change to:
```js
    updateStartBtn();
    if (seenTutorial) { document.getElementById('intro').classList.add('show'); }
    else { openTutorial(); }
```

- [ ] **Step 4: Full manual test in browser**

Open `glossari.html`. Perform these checks in order:

1. **Home screen** — button reads "Begin". Hovering the title shows accent color. Clicking title does nothing (puzzle not in progress).
2. **Start puzzle** — click "Begin". Puzzle loads, timer starts at 0:00.
3. **Navigate home mid-puzzle** — click the Glossari title. Intro appears. Button reads "Resume". Timer display is frozen.
4. **Resume** — click "Resume". Intro disappears. Timer continues from where it paused (not reset to 0).
5. **Complete puzzle** — solve all sets. Results screen appears. Navigate home (click title) — does nothing (puzzle complete, `inProgress` is false).
6. **Fresh page load** — button reads "Begin" (not "Resume").

- [ ] **Step 5: Commit**

```bash
git add glossari.html
git commit -m "feat: clickable title navigates home and pauses in-progress puzzle"
```
