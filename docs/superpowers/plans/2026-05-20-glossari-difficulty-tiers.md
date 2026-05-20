# Glossari Difficulty Tiers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three difficulty tiers (Easy / Medium / Hard) to Glossari with shared daily themes, per-tier state and stats, dedicated Practice puzzle pool, and per-tier admin authoring.

**Architecture:** The existing single-file static game ([glossari.html](glossari.html), 1753 lines) and [glossari.json](glossari.json) (flat array of 16 puzzles) become tier-aware. JSON top-level shape changes to `{ themes: [...], practice: {...} }`. localStorage keys gain a `v3` schema namespacing all per-day state and per-tier stats under each tier. Landing page replaces single Begin button with three tier buttons. In-puzzle UX, share text, archive, and admin all gain tier awareness. No build step is introduced — verification is manual browser testing matching project conventions, with one Node helper script for the one-shot JSON schema migration.

**Tech Stack:** Vanilla HTML/CSS/JS, no framework, no bundler. `python3 -m http.server 8000` for local dev. Cloudflare Pages auto-deploys on push to `main`. Node 18+ for the one-shot migration script.

**Spec:** [docs/superpowers/specs/2026-05-20-glossari-difficulty-tiers-design.md](docs/superpowers/specs/2026-05-20-glossari-difficulty-tiers-design.md)

---

## File Structure

**Modified files:**
- `glossari.json` — top-level shape changes from `Array<Puzzle>` to `{ themes: Array<Theme>, practice: { easy: Array<Puzzle>, medium: Array<Puzzle>, hard: Array<Puzzle> } }`. Existing 16 puzzles wrap into `themes[i].tiers.hard`. Easy/Medium variants and Practice pool added.
- `glossari.html` — every function that today assumes one puzzle per day becomes tier-aware: `dailyIndex`, `startDailyGame`, `startPracticeGame`, `loadPuzzle`, `recordCompletion`, `loadStorage`, `saveStorage`, `migrateStorageIfNeeded`, `showReveal`, `buildShareBlockHTML`, `generateShareText`, `renderArchive`, `showAlreadyPlayed`, intro overlay markup, in-puzzle subbar.
- `admin/glossari-admin.html` — per-theme card gains three tier slots (Easy / Medium / Hard); new Practice section lists the 9 sandbox puzzles.
- `README.md` — short note about tiers.

**New files:**
- `scripts/migrate-glossari-json.mjs` — one-shot Node script that converts `glossari.json` from the flat array to the new shape. Committed for posterity; run once.
- `tests/test-migrations.html` — standalone in-browser test page that exercises the v2→v3 localStorage migration across edge cases. Opened manually; prints PASS/FAIL per scenario.

**Why not extract logic to JS modules?** The codebase intentionally keeps everything inline in single HTML files (no build step, no bundler). Introducing modules + a test framework for one feature is over-engineering. Manual browser verification matches the project's existing conventions, and the standalone test page gives confidence in the one piece of logic (storage migration) that's hard to verify by inspection.

---

## Pre-flight

- [ ] **Confirm working directory and clean branch**

```bash
cd /Users/chrisandrews/Documents/ThoughtfulHollow
git status
```

Expected: clean working tree on `main`, the spec commits visible in `git log`.

- [ ] **Start the dev server in a separate terminal and leave it running for the rest of the plan**

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/glossari.html` in a browser to confirm the current game loads.

---

## Task 1: One-shot JSON schema migration

**Files:**
- Create: `scripts/migrate-glossari-json.mjs`
- Modify: `glossari.json`

The existing 16 puzzles must move from a flat array to `{ themes: [...], practice: {...} }`, with each puzzle's existing `sets` wrapping under `themes[i].tiers.hard`. We also seed the new shape with a Practice block (empty arrays for now — content lands in Task 13) and an Easy + Medium variant of **theme #1 "Fault & Faithlessness"** as test data so the rest of the plan is testable end-to-end before bulk content authoring.

- [ ] **Step 1: Write the migration script**

```javascript
// scripts/migrate-glossari-json.mjs
// One-shot migration: glossari.json flat array → { themes, practice }.
// Run once: `node scripts/migrate-glossari-json.mjs`.
// Committed for posterity / repeatability.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const jsonPath = resolve(here, '..', 'glossari.json');

const raw = JSON.parse(readFileSync(jsonPath, 'utf8'));

if (!Array.isArray(raw)) {
  if (raw && raw.themes && raw.practice) {
    console.log('glossari.json already in new shape; nothing to do.');
    process.exit(0);
  }
  throw new Error('Unexpected glossari.json shape: expected top-level array.');
}

// Validate each existing puzzle has exactly 4 sets and each set has 3 parts.
for (const [i, p] of raw.entries()) {
  if (!p.name) throw new Error(`Puzzle ${i} missing name`);
  if (!Array.isArray(p.sets) || p.sets.length !== 4) {
    throw new Error(`Puzzle ${i} (${p.name}) does not have exactly 4 sets`);
  }
  for (const [si, s] of p.sets.entries()) {
    if (!Array.isArray(s.parts) || s.parts.length !== 3) {
      throw new Error(`Puzzle ${i} (${p.name}) set ${si} parts.length !== 3`);
    }
  }
}

// Seed Easy + Medium variants for theme #1 only ("Fault & Faithlessness"),
// so end-to-end tier flow is testable before bulk content authoring (Task 13).
const seededEasyTheme1 = {
  sets: [
    {
      type: 'definition',
      clue: 'Not honest; tending to mislead or trick.',
      parts: ['un', 'truth', 'ful'],
      pos: 'adj.',
      definition: 'Not honest; tending to mislead or trick.',
      etymology: '<em>un-</em> (not) + <em>truth</em> + <em>-ful</em> (full of)',
      example: 'The <em>untruthful</em> witness changed her story three times.',
      synonyms: 'dishonest, deceitful, lying',
      antonyms: 'honest, truthful, candid'
    },
    {
      type: 'synonym',
      clue: 'wrongdoer, troublemaker',
      parts: ['mis', 'be', 'haver'],
      pos: 'n.',
      definition: 'One who behaves badly or breaks rules.',
      etymology: '<em>mis-</em> (badly) + <em>behave</em> + <em>-er</em> (one who)',
      example: 'The teacher kept the <em>misbehaver</em> after class.',
      synonyms: 'troublemaker, rule-breaker, offender',
      antonyms: 'role model, well-behaved one'
    },
    {
      type: 'antonym',
      clue: 'loyal, dependable, faithful',
      parts: ['un', 'reli', 'able'],
      pos: 'adj.',
      definition: 'Not able to be trusted or depended on.',
      etymology: '<em>un-</em> (not) + <em>rely</em> + <em>-able</em> (capable of)',
      example: 'The old car was too <em>unreliable</em> for long trips.',
      synonyms: 'untrustworthy, undependable, flaky',
      antonyms: 'reliable, trustworthy, dependable'
    },
    {
      type: 'example',
      clue: 'The thief gave a <em>____</em> excuse the guard immediately doubted.',
      parts: ['dis', 'hon', 'est'],
      pos: 'adj.',
      definition: 'Not telling the truth; willing to lie or cheat.',
      etymology: '<em>dis-</em> (not) + <em>honest</em>',
      example: 'The thief gave a <em>dishonest</em> excuse the guard immediately doubted.',
      synonyms: 'untruthful, deceitful, lying',
      antonyms: 'honest, truthful, sincere'
    }
  ]
};

const seededMediumTheme1 = {
  sets: [
    {
      type: 'definition',
      clue: 'Acting against one\'s faith or loyalty; betraying trust.',
      parts: ['be', 'tray', 'al'],
      pos: 'n.',
      definition: 'The act of being disloyal to a person, country, or cause.',
      etymology: '<em>be-</em> (thoroughly) + Old French <em>trair</em> (to hand over) + <em>-al</em>',
      example: 'His <em>betrayal</em> of the team\'s strategy cost them the match.',
      synonyms: 'treachery, disloyalty, double-cross',
      antonyms: 'loyalty, allegiance, fidelity'
    },
    {
      type: 'synonym',
      clue: 'two-faced, double-dealing',
      parts: ['du', 'plic', 'itous'],
      pos: 'adj.',
      definition: 'Deceitful; saying one thing while meaning another.',
      etymology: 'Latin <em>duplex</em> (twofold) + <em>-itous</em>',
      example: 'The <em>duplicitous</em> diplomat agreed in public and undermined the treaty in private.',
      synonyms: 'two-faced, deceitful, treacherous',
      antonyms: 'straightforward, sincere, candid'
    },
    {
      type: 'antonym',
      clue: 'loyal, honorable, principled',
      parts: ['un', 'scru', 'pulous'],
      pos: 'adj.',
      definition: 'Without moral principles; willing to do wrong for gain.',
      etymology: '<em>un-</em> (not) + Latin <em>scrupulus</em> (small sharp stone, scruple) + <em>-ous</em>',
      example: 'The <em>unscrupulous</em> banker hid losses from his clients for years.',
      synonyms: 'dishonorable, unethical, unprincipled',
      antonyms: 'principled, honorable, scrupulous'
    },
    {
      type: 'example',
      clue: 'The <em>____</em> spy passed his country\'s secrets to a foreign agent.',
      parts: ['trai', 'tor', 'ous'],
      pos: 'adj.',
      definition: 'Behaving as a traitor; disloyal to one\'s country or cause.',
      etymology: 'Old French <em>traitre</em> (traitor) + <em>-ous</em>',
      example: 'The <em>traitorous</em> spy passed his country\'s secrets to a foreign agent.',
      synonyms: 'treasonous, disloyal, faithless',
      antonyms: 'loyal, faithful, patriotic'
    }
  ]
};

// Seed one practice puzzle per tier — minimum to test Practice mode end-to-end.
// (Full pool of 3 per tier is authored in Task 13.)
const seededPracticeEasy = [
  {
    name: 'Practice — Helpers',
    sets: [
      {
        type: 'definition', clue: 'Able to be helped or made better.',
        parts: ['help', 'a', 'ble'], pos: 'adj.',
        definition: 'Able to be helped, fixed, or improved.',
        etymology: '<em>help</em> + <em>-able</em> (capable of)',
        example: 'The problem was small and easily <em>helpable</em>.',
        synonyms: 'fixable, resolvable, manageable',
        antonyms: 'hopeless, helpless, intractable'
      },
      {
        type: 'synonym', clue: 'kind, caring, considerate',
        parts: ['thought', 'ful', 'ness'], pos: 'n.',
        definition: 'The quality of caring about others\' feelings or needs.',
        etymology: '<em>thought</em> + <em>-ful</em> + <em>-ness</em>',
        example: 'Her <em>thoughtfulness</em> showed in every small gesture.',
        synonyms: 'kindness, consideration, care',
        antonyms: 'thoughtlessness, indifference, neglect'
      },
      {
        type: 'antonym', clue: 'cruel, harsh, hostile',
        parts: ['friend', 'li', 'ness'], pos: 'n.',
        definition: 'The quality of being kind and pleasant to others.',
        etymology: '<em>friend</em> + <em>-ly</em> + <em>-ness</em>',
        example: 'The town was known for the <em>friendliness</em> of its people.',
        synonyms: 'warmth, kindness, amiability',
        antonyms: 'hostility, coldness, unfriendliness'
      },
      {
        type: 'example', clue: 'She gave a <em>____</em> reply to every question, no matter how rude.',
        parts: ['re', 'spect', 'ful'], pos: 'adj.',
        definition: 'Showing politeness and consideration for others.',
        etymology: '<em>re-</em> (back) + Latin <em>spectus</em> (looked at) + <em>-ful</em>',
        example: 'She gave a <em>respectful</em> reply to every question, no matter how rude.',
        synonyms: 'polite, courteous, civil',
        antonyms: 'rude, disrespectful, impertinent'
      }
    ]
  }
];

