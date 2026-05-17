# Thoughtful Hollow v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `thoughtfulhollow.com` (minimal landing page) and `thoughtfulhollow.com/concordance` (existing game) on Cloudflare Pages, with a site-wide light/dark/system theme toggle.

**Architecture:** Single git repo at `/Users/chrisandrews/Documents/ThoughtfulHollow/`, deployed as a static site by Cloudflare Pages. All pages share a CSS-custom-properties theme system with a `data-theme` attribute on `<html>`, persisted to `localStorage` under `th_theme`. No build step, no test framework — verification is browser inspection and shell commands.

**Tech Stack:** Plain HTML5, CSS3 (custom properties), vanilla JS. Cloudflare Pages for hosting/SSL. Cloudflare DNS (nameservers swapped at Namecheap; Namecheap remains registrar).

**Spec:** [docs/superpowers/specs/2026-05-17-thoughtfulhollow-v1-design.md](../specs/2026-05-17-thoughtfulhollow-v1-design.md)

---

## File map

Final repo layout after all tasks:

```
ThoughtfulHollow/
├── .gitignore
├── README.md
├── index.html              # Landing page (created in Task 4)
├── concordance.html        # Game (moved from th-games/, modified in Tasks 5 & 6)
├── puzzles.json            # Puzzle data (moved from th-games/, unchanged)
├── _archive/               # Old affix-*.html — local reference only
│   ├── affix.html
│   ├── affix-iii.html
│   ├── affix-iv.html
│   └── affix-v.html
└── docs/
    └── superpowers/
        ├── specs/2026-05-17-thoughtfulhollow-v1-design.md
        └── plans/2026-05-17-thoughtfulhollow-v1.md
```

Responsibilities:
- `index.html` — landing page; owns its own styles and the theme toggle markup.
- `concordance.html` — game; existing structure plus theme integration (new `[data-theme="dark"]` rules and toggle UI in the header).
- `puzzles.json` — data file; not modified.
- `_archive/` — historical files; not linked from anywhere served.

Theme system is **inlined into each HTML page** for v1 (no shared `theme.js`). When a third page appears, factor it out.

---

## Task 1: Rename old GitHub repo and create new one

**Files:** None local. GitHub UI only.

- [ ] **Step 1: Rename existing `chrisandrewsedu/thoughtfulhollow` to `thoughtfulhollow-archive`**

Run:
```bash
gh repo rename thoughtfulhollow-archive --repo chrisandrewsedu/thoughtfulhollow
```

Expected: `✓ Renamed repository chrisandrewsedu/thoughtfulhollow-archive`

- [ ] **Step 2: Create a new empty repo at `chrisandrewsedu/thoughtfulhollow`**

Run:
```bash
gh repo create chrisandrewsedu/thoughtfulhollow --public --description "Thoughtful Hollow — a small workshop for word puzzles and other thoughtful things."
```

Expected: `✓ Created repository chrisandrewsedu/thoughtfulhollow on GitHub`

- [ ] **Step 3: Verify both repos exist**

Run:
```bash
gh repo list chrisandrewsedu --limit 20 | grep -i thoughtful
```

Expected output contains both `chrisandrewsedu/thoughtfulhollow` and `chrisandrewsedu/thoughtfulhollow-archive`.

---

## Task 2: Initialize local repo and rearrange files

**Files:**
- Create: `/Users/chrisandrews/Documents/ThoughtfulHollow/.gitignore`
- Create: `/Users/chrisandrews/Documents/ThoughtfulHollow/README.md`
- Move: `th-games/concordance.html` → `concordance.html`
- Move: `th-games/puzzles.json` → `puzzles.json`
- Move: `th-games/affix*.html` → `_archive/`
- Delete: `th-site/` directory
- Delete: `th-games/` directory (after files moved out)

- [ ] **Step 1: Move game files up to repo root**

Run:
```bash
cd /Users/chrisandrews/Documents/ThoughtfulHollow
mv th-games/concordance.html .
mv th-games/puzzles.json .
mkdir -p _archive
mv th-games/affix.html _archive/
mv th-games/affix-iii.html _archive/
mv th-games/affix-iv.html _archive/
mv th-games/affix-v.html _archive/
```

