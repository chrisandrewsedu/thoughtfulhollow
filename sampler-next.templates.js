'use strict';
// Sampler block designs (spike round 3). A design is authored data: a frame
// (cellsAreShape instances — may leave cells unpinned), structural and colour
// rules, kit, palette. continuity, symmetry, symmetry4, symmetryMirror, and
// all positional / count / adjacency / connectivity / orientation rules are
// optional per design — that is what makes the set feel varied.
//
// Round-3 spike findings recorded here as comments:
//   - 'wandering-ring' was dropped: connectedShape makes the solver hang
//     (non-monotonic rule with full 4×4 board is too slow to backtrack).
//   - 'circle', 'drift', 'diagonal', 'mirror-fan' are solvable but fail
//     the 5-given generator cap: their colour-rule vocabulary leaves too
//     many solutions (≥200 bare) for 5 givens to reach any passing count.
//     Only 'rosette' (symmetry4) and designs with very tight structural
//     rules can sustain the cap.
//   - 'paired' had mustBeAdjacent(triangle→curve) which is always violated
//     because corners [0,3,12,15] are never adjacent to centre [5,6,9,10]
//     in a 4×4 grid (edge squares sit between them). Rule dropped.
//   - 'mirror-fan' had squaresDiffer which contradicts symmetryMirror:
//     vertical mirror pairs cells 1↔2 and 13↔14, which are also adjacent
//     squares (squaresDiffer requires them to differ; mirror requires same).
//     squaresDiffer dropped.

const PALETTE = {
  pool: ['LINEN', 'FLAX', 'SAGE', 'MADDER', 'MARIGOLD', 'CLARET',
         'INDIGO', 'SLATE', 'TEAL'],
  size: 5,
  require: { warm: 1, cool: 1, neutral: 1 },
};
const BAND = { min: 1, max: 8 };

const CORNERS = [0, 3, 12, 15];
const CENTRE = [5, 6, 9, 10];
const EDGES = [1, 2, 4, 7, 8, 11, 13, 14];