const seededPracticeMedium = [
  {
    name: 'Practice — Vision',
    sets: [
      {
        type: 'definition', clue: 'A person who tells what will happen in the future.',
        parts: ['pre', 'dict', 'or'], pos: 'n.',
        definition: 'One who foretells events or outcomes.',
        etymology: 'Latin <em>prae-</em> (before) + <em>dicere</em> (to say) + <em>-or</em>',
        example: 'The economist became a respected <em>predictor</em> of market shifts.',
        synonyms: 'forecaster, prognosticator, seer',
        antonyms: 'observer, follower, hindsight-giver'
      },
      {
        type: 'synonym', clue: 'farsighted, prophetic',
        parts: ['fore', 'see', 'ing'], pos: 'adj.',
        definition: 'Able to know or guess what will happen before it does.',
        etymology: '<em>fore-</em> (before) + <em>see</em> + <em>-ing</em>',
        example: 'His <em>foreseeing</em> mind avoided every trap his rivals set.',
        synonyms: 'prescient, prophetic, far-sighted',
        antonyms: 'blind, unprepared, shortsighted'
      },
      {
        type: 'antonym', clue: 'blind, unaware, ignorant',
        parts: ['per', 'cept', 'ive'], pos: 'adj.',
        definition: 'Quick to notice or understand things.',
        etymology: 'Latin <em>per-</em> (through) + <em>capere</em> (to take) + <em>-ive</em>',
        example: 'A <em>perceptive</em> reader will catch the joke on first read.',
        synonyms: 'astute, observant, discerning',
        antonyms: 'oblivious, dull, unobservant'
      },
      {
        type: 'example', clue: 'The <em>____</em> general spotted the ambush before his scouts did.',
        parts: ['vi', 'gil', 'ant'], pos: 'adj.',
        definition: 'Keeping careful watch for possible danger.',
        etymology: 'Latin <em>vigil</em> (awake) + <em>-ant</em>',
        example: 'The <em>vigilant</em> general spotted the ambush before his scouts did.',
        synonyms: 'watchful, alert, attentive',
        antonyms: 'careless, inattentive, lax'
      }
    ]
  }
];

const seededPracticeHard = [
  {
    name: 'Practice — Concord',
    sets: [
      {
        type: 'definition', clue: 'Tending toward harmony or peaceful agreement.',
        parts: ['con', 'cili', 'atory'], pos: 'adj.',
        definition: 'Intended to placate or reconcile; meant to win goodwill.',
        etymology: 'Latin <em>conciliare</em> (to unite) + <em>-atory</em>',
        example: 'Her <em>conciliatory</em> tone defused the standoff in the boardroom.',
        synonyms: 'placating, peacemaking, mollifying',
        antonyms: 'antagonistic, hostile, provocative'
      },
      {
        type: 'synonym', clue: 'agreement, harmony, concord',
        parts: ['ac', 'cord', 'ance'], pos: 'n.',
        definition: 'A state of agreement or conformity.',
        etymology: 'Old French <em>acorder</em> (to agree) + <em>-ance</em>',
        example: 'The judgment was rendered in <em>accordance</em> with established precedent.',
        synonyms: 'conformity, agreement, harmony',
        antonyms: 'discord, conflict, disagreement'
      },
      {
        type: 'antonym', clue: 'discordant, quarrelsome, contentious',
        parts: ['har', 'moni', 'ous'], pos: 'adj.',
        definition: 'Free from conflict; pleasingly consistent.',
        etymology: 'Greek <em>harmonia</em> (joining, agreement) + <em>-ous</em>',
        example: 'The choir produced a <em>harmonious</em> blend few ensembles could match.',
        synonyms: 'concordant, peaceful, melodious',
        antonyms: 'discordant, jarring, contentious'
      },
      {
        type: 'example', clue: 'After hours of negotiation, the two factions reached a <em>____</em> settlement.',
        parts: ['con', 'sens', 'ual'], pos: 'adj.',
        definition: 'Reached by general agreement of those involved.',
        etymology: 'Latin <em>consensus</em> (agreement) + <em>-ual</em>',
        example: 'After hours of negotiation, the two factions reached a <em>consensual</em> settlement.',
        synonyms: 'agreed-upon, mutual, concordant',
        antonyms: 'unilateral, imposed, contested'
      }
    ]
  }
];

const migrated = {
  themes: raw.map((p, i) => {
    const tiers = { hard: { sets: p.sets } };
    if (i === 0) {
      tiers.easy = seededEasyTheme1;
      tiers.medium = seededMediumTheme1;
    }
    return { name: p.name, tiers };
  }),
  practice: {
    easy: seededPracticeEasy,
    medium: seededPracticeMedium,
    hard: seededPracticeHard
  }
};

writeFileSync(jsonPath, JSON.stringify(migrated, null, 2) + '\n');
console.log(`Migrated ${raw.length} themes; seeded easy+medium for theme 0 and 1 practice puzzle per tier.`);
```

- [ ] **Step 2: Run the migration**

```bash
mkdir -p scripts
node scripts/migrate-glossari-json.mjs
```

Expected output:
```
Migrated 16 themes; seeded easy+medium for theme 0 and 1 practice puzzle per tier.
```

- [ ] **Step 3: Verify the new shape structurally**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('glossari.json','utf8'));
console.assert(Array.isArray(d.themes), 'themes not array');
console.assert(d.themes.length === 16, 'theme count wrong: ' + d.themes.length);
console.assert(d.themes[0].tiers.easy && d.themes[0].tiers.medium && d.themes[0].tiers.hard, 'theme 0 missing tier');
console.assert(d.themes[1].tiers.hard && !d.themes[1].tiers.easy, 'theme 1 should be hard-only');
console.assert(d.practice.easy.length === 1 && d.practice.medium.length === 1 && d.practice.hard.length === 1, 'practice seed wrong');
// Verify parts.length === 3 everywhere
for (const [i, t] of d.themes.entries()) {
  for (const tier of Object.keys(t.tiers)) {
    for (const [si, s] of t.tiers[tier].sets.entries()) {
      console.assert(s.parts.length === 3, 'theme ' + i + ' ' + tier + ' set ' + si + ' parts.length != 3');
    }
  }
}
for (const tier of ['easy','medium','hard']) {
  for (const [pi, p] of d.practice[tier].entries()) {
    for (const [si, s] of p.sets.entries()) {
      console.assert(s.parts.length === 3, 'practice ' + tier + ' ' + pi + ' set ' + si + ' parts.length != 3');
    }
  }
}
console.log('OK');
"
```

Expected: `OK` with no assertion failures.

- [ ] **Step 4: Sanity-check that the existing game would break (this is expected — proves coverage)**

Open `http://localhost:8000/glossari.html` in a browser. Expected: it fails to load puzzles or shows an error, because the loader still expects a flat array. **This confirms Task 2 is necessary.** Do not "fix" anything yet.

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-glossari-json.mjs glossari.json
git commit -m "$(cat <<'EOF'
Migrate glossari.json to tiered shape

Top-level becomes { themes, practice }. Existing 16 puzzles wrap into
themes[i].tiers.hard with no content changes. Theme 0 gains seeded
easy + medium variants and the practice pool gets 1 puzzle per tier
to make the full tier flow testable end-to-end before bulk authoring.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Tier-aware data loader and helper functions

**Files:**
- Modify: `glossari.html:923-998` (data load and `dailyIndex`)

Replace the flat `PUZZLES` array model with `THEMES` + `PRACTICE`, and add helpers that look up a theme's tier variant. Keep `dailyIndex` semantics — it picks an index into themes by date.

- [ ] **Step 1: Replace the data-load block in `glossari.html`**

Find the block starting at line 932 (`let PUZZLES = [];`) through line 998 (the close of `dailyIndex`). Replace with:

```javascript
let THEMES = [];      // [{ name, tiers: { easy?, medium?, hard? } }]
let PRACTICE = { easy: [], medium: [], hard: [] };
const TIERS = ['easy', 'medium', 'hard'];

// Admin/dev override: ?puzzle=<idx-or-name> forces a specific theme.
// &tier=easy|medium|hard picks which tier variant to load (default: hard).
function slugifyName(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function forcedPuzzleIdx() {
  if (typeof location === 'undefined' || !location.search) return null;
  const raw = new URLSearchParams(location.search).get('puzzle');
  if (raw == null) return null;
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 0 && n < THEMES.length) return n;
  const slug = slugifyName(raw);
  const byName = THEMES.findIndex(t => slugifyName(t.name) === slug);
  return byName >= 0 ? byName : null;
}
function forcedTier() {
  if (typeof location === 'undefined' || !location.search) return null;
  const raw = new URLSearchParams(location.search).get('tier');
  return TIERS.includes(raw) ? raw : null;
}
// ?practice=easy:0 — load a specific practice puzzle by tier and index.
function forcedPracticeRef() {
  if (typeof location === 'undefined' || !location.search) return null;
  const raw = new URLSearchParams(location.search).get('practice');
  if (!raw) return null;
  const [tier, idxStr] = raw.split(':');
  const idx = Number(idxStr);
  if (!TIERS.includes(tier) || !Number.isInteger(idx)) return null;
  if (!PRACTICE[tier] || idx < 0 || idx >= PRACTICE[tier].length) return null;
  return { tier, idx };
}
function isPreviewMode() {
  if (typeof location === 'undefined' || !location.search) return false;
  return new URLSearchParams(location.search).get('preview') === '1';
}

// Returns the tier variant (or null) for a theme. Themes always have hard;
// easy/medium are optional.
function getTierVariant(themeIdx, tier) {
  const theme = THEMES[themeIdx];
  if (!theme || !theme.tiers) return null;
  return theme.tiers[tier] || null;
}
function tierAvailable(themeIdx, tier) {
  return getTierVariant(themeIdx, tier) != null;
}

// Boot path for ?preview=1.
function bootPreview() {
  document.body.classList.add('preview-mode');
  state.mode = 'preview';
  state.playDate = todayStr();
  state.tier = forcedTier() || 'hard';
  state.puzzleIdx = forcedPuzzleIdx() ?? 0;
  resetGameState();
  loadPuzzle();
  state.solvedSets = state.solvedSets.map(_ => true);
  state.locked = true;
  stopTimer();
  renderAll();
}

fetch('glossari.json')
  .then(r => { if (!r.ok) throw new Error('Failed to load puzzles'); return r.json(); })
  .then(data => {
    // Defensive: refuse to run against the old flat-array shape.
    if (Array.isArray(data) || !data.themes || !data.practice) {
      throw new Error('glossari.json is in legacy shape; run scripts/migrate-glossari-json.mjs');
    }
    THEMES = data.themes;
    PRACTICE = data.practice;
    if (isPreviewMode()) { bootPreview(); return; }
    let seenTutorial = false;
    try { seenTutorial = localStorage.getItem('tutorial_seen') === '1'; } catch (e) {}
    refreshIntroButtons();
    if (seenTutorial) { document.getElementById('intro').classList.add('show'); }
    else { openTutorial(); }
  })
  .catch((err) => {
    document.getElementById('intro').innerHTML = '<div class="go-title" style="font-size:1.2rem">Could not load puzzles</div><div class="intro-rules" style="margin-top:1rem">' + (err && err.message ? err.message : 'Make sure glossari.json is in the same folder as this file.') + '</div>';
    document.getElementById('intro').classList.add('show');
  });

const STORAGE_KEY_V1 = 'glossari_daily_v1';
const STORAGE_KEY_V2 = 'glossari_daily_v2';
const STORAGE_KEY = 'glossari_daily_v3';
const LAUNCH_DATE = '2026-05-17';

function dailyIndex(dateStr) {
  const ms = Date.parse(dateStr + 'T00:00:00Z') - Date.parse(LAUNCH_DATE + 'T00:00:00Z');
  const days = Math.floor(ms / 86400000);
  if (days < 0) return 0;
  return days % THEMES.length;
}
```

Note: `refreshIntroButtons` is introduced in Task 5. For now it doesn't exist — the page will fail when called. That's fine; we'll fix it in Task 5. Track this dependency.

- [ ] **Step 2: Globally replace `PUZZLES` with the appropriate new symbol in `glossari.html`**

Use Edit's `replace_all` to rename remaining bare `PUZZLES` references that pertain to the daily catalog. The cleanest replacement is to keep a single function `currentPuzzle()` that returns the loaded puzzle from `state`. Since callers vary, do it case-by-case:

Find these specific call sites and update them in subsequent tasks:
- `glossari.html:1124` — `state.puzzleIdx = Math.floor(Math.random() * PUZZLES.length);` (practice — replaced in Task 8)
- `glossari.html:1286` — `const puzzle = PUZZLES[state.puzzleIdx];` (`loadPuzzle` — Task 3)
- `glossari.html:1591` — `const puzzle = PUZZLES[state.puzzleIdx];` (`showReveal` — Task 9)
- `glossari.html:1708` — `const puzzle = PUZZLES[state.puzzleIdx];` (`copyResult` — Task 9)

For now, do a search-only pass:

```bash
grep -n 'PUZZLES' glossari.html
```

Expected: 4 remaining references at the lines above. Note them in the commit message of this task as known follow-ups.

- [ ] **Step 3: Add `state.tier` default to the state literal**

In `glossari.html`, find the `let state = { ... }` literal (around line 1050) and add `tier: 'hard',` to it. Updated literal:

```javascript
let state = {
  puzzleIdx: 0, mode: 'daily', tier: 'hard', puzzleMarksByEntry: [],
  items: [], selectedIds: new Set(), solvedSets: [], revealedSets: [],
  mistakes: 0, puzzlesSolved: 0, flawless: 0, totalMistakes: 0,
  locked: false, timerStart: null, timerInterval: null, elapsed: 0,
  guessLog: [],
  playDate: null, replay: false, inProgress: false,
};
```