Expected: no errors. Verify with `ls`:
```bash
ls -la /Users/chrisandrews/Documents/ThoughtfulHollow/
```
Should show `concordance.html`, `puzzles.json`, `_archive/`, `th-games/`, `th-site/`, `docs/`, `README.md`.

- [ ] **Step 2: Remove the old `th-games/` and `th-site/` directories**

Run:
```bash
cd /Users/chrisandrews/Documents/ThoughtfulHollow
rm -rf th-games th-site
```

Expected: no errors. `ls` should no longer show those folders.

- [ ] **Step 3: Replace the placeholder README**

Read the existing `README.md` first. Then overwrite it with:

```markdown
# Thoughtful Hollow

A small workshop for word puzzles and other thoughtful things.

Live site: https://thoughtfulhollow.com

## Local development

This is a plain static site with no build step. To work on it locally:

```sh
# From the repo root
python3 -m http.server 8000
# then open http://localhost:8000
```

## Pages

- `/` — landing
- `/concordance` — Concordance, a daily word puzzle

## Deployment

Cloudflare Pages auto-deploys every push to `main`. No CI, no build.
```

- [ ] **Step 4: Create `.gitignore`**

Create `/Users/chrisandrews/Documents/ThoughtfulHollow/.gitignore` with:

```gitignore
.DS_Store
.idea/
.vscode/
*.log
node_modules/
.env
.env.local
```

- [ ] **Step 5: Initialize git and make initial commit**

Run:
```bash
cd /Users/chrisandrews/Documents/ThoughtfulHollow
git init -b main
git add .gitignore README.md docs/ concordance.html puzzles.json _archive/
git commit -m "Initial commit: import Concordance, archive Affix variants, add spec and plan"
```

Expected: commit created. Verify with `git log --oneline`.

- [ ] **Step 6: Add remote and push**

Run:
```bash
git remote add origin git@github.com:chrisandrewsedu/thoughtfulhollow.git
git push -u origin main
```

Expected: push succeeds. Verify by visiting https://github.com/chrisandrewsedu/thoughtfulhollow in a browser — should show the imported files.

---

## Task 3: Build the theme system snippet (reusable across pages)

**Files:**
- Reference document only — no file created in this task. The snippet below will be copy-pasted into `index.html` (Task 4) and `concordance.html` (Task 5).

This task exists to define the canonical snippet so it appears identically in both pages. Read this whole task before touching any file.

- [ ] **Step 1: Note the canonical no-flash init script**

This goes in `<head>`, **before** any stylesheet link or `<style>` block:

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('th_theme') || 'system';
      var resolved = t === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : t;
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.setAttribute('data-theme-pref', t);
    } catch (e) {}
  })();
</script>
```

- [ ] **Step 2: Note the canonical toggle button markup**

```html
<button class="theme-toggle" id="themeToggle" aria-label="Toggle theme" type="button">
  <svg class="theme-icon theme-icon-light" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>
  <svg class="theme-icon theme-icon-dark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
  <svg class="theme-icon theme-icon-system" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8M12 17v4"></path></svg>
</button>
```

Visibility of the three icons is controlled by `[data-theme-pref="light|dark|system"]` selectors (defined inline in each page's `<style>`).

- [ ] **Step 3: Note the canonical toggle behavior script**

This goes at the end of `<body>`:

```html
<script>
  (function () {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    var order = ['light', 'dark', 'system'];
    btn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme-pref') || 'system';
      var next = order[(order.indexOf(cur) + 1) % order.length];
      try { localStorage.setItem('th_theme', next); } catch (e) {}
      document.documentElement.setAttribute('data-theme-pref', next);
      var resolved = next === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : next;
      document.documentElement.setAttribute('data-theme', resolved);
    });
    // Respond to OS changes when in "system" mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if ((localStorage.getItem('th_theme') || 'system') !== 'system') return;
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    });
  })();
