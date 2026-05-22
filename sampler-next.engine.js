'use strict';
// Sampler engine — pure logic, no DOM. Loadable in browser (<script src>) and Node.

const GRID = 4;
const NCELL = GRID * GRID;

const DIRS = ['N', 'E', 'S', 'W'];
const OPP = { N: 'S', E: 'W', S: 'N', W: 'E' };

// index of the neighbour of cell `i` in direction `dir`, or -1 if off-grid
function neighbor(i, dir) {
  const r = Math.floor(i / GRID), c = i % GRID;
  if (dir === 'N') return r > 0 ? i - GRID : -1;
  if (dir === 'S') return r < GRID - 1 ? i + GRID : -1;
  if (dir === 'E') return c < GRID - 1 ? i + 1 : -1;
  if (dir === 'W') return c > 0 ? i - 1 : -1;
  return -1;
}

// the 180°-rotation partner of cell `i`
function partnerOf(i) { return NCELL - 1 - i; }

// ── Pieces ───────────────────────────────────────────────────────
// shapes: 'square' | 'triangle' | 'curve'.  A curve is a Drunkard's-Path
// quarter-circle: part A = the disc, part B = the field. A triangle is a
// half-square triangle: parts A and B are its two halves.
function partsOf(shape) {
  return shape === 'square' ? ['W'] : ['A', 'B'];
}

// curve continuity ports by rotation (rot 0 = disc in the NW corner)
const CURVE_PORTS = { 0: ['N', 'W'], 1: ['N', 'E'], 2: ['S', 'E'], 3: ['S', 'W'] };
function portsOf(piece) {
  if (!piece || piece.shape !== 'curve') return [];
  return CURVE_PORTS[piece.rot].slice();
}

// ── Fabrics ──────────────────────────────────────────────────────
const FABRICS = {
  LINEN:    { name: 'Linen',    col: '#ece0c8', hue: 'neutral' },
  MADDER:   { name: 'Madder',   col: '#a8392f', hue: 'warm' },
  MARIGOLD: { name: 'Marigold', col: '#d99838', hue: 'warm' },
  INDIGO:   { name: 'Indigo',   col: '#2b3a5e', hue: 'cool' },
  SLATE:    { name: 'Slate',    col: '#5f7b87', hue: 'cool' },
};

// ── Structure rules ──────────────────────────────────────────────
const CORNERS = [0, 3, 12, 15];
const CENTRE = [5, 6, 9, 10];
const filledAll = grid => grid.every(Boolean);

// curves continue across every seam, and never run off the board edge
function ruleContinuity(state) {
  const { grid } = state;
  const violations = new Set();
  for (let i = 0; i < NCELL; i++) {
    if (!grid[i]) continue;
    const myPorts = portsOf(grid[i]);
    for (const d of DIRS) {
      const j = neighbor(i, d);
      if (j === -1) {
        if (myPorts.includes(d)) violations.add(i);
      } else if (grid[j]) {
        const mine = myPorts.includes(d);
        const theirs = portsOf(grid[j]).includes(OPP[d]);
        if (mine !== theirs) { violations.add(i); violations.add(j); }
      }
    }
  }
  return { ok: filledAll(grid) && violations.size === 0, violations };
}

// the block has half-turn (180°) symmetry — shape, rotation, and colour
function ruleSymmetry(state) {
  const { grid, colors } = state;
  const violations = new Set();
  for (let i = 0; i < NCELL; i++) {
    const p = partnerOf(i);
    if (i >= p) continue;                       // check each pair once
    const a = grid[i], b = grid[p];
    if (!a || !b) continue;
    let bad = a.shape !== b.shape;
    if (!bad && a.shape !== 'square') bad = ((a.rot + 2) % 4) !== b.rot;
    if (!bad) {
      for (const part of partsOf(a.shape)) {
        if (colors[i + ':' + part] !== colors[p + ':' + part]) bad = true;
      }
    }
    if (bad) { violations.add(i); violations.add(p); }
  }
  return { ok: filledAll(grid) && violations.size === 0, violations };
}

// triangles fill the corners — and only the corners
function ruleCornersAreTriangles(state) {
  const { grid } = state;
  const violations = new Set();
  for (let i = 0; i < NCELL; i++) {
    if (!grid[i]) continue;
    const isCorner = CORNERS.includes(i);
    const isTri = grid[i].shape === 'triangle';
    if (isCorner !== isTri) violations.add(i);
  }
  return { ok: filledAll(grid) && violations.size === 0, violations };
}

// the four centre cells are curves
function ruleCentreIsCurves(state) {
  const { grid } = state;
  const violations = new Set();
  for (const i of CENTRE) {
    if (grid[i] && grid[i].shape !== 'curve') violations.add(i);
  }
  const centreFilled = CENTRE.every(i => grid[i]);
  return { ok: centreFilled && violations.size === 0, violations };
}

// ── exports (Node) ───────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GRID, NCELL, DIRS, OPP, neighbor, partnerOf,
    partsOf, portsOf, CURVE_PORTS, FABRICS, CORNERS, CENTRE,
    ruleContinuity, ruleSymmetry, ruleCornersAreTriangles, ruleCentreIsCurves,
  };
}