- [ ] **Step 4: Verify in browser (expected: partial breakage)**

Reload `http://localhost:8000/glossari.html`. Expected: page loads but throws `refreshIntroButtons is not defined` in the console; intro doesn't render properly. **This is expected** — Task 5 introduces `refreshIntroButtons`. Confirm in DevTools console that the only error is `refreshIntroButtons is not defined` and that `THEMES` is populated:

```
> THEMES.length
16
> THEMES[0].tiers.easy.sets.length
4
> PRACTICE.easy.length
1
```

- [ ] **Step 5: Commit**

```bash
git add glossari.html
git commit -m "$(cat <<'EOF'
Load tiered glossari.json shape; add tier helpers

THEMES + PRACTICE replace PUZZLES. New helpers getTierVariant,
tierAvailable, forcedTier, forcedPracticeRef. state.tier defaults to
'hard'. Storage key bumps to v3 (migration in Task 6). Four PUZZLES
references remain at known call sites; replaced in Tasks 3, 8, 9.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Tier-aware `loadPuzzle`

**Files:**
- Modify: `glossari.html:1283-1302`

`loadPuzzle()` is the function that builds in-game state from a puzzle. It must read from `getTierVariant(state.puzzleIdx, state.tier)` instead of `PUZZLES[state.puzzleIdx]`. Practice mode needs to load from `PRACTICE[tier][practiceIdx]` instead — but we handle practice routing in Task 8; for now, only daily needs to work.

- [ ] **Step 1: Update `loadPuzzle` to be tier-aware**

Replace the function (currently lines 1283–1302):

```javascript
function loadPuzzle() {
  state.inProgress = true;
  document.getElementById('practiceLink').style.display = 'none';
  // Daily mode: look up tier variant on the current theme.
  // Practice mode: state.puzzleSource holds the resolved puzzle object directly (set by startPracticeGame).
  let puzzle;
  if (state.mode === 'practice') {
    puzzle = state.puzzleSource;
  } else {
    const variant = getTierVariant(state.puzzleIdx, state.tier);
    if (!variant) {
      console.error('No variant for theme', state.puzzleIdx, 'tier', state.tier);
      return;
    }
    // The theme provides name; the variant provides sets.
    puzzle = { name: THEMES[state.puzzleIdx].name, sets: variant.sets };
  }
  state.mistakes = 0; state.locked = false; state.selectedIds = new Set();
  state.guessLog = [];
  state.items = []; let id = 0;
  puzzle.sets.forEach((s, si) => { state.items.push({ id: id++, type: 'clue', clueObj: s, setIdx: si }); });
  const tileItems = [];
  puzzle.sets.forEach((s, si) => { s.parts.forEach(p => { tileItems.push({ id: id++, type: 'tile', text: p, setIdx: si }); }); });
  state.items.push(...shuffle(tileItems));
  state.solvedSets = puzzle.sets.map(_ => false); state.revealedSets = puzzle.sets.map(_ => false);
  document.getElementById('puzzleName').textContent = puzzle.name;
  state.currentPuzzle = puzzle; // cache for showReveal/copyResult use
  const playDate = state.playDate || todayStr();
  const isLive = playDate === todayStr();
  const d = new Date(playDate + 'T12:00:00Z');
  const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  document.getElementById('subbarDate').textContent = isLive ? dateLabel : 'Archive · ' + dateLabel;
  renderMistakes(); renderAll(); updateSubmit(); startTimer();
}
```

- [ ] **Step 2: Confirm by manual smoke** — defer; full smoke happens after Task 5 (intro is broken until then).

- [ ] **Step 3: Commit**

```bash
git add glossari.html
git commit -m "Make loadPuzzle tier-aware; cache state.currentPuzzle

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: In-puzzle tier label in subbar

**Files:**
- Modify: `glossari.html` (subbar markup around line 789, CSS around line 668)
- Modify: `glossari.html:1283-1302` (`loadPuzzle` sets the label)

The subbar currently shows the date + theme name. Add a static tier label visible during play.

- [ ] **Step 1: Add a tier-label span to the subbar markup**

Find the subbar block in `glossari.html` (around line 788–793):

```html
    <div class="subbar-date" id="subbarDate"></div>
    <div class="puzzle-name">
      <span class="puzzle-name-label">today's theme</span>
      <span class="name" id="puzzleName">— —</span>
    </div>
```

Add a tier label after the puzzle-name block. The simplest, least disruptive placement is on the right side of the subbar, mirroring the date on the left. Replace the subbar block with:

```html
    <div class="subbar-date" id="subbarDate"></div>
    <div class="puzzle-name">
      <span class="puzzle-name-label">today's theme</span>
      <span class="name" id="puzzleName">— —</span>
    </div>
    <div class="subbar-tier" id="subbarTier"></div>
```

- [ ] **Step 2: Add CSS for `.subbar-tier`**

Find the `.subbar-date` rule (around line 669) and add a sibling rule immediately after it:

```css
.subbar-tier {
  font-family: 'Lora', serif; font-style: italic;
  font-size: 0.55rem; color: var(--ink-faint);
  letter-spacing: 0.04em; text-transform: lowercase;
}
```

- [ ] **Step 3: Populate the tier label in `loadPuzzle`**

In `loadPuzzle`, just after the line that sets `subbarDate.textContent`, add:

```javascript
document.getElementById('subbarTier').textContent = state.mode === 'practice' ? 'practice' : state.tier;
```

- [ ] **Step 4: Hide the tier label in preview mode**

Find the preview-mode CSS block (around line 760–763) and add `body.preview-mode .subbar-tier { display: none; }` to the existing hidden-in-preview list.

- [ ] **Step 5: Commit**

```bash
git add glossari.html
git commit -m "Add tier label to in-puzzle subbar

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Landing page — replace Begin with three tier buttons

**Files:**
- Modify: `glossari.html` (intro overlay markup around line 849–855, related JS)

Replace the single Begin button with three tier buttons. Each button shows its tier's per-day state: `Begin` / `Resume` / `Played` / disabled with `Unavailable today` caption.

- [ ] **Step 1: Replace the intro-actions markup**

Find (around line 849–855):

```html
    <div class="intro-actions" id="introActions">
      <button class="btn" id="beginBtn" onclick="startGame()">Begin</button>
      <div class="intro-actions-row">
        <button class="btn-secondary" id="introPracticeBtn" onclick="startPracticeGame()">Practice</button>
        <button class="btn-secondary" id="introArchiveBtn" onclick="openArchive()">Archive</button>
      </div>
    </div>
```

Replace with:

```html
    <div class="intro-actions" id="introActions">
      <div class="tier-buttons" id="tierButtons">
        <button class="btn tier-btn" data-tier="easy"   onclick="startGame('easy')">Easy</button>
        <button class="btn tier-btn" data-tier="medium" onclick="startGame('medium')">Medium</button>
        <button class="btn tier-btn" data-tier="hard"   onclick="startGame('hard')">Hard</button>
      </div>
      <div class="intro-actions-row">
        <button class="btn-secondary" id="introPracticeBtn" onclick="openPracticePicker()">Practice</button>
        <button class="btn-secondary" id="introArchiveBtn" onclick="openArchive()">Archive</button>
      </div>
    </div>
```

- [ ] **Step 2: Add CSS for tier buttons**

Find the existing `.btn` rule in the CSS (search for `class="btn"` to find styling references, or locate where `.btn` is defined — search for `.btn {` in the stylesheet). Add after it:

```css
.tier-buttons {
  display: flex; gap: 0.6rem; justify-content: center;
  flex-wrap: wrap; margin-bottom: 0.6rem;
}
.tier-btn { min-width: 5.5rem; flex: 1 1 auto; max-width: 8rem; }
.tier-btn[disabled] {
  opacity: 0.4; cursor: not-allowed; pointer-events: none;
}
.tier-btn .tier-state {
  display: block;
  font-family: 'Lora', serif; font-style: italic; font-weight: 400;
  font-size: 0.55rem; letter-spacing: 0.06em; text-transform: lowercase;
  color: var(--ink-faint); margin-top: 0.15rem;
}
```

- [ ] **Step 3: Rewrite `startGame` and remove the old single-button flow**

Find `startGame` (around line 1274–1281) and replace:

```javascript
function startGame(tier) {
  if (!TIERS.includes(tier)) return;
  if (!tierAvailable(dailyIndex(todayStr()), tier)) return;
  state.tier = tier;
  startDailyGame(undefined, { tier });
}
```

Also remove the now-unused `updateStartBtn` function (was around line 1263) — replaced by `refreshIntroButtons` below. Search for and delete:

```javascript
function updateStartBtn() {
  document.getElementById('beginBtn').textContent = state.inProgress ? 'Resume' : 'Begin';
}
```

And replace the call site in `goHome` (around line 1267–1272):

```javascript
function goHome() {
  if (!state.inProgress) return;
  stopTimer();
  refreshIntroButtons();
  document.getElementById('intro').classList.add('show');
}
```

Also remove any other `updateStartBtn()` calls (use grep to find them and delete each line):

```bash
grep -n 'updateStartBtn' glossari.html
```

- [ ] **Step 4: Implement `refreshIntroButtons`**

Add this new function in `glossari.html` (place it near the other UI-render functions, e.g. just before `loadPuzzle`):

```javascript
// Refresh the three tier buttons on the landing page to reflect each
// tier's per-day state. Called on intro show and after completions.
function refreshIntroButtons() {
  const themeIdx = dailyIndex(todayStr());
  const today = todayStr();
  for (const tier of TIERS) {
    const btn = document.querySelector(`.tier-btn[data-tier="${tier}"]`);
    if (!btn) continue;
    const available = tierAvailable(themeIdx, tier);
    const tierState = getTierDayState(tier, today);
    let label = tier.charAt(0).toUpperCase() + tier.slice(1);
    let sub = '';
    if (!available) {
      btn.disabled = true;
      sub = 'unavailable today';
    } else if (tierState && tierState.result) {
      btn.disabled = false;
      sub = tierState.result.allSolved ? '✓ played' : '◊ played';
    } else if (tierState && tierState.inProgress) {
      btn.disabled = false;
      sub = 'resume';
    } else {
      btn.disabled = false;
      sub = 'begin';
    }
    btn.innerHTML = `${label}<span class="tier-state">${sub}</span>`;
  }
}
```

This function references `getTierDayState` which is introduced in Task 6. For now, leave a stub at the top of the script:

```javascript
// Stub — full implementation in Task 6 (per-tier storage).
function getTierDayState(tier, dateStr) { return null; }
```

Place the stub just below the `let state = {...}` literal so it's defined before `refreshIntroButtons` is called.

- [ ] **Step 5: Verify in browser**

Reload `http://localhost:8000/glossari.html` and inspect:
- Tutorial appears on first load (or reload after clearing `tutorial_seen` localStorage). After skipping, intro overlay shows three tier buttons: Easy / Medium / Hard.
- On today's date (theme 0), all three buttons should be active and labeled "Begin" since the seeded variants exist.
- Click "Hard" → existing puzzle loads, subbar shows `hard` on the right side.
- Refresh; click "Easy" → easy variant of theme 0 loads (`un + truth + ful`, etc.), subbar shows `easy`.
- Verify no console errors. Persistence won't yet remember tier completion (Task 6).

- [ ] **Step 6: Commit**

```bash
git add glossari.html
git commit -m "$(cat <<'EOF'
Replace Begin button with three tier buttons on landing

Landing now shows Easy / Medium / Hard buttons, each reflecting per-tier
state (begin / resume / played / unavailable). Persistence stub returns
null until Task 6 wires per-tier storage.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Per-tier localStorage schema (v3) with migration

**Files:**
- Modify: `glossari.html:989-1046` (storage section)
- Create: `tests/test-migrations.html`

Move from one global `byDate`/streak/totals blob to a per-tier shape. Migrate existing v2 data into `tiers.hard`.

**v3 shape:**
```javascript
{
  v: 3,
  tiers: {
    easy:   { byDate: {}, streak: 0, bestStreak: 0, lastPlayedDate: null, totalPlayed: 0, totalSolved: 0, totalFlawless: 0, totalSolveSeconds: 0, solvedTimedCount: 0 },
    medium: { ... same shape ... },
    hard:   { ... same shape ... }
  }
}
```

- [ ] **Step 1: Replace the storage block**

Replace the section starting at line 989 (`const STORAGE_KEY_V1 = ...`) through line 1046 (`function saveStorage`). Note: Task 2 already updated the key constants. The functions need to be rewritten. Replace `migrateStorageIfNeeded`, `loadStorage`, `saveStorage` with:

```javascript
function emptyTierState() {
  return {
    byDate: {},
    streak: 0,
    bestStreak: 0,
    lastPlayedDate: null,
    totalPlayed: 0,
    totalSolved: 0,
    totalFlawless: 0,
    totalSolveSeconds: 0,
    solvedTimedCount: 0,
  };
}

function emptyV3() {
  return {
    v: 3,
    tiers: { easy: emptyTierState(), medium: emptyTierState(), hard: emptyTierState() },
  };
}

// v1 → v2 (existing logic from prior release, preserved). Used as an
// intermediate step when migrating v1 storage forward to v3.
function migrateV1toV2() {
  try {
    if (localStorage.getItem(STORAGE_KEY_V2)) return;
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
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(v2));
  } catch {}
}

