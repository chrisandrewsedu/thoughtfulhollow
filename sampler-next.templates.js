'use strict';
// Sampler block designs (spike round 2). A design is authored data: a frame
// (cellsAreShape instances — may leave cells unpinned), structural and colour
// rules, kit, palette. continuity, symmetry, and symmetry4 are all optional
// per design — that is what makes the set feel varied.

const PALETTE = {
  pool: ['LINEN', 'FLAX', 'SAGE', 'MADDER', 'MARIGOLD', 'CLARET',
         'INDIGO', 'SLATE', 'TEAL'],
  size: 5,
  require: { warm: 1, cool: 1, neutral: 1 },
};
const BAND = { min: 1, max: 8 };

const TEMPLATES = [
  {
    id: 'circle',
    size: 4,
    ruleKeys: [
      'continuity', 'symmetry',
      { rule: 'cellsAreShape', cells: [0, 3, 12, 15], shape: 'triangle', label: 'Triangles fill the corners' },
      { rule: 'cellsAreShape', cells: [5, 6, 9, 10], shape: 'curve', label: 'The four centre cells are curves' },
      { rule: 'cellsAreShape', cells: [1, 2, 4, 7, 8, 11, 13, 14], shape: 'square', label: 'Squares fill the edges' },
      'discsUnified', 'triangleHues', 'fieldHue', 'squaresDiffer',
    ],
    kit: { curve: 4, triangle: 4, square: 8 },
    paletteFamily: PALETTE,
    solutionBand: BAND,
  },
  {
    id: 'rosette',
    size: 4,
    ruleKeys: [
      'symmetry4',
      { rule: 'cellsAreShape', cells: [0, 3, 12, 15], shape: 'triangle', label: 'Triangles fill the corners' },
      { rule: 'cellsAreShape', cells: [5, 6, 9, 10], shape: 'curve', label: 'The four centre cells are curves' },
      { rule: 'cellsAreShape', cells: [1, 2, 4, 7, 8, 11, 13, 14], shape: 'square', label: 'Squares fill the edges' },
      'discsUnified', 'triangleHues', 'fieldHue', 'squaresDiffer',
    ],
    kit: { curve: 4, triangle: 4, square: 8 },
    paletteFamily: PALETTE,
    solutionBand: BAND,
  },
  {
    id: 'drift',
    size: 4,
    ruleKeys: [
      'continuity',
      { rule: 'cellsAreShape', cells: [0, 1, 2, 3, 12, 13, 14, 15], shape: 'triangle', label: 'Triangles fill the top and bottom rows' },
      { rule: 'cellsAreShape', cells: [4, 5, 6, 7, 8, 9, 10, 11], shape: 'square', label: 'Squares fill the two middle rows' },
      'triangleHues', 'squaresDiffer',
    ],
    kit: { triangle: 8, square: 8 },
    paletteFamily: PALETTE,
    solutionBand: BAND,
  },
  {
    id: 'star4',
    size: 4,
    ruleKeys: [
      'symmetry4',
      { rule: 'cellsAreShape', cells: [0, 3, 5, 6, 9, 10, 12, 15], shape: 'triangle', label: 'Triangles form the diagonal cross' },
      { rule: 'cellsAreShape', cells: [1, 2, 4, 7, 8, 11, 13, 14], shape: 'square', label: 'Squares fill the rest' },
      'triangleHues', 'squaresDiffer',
    ],
    kit: { triangle: 8, square: 8 },
    paletteFamily: PALETTE,
    solutionBand: BAND,
  },
  {
    id: 'open-ring',
    size: 4,
    ruleKeys: [
      'continuity', 'symmetry',
      { rule: 'cellsAreShape', cells: [0, 3, 12, 15], shape: 'triangle', label: 'Triangles fill the corners' },
      'discsUnified', 'triangleHues', 'fieldHue', 'squaresDiffer',
    ],
    kit: { curve: 4, triangle: 4, square: 8 },
    paletteFamily: PALETTE,
    solutionBand: BAND,
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
    paletteFamily: PALETTE,
    solutionBand: BAND,
  },
];

if (typeof module !== 'undefined' && module.exports) module.exports = { TEMPLATES };