</script>
```

- [ ] **Step 4: Note the canonical toggle CSS (for showing the correct icon)**

```css
.theme-toggle {
  background: transparent;
  border: 1px solid var(--border, currentColor);
  border-radius: 999px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: inherit;
  padding: 0;
  transition: background 0.2s, border-color 0.2s;
}
.theme-toggle:hover { background: var(--toggle-hover, rgba(0,0,0,0.06)); }
.theme-toggle .theme-icon { display: none; }
:root[data-theme-pref="light"]  .theme-icon-light  { display: block; }
:root[data-theme-pref="dark"]   .theme-icon-dark   { display: block; }
:root[data-theme-pref="system"] .theme-icon-system { display: block; }
:root:not([data-theme-pref]) .theme-icon-system { display: block; } /* fallback */
```

No file change in this task. Move to Task 4.

---

## Task 4: Build the landing page (`index.html`)

**Files:**
- Create: `/Users/chrisandrews/Documents/ThoughtfulHollow/index.html`

- [ ] **Step 1: Create `index.html` with the full landing page**

Write the following to `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Thoughtful Hollow</title>
<meta name="description" content="A small workshop for word puzzles and other thoughtful things.">
<script>
  (function () {
    try {
      var t = localStorage.getItem('th_theme') || 'system';
      var resolved = t === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : t;
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.setAttribute('data-theme-pref', t);
    } catch (e) {}
  })();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #f7f5f0;
  --fg: #1a1610;
  --fg-muted: #5a4e3a;
  --fg-faint: #8a7c63;
  --accent: #8a1c1c;
  --border: #d9cba8;
  --card-bg: #ffffff;
  --card-border: #e6dabb;
  --toggle-hover: rgba(0,0,0,0.05);
}
:root[data-theme="dark"] {
  --bg: #14110d;
  --fg: #efe7d4;
  --fg-muted: #b8a98a;
  --fg-faint: #8a7c63;
  --accent: #d4a85a;
  --border: #3a322a;
  --card-bg: #1d1813;
  --card-border: #2e2820;
  --toggle-hover: rgba(255,255,255,0.06);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  background: var(--bg);
  color: var(--fg);
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  transition: background 0.25s, color 0.25s;
}
body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.page {
  flex: 1;
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 3rem;
  display: flex;
  flex-direction: column;
}
.top {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 4rem;
}
.hero {
  text-align: center;
  margin-bottom: 3.5rem;
}
.wordmark {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 400;
  font-size: clamp(2.4rem, 8vw, 3.6rem);
  font-variation-settings: "opsz" 144;
  letter-spacing: -0.01em;
  line-height: 1.05;
  margin-bottom: 0.75rem;
}
.tagline {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-weight: 400;
  font-size: 1.05rem;
  color: var(--fg-muted);
  max-width: 28rem;
  margin: 0 auto;
  line-height: 1.5;
}
.shelf-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--fg-faint);
  text-align: center;
  margin-bottom: 1rem;
}
.card {
  display: block;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 6px;
  padding: 1.25rem 1.4rem;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s, border-color 0.2s, box-shadow 0.2s;
}
.card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
}
.card-title {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 1.35rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}
.card-desc {
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  color: var(--fg-muted);
  font-size: 0.95rem;
  line-height: 1.45;
}
.card-arrow {
  color: var(--accent);
  margin-left: 0.3rem;
}
.footer {
  margin-top: auto;
  text-align: center;
  padding-top: 3rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem;
  color: var(--fg-faint);
  letter-spacing: 0.05em;
}
.theme-toggle {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 999px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--fg);
  padding: 0;
  transition: background 0.2s, border-color 0.2s;
}
.theme-toggle:hover { background: var(--toggle-hover); }
.theme-toggle .theme-icon { display: none; }
:root[data-theme-pref="light"]  .theme-icon-light  { display: block; }
:root[data-theme-pref="dark"]   .theme-icon-dark   { display: block; }
:root[data-theme-pref="system"] .theme-icon-system { display: block; }
:root:not([data-theme-pref]) .theme-icon-system { display: block; }
</style>
</head>
<body>
<div class="page">
  <div class="top">
    <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme" type="button">
      <svg class="theme-icon theme-icon-light" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>
      <svg class="theme-icon theme-icon-dark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
      <svg class="theme-icon theme-icon-system" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8M12 17v4"></path></svg>
    </button>
  </div>

  <div class="hero">
    <h1 class="wordmark">Thoughtful Hollow</h1>
    <p class="tagline">A small workshop for word puzzles and other thoughtful things.</p>
  </div>

  <div class="shelf-label">— Currently —</div>
  <a class="card" href="/concordance">
    <div class="card-title">Concordance <span class="card-arrow">→</span></div>
    <div class="card-desc">A daily word puzzle. Assemble four entries from twelve tiles.</div>
  </a>

  <div class="footer">© Thoughtful Hollow</div>
