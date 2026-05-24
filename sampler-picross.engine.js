'use strict';
// Sampler picross engine — geometry, fabrics, target validation, clue derivation.
// Pure logic, no DOM. Loadable in browser (via script tag) and Node.
//
// Grid size is per-target: a target is an array of N*N cells where N ∈ {3,4,5,6,7,8,9}.
// Helpers take `size` (the side length) where needed, OR derive it from
// `target.length`. There is no global GRID constant any more.

const DIRS = ['N', 'E', 'S', 'W'];
const SUPPORTED_SIZES = [3, 4, 5, 6, 7, 8, 9];

function gridSizeOf(target) {
  const n = Math.round(Math.sqrt(target.length));
  if (n * n !== target.length) throw new Error('target length must be a perfect square');
  return n;
}

function rowOf(i, size) { return Math.floor(i / size); }
function colOf(i, size) { return i % size; }
function rowCells(r, size) {
  const out = [];
  for (let c = 0; c < size; c++) out.push(r * size + c);
  return out;
}
function colCells(c, size) {
  const out = [];
  for (let r = 0; r < size; r++) out.push(r * size + c);
  return out;
}
function partnerOf(i, size) { return size * size - 1 - i; }

// ── Pieces ───────────────────────────────────────────────────────
// shapes:
//   square   — single fabric region W.
//   triangle — half-square triangle, seam is a diagonal. 2 rotations:
//              rot 0 = '\' seam (A=NE half, B=SW half),
//              rot 1 = '/' seam (A=SE half, B=NW half).
//              (Rotating 180° just swaps A/B labels — that's stored as the
//              same rot with the regions swapped, not a separate rotation.)
//   curve    — Drunkard's-Path quarter-circle (A=disc, B=field). 4 rotations,
//              one per corner where the disc sits (rot 0 = disc in NW).
//   bar      — two equal rectangles (a "rail" unit). 2 rotations:
//              rot 0 = horizontal cut (A=top, B=bottom),
//              rot 1 = vertical cut (A=right, B=left after a 90° rotation).
//   qst      — quarter-square triangle / hourglass: 4 triangles meeting at
//              centre, opposite pairs share fabric. 1 rotation: A=top+bottom,
//              B=left+right. (90° rotation just swaps A/B.)
const SHAPES = ['square', 'triangle', 'curve', 'bar', 'qst'];

function partsOf(shape) {
  return shape === 'square' ? ['W'] : ['A', 'B'];
}

// Default rotation per shape — a piece in this rotation does not count toward
// the ⟲ rotation total.
const DEFAULT_ROT = { square: 0, triangle: 0, curve: 0, bar: 0, qst: 0 };
const ROT_COUNT   = { square: 1, triangle: 2, curve: 4, bar: 2, qst: 1 };

// curve continuity ports by rotation (rot 0 = disc in the NW corner)
const CURVE_PORTS = { 0: ['N', 'W'], 1: ['N', 'E'], 2: ['S', 'E'], 3: ['S', 'W'] };

// Triangle region by rotation. rot 0 = '\' seam from NW to SE corner:
// region A is the NE half, region B is the SW half. rot 1 = '/' seam.
const TRIANGLE_FACES = {
  0: { N: 'A', E: 'A', S: 'B', W: 'B' },
  1: { N: 'B', E: 'A', S: 'A', W: 'B' },
};

// Partner-under-180° for half-turn symmetry. Returns the (rot, A↔B-swap) that
// makes a cell's partner look identical after spinning the board 180°. For
// triangle/bar a 180° rotation re-uses the same rot with the A/B labels
// swapped; for curve it lands on (rot+2)%4 with no swap; qst and square are
// fully symmetric under 180°.
function partnerSymmetry(shape, rot) {
  if (shape === 'square') return { rot: 0,             swap: false };
  if (shape === 'curve')  return { rot: (rot + 2) % 4, swap: false };
  if (shape === 'qst')    return { rot: 0,             swap: false };
  return { rot, swap: true }; // triangle, bar
}

