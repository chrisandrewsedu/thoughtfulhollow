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

// ── Generation (implemented in Task 8) ───────────────────────────
function generate() { return null; }
function generateDaily() { return null; }

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LAUNCH_DATE, mulberry32, seedFromDate, seededShuffle,
    dailyIndex, addDays, todayStr, resolvePalette,
    generate, generateDaily,
  };
}