</div>

<script>
  (function () {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    var order = ['light', 'dark', 'system'];
    btn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme-pref') || 'system';
      var next = order[(order.indexOf(cur) + 1) % order.length];
      try { localStorage.setItem('th_theme', next); } catch (e) {}
      document.documentElement.setAttribute('data-theme-pref', next);
      var resolved = next === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : next;
      document.documentElement.setAttribute('data-theme', resolved);
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if ((localStorage.getItem('th_theme') || 'system') !== 'system') return;
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    });
  })();
</script>
</body>
</html>
```

- [ ] **Step 2: Start a local server and open the page**

Run in one terminal:
```bash
cd /Users/chrisandrews/Documents/ThoughtfulHollow
python3 -m http.server 8000
```

Open http://localhost:8000 in a browser.

Expected:
- "Thoughtful Hollow" wordmark centered
- Tagline below
- One card linking to Concordance
- Theme toggle in top-right showing the monitor icon (system mode by default)
- "© Thoughtful Hollow" footer

- [ ] **Step 3: Verify theme toggle works**

In the browser:
1. Click the toggle once → icon changes to sun → page becomes light theme.
2. Click again → icon changes to moon → page becomes dark theme (background near-black, text cream).
3. Click again → icon changes to monitor → page returns to OS-default theme.
4. Reload the page → the most recent choice persists.
5. In DevTools → Application → Local Storage → confirm key `th_theme` is set.

Expected: all five behaviors work, no flash of incorrect theme on reload.

- [ ] **Step 4: Verify the Concordance link**

Click the card → the browser will 404 (the page isn't theme-integrated yet, but it should load the existing game). Confirm `concordance.html` at the root opens.

In the URL bar, try http://localhost:8000/concordance (no extension). Python's http.server does **not** rewrite to `.html`, so this will 404 locally — that's expected. Cloudflare Pages **does** rewrite, so this will work in production. Document this difference and move on.

- [ ] **Step 5: Commit**

Run:
```bash
cd /Users/chrisandrews/Documents/ThoughtfulHollow
git add index.html
git commit -m "Add landing page with theme system"
```

---

## Task 5: Integrate theme system into Concordance

**Files:**
- Modify: `/Users/chrisandrews/Documents/ThoughtfulHollow/concordance.html`

This task only adds the *infrastructure* (no-flash script, toggle UI, `data-theme` plumbing). The dark palette colors are added in Task 6.

- [ ] **Step 1: Add the no-flash init script at the top of `<head>`**

Open `concordance.html`. Find the line immediately after `<title>Concordance · Daily</title>` (around line 6).

Insert this **before** the `<link rel="preconnect"...>` line:

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('th_theme') || 'system';
      var resolved = t === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : t;
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.setAttribute('data-theme-pref', t);
    } catch (e) {}
  })();
</script>
```

- [ ] **Step 2: Add toggle CSS inside the existing `<style>` block**

Append the following rules at the **end** of the existing `<style>` block (just before `</style>`):

```css
.theme-toggle {
  background: transparent;
  border: 1px solid var(--ink-faint);
  border-radius: 999px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--ink-faint);
  padding: 0;
  margin-left: 0.5rem;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  vertical-align: middle;
}
.theme-toggle:hover {
  background: rgba(0,0,0,0.05);
  color: var(--accent);
  border-color: var(--accent);
}
.theme-toggle .theme-icon { display: none; }
:root[data-theme-pref="light"]  .theme-icon-light  { display: block; }
:root[data-theme-pref="dark"]   .theme-icon-dark   { display: block; }
:root[data-theme-pref="system"] .theme-icon-system { display: block; }
:root:not([data-theme-pref]) .theme-icon-system { display: block; }
```

- [ ] **Step 3: Add the toggle button next to the Practice link**

Find the existing line:
```html
<button class="practice-link" id="practiceLink" onclick="startPracticeGame()">Practice</button>
```

