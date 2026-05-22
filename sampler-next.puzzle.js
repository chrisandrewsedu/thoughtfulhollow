'use strict';
// The hand-authored Phase A daily puzzle.
// Layout: triangles in the 4 corners, a 4-curve ring in the centre,
// squares on the 8 edges. Half-turn symmetric.

const PUZZLE = {
  size: 4,
  // the rules in play, by registry key
  ruleKeys: [
    'continuity', 'symmetry', 'cornersTriangles', 'centreCurves',
    'discsUnified', 'triangleHues', 'fieldHue', 'squaresDiffer',
  ],
  // the kit the player draws from (counts include the givens)
  kit: { curve: 4, triangle: 4, square: 8 },
  fabrics: ['LINEN', 'MADDER', 'MARIGOLD', 'INDIGO', 'SLATE'],
  // cells revealed at the start (fully placed + coloured, locked)
  givens: [0, 1, 5, 10, 14, 15],
  // the authored solution: per cell { shape, rot, col }
  solution: [
    { shape: 'triangle', rot: 0, col: { A: 'MARIGOLD', B: 'INDIGO' } }, // 0
    { shape: 'square',   rot: 0, col: { W: 'LINEN' } },                 // 1
    { shape: 'square',   rot: 0, col: { W: 'SLATE' } },                 // 2
    { shape: 'triangle', rot: 1, col: { A: 'MARIGOLD', B: 'INDIGO' } }, // 3
    { shape: 'square',   rot: 0, col: { W: 'LINEN' } },                 // 4
    { shape: 'curve',    rot: 2, col: { A: 'MADDER', B: 'SLATE' } },    // 5
    { shape: 'curve',    rot: 3, col: { A: 'MADDER', B: 'SLATE' } },    // 6
    { shape: 'square',   rot: 0, col: { W: 'SLATE' } },                 // 7
    { shape: 'square',   rot: 0, col: { W: 'SLATE' } },                 // 8
    { shape: 'curve',    rot: 1, col: { A: 'MADDER', B: 'SLATE' } },    // 9
    { shape: 'curve',    rot: 0, col: { A: 'MADDER', B: 'SLATE' } },    // 10
    { shape: 'square',   rot: 0, col: { W: 'LINEN' } },                 // 11
    { shape: 'triangle', rot: 3, col: { A: 'MARIGOLD', B: 'INDIGO' } }, // 12
    { shape: 'square',   rot: 0, col: { W: 'SLATE' } },                 // 13
    { shape: 'square',   rot: 0, col: { W: 'LINEN' } },                 // 14
    { shape: 'triangle', rot: 2, col: { A: 'MARIGOLD', B: 'INDIGO' } }, // 15
  ],
};

if (typeof module !== 'undefined' && module.exports) module.exports = PUZZLE;