// v2 → v3: move all top-level fields into tiers.hard (existing players are
// all hard-tier players). Leaves v2 key in place for one release as a
// safety net; can be removed later.
function migrateV2toV3() {
  try {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    const v3 = emptyV3();
    if (rawV2) {
      const v2 = JSON.parse(rawV2) || {};
      v3.tiers.hard = {
        byDate: v2.byDate || {},
        streak: v2.streak || 0,
        bestStreak: v2.bestStreak || 0,
        lastPlayedDate: v2.lastPlayedDate || null,
        totalPlayed: v2.totalPlayed || 0,
        totalSolved: v2.totalSolved || 0,
        totalFlawless: v2.totalFlawless || 0,
        totalSolveSeconds: v2.totalSolveSeconds || 0,
        solvedTimedCount: v2.solvedTimedCount || 0,
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v3));
  } catch {}
}

function migrateStorageIfNeeded() {
  migrateV1toV2();
  migrateV2toV3();
}

function loadStorage() {
  migrateStorageIfNeeded();
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || parsed.v !== 3 || !parsed.tiers) return emptyV3();
    // Defensive: ensure each tier exists.
    for (const t of TIERS) {
      if (!parsed.tiers[t]) parsed.tiers[t] = emptyTierState();
    }
    return parsed;
  } catch {
    return emptyV3();
  }
}

function saveStorage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function tierStorage(tier) {
  const all = loadStorage();
  return all.tiers[tier] || emptyTierState();
}

// Replace the stub from Task 5.
function getTierDayState(tier, dateStr) {
  const ts = tierStorage(tier);
  const entry = ts.byDate && ts.byDate[dateStr];
  if (!entry) return null;
  return { result: entry.result, inProgress: false };
}
```

Then **delete** the stub `getTierDayState` placed in Task 5 so this one wins. Search and remove:

```bash
grep -n 'Stub — full implementation in Task 6' glossari.html
```

- [ ] **Step 2: Create the migration test page**

```bash
mkdir -p tests
```

Create `tests/test-migrations.html`:

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Glossari — Migration Tests</title>
<style>
body { font-family: ui-monospace, Menlo, monospace; padding: 1.5rem; max-width: 900px; margin: 0 auto; }
h1 { font-family: serif; }
.pass { color: #2a7a2a; }
.fail { color: #c01818; font-weight: bold; }
pre { background: #f4f4f2; padding: 0.6rem; border-radius: 4px; overflow-x: auto; }
.case { margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #ccc; }
</style>
</head>
<body>
<h1>Glossari — localStorage Migration Tests</h1>
<p>Each case: clears localStorage, sets up a starting state, runs the migration, and checks the result. Open the browser console for full diffs on failures.</p>
<div id="results"></div>

<script>
// Inline copies of the constants and migration helpers from glossari.html.
// Keep these in sync if the originals change. Worth re-running this page
// after any storage-related edit.

const STORAGE_KEY_V1 = 'glossari_daily_v1';
const STORAGE_KEY_V2 = 'glossari_daily_v2';
const STORAGE_KEY = 'glossari_daily_v3';
const TIERS = ['easy', 'medium', 'hard'];

function emptyTierState() {
  return { byDate: {}, streak: 0, bestStreak: 0, lastPlayedDate: null, totalPlayed: 0, totalSolved: 0, totalFlawless: 0, totalSolveSeconds: 0, solvedTimedCount: 0 };
}
function emptyV3() { return { v: 3, tiers: { easy: emptyTierState(), medium: emptyTierState(), hard: emptyTierState() } }; }

function migrateV1toV2() {
  try {
    if (localStorage.getItem(STORAGE_KEY_V2)) return;
    const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (!rawV1) return;
    const v1 = JSON.parse(rawV1) || {};
    const v2 = { byDate: {}, streak: v1.streak || 0, bestStreak: v1.bestStreak || 0, lastPlayedDate: v1.lastPlayedDate || null, totalPlayed: v1.totalPlayed || 0, totalSolved: v1.totalSolved || 0, totalFlawless: v1.totalFlawless || 0, totalSolveSeconds: 0, solvedTimedCount: 0 };
    if (v1.lastPlayedDate && v1.lastResult) {
      v2.byDate[v1.lastPlayedDate] = { puzzleIdx: v1.lastPlayedIndex ?? 0, result: v1.lastResult, completedAt: Date.now(), source: 'live' };
      if (v1.lastResult.allSolved && typeof v1.lastResult.elapsedSeconds === 'number') {
        v2.totalSolveSeconds = v1.lastResult.elapsedSeconds; v2.solvedTimedCount = 1;
      }
    }
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(v2));
  } catch {}
}

function migrateV2toV3() {
  try {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    const v3 = emptyV3();
    if (rawV2) {
      const v2 = JSON.parse(rawV2) || {};
      v3.tiers.hard = {
        byDate: v2.byDate || {}, streak: v2.streak || 0, bestStreak: v2.bestStreak || 0,
        lastPlayedDate: v2.lastPlayedDate || null, totalPlayed: v2.totalPlayed || 0,
        totalSolved: v2.totalSolved || 0, totalFlawless: v2.totalFlawless || 0,
        totalSolveSeconds: v2.totalSolveSeconds || 0, solvedTimedCount: v2.solvedTimedCount || 0,
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v3));
  } catch {}
}

function migrateStorageIfNeeded() { migrateV1toV2(); migrateV2toV3(); }

function resetLS() { localStorage.removeItem(STORAGE_KEY_V1); localStorage.removeItem(STORAGE_KEY_V2); localStorage.removeItem(STORAGE_KEY); }

const cases = [
  {
    name: 'Fresh user (no prior storage)',
    setup() { resetLS(); },
    check() {
      migrateStorageIfNeeded();
      const v3 = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!v3 || v3.v !== 3) return 'v3 not written';
      if (v3.tiers.hard.streak !== 0 || Object.keys(v3.tiers.hard.byDate).length !== 0) return 'fresh user has data';
      return null;
    }
  },
  {
    name: 'v2 only (existing hard player with streak + byDate)',
    setup() {
      resetLS();
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify({
        byDate: { '2026-05-18': { puzzleIdx: 1, result: { allSolved: true, elapsedSeconds: 120, mistakesUsed: 0 }, completedAt: 0, source: 'live' } },
        streak: 3, bestStreak: 5, lastPlayedDate: '2026-05-18',
        totalPlayed: 4, totalSolved: 3, totalFlawless: 2,
        totalSolveSeconds: 480, solvedTimedCount: 3
      }));
    },
    check() {
      migrateStorageIfNeeded();
      const v3 = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (v3.tiers.hard.streak !== 3) return 'streak not migrated: ' + v3.tiers.hard.streak;
      if (v3.tiers.hard.bestStreak !== 5) return 'bestStreak not migrated';
      if (!v3.tiers.hard.byDate['2026-05-18']) return 'byDate not migrated';
      if (v3.tiers.easy.streak !== 0) return 'easy tier polluted';
      return null;
    }
  },
  {
    name: 'v1 only (legacy → v2 → v3)',
    setup() {
      resetLS();
      localStorage.setItem(STORAGE_KEY_V1, JSON.stringify({
        streak: 2, bestStreak: 4, lastPlayedDate: '2026-05-18', totalPlayed: 3, totalSolved: 2, totalFlawless: 1,
        lastPlayedIndex: 0, lastResult: { allSolved: true, elapsedSeconds: 90, mistakesUsed: 1 }
      }));
    },
    check() {
      migrateStorageIfNeeded();
      const v3 = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (v3.tiers.hard.streak !== 2) return 'streak missing';
      if (!v3.tiers.hard.byDate['2026-05-18']) return 'byDate missing after v1→v2→v3';
      if (v3.tiers.hard.solvedTimedCount !== 1) return 'solvedTimedCount missing';
      return null;
    }
  },
  {
    name: 'Already v3 (idempotency)',
    setup() {
      resetLS();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        v: 3,
        tiers: {
          easy: emptyTierState(),
          medium: { ...emptyTierState(), streak: 7 },
          hard: { ...emptyTierState(), streak: 12 }
        }
      }));
    },
    check() {
      migrateStorageIfNeeded();
      const v3 = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (v3.tiers.medium.streak !== 7) return 'idempotency broke medium streak';
      if (v3.tiers.hard.streak !== 12) return 'idempotency broke hard streak';
      return null;
    }
  },
];

const out = document.getElementById('results');
let pass = 0, fail = 0;
for (const c of cases) {
  const div = document.createElement('div'); div.className = 'case';
  try {
    c.setup();
    const err = c.check();
    if (err) {
      div.innerHTML = `<span class="fail">FAIL</span> — ${c.name}<br><pre>${err}\n\nFinal v3:\n${localStorage.getItem(STORAGE_KEY)}</pre>`;
      fail++;
    } else {
      div.innerHTML = `<span class="pass">PASS</span> — ${c.name}`;
      pass++;
    }
  } catch (e) {
    div.innerHTML = `<span class="fail">THREW</span> — ${c.name}<br><pre>${e.stack || e.message}</pre>`;
    fail++;
  }
  out.appendChild(div);
}
const summary = document.createElement('div');
summary.innerHTML = `<h2>${pass} passed, ${fail} failed</h2>`;
out.prepend(summary);
resetLS();
</script>
</body>
</html>
```

- [ ] **Step 3: Run the migration tests**

Open `http://localhost:8000/tests/test-migrations.html` in a browser. Expected: `4 passed, 0 failed` at the top. If any case fails, fix the migration logic in `glossari.html` AND in the test page (they have to stay aligned) and re-run.

- [ ] **Step 4: Smoke the main game**

Open `http://localhost:8000/glossari.html`. If you had previous v2 storage from playing, your hard streak should be preserved. Tier buttons should reflect tier state — start a hard game, finish it, return to landing, and confirm the Hard button now shows `✓ played` (or `◊ played` if revealed without solving).

Test the "play all three tiers today" path: complete Hard, return to landing (click the wordmark or back via browser nav as needed), tier label for Hard shows played; click Easy, complete it — Easy now also shows played and the two states are independent.

- [ ] **Step 5: Commit**

