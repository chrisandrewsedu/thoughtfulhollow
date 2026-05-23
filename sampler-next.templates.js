'use strict';
// Sampler block designs (spike round 5) — single-solution model.
// Each design is a named classic quilt pattern with:
//   • piece kit (exact counts per shape, summing to size*size)
//   • color kit (exact counts per fabric, summing to total regions)
//   • structural and colour rules that make the solution unique
//   • solutionBand { min:1, max:1 } — one specific block to deduce

const BAND_1 = { min: 1, max: 1 };

const T_CORNERS = [0, 3, 12, 15];
const T_CENTRE  = [5, 6, 9, 10];
const T_EDGES   = [1, 2, 4, 7, 8, 11, 13, 14];

const TEMPLATES = [
  {
    id: 'drunkards-path',
    size: 4,
    ruleKeys: [
      'continuity', 'symmetry',
      { rule: 'cellsAreShape', cells: T_CORNERS, shape: 'triangle', label: 'Triangles fill the corners' },
      { rule: 'cellsAreShape', cells: T_CENTRE,  shape: 'curve',    label: 'The four centre cells are curves' },
      { rule: 'cellsAreShape', cells: T_EDGES,   shape: 'square',   label: 'Squares fill the edges' },
      { rule: 'colorKitExact', kit: { LINEN: 8, MADDER: 4, INDIGO: 4, MARIGOLD: 4, SLATE: 4 },
        label: 'Use 8 LINEN, 4 MADDER, 4 INDIGO, 4 MARIGOLD, 4 SLATE' },
      'discsUnified', 'fieldHue',
    ],
    kit: { curve: 4, triangle: 4, square: 8 },
    colorKit: { LINEN: 8, MADDER: 4, INDIGO: 4, MARIGOLD: 4, SLATE: 4 },
    solutionBand: BAND_1,
  },
  {
    id: 'friendship-star',
    size: 4,
    ruleKeys: [
      'symmetry',
      { rule: 'cellsAreShape', cells: T_CORNERS, shape: 'triangle', label: 'Triangles fill the corners' },
      { rule: 'cellsAreShape', cells: [...T_CENTRE, ...T_EDGES], shape: 'square', label: 'Squares fill everywhere else' },
      { rule: 'colorKitExact', kit: { LINEN: 8, MADDER: 8, INDIGO: 4 },
        label: 'Use 8 LINEN, 8 MADDER, 4 INDIGO' },
      'triangleHues', 'squaresDiffer',
    ],
    kit: { triangle: 4, square: 12 },
    colorKit: { LINEN: 8, MADDER: 8, INDIGO: 4 },
    solutionBand: BAND_1,
  },
  {
    id: 'sawtooth-border',
    size: 4,
    ruleKeys: [
      'symmetry',
      { rule: 'cellsAreShape', cells: [0, 1, 2, 3, 12, 13, 14, 15], shape: 'triangle', label: 'Triangles fill the top and bottom rows' },
      { rule: 'cellsAreShape', cells: [4, 5, 6, 7, 8, 9, 10, 11],   shape: 'square',   label: 'Squares fill the middle rows' },
      { rule: 'colorKitExact', kit: { LINEN: 8, MADDER: 8, INDIGO: 8 },
        label: 'Use 8 LINEN, 8 MADDER, 8 INDIGO' },
      'triangleHues', 'squaresDiffer',
    ],
    kit: { triangle: 8, square: 8 },
    colorKit: { LINEN: 8, MADDER: 8, INDIGO: 8 },
    solutionBand: BAND_1,
  },
  {
    id: 'pinwheel',
    size: 4,
    ruleKeys: [
      'symmetry4',
      { rule: 'cellsAreShape', cells: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], shape: 'triangle', label: 'Every cell is a triangle' },
      { rule: 'colorKitExact', kit: { LINEN: 16, MADDER: 16 },
        label: 'Use 16 LINEN, 16 MADDER' },
      'triangleHues',
    ],
    kit: { triangle: 16 },
    colorKit: { LINEN: 16, MADDER: 16 },
    solutionBand: BAND_1,
  },
];

if (typeof module !== 'undefined' && module.exports) module.exports = { TEMPLATES };
