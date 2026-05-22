'use strict';
// Sampler engine — pure logic, no DOM. Loadable in browser (<script src>) and Node.

const GRID = 4;
const NCELL = GRID * GRID;

const DIRS = ['N', 'E', 'S', 'W'];
const OPP = { N: 'S', E: 'W', S: 'N', W: 'E' };

// index of the neighbour of cell `i` in direction `dir`, or -1 if off-grid
function neighbor(i, dir) {
  const r = Math.floor(i / GRID), c = i % GRID;
  if (dir === 'N') return r > 0 ? i - GRID : -1;
  if (dir === 'S') return r < GRID - 1 ? i + GRID : -1;
  if (dir === 'E') return c < GRID - 1 ? i + 1 : -1;
  if (dir === 'W') return c > 0 ? i - 1 : -1;
  return -1;
}

// the 180°-rotation partner of cell `i`
function partnerOf(i) { return NCELL - 1 - i; }

// ── Pieces ───────────────────────────────────────────────────────
// shapes: 'square' | 'triangle' | 'curve'.  A curve is a Drunkard's-Path
// quarter-circle: part A = the disc, part B = the field. A triangle is a
// half-square triangle: parts A and B are its two halves.
function partsOf(shape) {
  return shape === 'square' ? ['W'] : ['A', 'B'];
}

// curve continuity ports by rotation (rot 0 = disc in the NW corner)
const CURVE_PORTS = { 0: ['N', 'W'], 1: ['N', 'E'], 2: ['S', 'E'], 3: ['S', 'W'] };
function portsOf(piece) {
  if (!piece || piece.shape !== 'curve') return [];
  return CURVE_PORTS[piece.rot].slice();
}

// ── Fabrics ──────────────────────────────────────────────────────
const FABRICS = {
  LINEN:    { name: 'Linen',    col: '#ece0c8', hue: 'neutral' },
  FLAX:     { name: 'Flax',     col: '#d6c79b', hue: 'neutral' },
  SAGE:     { name: 'Sage',     col: '#b3b89a', hue: 'neutral' },
  MADDER:   { name: 'Madder',   col: '#a8392f', hue: 'warm' },
  MARIGOLD: { name: 'Marigold', col: '#d99838', hue: 'warm' },
  CLARET:   { name: 'Claret',   col: '#7d2933', hue: 'warm' },
  INDIGO:   { name: 'Indigo',   col: '#2b3a5e', hue: 'cool' },
  SLATE:    { name: 'Slate',    col: '#5f7b87', hue: 'cool' },
  TEAL:     { name: 'Teal',     col: '#2f6d6a', hue: 'cool' },
};

// ── Structure rules ──────────────────────────────────────────────
const CORNERS = [0, 3, 12, 15];
const CENTRE = [5, 6, 9, 10];
const filledAll = grid => grid.every(Boolean);

// curves continue across every seam, and never run off the board edge
function ruleContinuity(state) {
  const { grid } = state;
  const violations = new Set();
  for (let i = 0; i < NCELL; i++) {
    if (!grid[i]) continue;
    const myPorts = portsOf(grid[i]);
    for (const d of DIRS) {
      const j = neighbor(i, d);
      if (j === -1) {
        if (myPorts.includes(d)) violations.add(i);
      } else if (grid[j]) {
        const mine = myPorts.includes(d);
        const theirs = portsOf(grid[j]).includes(OPP[d]);
        if (mine !== theirs) { violations.add(i); violations.add(j); }
      }
    }
  }
  return { ok: filledAll(grid) && violations.size === 0, violations };
}

// the block has half-turn (180°) symmetry — shape, rotation, and colour
function ruleSymmetry(state) {
  const { grid, colors } = state;
  const violations = new Set();
  for (let i = 0; i < NCELL; i++) {
    const p = partnerOf(i);
    if (i >= p) continue;                       // check each pair once
    const a = grid[i], b = grid[p];
    if (!a || !b) continue;
    let bad = a.shape !== b.shape;
    if (!bad && a.shape !== 'square') bad = ((a.rot + 2) % 4) !== b.rot;
    if (!bad) {
      for (const part of partsOf(a.shape)) {
        if (colors[i + ':' + part] !== colors[p + ':' + part]) bad = true;
      }
    }
    if (bad) { violations.add(i); violations.add(p); }
  }
  return { ok: filledAll(grid) && violations.size === 0, violations };
}

// triangles fill the corners — and only the corners
function ruleCornersAreTriangles(state) {
  const { grid } = state;
  const violations = new Set();
  for (let i = 0; i < NCELL; i++) {
    if (!grid[i]) continue;
    const isCorner = CORNERS.includes(i);
    const isTri = grid[i].shape === 'triangle';
    if (isCorner !== isTri) violations.add(i);
  }
  return { ok: filledAll(grid) && violations.size === 0, violations };
}

// the four centre cells are curves
function ruleCentreIsCurves(state) {
  const { grid } = state;
  const violations = new Set();
  for (const i of CENTRE) {
    if (grid[i] && grid[i].shape !== 'curve') violations.add(i);
  }
  const centreFilled = CENTRE.every(i => grid[i]);
  return { ok: centreFilled && violations.size === 0, violations };
}

// ── Colour rules ─────────────────────────────────────────────────
// every region of every placed piece has a colour
function fullyColoured(state) {
  const { grid, colors } = state;
  return grid.every((p, i) =>
    p && partsOf(p.shape).every(part => colors[i + ':' + part]));
}