```bash
git add glossari.html tests/test-migrations.html
git commit -m "$(cat <<'EOF'
Add per-tier localStorage (v3) with v1→v2→v3 migration

Three tier slots, each with its own byDate map and stats counters.
Existing v2 hard data migrates into tiers.hard preserving streaks.
Standalone test page tests/test-migrations.html exercises fresh-user,
v2-only, v1-only, and idempotency cases.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Tier-aware `recordCompletion`, `startDailyGame`, `showAlreadyPlayed`

**Files:**
- Modify: `glossari.html:1099-1121` (`startDailyGame`)
- Modify: `glossari.html:1552-1582` (`recordCompletion`)
- Modify: `glossari.html:1721-1732` (`showAlreadyPlayed`)

Everything that today reads/writes the global storage blob needs to operate on the current tier's slot instead.

- [ ] **Step 1: Update `startDailyGame` to be tier-aware**

Replace (lines 1099–1121):

```javascript
function startDailyGame(dateStr, opts) {
  dateStr = dateStr || todayStr();
  opts = opts || {};
  const replay = !!opts.replay;
  if (opts.tier && TIERS.includes(opts.tier)) state.tier = opts.tier;
  if (!state.tier) state.tier = 'hard';
  const all = loadStorage();
  const tierData = all.tiers[state.tier];
  const existing = tierData.byDate && tierData.byDate[dateStr];
  if (existing && !replay) {
    showAlreadyPlayed(all, state.tier); return;
  }
  state.mode = 'daily';
  state.playDate = dateStr;
  state.replay = replay;
  const forced = forcedPuzzleIdx();
  state.puzzleIdx = forced != null ? forced : dailyIndex(dateStr);
  // If the chosen tier doesn't have a variant for this theme, bail with a
  // gentle message rather than crashing.
  if (!tierAvailable(state.puzzleIdx, state.tier)) {
    alert(`This tier isn't available for today's puzzle.`);
    document.getElementById('intro').classList.add('show');
    return;
  }
  resetGameState();
  document.getElementById('intro').classList.remove('show');
  document.getElementById('alreadyPlayed').classList.remove('show');
  document.getElementById('reveal').classList.remove('show');
  loadPuzzle();
}
```

- [ ] **Step 2: Update `recordCompletion` to write per-tier**

Replace (lines 1552–1582):

```javascript
function recordCompletion() {
  if (state.replay) return;
  if (state.mode === 'practice') return; // practice never affects stats
  const playDate = state.playDate || todayStr();
  const isLive = playDate === todayStr();
  const result = buildCurrentResult();
  const allSolved = result.allSolved;
  const all = loadStorage();
  const t = all.tiers[state.tier];
  if (!t.byDate) t.byDate = {};
  t.byDate[playDate] = {
    puzzleIdx: state.puzzleIdx,
    result,
    completedAt: Date.now(),
    source: isLive ? 'live' : 'archive',
  };
  t.totalPlayed = (t.totalPlayed || 0) + 1;
  if (allSolved) {
    t.totalSolved = (t.totalSolved || 0) + 1;
    t.totalSolveSeconds = (t.totalSolveSeconds || 0) + state.elapsed;
    t.solvedTimedCount = (t.solvedTimedCount || 0) + 1;
    if (result.flawless) t.totalFlawless = (t.totalFlawless || 0) + 1;
  }
  if (isLive) {
    const yesterday = prevEtDate(todayStr());
    const streakBase = t.lastPlayedDate === yesterday ? (t.streak || 0) : 0;
    const newStreak = allSolved ? streakBase + 1 : 0;
    t.streak = newStreak;
    t.bestStreak = Math.max(newStreak, t.bestStreak || 0);
    t.lastPlayedDate = todayStr();
  }
  saveStorage(all);
}
```

- [ ] **Step 3: Update `showAlreadyPlayed`**

Replace (lines 1721–1732). The function previously took the whole storage blob; now it takes the blob plus the tier whose stats to render. Update both the function and any callers (Task 9 will fix the rest):

```javascript
function showAlreadyPlayed(all, tier) {
  document.getElementById('intro').classList.remove('show');
  const t = (all && all.tiers && all.tiers[tier]) || emptyTierState();
  const statsEl = document.getElementById('alreadyStats'); statsEl.textContent = '';
  [['Streak', t.streak || 0], ['Played', t.totalPlayed || 0], ['Flawless', t.totalFlawless || 0], ['Avg Time', formatAvgTime(t)]].forEach(([label, val]) => {
    const div = document.createElement('div'); div.className = 'go-stat';
    const num = document.createElement('div'); num.className = 'go-stat-num'; num.textContent = val;
    const lbl = document.createElement('div'); lbl.className = 'go-stat-label'; lbl.textContent = label;
    div.appendChild(num); div.appendChild(lbl); statsEl.appendChild(div);
  });
  document.getElementById('practiceLink').style.display = 'inline';
  document.getElementById('alreadyPlayed').classList.add('show');
}
```

Now find and update any other call site to `showAlreadyPlayed(stored)` — search:

```bash
grep -n 'showAlreadyPlayed' glossari.html
```

Update each call to pass the current `state.tier` as the second argument. For example, in `closeArchive`:

```javascript
function closeArchive() {
  document.getElementById('archive').classList.remove('show');
  const all = loadStorage();
  const today = todayStr();
  const t = all.tiers[state.tier] || emptyTierState();
  if (t.byDate && t.byDate[today]) {
    showAlreadyPlayed(all, state.tier);
  } else {
    document.getElementById('intro').classList.add('show');
  }
}
```

- [ ] **Step 4: Smoke test**

Open the game. Play the hard tier through to completion. Refresh the page. Confirm the hard button now shows `✓ played` and tapping it shows the already-played screen with your stats.

Then play easy (theme 0) through to completion. Refresh. Confirm both Hard and Easy show as played, and Medium still shows `begin`.

Confirm tapping Medium begins a fresh medium puzzle (because medium hasn't been completed today). Complete medium. All three should now show played.

- [ ] **Step 5: Commit**

```bash
git add glossari.html
git commit -m "$(cat <<'EOF'
Make startDailyGame/recordCompletion/showAlreadyPlayed tier-aware

State writes and reads happen against state.tier's slot only.
showAlreadyPlayed renders the current tier's stats.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Tier-aware Practice mode

**Files:**
- Modify: `glossari.html:1123-1130` (`startPracticeGame`)
- Modify: `glossari.html` intro overlay (add Practice picker)
- Modify: `glossari.html` header "Practice" link behavior

Practice now draws from `PRACTICE[tier]` rather than the daily catalog. The Practice button opens a tier picker (same three-button affordance).

- [ ] **Step 1: Add a Practice picker overlay**

Add a new overlay block in `glossari.html`, immediately after the existing `<div class="overlay" id="alreadyPlayed">...</div>` block (around line 896, after that overlay closes):

```html
  <div class="overlay" id="practicePicker">
    <div class="dict-entry-head">
      <div class="dict-headword-large">Practice</div>
      <div class="dict-tagline">Pick a difficulty</div>
    </div>
    <div class="go-rule"></div>
    <div class="intro-rules" style="margin-bottom:1.1rem; text-align:center">A standalone puzzle outside the daily rotation. Doesn't affect your streak.</div>
    <div class="tier-buttons" id="practiceTierButtons">
      <button class="btn tier-btn" data-tier="easy"   onclick="startPracticeGame('easy')">Easy</button>
      <button class="btn tier-btn" data-tier="medium" onclick="startPracticeGame('medium')">Medium</button>
      <button class="btn tier-btn" data-tier="hard"   onclick="startPracticeGame('hard')">Hard</button>
    </div>
    <div class="intro-actions-row" style="margin-top:0.9rem">
      <button class="btn-secondary" onclick="closePracticePicker()">Back</button>
    </div>
  </div>
```

- [ ] **Step 2: Add `openPracticePicker` / `closePracticePicker` / update `startPracticeGame`**

Add near the other overlay-control functions:

```javascript
function openPracticePicker() {
  document.getElementById('intro').classList.remove('show');
  document.getElementById('alreadyPlayed').classList.remove('show');
  // Disable tier buttons that have no practice content.
  for (const tier of TIERS) {
    const btn = document.querySelector(`#practiceTierButtons .tier-btn[data-tier="${tier}"]`);
    if (!btn) continue;
    const hasContent = Array.isArray(PRACTICE[tier]) && PRACTICE[tier].length > 0;
    btn.disabled = !hasContent;
  }
  document.getElementById('practicePicker').classList.add('show');
}

function closePracticePicker() {
  document.getElementById('practicePicker').classList.remove('show');
  document.getElementById('intro').classList.add('show');
}
```

Replace `startPracticeGame` (lines 1123–1130):

```javascript
function startPracticeGame(tier) {
  if (!TIERS.includes(tier)) return;
  const pool = PRACTICE[tier] || [];
  if (pool.length === 0) return;
  // Honor ?practice=tier:idx if present.
  const forced = forcedPracticeRef();
  const idx = (forced && forced.tier === tier) ? forced.idx : Math.floor(Math.random() * pool.length);
  state.mode = 'practice';
  state.tier = tier;
  state.puzzleSource = pool[idx];
  state.puzzleIdx = -1; // not a theme idx
  resetGameState();
  document.getElementById('intro').classList.remove('show');
  document.getElementById('practicePicker').classList.remove('show');
  document.getElementById('alreadyPlayed').classList.remove('show');
  document.getElementById('reveal').classList.remove('show');
  loadPuzzle();
}
```

- [ ] **Step 3: Update the header "Practice" link**

Find the header (around line 777):

```html
      <button class="practice-link" id="practiceLink" onclick="startPracticeGame()">Practice</button>
```

Change `onclick` to `openPracticePicker()`:

```html
      <button class="practice-link" id="practiceLink" onclick="openPracticePicker()">Practice</button>
```

- [ ] **Step 4: Smoke test**

- Click Practice on the landing — picker overlay appears with three tier buttons.
- Click Easy — loads "Practice — Helpers" puzzle, subbar shows `practice`.
- Complete it — stats are NOT incremented (no change to streak / totalPlayed when you return to the landing).
- Click Practice again — same easy puzzle (only 1 in the pool) loads; verify it's the practice puzzle, not the daily.
- Try Medium and Hard practice — each loads its single seed puzzle.
- Critical check: verify Practice **does not** ever serve a daily catalog puzzle. Open DevTools and confirm `state.puzzleIdx === -1` and `state.mode === 'practice'` when in a practice game.

- [ ] **Step 5: Commit**

```bash
git add glossari.html
git commit -m "$(cat <<'EOF'
Tier-aware Practice mode with dedicated puzzle pool

Practice button opens a tier picker; selected tier loads a random
puzzle from PRACTICE[tier]. Practice never touches the daily catalog
and never affects per-tier stats or streak.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Tier in share text, share block, and reveal header

**Files:**
- Modify: `glossari.html:1589-1619` (`showReveal`)
- Modify: `glossari.html:1637-1686` (`buildShareBlockHTML`)
- Modify: `glossari.html:1688-1705` (`generateShareText`)
- Modify: `glossari.html:1707-1719` (`copyResult`)

Share output gains the tier name. Daily share format becomes `Glossari #N · Easy/Medium/Hard · score`. Reveal header shows the tier alongside the puzzle number.

- [ ] **Step 1: Update `showReveal`**

Replace (lines 1589–1619):

```javascript
function showReveal() {
  state.inProgress = false;
  const puzzle = state.currentPuzzle || (state.mode === 'practice' ? state.puzzleSource : { name: THEMES[state.puzzleIdx].name, sets: getTierVariant(state.puzzleIdx, state.tier).sets });
  const all = loadStorage();
  const playDate = state.playDate || todayStr();
  const dateStr = new Date(playDate + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/New_York' });
  const persisted = state.mode === 'daily' ? (all.tiers[state.tier].byDate || {})[playDate] : null;
  const result = state.mode === 'daily' && persisted && !state.replay
    ? persisted.result
    : buildCurrentResult();
  if (state.mode === 'daily') {
    const puzzleNum = dailyIndex(playDate) + 1;
    const tierLabel = state.tier.charAt(0).toUpperCase() + state.tier.slice(1);
    document.getElementById('revealHeader').innerHTML = `<div class="reveal-num">— Daily No. ${puzzleNum} · ${tierLabel} —</div><div class="reveal-title">${puzzle.name}</div><div class="reveal-date">${dateStr}</div>`;
  } else {
    const tierLabel = state.tier.charAt(0).toUpperCase() + state.tier.slice(1);
    document.getElementById('revealHeader').innerHTML = `<div class="reveal-num">— Practice · ${tierLabel} —</div><div class="reveal-title">${puzzle.name}</div>`;
  }
  const clueItems = state.items.filter(it => it.type === 'clue').sort((a, b) => a.id - b.id);
  const entriesEl = document.getElementById('revealEntries'); entriesEl.innerHTML = '';
  clueItems.forEach(it => {
    const s = it.clueObj; const isSolved = state.solvedSets[it.setIdx];
    const partsHtml = s.parts.map((p, i) => (i > 0 ? '<span class="dict-sep">·</span>' : '') + p).join('');
    const div = document.createElement('div'); div.className = 'dict-entry' + (isSolved ? '' : ' revealed');
    div.innerHTML = `<div class="dict-headword">${partsHtml}</div><div class="dict-pos">${s.pos} <span class="dict-badge">${isSolved ? 'Solved' : 'Revealed'}</span></div><div class="dict-row"><span class="dict-sym">❦</span><span class="dict-text">${s.definition}</span></div><div class="dict-row"><span class="dict-sym">§</span><span class="dict-text">${s.etymology}</span></div><div class="dict-row"><span class="dict-sym">¶</span><span class="dict-text">${s.example}</span></div><div class="dict-row"><span class="dict-sym">≡</span><span class="dict-text">${s.synonyms}</span></div><div class="dict-row"><span class="dict-sym">≠</span><span class="dict-text">${s.antonyms}</span></div>`;
    entriesEl.appendChild(div);
  });
  const puzzleNum = state.mode === 'daily' ? dailyIndex(state.playDate || todayStr()) + 1 : null;
  const tierStats = state.mode === 'daily' ? all.tiers[state.tier] : emptyTierState();
  const sharePlayDate = state.mode === 'daily' ? (state.playDate || todayStr()) : null;
  document.getElementById('shareBlock').innerHTML = buildShareBlockHTML(tierStats, puzzle, puzzleNum, result, sharePlayDate, state.tier);
  document.getElementById('practiceLink').style.display = 'inline';
  document.getElementById('reveal').classList.add('show');
}
```

- [ ] **Step 2: Update `buildShareBlockHTML` signature and output**

Replace (lines 1637–1686):

