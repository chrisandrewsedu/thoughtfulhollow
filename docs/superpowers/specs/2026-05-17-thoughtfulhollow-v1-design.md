# Thoughtful Hollow v1 — Landing Page & Concordance Launch

**Date:** 2026-05-17
**Status:** Design — pending user review

## Context

Thoughtful Hollow began as a "belief reconstruction platform with AI guides" (see archived repo `chrisandrewsedu/thoughtfulhollow`) but has morphed. Today, the owner is at "D with B-energy": not committed to a single identity, but the first concrete thing shipping under the brand is a word puzzle game (Concordance). Goal of v1 is to stand up a minimal public site that:

- Doesn't lock the brand into any single direction.
- Gets Concordance live and playable.
- Establishes patterns (theme system, deployment) that future additions can reuse.

The owner wants "simpler is the vibe" — minimum viable surface area, decisions deferred wherever possible.

## Scope

In scope:
- A single-page landing at `thoughtfulhollow.com`.
- Concordance hosted at `thoughtfulhollow.com/concordance` from existing `concordance.html` + `puzzles.json`.
- Site-wide light/dark/system theme with persistent preference.
- Cloudflare Pages deployment fronted by Cloudflare DNS; domain remains registered at Namecheap.

Out of scope (deferred):
- About page, contact form, navigation bar, newsletter, social links.
- Analytics.
- Any non-Concordance game (`affix-*.html` variants archived, not deployed).
- Logo / wordmark beyond a typographic treatment.
- Build tooling — site is plain static HTML/CSS/JS.

## Repository structure

Single repo, repo root = deploy root.

```
ThoughtfulHollow/
├── index.html           # landing page
├── concordance.html     # game (moved up from th-games/)
├── puzzles.json         # puzzles data (moved up from th-games/)
├── theme.js             # shared no-flash theme init (optional; may inline)
├── _archive/            # affix-*.html variants — NOT deployed
├── docs/                # specs and design docs
└── README.md
```

Decisions:
- The current empty `th-site/` folder is deleted.
- `th-games/` contents are flattened into the root; its git history is not preserved (fresh repo).
- The existing GitHub repo `chrisandrewsedu/thoughtfulhollow` (containing the old Lovable belief-platform code) is renamed to `thoughtfulhollow-archive`. A new repo at `chrisandrewsedu/thoughtfulhollow` becomes the live site.
- `affix.html`, `affix-iii.html`, `affix-iv.html`, `affix-v.html` move into `_archive/` for reference; Cloudflare Pages will not serve `_archive/` because we will not link to it (Pages does serve files by default, so this is a soft hide — acceptable for v1).

## URL shape

- `/` → `index.html` (landing)
- `/concordance` → `concordance.html` (Cloudflare Pages resolves clean URLs to `.html` automatically)
- `/puzzles.json` → fetched by Concordance at runtime, same directory

## Landing page design

Single column, centered, mobile-first. Top-to-bottom:

1. **Wordmark** — "Thoughtful Hollow" set large in a serif. No graphic mark.
2. **Tagline** — *"A small workshop for word puzzles and other thoughtful things."* Easy to swap.
3. **Featured card** — Concordance. Title, one-line description (*"A daily word puzzle. Assemble four entries from twelve tiles."*), link to `/concordance`.
4. **Footer** — minimal. `© Thoughtful Hollow` only.
5. **Theme toggle** — small icon button, top-right corner of the page.

Aesthetic direction: deliberately *not* the Concordance cream-paper look. Quieter, more neutral — off-white background, a single serif (system serif or one Google font), generous whitespace, no images, no animation. The root has its own identity so that clicking into Concordance feels like entering a distinct world.

## Light / dark mode (site-wide)

A single theme system used by both the landing page and Concordance, designed so that any future page just imports the same pattern.

### Mechanism

- All colors expressed as CSS custom properties on `:root`.
- A `data-theme` attribute on `<html>` selects the palette via `[data-theme="dark"] :root { ... }` or equivalent.
- Three states: `light`, `dark`, `system` (default; follows `prefers-color-scheme`).
- User preference persisted in `localStorage` under key `th_theme` with values `"light" | "dark" | "system"`.
- Because every page is on the same origin (`thoughtfulhollow.com`), preference carries across pages automatically.

