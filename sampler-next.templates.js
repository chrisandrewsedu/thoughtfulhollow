'use strict';
// Sampler block designs. A design is authored data: a fully-pinned frame
// (cellsAreShape instances) + structural and colour rules + kit + palette.
// The generator instantiates a date-seeded daily puzzle from a design.

// Every design draws its palette from this family (spec §9).
const PALETTE = {
  pool: ['LINEN', 'FLAX', 'SAGE', 'MADDER', 'MARIGOLD', 'CLARET',
         'INDIGO', 'SLATE', 'TEAL'],
  size: 5,
  require: { warm: 1, cool: 1, neutral: 1 },
};
const BAND = { min: 1, max: 8 };

const TEMPLATES = [
  {
    // 1 — triangles in the corners, a curve ring at the centre, square edges
    id: 'classic-star',
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
    // 2 — sawtooth bands: triangle rows top and bottom, square rows centre
    id: 'sawtooth-bands',
    size: 4,
    ruleKeys: [
      'continuity', 'symmetry',
      { rule: 'cellsAreShape', cells: [0, 1, 2, 3, 12, 13, 14, 15], shape: 'triangle', label: 'Triangles fill the top and bottom rows' },
      { rule: 'cellsAreShape', cells: [4, 5, 6, 7, 8, 9, 10, 11], shape: 'square', label: 'Squares fill the two middle rows' },
      'triangleHues', 'squaresDiffer',
    ],
    kit: { triangle: 8, square: 8 },
    paletteFamily: PALETTE,
    solutionBand: BAND,
  },
  {
    // 3 — circle field: every cell a curve, four interlocking rings
    id: 'circle-field',
    size: 4,
    ruleKeys: [
      'continuity', 'symmetry',
      { rule: 'cellsAreShape', cells: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], shape: 'curve', label: 'Every cell is a curve' },
      'discsUnified', 'fieldHue',
    ],
    kit: { curve: 16 },
    paletteFamily: PALETTE,
    solutionBand: BAND,
  },
  {
    // 4 — twin rings: curve rings top-left and bottom-right
    id: 'twin-rings',
    size: 4,
    ruleKeys: [
      'continuity', 'symmetry',
      { rule: 'cellsAreShape', cells: [0, 1, 4, 5, 10, 11, 14, 15], shape: 'curve', label: 'Curves form two rings — top-left and bottom-right' },
      { rule: 'cellsAreShape', cells: [3, 12], shape: 'triangle', label: 'Triangles fill the other two corners' },
      { rule: 'cellsAreShape', cells: [2, 6, 7, 8, 9, 13], shape: 'square', label: 'Squares fill the rest' },
      'discsUnified', 'triangleHues', 'fieldHue', 'squaresDiffer',
    ],
    kit: { curve: 8, triangle: 2, square: 6 },
    paletteFamily: PALETTE,
    solutionBand: BAND,
  },
  {
    // 5 — crossed star: triangles on both diagonals, square ground
    id: 'crossed-star',
    size: 4,
    ruleKeys: [
      'continuity', 'symmetry',
      { rule: 'cellsAreShape', cells: [0, 3, 5, 6, 9, 10, 12, 15], shape: 'triangle', label: 'Triangles form the diagonal cross' },
      { rule: 'cellsAreShape', cells: [1, 2, 4, 7, 8, 11, 13, 14], shape: 'square', label: 'Squares fill the rest' },
      'triangleHues', 'squaresDiffer',
    ],
    kit: { triangle: 8, square: 8 },
    paletteFamily: PALETTE,
    solutionBand: BAND,
  },
];

if (typeof module !== 'undefined' && module.exports) module.exports = { TEMPLATES };