```javascript
function buildShareBlockHTML(tierStats, puzzle, puzzleNum, result, playDate, tier) {
  const marks = result.marks || [];
  const timeStr = result.elapsedSeconds != null ? formatTime(result.elapsedSeconds) : '—';
  const errStr = result.mistakesUsed === 0 ? 'no errors' : result.mistakesUsed === 1 ? '1 mistake' : `${result.mistakesUsed} mistakes`;
  const solvedCount = marks.filter(m => m === 'solved').length;
  const perf = perfWordFor(result);
  const tierLabel = tier ? (tier.charAt(0).toUpperCase() + tier.slice(1)) : '';
  const puzzleLabel = puzzleNum != null
    ? `No. ${puzzleNum} · ${tierLabel}`
    : (tier ? `Practice · ${tierLabel}` : 'Practice');
  const dateStr = playDate
    ? new Date(playDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const SYM = { correct: '❧', partial: '◆', wrong: '·' };
  const guessLog = state.guessLog || [];
  const headerCols = ['Clue', '·1', '·2', '·3'];
  const headerHtml = headerCols.map((h, i) =>
    (i === 1 ? '<div class="share-guess-sep"></div>' : '') +
    `<div class="share-guess-col" style="font-family:'Lora',serif;font-size:0.42rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-faint);font-style:italic;">${h}</div>`
  ).join('');
  const rowsHtml = guessLog.map(row =>
    `<div class="share-guess-row">${row.map((m, i) =>
      (i === 1 ? '<div class="share-guess-sep"></div>' : '') +
      `<div class="share-guess-col ${m}">${SYM[m]}</div>`
    ).join('')}</div>`
  ).join('');

  return `<div class="share-block" data-puzzle-num="${puzzleNum ?? ''}" data-tier="${tier ?? ''}">
    <div class="share-brand">
      <div class="share-game-title">Glos<span class="share-dot">·</span>sa<span class="share-dot">·</span>ri</div>
      <div class="share-game-sub">${puzzleLabel} · <em>"${puzzle.name}"</em></div>
      ${puzzleNum ? `<div class="share-game-date">${dateStr}</div>` : ''}
    </div>
    <div class="share-guess-grid">
      <div class="share-guess-row">${headerHtml}</div>
      ${rowsHtml}
    </div>
    <div class="share-summary">${solvedCount} of ${marks.length} · ${timeStr} · ${errStr}</div>
    <hr class="share-divider">
    <div class="share-stats">
      <div class="share-stat"><div class="share-stat-num">${tierStats.streak || 0}</div><div class="share-stat-lbl">Streak</div></div>
      <div class="share-stat"><div class="share-stat-num">${tierStats.totalPlayed || 0}</div><div class="share-stat-lbl">Played</div></div>
      <div class="share-stat"><div class="share-stat-num">${tierStats.totalFlawless || 0}</div><div class="share-stat-lbl">Flawless</div></div>
      <div class="share-stat"><div class="share-stat-num">${formatAvgTime(tierStats)}</div><div class="share-stat-lbl">Avg Time</div></div>
    </div>
    <div class="share-perf">
      <div class="share-perf-word"><span class="share-sym">❦</span>${perf.word}<span class="share-perf-pos">${perf.pos}</span></div>
      <div class="share-perf-def">${perf.def}</div>
    </div>
    <button class="share-copy-btn" onclick="copyResult()">Copy Result</button>
  </div>`;
}
```

- [ ] **Step 3: Update `generateShareText`**

Replace (lines 1688–1705):

```javascript
function generateShareText(puzzle, puzzleNum, result, tier) {
  const marks = result.marks || [];
  const timeStr = result.elapsedSeconds != null ? formatTime(result.elapsedSeconds) : '—';
  const errStr = result.mistakesUsed === 0 ? 'no errors' : result.mistakesUsed === 1 ? '1 mistake' : `${result.mistakesUsed} mistakes`;
  const solvedCount = marks.filter(m => m === 'solved').length;
  const tierLabel = tier ? (tier.charAt(0).toUpperCase() + tier.slice(1)) : '';
  const header = puzzleNum != null
    ? `Glos·sa·ri — No. ${puzzleNum} · ${tierLabel}`
    : (tier ? `Glos·sa·ri — Practice · ${tierLabel}` : 'Glos·sa·ri — Practice');
  const SYM = { correct: '❧', partial: '◆', wrong: '·' };
  const guessLog = state.guessLog || [];
  const grid = guessLog.map(row => row.map(m => SYM[m]).join(' ')).join('\n');
  return [
    header,
    `"${puzzle.name}"`,
    '',
    grid,
    '',
    `${solvedCount} of ${marks.length} · ${timeStr} · ${errStr}`,
  ].join('\n');
}
```

- [ ] **Step 4: Update `copyResult`**

Replace (lines 1707–1719):

```javascript
function copyResult() {
  const result = buildCurrentResult();
  const puzzle = state.currentPuzzle || (state.mode === 'practice' ? state.puzzleSource : { name: THEMES[state.puzzleIdx].name, sets: getTierVariant(state.puzzleIdx, state.tier).sets });
  const block = document.querySelector('.share-block');
  const rawNum = block?.dataset.puzzleNum;
  const puzzleNum = rawNum ? parseInt(rawNum, 10) : null;
  const tier = block?.dataset.tier || state.tier;
  const text = generateShareText(puzzle, puzzleNum, result, tier);
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.share-copy-btn'); const orig = btn.textContent;
    btn.textContent = 'Copied ✓'; setTimeout(() => { btn.textContent = orig; }, 1800);
  }).catch(() => {
    const ta = document.createElement('textarea'); ta.value = text;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  });
}
```

- [ ] **Step 5: Smoke test**

- Play Hard to completion. Reveal screen header reads `— Daily No. N · Hard —`. Share block subhead reads `No. N · Hard · "Theme name"`. Click "Copy Result" — pasted text starts `Glos·sa·ri — No. N · Hard`.
- Play Easy to completion. Reveal header reads `— Daily No. N · Easy —`. Share text reads `Glos·sa·ri — No. N · Easy`. Stats shown in the share block are Easy's (not Hard's).
- Play a Practice game (any tier). Reveal header reads `— Practice · {Tier} —`. Share text reads `Glos·sa·ri — Practice · {Tier}`. Practice does NOT show streak stats in the share block, but the block still renders.

- [ ] **Step 6: Commit**

```bash
git add glossari.html
git commit -m "$(cat <<'EOF'
Tier in share text, share block, and reveal header

showReveal, buildShareBlockHTML, generateShareText, copyResult all
take tier through; the disambiguator appears in pasted share text as
'No. N · Easy/Medium/Hard'. Share block stats are per-tier.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Archive per-date tier picker

**Files:**
- Modify: `glossari.html:1170-1259` (`renderArchive` and `archiveCellClick`)

Archive cells today open a single replay of the day's puzzle. Now they should open a small per-date tier picker so the user can replay any of the three tiers (with grayed-out for tiers without content on that date). Archive stats should aggregate across tiers.

Design choice for the picker: rather than building another overlay, we reuse the existing intro tier-buttons UI but in an "archive replay" mode. Simpler approach for v1: a small inline modal rendered on top of the archive grid.

- [ ] **Step 1: Add CSS for the archive tier picker**

Find the existing `.archive-cell` CSS block (search `.archive-cell`) and add immediately after the archive rules:

```css
.archive-tier-picker {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  background: var(--paper); border: 1px solid var(--border);
  border-radius: 6px; padding: 1rem 1.2rem;
  box-shadow: 0 6px 32px rgba(0,0,0,0.18);
  z-index: 20; display: none;
}
.archive-tier-picker.show { display: block; }
.archive-tier-picker .picker-title {
  font-family: 'DM Serif Display', serif; font-style: italic;
  text-align: center; margin-bottom: 0.4rem;
}
.archive-tier-picker .picker-sub {
  font-family: 'Lora', serif; font-style: italic;
  font-size: 0.6rem; color: var(--ink-faint);
  text-align: center; margin-bottom: 0.8rem;
}
.archive-tier-picker .tier-buttons { margin-top: 0.3rem; }
.archive-tier-picker .picker-close {
  display: block; margin: 0.8rem auto 0;
}
```

- [ ] **Step 2: Add the picker markup inside the archive overlay**

Find the archive overlay block (around line 902–919). Add the picker as a sibling of `.archive-inner`, inside `<div class="overlay" id="archive">`:

```html
      <div class="archive-tier-picker" id="archiveTierPicker">
        <div class="picker-title" id="archivePickerTitle">—</div>
        <div class="picker-sub" id="archivePickerSub">—</div>
        <div class="tier-buttons" id="archivePickerButtons">
          <button class="btn tier-btn" data-tier="easy"   onclick="archiveTierPick('easy')">Easy</button>
          <button class="btn tier-btn" data-tier="medium" onclick="archiveTierPick('medium')">Medium</button>
          <button class="btn tier-btn" data-tier="hard"   onclick="archiveTierPick('hard')">Hard</button>
        </div>
        <button class="btn-secondary picker-close" onclick="closeArchiveTierPicker()">Back</button>
      </div>
```

- [ ] **Step 3: Update archive interaction**

Replace `archiveCellClick` (line 1256–1259) and add picker helpers:

```javascript
let archivePickerDate = null;

function archiveCellClick(dateStr) {
  archivePickerDate = dateStr;
  const themeIdx = dailyIndex(dateStr);
  const theme = THEMES[themeIdx];
  const d = new Date(dateStr + 'T12:00:00Z');
  const dateLabel = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  document.getElementById('archivePickerTitle').textContent = theme.name;
  document.getElementById('archivePickerSub').textContent = dateLabel;
  // Enable each tier button only if a variant exists for that date.
  const all = loadStorage();
  for (const tier of TIERS) {
    const btn = document.querySelector(`#archivePickerButtons .tier-btn[data-tier="${tier}"]`);
    if (!btn) continue;
    const available = tierAvailable(themeIdx, tier);
    const tEntry = all.tiers[tier].byDate && all.tiers[tier].byDate[dateStr];
    const sub = !available ? 'unavailable' : (tEntry ? (tEntry.result.allSolved ? '✓ played' : '◊ played') : 'play');
    btn.disabled = !available;
    btn.innerHTML = `${tier.charAt(0).toUpperCase() + tier.slice(1)}<span class="tier-state">${sub}</span>`;
  }
  document.getElementById('archiveTierPicker').classList.add('show');
}

function closeArchiveTierPicker() {
  document.getElementById('archiveTierPicker').classList.remove('show');
  archivePickerDate = null;
}

function archiveTierPick(tier) {
  if (!archivePickerDate) return;
  if (!tierAvailable(dailyIndex(archivePickerDate), tier)) return;
  const date = archivePickerDate;
  closeArchiveTierPicker();
  document.getElementById('archive').classList.remove('show');
  const all = loadStorage();
  const entry = all.tiers[tier].byDate && all.tiers[tier].byDate[date];
  // If already played, replay; otherwise play fresh.
  startDailyGame(date, { tier, replay: !!entry });
}
```

- [ ] **Step 4: Update the archive cell click registration**

In `renderArchive`, find the cell-onclick assignments (around lines 1231 and 1234):

```javascript
        cell.onclick = () => archiveCellClick(dateStr, true);
```
and
```javascript
        cell.onclick = () => archiveCellClick(dateStr, false);
```

Replace both with the no-arg form:

```javascript
        cell.onclick = () => archiveCellClick(dateStr);
```

The picker handles per-tier replay vs. fresh-play distinction now.

- [ ] **Step 5: Update archive cell completion marks (cell shows ✓ if ANY tier played that day)**

In `renderArchive`, the current logic checks `byDate[dateStr]` on the top-level storage blob. Now it must check per-tier. Find the block around line 1216–1230 and replace:

```javascript
    const all = loadStorage();
    const playedTiers = TIERS.filter(t => all.tiers[t].byDate && all.tiers[t].byDate[dateStr]);
    const allSolvedOnAnyTier = playedTiers.some(t => all.tiers[t].byDate[dateStr].result && all.tiers[t].byDate[dateStr].result.allSolved);
    const hasAnyPlay = playedTiers.length > 0;
```

(Replace the existing single-line `const entry = byDate[dateStr];` lookup with the multi-tier logic above; and replace the `entry`-conditional block beneath it with logic that uses `playedTiers`, `allSolvedOnAnyTier`, `hasAnyPlay`.)

Full replaced section (lines 1192–1238 in original — find the entire archive-grid generation loop):

```javascript
  const all = loadStorage();

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
    const playedTiers = TIERS.filter(t => all.tiers[t].byDate && all.tiers[t].byDate[dateStr]);
    const hasAnyPlay = playedTiers.length > 0;
    const allSolvedOnAnyTier = hasAnyPlay && playedTiers.some(t => all.tiers[t].byDate[dateStr].result && all.tiers[t].byDate[dateStr].result.allSolved);

    if (isBeforeLaunch || isFuture) {
      cell.classList.add(isFuture ? 'future' : 'empty');
      if (isBeforeLaunch) cell.classList.add('empty');
    } else {
      if (isToday) cell.classList.add('today');
      if (hasAnyPlay) {
        cell.classList.add('completed');
        cell.classList.add(allSolvedOnAnyTier ? 'solved' : 'revealed');
        const mark = document.createElement('div');
        mark.className = 'archive-mark';
        mark.textContent = allSolvedOnAnyTier ? '✓' : '◊';
        cell.appendChild(mark);
      } else {
        cell.classList.add('available');
      }
      cell.onclick = () => archiveCellClick(dateStr);
    }
    grid.appendChild(cell);
  }