// ── Fabrics ──────────────────────────────────────────────────────
const FABRICS = {
  LINEN:    { name: 'Linen',    col: '#ece0c8', hue: 'neutral' },
  FLAX:     { name: 'Flax',     col: '#d6c79b', hue: 'neutral' },
  SAGE:     { name: 'Sage',     col: '#b3b89a', hue: 'neutral' },
  MADDER:   { name: 'Madder',   col: '#a8392f', hue: 'warm' },
  MARIGOLD: { name: 'Marigold', col: '#d99838', hue: 'warm' },
  CLARET:   { name: 'Claret',   col: '#7d2933', hue: 'warm' },
  INDIGO:   { name: 'Indigo',   col: '#2b3a5e', hue: 'cool' },
  SLATE:    { name: 'Slate',    col: '#5f7b87', hue: 'cool' },
  TEAL:     { name: 'Teal',     col: '#2f6d6a', hue: 'cool' },
};

// ── Patterns ─────────────────────────────────────────────────────
// A fabric is a (color × pattern) combination. PATTERNS holds the pattern
// templates — each has a tile size and a render(base, ink) function that
// returns the inner SVG markup of an SVG <pattern> element. DOM injection
// lives in the page-level renderer (engine stays DOM-free).
const PATTERNS = {
  weave: {
    name: 'Plain weave',
    tile: 6,
    render: (base, ink) => `
      <rect width="6" height="6" fill="${base}"/>
      <rect x="0" y="0" width="6" height="3" fill="rgba(0,0,0,0.10)"/>
      <rect x="0" y="0" width="3" height="6" fill="rgba(255,255,255,0.08)"/>
      <rect x="1" y="4" width="1" height="1" fill="rgba(0,0,0,0.14)"/>
      <rect x="4" y="1" width="1" height="1" fill="rgba(255,255,255,0.10)"/>
    `,
  },
  trellis: {
    name: 'Diamond trellis',
    tile: 24,
    render: (base, ink) => `
      <rect width="24" height="24" fill="${base}"/>
      <g>
        <rect x="0" y="11" width="24" height="2" fill="rgba(0,0,0,0.09)"/>
        <rect x="11" y="0" width="2" height="24" fill="rgba(255,255,255,0.07)"/>
      </g>
      <g fill="none" stroke="${ink}" stroke-width="0.9" opacity="0.9">
        <path d="M 6 2 L 10 6 L 6 10 L 2 6 Z"/>
        <path d="M 18 2 L 22 6 L 18 10 L 14 6 Z"/>
        <path d="M 6 14 L 10 18 L 6 22 L 2 18 Z"/>
        <path d="M 18 14 L 22 18 L 18 22 L 14 18 Z"/>
      </g>
      <g fill="${ink}" opacity="0.9">
        <circle cx="6"  cy="6"  r="0.9"/>
        <circle cx="18" cy="6"  r="0.9"/>
        <circle cx="6"  cy="18" r="0.9"/>
        <circle cx="18" cy="18" r="0.9"/>
      </g>
    `,
  },
  cross: {
    name: 'Cross-stitch',
    tile: 20,
    render: (base, ink) => `
      <rect width="20" height="20" fill="${base}"/>
      <g>
        <rect x="0" y="0" width="20" height="2" fill="rgba(0,0,0,0.09)"/>
        <rect x="0" y="10" width="20" height="2" fill="rgba(0,0,0,0.09)"/>
        <rect x="0" y="0" width="2" height="20" fill="rgba(255,255,255,0.07)"/>
        <rect x="10" y="0" width="2" height="20" fill="rgba(255,255,255,0.07)"/>
      </g>
      <g stroke="${ink}" stroke-width="1.4" stroke-linecap="square" opacity="0.95">
        <line x1="6" y1="6" x2="14" y2="14"/>
        <line x1="14" y1="6" x2="6" y2="14"/>
      </g>
    `,
  },
  floret: {
    name: 'Floret',
    tile: 24,
    render: (base, ink) => `
      <rect width="24" height="24" fill="${base}"/>
      <g>
        <rect x="0" y="11" width="24" height="2" fill="rgba(0,0,0,0.09)"/>
        <rect x="11" y="0" width="2" height="24" fill="rgba(255,255,255,0.07)"/>
      </g>
      <g fill="${ink}" opacity="0.92">
        <circle cx="6"  cy="6"  r="1.1"/>
        <circle cx="6"  cy="3"  r="0.9"/><circle cx="9"  cy="6"  r="0.9"/><circle cx="6"  cy="9"  r="0.9"/><circle cx="3"  cy="6"  r="0.9"/>
        <circle cx="18" cy="6"  r="1.1"/>
        <circle cx="18" cy="3"  r="0.9"/><circle cx="21" cy="6"  r="0.9"/><circle cx="18" cy="9"  r="0.9"/><circle cx="15" cy="6"  r="0.9"/>
        <circle cx="6"  cy="18" r="1.1"/>
        <circle cx="6"  cy="15" r="0.9"/><circle cx="9"  cy="18" r="0.9"/><circle cx="6"  cy="21" r="0.9"/><circle cx="3"  cy="18" r="0.9"/>
        <circle cx="18" cy="18" r="1.1"/>
        <circle cx="18" cy="15" r="0.9"/><circle cx="21" cy="18" r="0.9"/><circle cx="18" cy="21" r="0.9"/><circle cx="15" cy="18" r="0.9"/>
      </g>
    `,
  },
};
const DEFAULT_PATTERN = 'weave';

