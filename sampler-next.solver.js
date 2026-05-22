'use strict';
// Sampler solver — pure logic, no DOM. Loadable in the browser and Node.
// Enumerates every solution of a puzzle and runs the spec's four
// generation checks (§9): solvable, solution-count band, dead-end-free.

// Engine access: require() in Node; in the browser the engine's top-level
// consts are already global (shared <script> scope), so reference them bare.
const _ENG = (typeof require === 'function') ? require('./sampler-next.engine.js') : null;
const _evaluateAll = _ENG ? _ENG.evaluateAll : evaluateAll;
const _isSolved    = _ENG ? _ENG.isSolved   : isSolved;
const _partsOf     = _ENG ? _ENG.partsOf    : partsOf;

// every {shape, rot, col} a single cell could take, given the kit left,
// the palette, and an optional shape-allowlist. Squares are
// rotation-invariant (one region) — rot 0 only.
function cellCandidates(kitLeft, palette, allowShapes) {
  const out = [];
  for (const shape of ['curve', 'triangle', 'square']) {
    if ((kitLeft[shape] || 0) <= 0) continue;
    if (allowShapes && !allowShapes.includes(shape)) continue;
    const rots = shape === 'square' ? [0] : [0, 1, 2, 3];
    const twoPart = shape !== 'square';
    for (const rot of rots) {
      if (twoPart) {
        for (const a of palette) for (const b of palette)
          out.push({ shape, rot, col: { A: a, B: b } });
      } else {
        for (const w of palette) out.push({ shape, rot, col: { W: w } });
      }
    }
  }
  return out;
}

// Per-cell allowed shapes, used to prune the search. Derived from the
// design's positional rules: each cellsAreShape instance pins its cells to
// one shape. The legacy hardcoded positional rules are still recognised
// (the full block-library effort removes them).
function shapeConstraints(N, ruleKeys) {
  const constraints = new Array(N).fill(null);
  // legacy hardcoded positional rules (Phase B — removed in the full effort)
  if (ruleKeys.includes('cornersTriangles')) {
    for (let i = 0; i < N; i++) {
      constraints[i] = [0, 3, N - 4, N - 1].includes(i) ? ['triangle'] : ['curve', 'square'];
    }
  }
  if (ruleKeys.includes('centreCurves')) {
    for (const i of [5, 6, 9, 10]) constraints[i] = ['curve'];
  }
  // data-driven frame: cellsAreShape instances
  for (const entry of ruleKeys) {
    if (entry && typeof entry === 'object' && entry.rule === 'cellsAreShape') {
      for (const c of entry.cells) {
        if (constraints[c] && constraints[c].includes(entry.shape)) continue;
        constraints[c] = [entry.shape];
      }
    }
  }
  return constraints;
}

// Given a cell placement, return the placement its 180° partner must have
// to satisfy symmetry (same shape/color, rotation flipped by 180°).
function symmetryPartner(cell) {
  const rot = cell.shape === 'square' ? 0 : (cell.rot + 2) % 4;
  return { shape: cell.shape, rot, col: Object.assign({}, cell.col) };
}