// every placed cell of `shape` has its `part` region coloured — lets a colour
// rule complete once its own regions are done, rather than waiting on the
// whole board to be coloured.
function partFilled(state, shape, part) {
  const { grid, colors } = state;
  return grid.every((p, i) => !p || p.shape !== shape || !!colors[i + ':' + part]);
}

// how many cells of `shape` are placed on the board
function shapeCount(grid, shape) {
  let n = 0;
  for (const p of grid) if (p && p.shape === shape) n++;
  return n;
}

// are all of `shape` placed? With the puzzle's kit totals (state.kit) a colour
// rule can complete as soon as its own shape is fully down — even while other
// shapes are still missing. Falls back to "the whole board is placed".
function allShapePlaced(state, shape) {
  const { grid, kit } = state;
  return kit ? shapeCount(grid, shape) === kit[shape] : filledAll(grid);
}

// every curve's disc (part A) is the same fabric
function ruleDiscsUnified(state) {
  const { grid, colors } = state;
  const violations = new Set();
  const discs = [];
  for (let i = 0; i < NCELL; i++) {
    if (grid[i] && grid[i].shape === 'curve') {
      const f = colors[i + ':A'];
      if (f) discs.push([i, f]);
    }
  }
  const same = discs.length > 0 && discs.every(([, f]) => f === discs[0][1]);
  if (discs.length && !same) {
    for (const [i] of discs) violations.add(i);
  }
  return { ok: allShapePlaced(state, 'curve') && partFilled(state, 'curve', 'A') && same, violations };
}

// each triangle's two halves differ in hue
function ruleTriangleHalvesDifferHue(state) {
  const { grid, colors } = state;
  const violations = new Set();
  for (let i = 0; i < NCELL; i++) {
    if (!grid[i] || grid[i].shape !== 'triangle') continue;
    const a = colors[i + ':A'], b = colors[i + ':B'];
    if (a && b && FABRICS[a].hue === FABRICS[b].hue) violations.add(i);
  }
  return {
    ok: allShapePlaced(state, 'triangle')
      && partFilled(state, 'triangle', 'A') && partFilled(state, 'triangle', 'B')
      && violations.size === 0,
    violations,
  };
}

// curve background fields (part B) stay cool or neutral
function ruleFieldHue(state) {
  const { grid, colors } = state;
  const violations = new Set();
  for (let i = 0; i < NCELL; i++) {
    if (!grid[i] || grid[i].shape !== 'curve') continue;
    const b = colors[i + ':B'];
    if (b && FABRICS[b].hue === 'warm') violations.add(i);
  }
  return {
    ok: allShapePlaced(state, 'curve') && partFilled(state, 'curve', 'B') && violations.size === 0,
    violations,
  };
}

// no two touching squares share a fabric
function ruleNoAdjacentSquaresSameFabric(state) {
  const { grid, colors } = state;
  const violations = new Set();
  for (let i = 0; i < NCELL; i++) {
    if (!grid[i] || grid[i].shape !== 'square') continue;
    const f = colors[i + ':W'];
    if (!f) continue;
    for (const d of ['E', 'S']) {
      const j = neighbor(i, d);
      if (j !== -1 && grid[j] && grid[j].shape === 'square'
          && colors[j + ':W'] === f) {
        violations.add(i); violations.add(j);
      }
    }
  }
  return {
    ok: allShapePlaced(state, 'square') && partFilled(state, 'square', 'W') && violations.size === 0,
    violations,
  };
}

// ── Rule registry ────────────────────────────────────────────────
const RULES = {
  continuity:        { group: 'structure', label: 'Curves continue across every seam',          fn: ruleContinuity },
  symmetry:          { group: 'structure', label: 'The block has half-turn (180°) symmetry',     fn: ruleSymmetry },
  cornersTriangles:  { group: 'structure', label: 'Triangles fill the corners — and only there', fn: ruleCornersAreTriangles },
  centreCurves:      { group: 'structure', label: 'The four centre cells are curves',            fn: ruleCentreIsCurves },
  discsUnified:      { group: 'colour',    label: 'Every curve’s disc is the same fabric',        fn: ruleDiscsUnified },
  triangleHues:      { group: 'colour',    label: 'Each triangle’s two halves differ in hue',     fn: ruleTriangleHalvesDifferHue },
  fieldHue:          { group: 'colour',    label: 'Curve background fields stay cool or neutral', fn: ruleFieldHue },
  squaresDiffer:     { group: 'colour',    label: 'No two touching squares share a fabric',       fn: ruleNoAdjacentSquaresSameFabric },
};

// run the named rules; returns [{ key, group, label, ok, violations }]
function evaluateAll(state, ruleKeys) {
  return ruleKeys.map(key => {
    const def = RULES[key];
    if (!def) throw new Error(`Unknown rule key: "${key}"`);
    const res = def.fn(state);
    return { key, group: def.group, label: def.label, ok: res.ok, violations: res.violations };
  });
}

// solved = board fully placed, fully coloured, every named rule satisfied
function isSolved(state, ruleKeys) {
  if (!state.grid.every(Boolean)) return false;
  if (!fullyColoured(state)) return false;
  return evaluateAll(state, ruleKeys).every(r => r.ok);
}

// ── exports (Node) ───────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GRID, NCELL, DIRS, OPP, neighbor, partnerOf,
    partsOf, portsOf, CURVE_PORTS, FABRICS, CORNERS, CENTRE,
    ruleContinuity, ruleSymmetry, ruleCornersAreTriangles, ruleCentreIsCurves,
    ruleDiscsUnified, ruleTriangleHalvesDifferHue, ruleFieldHue, ruleNoAdjacentSquaresSameFabric, fullyColoured,
    RULES, evaluateAll, isSolved,
  };
}