// ── Luminance & contrast ink (WCAG-style) ────────────────────────
// Motif ink and shape-outline ink are computed from the base color's
// luminance so dark fabrics get a cream ink and light fabrics get a dark
// ink. Same ink drives both pattern motifs and shape outlines on top.
const INK_DARK  = '#2b2418';
const INK_LIGHT = '#ece0c8';
function hexToRgb(hex) {
  const h = hex.replace('#','');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function relLuminance(hex) {
  const [r,g,b] = hexToRgb(hex).map(v => {
    v /= 255;
    return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
  });
  return 0.2126*r + 0.7152*g + 0.0722*b;
}
function inkFor(colorIdOrHex) {
  const hex = (colorIdOrHex && FABRICS[colorIdOrHex]?.col) || colorIdOrHex;
  if (!hex) return INK_DARK;
  return relLuminance(hex) > 0.45 ? INK_DARK : INK_LIGHT;
}

// ── Region value normalization ───────────────────────────────────
// A cell.regions[part] value can be:
//   string                → legacy: just a color ID, pattern defaults to weave.
//   { color, pattern }    → new: explicit color × pattern combination.
//   null / undefined      → blank region.
// All engine code that reads region values goes through these helpers so the
// two forms are interchangeable everywhere.
function regionColor(value) {
  if (!value) return null;
  return typeof value === 'string' ? value : (value.color || null);
}
function regionPattern(value) {
  // null = "solid color, no pattern" (the default for both legacy strings and
  // {color}-only objects). Patterns are explicit, opt-in decoration.
  if (!value || typeof value === 'string') return null;
  return value.pattern || null;
}
function regionKey(value) {
  const c = regionColor(value);
  if (!c) return null;
  const p = regionPattern(value);
  return p ? `${c}:${p}` : c;
}
function patternIdFor(colorId, patternId) {
  return patternId ? `fab-${colorId}-${patternId}` : null;
}

// ── Target validation ────────────────────────────────────────────
function validateTarget(target) {
  const errors = [];
  if (!Array.isArray(target)) { errors.push('target must be an array'); return errors; }
  let size;
  try { size = gridSizeOf(target); }
  catch (e) { errors.push(e.message); return errors; }
  if (!SUPPORTED_SIZES.includes(size)) {
    errors.push(`unsupported grid size ${size}; supported sizes are ${SUPPORTED_SIZES.join(', ')}`);
  }
  for (let i = 0; i < target.length; i++) {
    const cell = target[i];
    if (!cell) { errors.push(`cell ${i}: missing`); continue; }
    if (!SHAPES.includes(cell.shape)) errors.push(`cell ${i}: bad shape '${cell.shape}'`);
    if (typeof cell.rot !== 'number' || cell.rot < 0 || cell.rot >= ROT_COUNT[cell.shape]) {
      errors.push(`cell ${i}: bad rot ${cell.rot} for shape ${cell.shape}`);
    }
    for (const part of partsOf(cell.shape)) {
      const val = cell.regions?.[part];
      const color = regionColor(val);
      if (!color || !FABRICS[color]) {
        errors.push(`cell ${i}: region '${part}' has bad color '${color}'`);
      }
      if (val && typeof val === 'object' && val.pattern && !PATTERNS[val.pattern]) {
        errors.push(`cell ${i}: region '${part}' has bad pattern '${val.pattern}'`);
      }
    }
  }
  return errors;
}

// ── Clue derivation ──────────────────────────────────────────────
function clueForCells(target, cellIndices) {
  const shape = Object.create(null);
  const rotation = Object.create(null);
  const fabric = Object.create(null);
  for (const i of cellIndices) {
    const cell = target[i];
    if (!cell) continue;
    shape[cell.shape] = (shape[cell.shape] || 0) + 1;
    if (cell.rot !== DEFAULT_ROT[cell.shape]) {
      rotation[cell.shape] = (rotation[cell.shape] || 0) + 1;
    }
    for (const part of partsOf(cell.shape)) {
      const fab = regionColor(cell.regions[part]);
      if (fab) fabric[fab] = (fabric[fab] || 0) + 1;
    }
  }
  return { shape, rotation, fabric };
}

function deriveClues(target) {
  const size = gridSizeOf(target);
  const rows = [];
  const cols = [];
  for (let r = 0; r < size; r++) rows.push(clueForCells(target, rowCells(r, size)));
  for (let c = 0; c < size; c++) cols.push(clueForCells(target, colCells(c, size)));
  return { rows, cols, size };
}

// ── Symmetry detection ───────────────────────────────────────────
function isHalfTurnSymmetric(target) {
  const size = gridSizeOf(target);
  const N = size * size;
  for (let i = 0; i < N; i++) {
    const a = target[i];
    const b = target[N - 1 - i];
    if (!a || !b) return false;
    if (a.shape !== b.shape) return false;
    const sym = partnerSymmetry(a.shape, a.rot);
    if (b.rot !== sym.rot) return false;
    for (const part of partsOf(a.shape)) {
      const partnerPart = sym.swap ? (part === 'A' ? 'B' : part === 'B' ? 'A' : part) : part;
      // Compare normalized (color:pattern) keys so visual symmetry holds
      // for both legacy string regions and new {color,pattern} regions.
      if (regionKey(a.regions[part]) !== regionKey(b.regions[partnerPart])) return false;
    }
  }
  return true;
}

// ── Density check ────────────────────────────────────────────────
function maxBandChips(clues) {
  let worst = 0;
  const bands = [...clues.rows, ...clues.cols];
  for (const b of bands) {
    const shapeChips = Object.keys(b.shape).length;
    const fabricChips = Object.keys(b.fabric).length;
    worst = Math.max(worst, shapeChips, fabricChips);
  }
  return worst;
}

// ── Difficulty suggestion ───────────────────────────────────────
// Heuristic: bigger grid, more shapes, more fabrics, more rotations push
// difficulty up; more givens (from the generator) pull it back down. Returns
// one of 'mon-tue' | 'wed-th' | 'fri-sat' | 'sun'. Author can override.
const DIFFICULTIES = ['mon-tue', 'wed-th', 'fri-sat', 'sun'];

function suggestedDifficulty(target, generated) {
  const size = gridSizeOf(target);
  const shapes = new Set();
  const fabrics = new Set();
  let rotated = 0;
  for (const c of target) {
    if (!c) continue;
    shapes.add(c.shape);
    for (const val of Object.values(c.regions || {})) {
      const color = regionColor(val);
      if (color) fabrics.add(color);
    }
    if (c.rot !== 0) rotated++;
  }
  const givens = generated?.givenCount ?? 0;
  let score = 0;
  score += (size - 3) * 8;
  score += (shapes.size - 1) * 20;
  score += Math.max(0, fabrics.size - 2) * 8;
  score += Math.min(rotated, 12) * 4;
  score -= givens * 1;
  if (score < 14) return 'mon-tue';
  if (score < 30) return 'wed-th';
  if (score < 50) return 'fri-sat';
  return 'sun';
}

// ── Exports ──────────────────────────────────────────────────────
const PicrossEngine = {
  DIRS, SUPPORTED_SIZES,
  SHAPES, DEFAULT_ROT, ROT_COUNT,
  CURVE_PORTS, TRIANGLE_FACES,
  FABRICS,
  PATTERNS, DEFAULT_PATTERN,
  INK_DARK, INK_LIGHT,
  relLuminance, inkFor,
  regionColor, regionPattern, regionKey, patternIdFor,
  gridSizeOf,
  rowOf, colOf, rowCells, colCells, partnerOf,
  partsOf,
  partnerSymmetry,
  validateTarget,
  clueForCells, deriveClues,
  isHalfTurnSymmetric,
  maxBandChips,
  suggestedDifficulty, DIFFICULTIES,
};

if (typeof module !== 'undefined' && module.exports) module.exports = PicrossEngine;
if (typeof window !== 'undefined') window.PicrossEngine = PicrossEngine;
