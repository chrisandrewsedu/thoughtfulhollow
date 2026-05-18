# Thoughtful Hollow

A small workshop for word puzzles and other thoughtful things.

Live site: https://thoughtfulhollow.com

## Glossari

Glossari is a daily dictionary puzzle. Each puzzle contains four dictionary entries. The headword has been removed — your job is to identify it from the clue and assemble it from three word segments in the correct order.

**Clue types:** definition, synonym, antonym, example sentence (marked with ❦ ≡ ≠ ¶)

**Mechanics:**
- Select one clue card and three word segments, in order
- Segment order matters — right parts in the wrong order gives a yellow warning rather than a solve
- Four mistakes allowed per puzzle
- Daily puzzle rotates at midnight; practice mode available any time

**Share format:** the results screen shows a guess log with four columns (clue + three segments) using ❧ (correct), ◆ (right part, wrong position), and · (wrong). The same symbols appear in the copied share text.

**Puzzle data:** `concordance.json` — an array of puzzle objects, each with a `name`, `sets` array, and per-set `parts`, `pos`, `definition`, `synonyms`, `antonyms`, and `example`.

## Local development

Plain static site, no build step.

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Or from the concordance worktree directory directly — the game fetches `concordance.json` from the same folder, so the server root matters.

## Pages

- `/` — landing
- `/concordance` — Glossari daily puzzle (`concordance.html` + `concordance.json`)

## Deployment

Cloudflare Pages auto-deploys every push to `main`. No CI, no build.