Replace with:
```html
<button class="practice-link" id="practiceLink" onclick="startPracticeGame()">Practice</button>
<button class="theme-toggle" id="themeToggle" aria-label="Toggle theme" type="button">
  <svg class="theme-icon theme-icon-light" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>
  <svg class="theme-icon theme-icon-dark" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
  <svg class="theme-icon theme-icon-system" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8M12 17v4"></path></svg>
</button>
```

- [ ] **Step 4: Add the toggle behavior script at the end of `<body>`**

Find the existing closing `</script>` followed by `</body>` near the end of the file. **Before** the `</body>` (and after the existing closing `</script>`), insert a new script block:

```html
<script>
  (function () {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    var order = ['light', 'dark', 'system'];
    btn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme-pref') || 'system';
      var next = order[(order.indexOf(cur) + 1) % order.length];
      try { localStorage.setItem('th_theme', next); } catch (e) {}
      document.documentElement.setAttribute('data-theme-pref', next);
      var resolved = next === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : next;
      document.documentElement.setAttribute('data-theme', resolved);
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if ((localStorage.getItem('th_theme') || 'system') !== 'system') return;
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    });
  })();
</script>
```

- [ ] **Step 5: Verify the toggle appears and clicks (still light-only visuals)**

With the local server still running (or `python3 -m http.server 8000` from the repo root), open http://localhost:8000/concordance.html.

Expected:
- The header shows: brand, Practice link, theme toggle button (monitor icon), puzzle label
- Clicking the toggle changes the icon (sun → moon → monitor)
- The page does **not** visually change color yet (palette swap is Task 6) — this is expected
- DevTools → Application → Local Storage → `th_theme` updates on click
- The `<html>` element gains a `data-theme` attribute that updates on click

- [ ] **Step 6: Commit**

Run:
```bash
cd /Users/chrisandrews/Documents/ThoughtfulHollow
git add concordance.html
git commit -m "Add theme toggle infrastructure to Concordance (no palette yet)"
```

---

## Task 6: Design and add the Concordance dark palette

**Files:**
- Modify: `/Users/chrisandrews/Documents/ThoughtfulHollow/concordance.html`

The existing `:root` block already defines the light palette. We add a `[data-theme="dark"]` block that overrides every variable, then tune the few hardcoded gradients/shadows that don't use variables.

- [ ] **Step 1: Add the dark palette override**

In `concordance.html`, find the existing `:root { ... }` block at the top of `<style>` (lines ~11-26). Immediately **after** the closing `}` of that block (before `* { box-sizing... }`), insert:

```css
:root[data-theme="dark"] {
  --paper:        #1f1a13;
  --paper-deep:   #181410;
  --paper-shadow: #100c08;
  --ink:          #efe5cd;
  --ink-soft:     #c9bda0;
  --ink-faint:    #8e7f63;
  --ink-ghost:    #5a4e3a;
  --accent:       #d46a6a;
  --accent-bright:#e88a8a;
  --accent-deep:  #8a1c1c;
  --gold:         #d4a85a;
  --gold-bright:  #e6c47e;
  --green:        #7aa872;
  --green-bright: #9bc594;
}
```

- [ ] **Step 2: Add dark-mode overrides for hardcoded gradients and overlay tints**

Append at the **end** of the existing `<style>` block (after the theme-toggle CSS from Task 5):

