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

// ── exports (Node) ───────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GRID, NCELL, DIRS, OPP, neighbor, partnerOf };
}
