'use strict';
// Sampler picross generator — turns a target block into a playable puzzle.
// Works on any supported grid size.

const E =
  typeof require !== 'undefined'
    ? require('./sampler-picross.engine.js')
    : (typeof window !== 'undefined' ? window.PicrossEngine : null);
const S =
  typeof require !== 'undefined'
    ? require('./sampler-picross.solver.js')
    : (typeof window !== 'undefined' ? window.PicrossSolver : null);

const { partsOf, deriveClues, validateTarget, maxBandChips, isHalfTurnSymmetric, gridSizeOf } = E;

function scoreCandidate(clues, givens, cell, target, opts) {
  const trial = { ...givens, [cell]: target[cell] };
  const r = S.solve(clues, trial, opts);
  if (r.unique) return 0;
  return r.solutions.length;
}

// Among cells tied for the best score, prefer the one farthest (Chebyshev
// distance) from existing givens, with a random shuffle as the last tiebreak.
// This produces a visually spread-out given layout instead of clumping every
// given in the top-left corner of the board.
function pickNextGiven(clues, givens, target, opts) {
  const size = clues.size;
  const N = size * size;
  const givenIdx = Object.keys(givens).map(Number);
  let bestScore = Infinity;
  const tied = [];
  for (let i = 0; i < N; i++) {
    if (givens[i] != null) continue;
    const score = scoreCandidate(clues, givens, i, target, opts);
    if (score < bestScore) {
      bestScore = score;
      tied.length = 0;
      tied.push(i);
    } else if (score === bestScore) {
      tied.push(i);
    }
  }
  if (tied.length === 0) return { cell: null, score: Infinity };
  if (tied.length === 1) return { cell: tied[0], score: bestScore };
  function distToGivens(i) {
    if (givenIdx.length === 0) return 0;
    const r = Math.floor(i / size), c = i % size;
    let min = Infinity;
    for (const g of givenIdx) {
      const d = Math.max(Math.abs(r - Math.floor(g / size)), Math.abs(c - (g % size)));
      if (d < min) min = d;
    }
    return min;
  }
  tied.sort((a, b) => {
    const dd = distToGivens(b) - distToGivens(a);
    if (dd !== 0) return dd;
    return Math.random() - 0.5;
  });
  return { cell: tied[0], score: bestScore };
}

function generate(target, opts) {
  const options = Object.assign({ maxGivens: undefined, halfTurnSymmetric: undefined }, opts || {});
  const errs = validateTarget(target);
  if (errs.length) throw new Error('invalid target: ' + errs.join('; '));
  const size = gridSizeOf(target);
  const clues = deriveClues(target);
  // Default maxGivens scales with grid size so generation has headroom on
  // larger boards.
  const maxGivens = options.maxGivens != null ? options.maxGivens : Math.max(8, size * 2);
  const sym = options.halfTurnSymmetric != null
    ? !!options.halfTurnSymmetric
    : isHalfTurnSymmetric(target);
  const solveOpts = { halfTurnSymmetric: sym };

  const bandStats = {
    maxChips: maxBandChips(clues),
    perBand: {
      rows: clues.rows.map(b => ({ shape: Object.keys(b.shape).length, fabric: Object.keys(b.fabric).length })),
      cols: clues.cols.map(b => ({ shape: Object.keys(b.shape).length, fabric: Object.keys(b.fabric).length })),
    },
  };

  const givens = {};
  let result = S.solve(clues, givens, solveOpts);
  while (!result.unique && Object.keys(givens).length < maxGivens) {
    const { cell } = pickNextGiven(clues, givens, target, solveOpts);
    if (cell == null) break;
    givens[cell] = target[cell];
    result = S.solve(clues, givens, solveOpts);
  }

  return {
    target, clues, givens,
    size,
    unique: result.unique,
    givenCount: Object.keys(givens).length,
    bandStats,
    halfTurnSymmetric: sym,
  };
}

const PicrossGenerator = { generate, pickNextGiven };
if (typeof module !== 'undefined' && module.exports) module.exports = PicrossGenerator;
if (typeof window !== 'undefined') window.PicrossGenerator = PicrossGenerator;