const TEMPLATES = [
  // ROSETTE first — the only design that reliably generates under the
  // 5-given cap.  symmetry4 cuts the structural solution space enough
  // that 5 givens bring the count into band.  (The generator tests use
  // TEMPLATES[0].)
  {
    id: 'rosette',
    size: 4,
    ruleKeys: [
      'symmetry4',
      { rule: 'cellsAreShape', cells: CORNERS, shape: 'triangle', label: 'Triangles fill the corners' },
      { rule: 'cellsAreShape', cells: CENTRE,  shape: 'curve',    label: 'The four centre cells are curves' },
      { rule: 'cellsAreShape', cells: EDGES,   shape: 'square',   label: 'Squares fill the edges' },
      'discsUnified', 'triangleHues', 'fieldHue', 'squaresDiffer',
    ],
    kit: { curve: 4, triangle: 4, square: 8 },
    paletteFamily: PALETTE, solutionBand: BAND,
  },
  // SCATTER — solvable; generates 0/14 under 5-given cap (colour space
  // too large for noAdjacentShape alone).  Retained as spike data.
  {
    id: 'scatter',
    size: 4,
    ruleKeys: [
      'symmetry',
      { rule: 'noAdjacentShape', shape: 'triangle', label: 'No two triangles touch' },
      'triangleHues', 'squaresDiffer',
    ],
    kit: { triangle: 4, square: 12 },
    paletteFamily: PALETTE, solutionBand: BAND,
  },
  // CIRCLE — solvable; generates 0/14 under 5-given cap (≥200 bare colour
  // solutions; 5 givens reduce to ~320, still above any useful band).
  {
    id: 'circle',
    size: 4,
    ruleKeys: [
      'continuity', 'symmetry',
      { rule: 'cellsAreShape', cells: CORNERS, shape: 'triangle', label: 'Triangles fill the corners' },
      { rule: 'cellsAreShape', cells: CENTRE,  shape: 'curve',    label: 'The four centre cells are curves' },
      { rule: 'cellsAreShape', cells: EDGES,   shape: 'square',   label: 'Squares fill the edges' },
      'discsUnified', 'triangleHues', 'fieldHue', 'squaresDiffer',
    ],
    kit: { curve: 4, triangle: 4, square: 8 },
    paletteFamily: PALETTE, solutionBand: { min: 1, max: 12 },
  },
  // DRIFT — solvable; generates 0/14 under 5-given cap (same colour
  // solution count problem as circle).
  {
    id: 'drift',
    size: 4,
    ruleKeys: [
      'continuity',
      { rule: 'cellsAreShape', cells: [0, 1, 2, 3, 12, 13, 14, 15], shape: 'triangle', label: 'Triangles fill the top and bottom rows' },
      { rule: 'cellsAreShape', cells: [4, 5, 6, 7, 8, 9, 10, 11],   shape: 'square',   label: 'Squares fill the two middle rows' },
      'triangleHues', 'squaresDiffer',
    ],
    kit: { triangle: 8, square: 8 },
    paletteFamily: PALETTE, solutionBand: BAND,
  },
  // MIRROR-FAN — solvable after removing squaresDiffer (contradicted by
  // symmetryMirror on adjacent mirror pairs); generates 0/14 (colour cap).
  {
    id: 'mirror-fan',
    size: 4,
    ruleKeys: [
      { rule: 'symmetryMirror', axis: 'v', label: 'The block is mirror-symmetric across the vertical axis' },
      { rule: 'cellsAreShape', cells: CORNERS, shape: 'triangle', label: 'Triangles fill the corners' },
      { rule: 'cellsAreShape', cells: CENTRE,  shape: 'curve',    label: 'The four centre cells are curves' },
      { rule: 'cellsAreShape', cells: EDGES,   shape: 'square',   label: 'Squares fill the edges' },
      'discsUnified', 'triangleHues', 'fieldHue',
    ],
    kit: { curve: 4, triangle: 4, square: 8 },
    paletteFamily: PALETTE, solutionBand: BAND,
  },
  // DIAGONAL — solvable; generates 0/14 (colour solution count problem).
  {
    id: 'diagonal',
    size: 4,
    ruleKeys: [
      'symmetry',
      { rule: 'countShapeInRegion', cells: [0, 1, 2, 3],     shape: 'curve', count: 1, label: 'Row 1 has one curve' },
      { rule: 'countShapeInRegion', cells: [4, 5, 6, 7],     shape: 'curve', count: 1, label: 'Row 2 has one curve' },
      { rule: 'countShapeInRegion', cells: [8, 9, 10, 11],   shape: 'curve', count: 1, label: 'Row 3 has one curve' },
      { rule: 'countShapeInRegion', cells: [12, 13, 14, 15], shape: 'curve', count: 1, label: 'Row 4 has one curve' },
      { rule: 'cellsAreShape', cells: CORNERS, shape: 'triangle', label: 'Triangles fill the corners' },
      'triangleHues', 'squaresDiffer',
    ],
    kit: { curve: 4, triangle: 4, square: 8 },
    paletteFamily: PALETTE, solutionBand: BAND,
  },
  // PAIRED — mustBeAdjacent(triangle→curve) dropped: corners [0,3,12,15]
  // are never adjacent to centre [5,6,9,10] in a 4×4 grid, so the rule
  // was always violated and the design was unsolvable.  noLargeBlock(square)
  // retained.  Still generates 0/14 (colour solution count problem).
  {
    id: 'paired',
    size: 4,
    ruleKeys: [
      'symmetry',
      { rule: 'cellsAreShape',  cells: CORNERS, shape: 'triangle', label: 'Triangles fill the corners' },
      { rule: 'cellsAreShape',  cells: CENTRE,  shape: 'curve',    label: 'The four centre cells are curves' },
      { rule: 'cellsAreShape',  cells: EDGES,   shape: 'square',   label: 'Squares fill the edges' },
      { rule: 'noLargeBlock',   shape: 'square', label: 'No 2x2 of squares' },
      'discsUnified', 'triangleHues', 'fieldHue', 'squaresDiffer',
    ],
    kit: { curve: 4, triangle: 4, square: 8 },
    paletteFamily: PALETTE, solutionBand: BAND,
  },
];

if (typeof module !== 'undefined' && module.exports) module.exports = { TEMPLATES };
