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