```

- [ ] **Step 6: Update archive stats to show all three tiers**

Replace the stats block at the bottom of `renderArchive` (around lines 1240–1253):

```javascript
  const statsEl = document.getElementById('archiveStats');
  statsEl.innerHTML = '';
  // Per-tier rows: always show all three so other tiers stay discoverable.
  for (const tier of TIERS) {
    const t = all.tiers[tier];
    const row = document.createElement('div');
    row.className = 'archive-stat-row';
    row.innerHTML = `<div class="archive-stat-tier">${tier.charAt(0).toUpperCase() + tier.slice(1)}</div>` +
      [['Streak', t.streak || 0], ['Played', t.totalPlayed || 0], ['Flawless', t.totalFlawless || 0], ['Avg', formatAvgTime(t)]]
        .map(([label, val]) => `<div class="archive-stat"><div class="archive-stat-num">${val}</div><div class="archive-stat-lbl">${label}</div></div>`)
        .join('');
    statsEl.appendChild(row);
  }
```

Add minimal supporting CSS — find the existing `.archive-stats` and `.archive-stat` rules and add adjacent:

```css
.archive-stat-row {
  display: grid; grid-template-columns: 4rem 1fr 1fr 1fr 1fr;
  gap: 0.4rem; align-items: center; padding: 0.3rem 0;
  border-top: 1px solid var(--paper-shadow);
}
.archive-stat-tier {
  font-family: 'Lora', serif; font-style: italic;
  font-size: 0.7rem; color: var(--ink-soft);
  text-align: left;
}
```

(Existing `.archive-stat` / `.archive-stat-num` / `.archive-stat-lbl` styles are reused for the per-tier cells.)

- [ ] **Step 7: Smoke test**

- Play Hard today; play Easy today.
- Open Archive — today's cell shows `✓` (or `◊` if revealed without solving).
- Tap today's cell — picker opens showing "Today's theme" name, with Easy and Hard buttons showing `✓ played` and Medium showing `play`.
- Tap Medium — fresh medium game starts.
- Return to archive — verify all three tiers now play states in the picker.
- Archive stats at the bottom show three rows: Easy / Medium / Hard, each with Streak / Played / Flawless / Avg.

- [ ] **Step 8: Commit**

```bash
git add glossari.html
git commit -m "$(cat <<'EOF'
Archive: per-date tier picker; per-tier stats rows

Tapping an archive cell opens a small modal letting the player pick
which tier to (re)play for that date. Cells mark complete if any
tier was played; ✓ if any tier was fully solved. Archive footer
shows a row per tier with that tier's streak, played, flawless, avg.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Admin — per-tier slots and Practice section

**Files:**
- Modify: `admin/glossari-admin.html`

The admin page currently shows one card per puzzle. Now: one card per theme with three preview slots (Easy / Medium / Hard) + a Practice section listing the 9 sandbox puzzles (3 per tier).

- [ ] **Step 1: Replace admin script and grid markup**

Replace the full `<script>` block in `admin/glossari-admin.html` (lines 107–151) with:

```html
<script>
function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
const TIERS = ['easy', 'medium', 'hard'];

function tierSlot(themeIdx, tier, available) {
  if (!available) {
    return `<div class="tier-slot tier-slot-missing">
      <div class="tier-slot-label">${tier.charAt(0).toUpperCase() + tier.slice(1)}</div>
      <div class="tier-slot-empty">— not authored —</div>
    </div>`;
  }
  return `<div class="tier-slot">
    <div class="tier-slot-label">${tier.charAt(0).toUpperCase() + tier.slice(1)}</div>
    <div class="card-frame">
      <iframe src="../glossari.html?puzzle=${themeIdx}&tier=${tier}&preview=1" loading="lazy" title="${tier} preview"></iframe>
    </div>
    <div class="tier-slot-actions">
      <a class="play-btn" href="../glossari.html?puzzle=${themeIdx}&tier=${tier}" target="_blank" rel="noopener">Play</a>
      <a class="open-btn" href="../glossari.html?puzzle=${themeIdx}&tier=${tier}&preview=1" target="_blank" rel="noopener">Reveal</a>
    </div>
  </div>`;
}

function themeCard(theme, idx) {
  const card = document.createElement('div');
  card.className = 'card theme-card';
  const slug = slugify(theme.name);
  const slotsHtml = TIERS.map(t => tierSlot(idx, t, !!(theme.tiers && theme.tiers[t]))).join('');
  card.innerHTML = `
    <div class="card-meta">
      <div class="card-num">No. ${String(idx + 1).padStart(2, '0')}</div>
      <div class="card-name">${theme.name}</div>
      <div class="card-slug">?puzzle=${slug}</div>
    </div>
    <div class="tier-slots">${slotsHtml}</div>
  `;
  return card;
}

function practiceCard(puzzle, tier, idx) {
  const card = document.createElement('div');
  card.className = 'card practice-card';
  card.innerHTML = `
    <div class="card-frame">
      <iframe src="../glossari.html?practice=${tier}:${idx}&preview=1" loading="lazy" title="${puzzle.name} preview"></iframe>
    </div>
    <div class="card-meta">
      <div class="card-num">Practice · ${tier.charAt(0).toUpperCase() + tier.slice(1)} · ${idx + 1}</div>
      <div class="card-name">${puzzle.name}</div>
      <div class="card-slug">?practice=${tier}:${idx}</div>
    </div>
    <div class="card-actions">
      <a class="play-btn" href="../glossari.html?practice=${tier}:${idx}" target="_blank" rel="noopener">Play</a>
      <a class="open-btn" href="../glossari.html?practice=${tier}:${idx}&preview=1" target="_blank" rel="noopener">Reveal</a>
    </div>
  `;
  return card;
}

function validatePartsLengths(data) {
  const issues = [];
  for (const [i, t] of data.themes.entries()) {
    for (const tier of Object.keys(t.tiers)) {
      for (const [si, s] of t.tiers[tier].sets.entries()) {
        if (!Array.isArray(s.parts) || s.parts.length !== 3) {
          issues.push(`Theme ${i + 1} (${t.name}) ${tier} set ${si + 1}: parts.length is ${s.parts ? s.parts.length : 'undefined'} (must be 3)`);
        }
      }
    }
  }
  for (const tier of TIERS) {
    (data.practice[tier] || []).forEach((p, pi) => {
      p.sets.forEach((s, si) => {
        if (!Array.isArray(s.parts) || s.parts.length !== 3) {
          issues.push(`Practice ${tier} ${pi + 1} (${p.name}) set ${si + 1}: parts.length is ${s.parts ? s.parts.length : 'undefined'} (must be 3)`);
        }
      });
    });
  }
  return issues;
}

fetch('../glossari.json')
  .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then(data => {
    if (!data.themes || !data.practice) throw new Error('glossari.json missing themes/practice — run scripts/migrate-glossari-json.mjs');

    const issues = validatePartsLengths(data);
    if (issues.length) {
      const v = document.getElementById('validation');
      v.className = 'hint error';
      v.innerHTML = `<b>Validation failed (${issues.length} issue${issues.length > 1 ? 's' : ''}):</b><ul>${issues.map(s => `<li>${s}</li>`).join('')}</ul>`;
    }

    const grid = document.getElementById('themesGrid');
    data.themes.forEach((t, i) => grid.appendChild(themeCard(t, i)));

    const pGrid = document.getElementById('practiceGrid');
    TIERS.forEach(tier => {
      (data.practice[tier] || []).forEach((p, i) => pGrid.appendChild(practiceCard(p, tier, i)));
    });

    document.getElementById('hint').innerHTML += ` &nbsp;<span style="color:var(--ink-faint)">(${data.themes.length} themes, ${TIERS.reduce((n, t) => n + (data.practice[t] || []).length, 0)} practice puzzles loaded)</span>`;
  })
  .catch(err => {
    const hint = document.getElementById('hint');
    hint.className = 'hint error';
    hint.innerHTML = `Could not load <code>glossari.json</code>: ${err.message}. Make sure you're serving this page over HTTP (<code>python3 -m http.server 8000</code> in this folder), not opening it via file://.`;
  });

if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.setAttribute('data-theme', 'dark');
}
</script>
```

- [ ] **Step 2: Update the admin HTML body**

Replace the `<div class="app">…</div>` block (lines 95–105) with:

```html
<div class="app">
  <header>
    <h1>Glossari</h1>
    <span class="subtitle">Admin — themes &amp; practice</span>
  </header>
  <div class="hint" id="hint">
    Each theme card shows three tier slots. Practice puzzles are listed separately and never appear in the daily rotation. <b>Play</b> launches a tier blank in a new tab; <b>Reveal</b> opens the solved preview full-screen.
  </div>
  <div class="hint" id="validation" style="display:none"></div>
  <script>
    // Show validation hint only if it gets populated.
    new MutationObserver(() => {
      const v = document.getElementById('validation');
      if (v.innerHTML.trim()) v.style.display = 'block';
    }).observe(document.getElementById('validation'), { childList: true, subtree: true, characterData: true });
  </script>

  <h2 style="font-family:'Spectral',serif;font-weight:600;font-size:1.1rem;color:var(--ink);margin:1.5rem 0 0.8rem;">Themes (daily rotation)</h2>
  <div class="grid" id="themesGrid"></div>

  <h2 style="font-family:'Spectral',serif;font-weight:600;font-size:1.1rem;color:var(--ink);margin:2.5rem 0 0.8rem;">Practice puzzles</h2>
  <div class="grid" id="practiceGrid"></div>
</div>
```

- [ ] **Step 3: Add CSS for the new tier-slot layout inside theme cards**

Add to the admin's `<style>` block (before the closing `</style>`):

```css
.theme-card { gap: 0.5rem; }
.tier-slots {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: 0.4rem;
}
.tier-slot {
  display: flex; flex-direction: column; gap: 0.25rem;
  border: 1px solid var(--border); border-radius: 4px;
  padding: 0.4rem; background: var(--paper);
}
.tier-slot-label {
  font-family: 'Spectral', serif; font-size: 0.7rem;
  color: var(--ink-soft); letter-spacing: 0.08em; text-transform: uppercase;
}
.tier-slot .card-frame { aspect-ratio: 4 / 5; }
.tier-slot-missing {
  opacity: 0.55; min-height: 8rem;
  display: flex; align-items: center; justify-content: center;
  flex-direction: column;
}
.tier-slot-empty {
  font-family: 'Lora', serif; font-style: italic;
  font-size: 0.7rem; color: var(--ink-faint);
}
.tier-slot-actions { display: flex; gap: 0.3rem; }
.tier-slot-actions .play-btn, .tier-slot-actions .open-btn {
  font-size: 0.75rem; padding: 0.3rem 0.4rem;
}
.practice-card .card-frame { aspect-ratio: 4 / 5; }
```

- [ ] **Step 4: Smoke test the admin**

Open `http://localhost:8000/admin/glossari-admin.html`. Expected:
- Page renders without console errors.
- "Themes" section shows 16 theme cards. Theme 1 ("Fault & Faithlessness") shows all three tier slots populated; themes 2–16 show Easy and Medium as "not authored" with only Hard populated.
- "Practice" section shows 3 cards (one per tier).
- Click "Play" on theme 1 Easy slot → opens `glossari.html?puzzle=0&tier=easy` in new tab; the easy variant loads.
- Click "Reveal" on theme 5 Hard slot → opens that hard puzzle in solved preview.
- Click "Play" on a Practice card → loads the practice puzzle (not a daily one).
- No validation errors shown.

- [ ] **Step 5: Commit**

```bash
git add admin/glossari-admin.html
git commit -m "$(cat <<'EOF'
Admin: per-tier theme slots + dedicated Practice section

Each theme card now shows three preview slots (Easy/Medium/Hard) with
'not authored' placeholders for missing tiers. Practice section lists
the dedicated sandbox puzzles. Inline parts.length validator flags
any puzzle whose headword isn't built from exactly three parts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: README update + post-implementation polish

**Files:**
- Modify: `README.md`
- Modify: `glossari.html` (`refreshIntroButtons` call sites — ensure called after archive close, etc.)

- [ ] **Step 1: Update README**

Find the Glossari section in `README.md` (starts around line 5). Replace the **Mechanics** paragraph and the **Share format** paragraph with:

```markdown
**Difficulty tiers:** each daily theme comes in three tiers — **Easy** (productive English affixes, ~4th–8th grade), **Medium** (transparent Latin/Greek roots, ~high school / early college), and **Hard** (current college / grad vocabulary). The landing page presents three tier buttons; players can play any or all three on the same day. Streaks, stats, and share text are independent per tier.