```css
/* Dark mode — gradient and overlay tweaks for elements that use hardcoded colors */
:root[data-theme="dark"] body::before {
  background-image:
    radial-gradient(ellipse 80% 60% at 20% 0%, rgba(212,168,90,0.06) 0%, transparent 60%),
    radial-gradient(ellipse 80% 60% at 80% 100%, rgba(212,106,106,0.06) 0%, transparent 60%),
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.95, 0 0 0 0 0.88, 0 0 0 0 0.75, 0 0 0 0.04 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
:root[data-theme="dark"] body::after {
  background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 8%, transparent 92%, rgba(0,0,0,0.4) 100%);
}
:root[data-theme="dark"] .clue-card {
  background: linear-gradient(180deg, #2a2218 0%, #1f1a13 100%);
}
:root[data-theme="dark"] .clue-card::before {
  background: linear-gradient(180deg, rgba(255,240,200,0.05) 0%, transparent 35%);
}
:root[data-theme="dark"] .clue-card.selected {
  background: linear-gradient(180deg, #3a2020 0%, #2a1818 100%);
  box-shadow: 0 0 0 2px rgba(212,106,106,0.25), 0 3px 8px rgba(212,106,106,0.18);
}
:root[data-theme="dark"] .clue-card.solved {
  background: linear-gradient(180deg, #1f2e1d 0%, #18241a 100%);
}
:root[data-theme="dark"] .clue-card.revealed {
  background: linear-gradient(180deg, #2e2418 0%, #241c10 100%);
}
:root[data-theme="dark"] .tile {
  background: linear-gradient(180deg, #2a2218 0%, #1f1a13 100%);
  color: var(--ink);
}
:root[data-theme="dark"] .tile::before {
  background: linear-gradient(180deg, rgba(255,240,200,0.05) 0%, transparent 40%);
}
:root[data-theme="dark"] .tile.selected {
  background: linear-gradient(180deg, #3a2020 0%, #2a1818 100%);
  box-shadow: 0 0 0 2px rgba(212,106,106,0.25), 0 3px 8px rgba(212,106,106,0.18);
  color: var(--accent-bright);
}
:root[data-theme="dark"] .btn-submit {
  background: var(--accent);
  color: var(--paper-deep);
  box-shadow: 2.5px 2.5px 0 var(--ink-ghost);
}
:root[data-theme="dark"] .btn-submit:active:not(:disabled) {
  box-shadow: 0 0 0 var(--ink-ghost);
}
:root[data-theme="dark"] .btn { box-shadow: 3px 3px 0 var(--accent-deep); }
:root[data-theme="dark"] .btn { background: var(--ink); color: var(--paper); }
:root[data-theme="dark"] .share-block { background: var(--paper-deep); border-color: var(--ink-ghost); }
:root[data-theme="dark"] .dict-badge { background: #1d2a1c; color: var(--green-bright); border-color: var(--green); }
:root[data-theme="dark"] .dict-entry.revealed .dict-badge { background: #2a2418; color: var(--gold-bright); border-color: var(--gold-bright); }
:root[data-theme="dark"] .mistake-dot { box-shadow: inset 0 -1px 1.5px rgba(0,0,0,0.4); }
:root[data-theme="dark"] .badge .big { text-shadow: 2px 2px 0 #000; }
html, body { transition: background 0.25s, color 0.25s; }
```

- [ ] **Step 3: Open Concordance and verify both themes**

With the local server running, open http://localhost:8000/concordance.html.

Cycle the toggle through all three states and verify each:

**Light:**
- Cream paper background, dark ink text
- Red accent on clue symbols, gold on revealed cards, green on solved
- No regressions vs. before this task

**Dark:**
- Deep warm-brown background (close to `#1f1a13`)
- Soft cream text (`#efe5cd`-ish)
- Accents visible but muted (rose-red, warm gold, sage green) — none should be jarringly bright
- Clue cards readable; tile bank tiles readable; assembled answers visible
- No element is invisible (low contrast issue)

**System:**
- Matches your OS theme. Toggle macOS dark mode in System Settings → page should follow within ~1 second without reload.

- [ ] **Step 4: Play through one puzzle in dark mode**

Click "Begin" → play a full puzzle (or at least submit one set correctly and one set wrong). Verify:
- Selected state visible
- "One Away" / "Not Quite" badges readable
- Mistake dots visible
- Reveal screen styled correctly

- [ ] **Step 5: Commit**

Run:
```bash
cd /Users/chrisandrews/Documents/ThoughtfulHollow
git add concordance.html
git commit -m "Add Concordance dark palette and gradient overrides"
git push
```

---

## Task 7: Connect repo to Cloudflare Pages

**Files:** None local. Cloudflare dashboard UI.

- [ ] **Step 1: Create the Pages project**

In a browser:
1. Go to https://dash.cloudflare.com → Workers & Pages → Create application → Pages → Connect to Git.
2. Authorize GitHub if prompted.
3. Select `chrisandrewsedu/thoughtfulhollow`.
4. Set production branch: `main`.
5. Framework preset: **None**.
6. Build command: **leave blank**.
7. Build output directory: **leave as `/`** (or blank).
8. Click "Save and Deploy".

Expected: first deploy completes in ~30 seconds; Cloudflare gives you a URL like `https://thoughtfulhollow.pages.dev`.

- [ ] **Step 2: Verify the preview URL works**

