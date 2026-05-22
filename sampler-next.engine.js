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

// ── exports (Node) ───────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GRID, NCELL, DIRS, OPP, neighbor, partnerOf,
    partsOf, portsOf, CURVE_PORTS, FABRICS,
  };
}
