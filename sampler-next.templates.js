'use strict';
// Sampler block designs (spike round 4). A design is authored data: a frame
// (cellsAreShape instances — may leave cells unpinned), structural and colour
// rules, kit, palette. Round 4 collapses the colour space with two levers:
// per-design paletteFamily.size and the paletteUsesAtMost rule.

const PALETTE_5 = {
  pool: ['LINEN', 'FLAX', 'SAGE', 'MADDER', 'MARIGOLD', 'CLARET',
         'INDIGO', 'SLATE', 'TEAL'],
  size: 5,
  require: { warm: 1, cool: 1, neutral: 1 },
};
const PALETTE_3 = {
  pool: ['LINEN', 'FLAX', 'SAGE', 'MADDER', 'MARIGOLD', 'CLARET',
         'INDIGO', 'SLATE', 'TEAL'],
  size: 3,
  require: { warm: 1, cool: 1, neutral: 1 },
};
const BAND = { min: 1, max: 8 };

const CORNERS = [0, 3, 12, 15];
const CENTRE = [5, 6, 9, 10];
const EDGES = [1, 2, 4, 7, 8, 11, 13, 14];

const TEMPLATES = [
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
    paletteFamily: PALETTE_5, solutionBand: BAND,
  },
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
    paletteFamily: PALETTE_3, solutionBand: BAND,
  },
  {
    id: 'drift',
    size: 4,
    ruleKeys: [
      'continuity', 'symmetry',
      { rule: 'cellsAreShape', cells: [0, 1, 2, 3, 12, 13, 14, 15], shape: 'triangle', label: 'Triangles fill the top and bottom rows' },
      { rule: 'cellsAreShape', cells: [4, 5, 6, 7, 8, 9, 10, 11],   shape: 'square',   label: 'Squares fill the two middle rows' },
      'triangleHues', 'squaresDiffer',
      { rule: 'paletteUsesAtMost', count: 2, label: 'The block uses at most 2 fabrics' },
    ],
    kit: { triangle: 8, square: 8 },
    paletteFamily: PALETTE_3, solutionBand: BAND,
  },
  {
    id: 'mirror-fan',
    size: 4,
    ruleKeys: [
      { rule: 'symmetryMirror', axis: 'v', label: 'The block is mirror-symmetric across the vertical axis' },
      { rule: 'cellsAreShape', cells: CORNERS, shape: 'triangle', label: 'Triangles fill the corners' },
      { rule: 'cellsAreShape', cells: CENTRE,  shape: 'curve',    label: 'The four centre cells are curves' },
      { rule: 'cellsAreShape', cells: EDGES,   shape: 'square',   label: 'Squares fill the edges' },
      { rule: 'paletteUsesAtMost', count: 2, label: 'The block uses at most 2 fabrics' },
      'discsUnified', 'triangleHues', 'fieldHue',
    ],
    kit: { curve: 4, triangle: 4, square: 8 },
    paletteFamily: PALETTE_3, solutionBand: BAND,
  },
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
    paletteFamily: PALETTE_3, solutionBand: BAND,
  },
  {
    id: 'paired',
    size: 4,
    ruleKeys: [
      'symmetry',
      { rule: 'cellsAreShape',  cells: CORNERS, shape: 'triangle', label: 'Triangles fill the corners' },
      { rule: 'cellsAreShape',  cells: CENTRE,  shape: 'curve',    label: 'The four centre cells are curves' },
      { rule: 'cellsAreShape',  cells: EDGES,   shape: 'square',   label: 'Squares fill the edges' },
      { rule: 'noLargeBlock',   shape: 'square', label: 'No 2x2 of squares' },
      { rule: 'paletteUsesAtMost', count: 2, label: 'The block uses at most 2 fabrics' },
      'discsUnified', 'triangleHues', 'fieldHue', 'squaresDiffer',
    ],
    kit: { curve: 4, triangle: 4, square: 8 },
    paletteFamily: PALETTE_3, solutionBand: BAND,
  },
  {
    id: 'scatter',
    size: 4,
    ruleKeys: [
      'symmetry',
      { rule: 'noAdjacentShape', shape: 'triangle', label: 'No two triangles touch' },
      'triangleHues', 'squaresDiffer',
    ],
    kit: { triangle: 4, square: 12 },
    paletteFamily: PALETTE_3, solutionBand: BAND,
  },
];

if (typeof module !== 'undefined' && module.exports) module.exports = { TEMPLATES };
