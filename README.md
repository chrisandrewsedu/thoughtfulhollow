# Thoughtful Hollow

A small workshop for word puzzles and other thoughtful things.

Live site: https://thoughtfulhollow.com

## Glossari

Glossari is a daily dictionary puzzle. Each puzzle contains four dictionary entries. The headword has been removed — your job is to identify it from the clue and assemble it from three word segments in the correct order.

**Clue types:** definition, synonym, antonym, example sentence (marked with ❦ ≡ ≠ ¶)

**Difficulty tiers:** each daily theme comes in three tiers — **Easy** (productive English affixes, ~4th–8th grade), **Medium** (transparent Latin/Greek roots, ~high school / early college), and **Hard** (current college / grad vocabulary). The landing page presents three tier buttons; players can play any or all three on the same day. Streaks, stats, and share text are independent per tier.

**Mechanics:**
- Select one clue card and three word segments, in order
- All headwords across all tiers are exactly three parts
- Segment order matters — right parts in the wrong order gives a yellow warning rather than a solve
- Four mistakes allowed per puzzle
- Daily puzzle rotates at midnight; practice mode available any time with its own dedicated puzzle pool (separate from the daily rotation)

**Share format:** the results screen shows a guess log with four columns (clue + three segments) using ❧ (correct), ◆ (right part, wrong position), and · (wrong). Share text reads `Glossari — No. N · {Tier} · "{Theme}"` followed by the guess grid.

**Puzzle data:** `glossari.json` — a top-level object with two collections. `themes[]` is the daily rotation; each theme has up to three `tiers` (`easy`, `medium`, `hard`). `practice` is an object keyed by tier, each value a small array of sandbox puzzles never drawn from the daily catalog. Each puzzle in either collection has 4 entries with `parts` always of length 3, plus `pos`, `definition`, `etymology`, `example`, `synonyms`, `antonyms`.

## Local development

Plain static site, no build step.

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Or from the glossari worktree directory directly — the game fetches `glossari.json` from the same folder, so the server root matters.

## Pages

- `/` — landing
- `/glossari` — Glossari daily puzzle (`glossari.html` + `glossari.json`)

## Deployment

Cloudflare Pages auto-deploys every push to `main`. No CI, no build.