**Mechanics:**
- Select one clue card and three word segments, in order
- All headwords across all tiers are exactly three parts
- Segment order matters — right parts in the wrong order gives a yellow warning rather than a solve
- Four mistakes allowed per puzzle
- Daily puzzle rotates at midnight; practice mode available any time with its own dedicated puzzle pool (separate from the daily rotation)

**Share format:** the results screen shows a guess log with four columns (clue + three segments) using ❧ (correct), ◆ (right part, wrong position), and · (wrong). Share text reads `Glossari — No. N · {Tier} · "{Theme}"` followed by the guess grid.

**Puzzle data:** `glossari.json` — a top-level object with two collections. `themes[]` is the daily rotation; each theme has up to three `tiers` (`easy`, `medium`, `hard`). `practice` is an object keyed by tier, each value a small array of sandbox puzzles never drawn from the daily catalog. Each puzzle in either collection has 4 entries with `parts` always of length 3, plus `pos`, `definition`, `etymology`, `example`, `synonyms`, `antonyms`.
```

- [ ] **Step 2: Ensure `refreshIntroButtons` runs after archive close**

In `closeArchive`, after the `if (t.byDate && ...)` block, ensure `refreshIntroButtons()` is called when returning to intro. Update:

```javascript
function closeArchive() {
  document.getElementById('archive').classList.remove('show');
  const all = loadStorage();
  const today = todayStr();
  const t = all.tiers[state.tier] || emptyTierState();
  if (t.byDate && t.byDate[today]) {
    showAlreadyPlayed(all, state.tier);
  } else {
    refreshIntroButtons();
    document.getElementById('intro').classList.add('show');
  }
}
```

Same in `closePracticePicker`:

```javascript
function closePracticePicker() {
  document.getElementById('practicePicker').classList.remove('show');
  refreshIntroButtons();
  document.getElementById('intro').classList.add('show');
}
```

And in `goHome`:

```javascript
function goHome() {
  if (!state.inProgress) return;
  stopTimer();
  refreshIntroButtons();
  document.getElementById('intro').classList.add('show');
}
```

- [ ] **Step 3: Full smoke test of the integrated experience**

Clear localStorage in DevTools. Reload `glossari.html`. Walk through:
- Tutorial appears (first visit). Skip.
- Landing shows three tier buttons. Easy/Medium/Hard for theme 0 all show "begin".
- Click Hard → play to completion. Reveal screen shows `Daily No. N · Hard`. Copy result → paste shows `Glos·sa·ri — No. N · Hard`. Return to intro (wordmark click).
- Hard now shows `✓ played`. Easy and Medium still show `begin`.
- Click Easy → play to completion. Reveal shows `Daily No. N · Easy`. Stats in share block are Easy's. Return to intro.
- Easy and Hard both show `✓ played`. Medium shows `begin`.
- Click Practice → picker appears with three tier buttons. Click any → practice puzzle loads with subbar `practice`. Stats don't change.
- Click Archive → today's cell shows `✓`. Click it → picker appears showing Easy and Hard `✓ played` and Medium `play`. Click Medium → fresh medium game starts.
- Complete Medium → all three should show played. Stats: each tier has its own streak.

- [ ] **Step 4: Commit**

```bash
git add README.md glossari.html
git commit -m "$(cat <<'EOF'
Polish: update README for tiers; refresh intro on overlay close

README mechanics section reflects three-tier model and new JSON shape.
refreshIntroButtons is called wherever we return to the landing overlay
so per-tier states stay accurate.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Bulk content authoring (Easy + Medium for themes 2-16, plus 2 more practice puzzles per tier)

**Files:**
- Modify: `glossari.json`
- (Optionally) use `admin/glossari-admin.html` running on `http://localhost:8000/admin/glossari-admin.html` for live preview during authoring.

This is the long pole of the launch. The CODE work is done; what remains is content. This task lays out the authoring workflow and the launch-criterion checklist. **Treat this as a content-production task, not a code task.** Each puzzle should be authored individually, previewed in the admin, and committed in small batches.

**Authoring constraints (recap from spec):**
- Each puzzle: exactly 4 sets (one each of definition, synonym, antonym, example) — match the existing convention.
- Each set: `parts.length === 3` (the admin validator enforces this).
- Within a tier puzzle, vary the affixes/roots across the 4 words. Don't make every Easy word end in `-tion` or start with `un-`.
- Easy = productive English affixes (4th–8th grade): un-, re-, pre-, mis-, dis-, -able, -tion, -ing, -ly, -er, -ful, -ness, -less.
- Medium = transparent Latin/Greek combining forms (HS / early college): con-, pre-, sub-, inter-, bene-, mal-, -dict-, -spect-, -struct-, -ject-, -vert-, -port-, -form-.
- Hard = unchanged (existing 16 already serve as Hard).

**Each puzzle entry needs:** `type`, `clue`, `parts`, `pos`, `definition`, `etymology`, `example`, `synonyms`, `antonyms`.

**Workflow per puzzle:**

- [ ] **Step 1: For each remaining theme (themes 2–16), author Easy and Medium variants**

The existing 16 themes (from glossari.json after Task 1's migration):

1. ~~Fault & Faithlessness~~ (seeded in Task 1)
2. Mind & Motive
3. Force & Form
4. Power & Pretence
5. Loss & Lack
6. Judgment & Wit
7. Time & Change
8. Speech & Silence
9. Light & Shadow
10. Truth & Doubt
11. Sloth & Diligence
12. Beginning & Origin
13. Wandering & Wayfaring
14. Generosity & Greed
15. Memory & Forgetting
16. Hospitality & Hostility

For each: add an `easy` and `medium` block under `themes[i].tiers` in `glossari.json` (15 themes × 2 tiers = **30 puzzles**). Use [glossari.json](glossari.json) entry for theme 1 (post-migration) as the structural template.

**Per-puzzle micro-workflow:**

- [ ] Open `admin/glossari-admin.html` in a browser tab; keep it open as the live preview surface.
- [ ] Edit `glossari.json`: add the `easy` (or `medium`) block to `themes[i].tiers`.
- [ ] Reload the admin tab; verify the new slot appears, populated, with all four entries visible in the iframe preview.
- [ ] Click "Reveal" on the slot → full-screen preview; sanity-check that all parts assemble, definitions read well, example sentence uses the headword, synonyms/antonyms are tier-appropriate vocabulary.
- [ ] Verify the admin's validation hint does NOT flag any errors. If it does (e.g., a part has length 2 or 4), fix and reload.
- [ ] Commit one or two themes at a time (e.g. `git commit -m "Author Easy/Medium for themes 2-3"`) so each batch is reviewable.

- [ ] **Step 2: Author 2 more practice puzzles per tier (3 total per tier)**

Add to each `practice.{tier}` array so each contains exactly 3 puzzles. Practice puzzles don't have themes; pick standalone topical names (e.g. "Practice — Light", "Practice — Sound").

- [ ] **Step 3: Final launch validation**

After all content is authored, run a final structural check:

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('glossari.json','utf8'));
let issues = 0;
for (const [i, t] of d.themes.entries()) {
  for (const tier of ['easy','medium','hard']) {
    if (!t.tiers[tier]) { console.log('MISSING ' + (i+1) + ' ' + t.name + ' ' + tier); issues++; continue; }
    if (t.tiers[tier].sets.length !== 4) { console.log('NOT 4 SETS ' + (i+1) + ' ' + tier); issues++; }
    for (const [si, s] of t.tiers[tier].sets.entries()) {
      if (s.parts.length !== 3) { console.log('PARTS!=3 ' + (i+1) + ' ' + tier + ' ' + si); issues++; }
    }
  }
}
for (const tier of ['easy','medium','hard']) {
  if (d.practice[tier].length !== 3) { console.log('PRACTICE ' + tier + ' count ' + d.practice[tier].length); issues++; }
  for (const [pi, p] of d.practice[tier].entries()) {
    if (p.sets.length !== 4) { console.log('PRACTICE !4 ' + tier + ' ' + pi); issues++; }
    for (const [si, s] of p.sets.entries()) {
      if (s.parts.length !== 3) { console.log('PRACTICE PARTS!=3 ' + tier + ' ' + pi + ' ' + si); issues++; }
    }
  }
}
console.log(issues === 0 ? 'OK' : (issues + ' issues'));
"
```

Expected: `OK`. Any other output is a launch-blocker.

- [ ] **Step 4: Final integrated smoke**

Open the live `glossari.html`. Verify:
- Today's three tier buttons all show as active (no grayed-out tiers).
- Each tier loads correctly and shows tier-appropriate vocabulary.
- Practice picker shows three tier buttons, each loads a randomly-selected practice puzzle from the 3-puzzle pool.
- Open archive — every past date through today shows three available tiers in its picker.

- [ ] **Step 5: Final commit + ship**

```bash
git add glossari.json
git commit -m "$(cat <<'EOF'
Backfill Easy + Medium content for themes 2-16; complete practice pools

All 16 daily themes now have populated Easy, Medium, and Hard tiers.
Practice pools (easy/medium/hard) each contain 3 puzzles.
Glossari v3 launch ready.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Cloudflare Pages auto-deploys on push to `main`. After pushing:

```bash
git push origin main
```

Check production at `https://thoughtfulhollow.com/glossari` after the deploy completes (~1–2 min).

---

## Self-Review (post-write)

**Spec coverage check:**

| Spec section | Plan task |
| --- | --- |
| Three tiers with grade definitions | Task 1 (seed content) + Task 13 (bulk authoring) |
| Daily rotation with shared theme | Tasks 2, 3 (theme catalog + tier lookup) |
| Data model `{ themes, practice }` | Task 1 (migration) + Task 2 (loader) |
| `parts.length === 3` enforcement | Task 1 (migration validation) + Task 11 (admin validator) |
| Migration of existing 16 puzzles into `tiers.hard` | Task 1 |
| Landing with three tier buttons | Task 5 |
| Per-button states (begin/resume/played/unavailable) | Task 5 + Task 6 stub → real |
| Static tier label in subbar | Task 4 |
| No mid-game tier switching | Implicit — no UI added; Task 4 only adds a label |
| Per-tier localStorage with migration | Task 6 |
| Per-tier streaks and stats | Task 7 (recordCompletion writes per-tier) + Task 10 (archive shows per-tier stats) |
| Stats screen shows all three rows always | Task 10 step 6 |
| Share text includes tier | Task 9 |
| Day number tied to days-since-launch | Task 9 (uses `dailyIndex(playDate) + 1` unchanged) |
| Archive per-date tier picker | Task 10 |
| Archive cell shows ✓ if any tier solved | Task 10 step 5 |
| Practice dedicated pool, never spoils daily | Tasks 1, 8 |
| Practice tier picker | Task 8 |
| Admin per-tier slots + Practice section | Task 11 |
| `?tier=` and `?practice=` URL overrides | Task 2 (forced helpers) + Task 11 (admin uses them) |
| Backfill all 16 themes' Easy + Medium for launch | Task 13 |
| README update | Task 12 |

All spec requirements have at least one task. ✓

**Placeholder scan:** No "TBD", "implement later", or "similar to Task N" placeholders. Every step shows the actual code or command. ✓

**Type consistency check:**
- `state.tier` introduced in Task 2, used everywhere consistently. ✓
- `getTierVariant(themeIdx, tier)` introduced Task 2, called in Tasks 3, 7, 9. ✓
- `loadStorage()` returns `{ v: 3, tiers: { easy, medium, hard } }` from Task 6 onward; all consumers in Tasks 7, 8, 9, 10 access via `all.tiers[tier]`. ✓
- `tierStorage(tier)` helper introduced in Task 6, used by `getTierDayState`. ✓
- `state.currentPuzzle` cached in Task 3 (`loadPuzzle`), consumed in Task 9 (`showReveal`, `copyResult`). ✓
- `refreshIntroButtons()` introduced in Task 5, called in Task 12 polish. ✓
- `archivePickerDate` is module-scoped state in Task 10. ✓
- `state.puzzleSource` set in Task 8 (`startPracticeGame`), consumed in Tasks 3 (`loadPuzzle`) and 9 (`showReveal`, `copyResult`). ✓
- Storage key constants `STORAGE_KEY_V1`, `STORAGE_KEY_V2`, `STORAGE_KEY` all introduced in Task 2 and used consistently in Task 6. ✓

Plan is internally consistent.