### No-flash init

A small script in `<head>` of every page, executed synchronously before the body renders:

```js
(function () {
  try {
    var t = localStorage.getItem('th_theme') || 'system';
    var resolved = t === 'system'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t;
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.setAttribute('data-theme-pref', t);
  } catch (e) {}
})();
```

For v1, inline this into both `index.html` and `concordance.html`. If a third page appears, factor it into `theme.js` then.

### Toggle UI

- Icon button (sun / moon / monitor depending on current preference).
- Click cycles `light → dark → system → light`.
- Located:
  - Landing: top-right corner of the page.
  - Concordance: in the existing header, adjacent to the "Practice" link.
- Setting `data-theme-pref` on `<html>` lets the toggle reflect the user's actual choice (vs. resolved theme), so "system" remains visible as a state.

### Palettes

- **Landing — light:** off-white background, near-black text, single subtle accent.
- **Landing — dark:** very dark warm gray background, soft off-white text, same accent muted.
- **Concordance — light:** existing palette (cream paper, ink, red accent). Already implemented.
- **Concordance — dark:** new palette to design. Direction: deep warm-brown background (close to current `--ink: #1a1610`), cream-on-dark text, muted red/gold/green accents. Aim for "literary dark" — not inverted print, not sterile-tech dark. The existing `affix-*.html` variants may already explore this and should be reviewed before designing from scratch.

The paper-noise SVG and gradient overlays in `concordance.html` will need dark-mode variants (lower opacity noise, different gradient stops).

## Deployment

### One-time setup

1. **Init git** at the `ThoughtfulHollow/` root. Push to a new (or renamed) `chrisandrewsedu/thoughtfulhollow` on GitHub via SSH.
2. **Cloudflare Pages** project connected to the repo.
   - Build command: *(none)*.
   - Output directory: *(repo root)*.
   - Pushes to `main` auto-deploy. First deploy produces a `*.pages.dev` URL for verification.
3. **Move DNS to Cloudflare.**
   - Add `thoughtfulhollow.com` as a site in Cloudflare; Cloudflare provides two nameservers.
   - In Namecheap: set nameservers to "Custom DNS" and paste the Cloudflare nameservers.
   - Namecheap remains the registrar; Cloudflare runs DNS.
4. **Attach custom domain** in the Pages project: `thoughtfulhollow.com` and `www.thoughtfulhollow.com`. Cloudflare provisions SSL and creates DNS records automatically.

### Why move nameservers (rather than CNAME at Namecheap)

Apex domains can't be CNAMEd. Full Cloudflare DNS lets the apex point cleanly at Pages without `www`-first redirects. Cost: nothing.

### Ongoing flow

Edit locally → `git push` → Cloudflare rebuilds (~30s) → live. No CI, no build step.

## localStorage compatibility

Concordance uses key `concordance_daily_v1`. Because nothing has been deployed yet, there is no existing user state to migrate. Going forward:

- All games sharing the `thoughtfulhollow.com` origin share one localStorage bucket.
- Each game uses a prefixed key (Concordance already does). No collision risk.
- Theme key `th_theme` is shared intentionally so the preference is site-wide.

## What this design deliberately defers

- Logo / brand mark.
- Any second game or non-game content.
- Tagline language (placeholder is acceptable; easy to swap).
- Analytics, SEO metadata beyond a basic `<title>` and `<meta description>`.
- Choosing a permanent typeface for the landing.
- A general theme-token file shared between pages (would only matter at 3+ pages).

## Risks / open questions

- **`_archive/` is reachable** via direct URL on Cloudflare Pages. For v1 this is acceptable (no one will guess `/affix-iii.html`), but if a real "private" surface becomes necessary later, archive contents should move outside the deploy directory.
- **DNS propagation** during nameserver swap can take up to a few hours; if `thoughtfulhollow.com` currently resolves anywhere (e.g., Namecheap parking page), there will be a brief window where the old answer is cached. Plan the cutover when downtime is acceptable.
- **Concordance dark palette** is a real piece of design work, not a mechanical swap. If time-constrained, v1 could ship Concordance in light-only and add dark in a follow-up — but per user preference, dark is included in v1 scope.
