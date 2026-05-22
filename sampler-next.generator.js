'use strict';
// Sampler generator — pure logic. Instantiates a date-seeded daily puzzle
// from a constraint-template (spec §9). Loadable in the browser and Node.

// Engine / solver / templates access: require() in Node; shared globals in
// the browser. Bind to fresh names so the browser never redeclares.
const _ENG_G  = (typeof require === 'function') ? require('./sampler-next.engine.js')    : null;
const _FABRICS = _ENG_G ? _ENG_G.FABRICS : FABRICS;
const _SOL_G  = (typeof require === 'function') ? require('./sampler-next.solver.js')    : null;
const _solve   = _SOL_G ? _SOL_G.solve   : solve;
const _analyze = _SOL_G ? _SOL_G.analyze : analyze;
const _TPL_G  = (typeof require === 'function') ? require('./sampler-next.templates.js') : null;
const _TEMPLATES = _TPL_G ? _TPL_G.TEMPLATES : TEMPLATES;

// ── Release config (spec §11) ────────────────────────────────────
const LAUNCH_DATE = '2026-05-19';

// ── Seeded RNG (mirrors sampler.html) ────────────────────────────
function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedFromDate(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seededShuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

// ── Dates ────────────────────────────────────────────────────────
function dailyIndex(dateStr) {
  const ms = Date.parse(dateStr + 'T00:00:00Z') - Date.parse(LAUNCH_DATE + 'T00:00:00Z');
  const days = Math.floor(ms / 86400000);
  return days < 0 ? -1 : days;
}
function addDays(dateStr, n) {
  const ms = Date.parse(dateStr + 'T00:00:00Z') + n * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}
function todayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

// ── Palette resolution ───────────────────────────────────────────
// Resolve a concrete palette from a palette family, guaranteeing the
// required hue minimums, varying with the seeded rng.
function resolvePalette(family, rng) {
  const byHue = { warm: [], cool: [], neutral: [] };
  for (const f of seededShuffle(family.pool, rng)) byHue[_FABRICS[f].hue].push(f);
  const chosen = [];
  for (const hue of ['warm', 'cool', 'neutral']) {
    const need = (family.require && family.require[hue]) || 0;
    for (let k = 0; k < need && byHue[hue].length; k++) chosen.push(byHue[hue].shift());
  }
  const rest = seededShuffle(byHue.warm.concat(byHue.cool, byHue.neutral), rng);
  while (chosen.length < family.size && rest.length) chosen.push(rest.shift());
  return chosen;
}

// ── Generation ───────────────────────────────────────────────────
function range(n) { const a = []; for (let i = 0; i < n; i++) a.push(i); return a; }

// Instantiate a daily puzzle from `template` for `dateStr` (spec §9).
//
// Count-targeting: the solution count decreases monotonically as givens are
// added, so for each re-rolled cell order we add givens one at a time until
// the count first lands at or below the band maximum. If at that point the
// puzzle passes all four checks it is returned; otherwise the order overshot
// the band (count fell below the minimum, or the in-band puzzle was not
// dead-end-free) and the cell order is re-rolled.
function generate(template, dateStr, opts) {
  opts = opts || {};
  const maxRerolls = opts.maxRerolls || 60;
  const rng = mulberry32(seedFromDate(dateStr + ':' + template.id));
  const fabrics = resolvePalette(template.paletteFamily, rng);
  const N = template.size * template.size;
  const band = template.solutionBand || { min: 2, max: 8 };

  // a reference solution of the bare template under this palette
  const bare = { size: template.size, ruleKeys: template.ruleKeys,
                 kit: template.kit, fabrics, givens: [], solution: null };
  const found = _solve(bare, { cap: 1 });
  if (found.length === 0) return null;          // unsatisfiable under this palette
  const refSol = found[0];

  for (let attempt = 0; attempt < maxRerolls; attempt++) {
    const order = seededShuffle(range(N), rng);
    const givens = [];
    for (const cell of order) {
      givens.push(cell);
      const puzzle = {
        size: template.size, templateId: template.id, dateStr,
        ruleKeys: template.ruleKeys, kit: template.kit, fabrics,
        solutionBand: band, solution: refSol,
        givens: givens.slice().sort(function (a, b) { return a - b; }),
      };
      const a = _analyze(puzzle);
      if (a.count <= band.max) {
        if (a.pass) { puzzle.analysis = a; return puzzle; }
        break;   // overshot the band — re-roll the cell order
      }
    }
  }
  return null;
}

// First template (in list order) that yields a passing puzzle for the date.
function generateDaily(dateStr, templates) {
  templates = templates || _TEMPLATES;
  for (const t of templates) {
    const p = generate(t, dateStr);
    if (p) return p;
  }
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LAUNCH_DATE, mulberry32, seedFromDate, seededShuffle,
    dailyIndex, addDays, todayStr, resolvePalette,
    generate, generateDaily,
  };
}
