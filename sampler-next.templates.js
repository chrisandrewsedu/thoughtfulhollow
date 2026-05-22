'use strict';
// Sampler constraint-templates. A template is authored once; the generator
// instantiates a date-seeded daily puzzle from it (spec §9). Author
// constraint-sets, never finished pictures.

const TEMPLATES = [
  {
    id: 'sampler-classic-4x4',
    size: 4,
    // structure + colour rules, all live at once (spec §4)
    ruleKeys: [
      'continuity', 'symmetry', 'cornersTriangles', 'centreCurves',
      'discsUnified', 'triangleHues', 'fieldHue', 'squaresDiffer',
    ],
    // the piece kit — counts sum to the 16 cells
    kit: { curve: 4, triangle: 4, square: 8 },
    // palette family: the generator resolves a concrete 5-fabric palette
    // per date, always including at least one fabric of each hue.
    paletteFamily: {
      pool: ['LINEN', 'FLAX', 'SAGE', 'MADDER', 'MARIGOLD', 'CLARET',
             'INDIGO', 'SLATE', 'TEAL'],
      size: 5,
      require: { warm: 1, cool: 1, neutral: 1 },
    },
    // how many cells are revealed pre-placed; the seed chooses which.
    givenPolicy: { count: 8 },
    // acceptable solution-count band (spec §5)
    solutionBand: { min: 1, max: 10 },
  },
];

if (typeof module !== 'undefined' && module.exports) module.exports = { TEMPLATES };
