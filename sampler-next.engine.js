'use strict';
// Sampler engine — pure logic, no DOM. Loadable in browser (<script src>) and Node.

const GRID = 4;
const NCELL = GRID * GRID;

// ── exports (Node) ───────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GRID, NCELL };
}