// enumerate every complete solution of `puzzle`, up to opts.cap (default 64).
// Given cells are fixed to puzzle.solution[idx]; other cells are searched.
//
// Traversal iterates over symmetry pairs (i, N-1-i). For each pair, the
// "primary" cell is searched with cellCandidates; the partner cell is
// immediately forced to its unique symmetry-determined value. This reduces
// branching by ~100× compared with searching both cells independently.
// When a rule set doesn't include 'symmetry', pairs degenerate to single
// cells and the solver still works correctly.
function solve(puzzle, opts) {
  opts = opts || {};
  const cap = opts.cap || 64;
  const N = puzzle.size * puzzle.size;
  const ruleKeys = puzzle.ruleKeys;
  const palette = puzzle.fabrics;
  const useSymmetry = ruleKeys.includes('symmetry');

  // Build pair list: each entry is [primary, partner|null].
  // For a symmetric puzzle, partner = N-1-primary (skip if same cell or
  // already paired). For non-symmetric, partner = null.
  const pairs = [];
  const paired = new Set();
  for (let i = 0; i < N; i++) {
    if (paired.has(i)) continue;
    if (useSymmetry) {
      const p = N - 1 - i;
      if (p !== i) {
        pairs.push([i, p]);
        paired.add(i);
        paired.add(p);
      } else {
        pairs.push([i, null]); // centre cell in odd-size grids
        paired.add(i);
      }
    } else {
      pairs.push([i, null]);
      paired.add(i);
    }
  }

  const shapeAllowed = shapeConstraints(N, ruleKeys);

  const fixed = new Array(N).fill(null);
  for (const i of (puzzle.givens || [])) fixed[i] = puzzle.solution[i];

  const grid = new Array(N).fill(null);
  const colors = {};
  const kitLeft = Object.assign({}, puzzle.kit);
  const solutions = [];

  function apply(i, cell) {
    grid[i] = { shape: cell.shape, rot: cell.rot };
    for (const part in cell.col) colors[i + ':' + part] = cell.col[part];
    kitLeft[cell.shape]--;
  }
  function undo(i, cell) {
    grid[i] = null;
    for (const part in cell.col) delete colors[i + ':' + part];
    kitLeft[cell.shape]++;
  }
  // any non-empty violation set on the partial board is a permanent dead
  // branch (every rule is monotonic) — prune it.
  function violates() {
    const res = _evaluateAll({ grid, colors, kit: puzzle.kit }, ruleKeys);
    for (const r of res) if (r.violations.size > 0) return true;
    return false;
  }
  function snapshot() {
    return grid.map((p, i) => {
      const col = {};
      for (const part of _partsOf(p.shape)) col[part] = colors[i + ':' + part];
      return { shape: p.shape, rot: p.rot, col };
    });
  }

  // Place every given cell up-front; the search then only fills free cells.
  for (let i = 0; i < N; i++) if (fixed[i]) apply(i, fixed[i]);

  function recurse(step) {
    if (solutions.length >= cap) return;
    if (step === pairs.length) {
      if (_isSolved({ grid, colors, kit: puzzle.kit }, ruleKeys)) solutions.push(snapshot());
      return;
    }
    const [i, partner] = pairs[step];
    const iFixed = !!fixed[i];
    const pFixed = partner !== null && !!fixed[partner];

    // both cells already placed up-front — nothing to search
    if (iFixed && (partner === null || pFixed)) {
      recurse(step + 1);
      return;
    }

    // primary fixed, partner free — partner forced by symmetry
    if (iFixed && !pFixed) {
      const pc = symmetryPartner(fixed[i]);
      if ((kitLeft[pc.shape] || 0) > 0) {
        apply(partner, pc);
        if (!violates()) recurse(step + 1);
        undo(partner, pc);
      }
      return;
    }

    // partner fixed, primary free — primary forced by symmetry (involutive)
    if (!iFixed && pFixed) {
      const pc = symmetryPartner(fixed[partner]);
      const allowed = shapeAllowed[i];
      if (allowed && !allowed.includes(pc.shape)) return;
      if ((kitLeft[pc.shape] || 0) > 0) {
        apply(i, pc);
        if (!violates()) recurse(step + 1);
        undo(i, pc);
      }
      return;
    }

    // both free — search the primary; partner (if any) forced by symmetry
    for (const cand of cellCandidates(kitLeft, palette, shapeAllowed[i])) {
      const need = (partner !== null) ? 2 : 1;
      if ((kitLeft[cand.shape] || 0) < need) continue;
      apply(i, cand);
      let pc = null;
      if (partner !== null) { pc = symmetryPartner(cand); apply(partner, pc); }
      if (!violates()) recurse(step + 1);
      if (pc) undo(partner, pc);
      undo(i, cand);
      if (solutions.length >= cap) return;
    }
  }

  recurse(0);
  return solutions;
}
// a stable per-cell value key — two cells are "the same" iff this matches
function cellKey(c) {
  if (c.shape === 'square') return 'sq|' + c.col.W;
  return c.shape[0] + '|' + c.rot + '|' + c.col.A + '|' + c.col.B;
}

// Dead-end-free check (spec §5/§13), via independent choice points.
// Diff cells (where solutions disagree) are grouped by correlation into
// choice-point components with union-find; the puzzle passes when the
// solution count equals the product of the per-component option counts —
// i.e. the components are mutually independent, so settling one choice
// point never strands another.
// A multi-cell component is treated as one atomic choice point (spec §5):
// this check verifies independence *between* choice points, not cell-by-cell
// safety *within* one. Per spec §13 that residual is accepted — a dead-end
// inside a single choice point is rare and fully recoverable (the engine
// gives no live feedback and the page's Erase is unlimited).
function checkIndependence(solutions) {
  if (solutions.length <= 1) return true;
  const n = solutions.length;
  const N = solutions[0].length;

  // diff cells: the cells where solutions disagree
  const diff = [];
  for (let i = 0; i < N; i++) {
    if (new Set(solutions.map(s => cellKey(s[i]))).size > 1) diff.push(i);
  }
  if (diff.length === 0) return true;

  // union-find over diff cells: merge any two that are NOT independent
  // (their joint projection is smaller than the product of their singles)
  const parent = {};
  for (const i of diff) parent[i] = i;
  function find(x) { while (parent[x] !== x) x = parent[x] = parent[parent[x]]; return x; }
  for (let a = 0; a < diff.length; a++) {
    for (let b = a + 1; b < diff.length; b++) {
      const i = diff[a], j = diff[b];
      const pi = new Set(solutions.map(s => cellKey(s[i]))).size;
      const pj = new Set(solutions.map(s => cellKey(s[j]))).size;
      const pij = new Set(solutions.map(s => cellKey(s[i]) + '#' + cellKey(s[j]))).size;
      if (pij !== pi * pj) parent[find(i)] = find(j);
    }
  }

  // group diff cells into choice-point components, then require the count
  // to equal the product of the per-component option counts
  const groups = {};
  for (const i of diff) {
    const r = find(i);
    (groups[r] || (groups[r] = [])).push(i);
  }
  let product = 1;
  for (const r in groups) {
    const cells = groups[r];
    product *= new Set(solutions.map(s => cells.map(i => cellKey(s[i])).join('/'))).size;
    if (product > n) return false;
  }
  return product === n;
}
// run the spec §9 checks on a concrete puzzle.
function analyze(puzzle) {
  const band = puzzle.solutionBand || { min: 2, max: 8 };
  const cap = band.max + 1;                      // +1 detects over-band cheaply
  const solutions = solve(puzzle, { cap });
  const count = solutions.length;
  const solvable = count >= 1;
  const overBand = count > band.max;
  const inBand = solvable && !overBand && count >= band.min;
  // skip the independence check when over-band: `solutions` is then a
  // truncated (capped) set, so factoring it would be meaningless.
  const deadEndFree = !overBand && checkIndependence(solutions);
  const pass = solvable && inBand && deadEndFree;
  return { solvable, count, overBand, inBand, deadEndFree, pass, band, solutions };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { solve, analyze, checkIndependence };
}