Open `https://thoughtfulhollow-<hash>.pages.dev` (the URL Cloudflare gives you) in a browser.

Expected:
- Landing page renders with wordmark, tagline, Concordance card
- Theme toggle works
- Clicking the card navigates to `/concordance` (clean URL, no `.html`) and the game loads
- `puzzles.json` loads successfully (the game shows a puzzle, not an error message)

If `/concordance` returns 404 or the game can't load `puzzles.json`, stop and check the deploy logs in the Cloudflare dashboard.

- [ ] **Step 3: Block out a maintenance window before changing DNS**

DNS propagation can take up to several hours. Note the current state of `thoughtfulhollow.com`:
```bash
dig thoughtfulhollow.com +short
dig www.thoughtfulhollow.com +short
```

Record the output. If anything is currently live there, plan the cutover when downtime is acceptable.

---

## Task 8: Move DNS to Cloudflare and attach the custom domain

**Files:** None local. Cloudflare + Namecheap dashboards.

- [ ] **Step 1: Add the site to Cloudflare**

In Cloudflare dashboard → "Add a Site" → enter `thoughtfulhollow.com` → choose the Free plan → continue.

Cloudflare scans existing DNS records. Review them and accept the import (or note any you want to keep — for v1 there are probably none worth keeping if the domain was parked).

Cloudflare displays **two nameservers** (e.g. `chad.ns.cloudflare.com` and `priya.ns.cloudflare.com`). Copy both.

- [ ] **Step 2: Swap nameservers at Namecheap**

In Namecheap dashboard:
1. Domain List → `thoughtfulhollow.com` → Manage.
2. Nameservers → change from "Namecheap BasicDNS" to **"Custom DNS"**.
3. Paste the two Cloudflare nameservers (one per row).
4. Save (green checkmark).

- [ ] **Step 3: Wait for activation**

Back in Cloudflare → Overview for `thoughtfulhollow.com` → click "Check nameservers". Status will move from "Pending Nameserver Update" to "Active" once propagation completes (usually under an hour, occasionally a few hours).

Verify with:
```bash
dig NS thoughtfulhollow.com +short
```

Expected: the two Cloudflare nameservers you pasted.

- [ ] **Step 4: Attach the custom domain to the Pages project**

In Cloudflare → Workers & Pages → your project → Custom domains → Set up a custom domain.

Add **two** domains, one at a time:
1. `thoughtfulhollow.com`
2. `www.thoughtfulhollow.com`

Cloudflare auto-creates the DNS records (CNAME or proxy records) and provisions SSL.

- [ ] **Step 5: Verify the live site**

Wait 1–2 minutes for SSL cert provisioning. Then:

```bash
curl -I https://thoughtfulhollow.com
curl -I https://www.thoughtfulhollow.com
curl -I https://thoughtfulhollow.com/concordance
```

Expected: all three return `HTTP/2 200`.

Open https://thoughtfulhollow.com in a browser.

Expected:
- Landing renders with valid HTTPS (no cert warning)
- Theme toggle works and persists across reload
- Clicking the card loads `/concordance` and the game runs end-to-end (intro → begin → first puzzle plays)
- Console (DevTools) shows no errors

- [ ] **Step 6: Final smoke test**

In an incognito window:
1. Open https://thoughtfulhollow.com → toggle theme to dark → click Concordance card → game opens already in dark mode (theme persisted across page nav).
2. Close incognito, reopen → site loads in system theme by default.

- [ ] **Step 7: Commit any final notes**

If anything was learned about the deploy that should be in README (e.g., DNS gotchas), update README.md and commit:
```bash
git add README.md
git commit -m "Document deployment notes" && git push
```

Otherwise, skip.

---

## Self-review notes

- Spec coverage: every spec section maps to a task — repo structure (Task 2), URL shape (verified Tasks 4 + 7), landing design (Task 4), theme system (Tasks 3–6), deployment (Tasks 7–8). The `_archive/` soft-hide risk is implicitly accepted by not linking; no task needed.
- Placeholder scan: no TBDs, no "implement later", every code block is complete.
- Type consistency: theme attribute names (`data-theme`, `data-theme-pref`), localStorage key (`th_theme`), CSS variable names match across all tasks.
- Tagline appears in three places (README, `<meta description>`, landing page) — all use the identical string.
