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

// ── Parameterized rules ──────────────────────────────────────────
// A parameterized rule is carried in a design's rule list as an instance
// { rule, ...params, label } rather than a plain registry key. cellsAreShape
// is the data-driven positional rule: the named cells must all be `shape`.
function ruleCellsAreShape(state, params) {
  const { grid } = state;
  const violations = new Set();
  let allFilled = true;
  for (const i of params.cells) {
    if (!grid[i]) { allFilled = false; continue; }
    if (grid[i].shape !== params.shape) violations.add(i);
  }
  return { ok: allFilled && violations.size === 0, violations };
}

// 90°-clockwise image of cell `i` on the GRID×GRID board.
function rot90(i) {
  const r = Math.floor(i / GRID), c = i % GRID;
  return c * GRID + (GRID - 1 - r);
}

// 4-fold rotational symmetry: the block is invariant under a 90° turn.
// Each cell must match its 90° image — same shape, rotation stepped by +1
// (squares are rotation-invariant), and each region's colour equal.
function ruleSymmetry4(state) {
  const { grid, colors } = state;
  const violations = new Set();
  for (let i = 0; i < NCELL; i++) {
    const j = rot90(i);
    const a = grid[i], b = grid[j];
    if (!a || !b) continue;
    let bad = a.shape !== b.shape;
    if (!bad && a.shape !== 'square') bad = ((a.rot + 1) % 4) !== b.rot;
    if (!bad) {
      for (const part of partsOf(a.shape)) {
        if (colors[i + ':' + part] !== colors[j + ':' + part]) bad = true;
      }
    }
    if (bad) { violations.add(i); violations.add(j); }
  }
  return { ok: filledAll(grid) && violations.size === 0, violations };
}

// parameterized: no two cells of params.shape are orthogonally adjacent.
function ruleNoAdjacentShape(state, params) {
  const { grid } = state;
  const violations = new Set();
  for (let i = 0; i < NCELL; i++) {
    if (!grid[i] || grid[i].shape !== params.shape) continue;
    for (const d of ['E', 'S']) {
      const j = neighbor(i, d);
      if (j !== -1 && grid[j] && grid[j].shape === params.shape) {
        violations.add(i); violations.add(j);
      }
    }
  }
  return { ok: filledAll(grid) && violations.size === 0, violations };
}

// Inverse of cellsAreShape: the named cells must NOT be `shape`.
function ruleCellsAvoidShape(state, params) {
  const { grid } = state;
  const violations = new Set();
  let allFilled = true;
  for (const i of params.cells) {
    if (!grid[i]) { allFilled = false; continue; }
    if (grid[i].shape === params.shape) violations.add(i);
  }
  return { ok: allFilled && violations.size === 0, violations };
}

// Within params.cells, cells holding params.shape must each have a distinct
// rotation. (Two cells with the same rotation flag both.)
function ruleDistinctRotations(state, params) {
  const { grid } = state;
  const violations = new Set();
  const seen = new Map();
  let allPlaced = true;
  for (const i of params.cells) {
    if (!grid[i]) { allPlaced = false; continue; }
    if (grid[i].shape !== params.shape) continue;
    const r = grid[i].rot;
    if (seen.has(r)) { violations.add(i); violations.add(seen.get(r)); }
    else seen.set(r, i);
  }
  return { ok: allPlaced && violations.size === 0, violations };
}

// Mirror-axis cell partner. 'v' = vertical axis (left-right mirror),
// 'h' = horizontal axis (top-bottom mirror).
function mirrorPartner(i, axis) {
  const r = Math.floor(i / GRID), c = i % GRID;
  if (axis === 'h') return (GRID - 1 - r) * GRID + c;
  return r * GRID + (GRID - 1 - c);
}
// How a piece's rotation transforms under the mirror.
function mirrorRot(rot, axis) {
  if (axis === 'h') return 3 - rot;
  return rot ^ 1;
}

// Mirror symmetry across the given axis.
function ruleSymmetryMirror(state, params) {
  const { grid, colors } = state;
  const axis = params.axis || 'v';
  const violations = new Set();
  for (let i = 0; i < NCELL; i++) {
    const j = mirrorPartner(i, axis);
    if (j <= i) continue;
    const a = grid[i], b = grid[j];
    if (!a || !b) continue;
    let bad = a.shape !== b.shape;
    if (!bad && a.shape !== 'square') bad = mirrorRot(a.rot, axis) !== b.rot;
    if (!bad) {
      for (const part of partsOf(a.shape)) {
        if (colors[i + ':' + part] !== colors[j + ':' + part]) bad = true;
      }
    }
    if (bad) { violations.add(i); violations.add(j); }
  }
  return { ok: filledAll(grid) && violations.size === 0, violations };
}

// No 2×2 region of params.shape.
function ruleNoLargeBlock(state, params) {
  const { grid } = state;
  const violations = new Set();
  for (let r = 0; r < GRID - 1; r++) {
    for (let c = 0; c < GRID - 1; c++) {
      const i = r * GRID + c;
      const a = grid[i], b = grid[i + 1], c2 = grid[i + GRID], d = grid[i + GRID + 1];
      if (!a || !b || !c2 || !d) continue;
      if (a.shape === params.shape && b.shape === params.shape
       && c2.shape === params.shape && d.shape === params.shape) {
        violations.add(i); violations.add(i + 1);
        violations.add(i + GRID); violations.add(i + GRID + 1);
      }
    }
  }
  return { ok: filledAll(grid) && violations.size === 0, violations };
}

// All cells of params.shape form one orthogonally-connected group. Only
// judged once every cell of the shape is placed (uses state.kit).
function ruleConnectedShape(state, params) {
  const { grid } = state;
  const cells = [];
  for (let i = 0; i < NCELL; i++) if (grid[i] && grid[i].shape === params.shape) cells.push(i);
  if (!allShapePlaced(state, params.shape)) return { ok: false, violations: new Set() };
  if (cells.length === 0) return { ok: true, violations: new Set() };
  const set = new Set(cells);
  const visited = new Set([cells[0]]);
  const queue = [cells[0]];
  while (queue.length) {
    const i = queue.shift();
    for (const d of DIRS) {
      const j = neighbor(i, d);
      if (j !== -1 && set.has(j) && !visited.has(j)) { visited.add(j); queue.push(j); }
    }
  }
  if (visited.size === cells.length) return { ok: true, violations: new Set() };
  const violations = new Set();
  for (const i of cells) if (!visited.has(i)) violations.add(i);
  return { ok: false, violations };
}

// Exactly params.count cells of params.shape within params.cells. Over-count
// is always a permanent violation; under-count is only judged once the
// region (or the shape) is fully placed.
function ruleCountShapeInRegion(state, params) {
  const { grid } = state;
  let placedCount = 0;
  let regionFilled = true;
  for (const i of params.cells) {
    if (!grid[i]) { regionFilled = false; continue; }
    if (grid[i].shape === params.shape) placedCount++;
  }
  const violations = new Set();
  if (placedCount > params.count) {
    for (const i of params.cells) if (grid[i] && grid[i].shape === params.shape) violations.add(i);
    return { ok: false, violations };
  }
  const judgable = regionFilled || allShapePlaced(state, params.shape);
  if (judgable && placedCount !== params.count) {
    for (const i of params.cells) violations.add(i);
    return { ok: false, violations };
  }
  return { ok: regionFilled && placedCount === params.count, violations };
}

// Every cell of params.shape has at least one orthogonal neighbour of
// params.adjacentTo. A cell is judged only when all of its on-board
// neighbours are placed.
function ruleMustBeAdjacent(state, params) {
  const { grid } = state;
  const violations = new Set();
  for (let i = 0; i < NCELL; i++) {
    if (!grid[i] || grid[i].shape !== params.shape) continue;
    let hasAdj = false, allNeighbsPlaced = true;
    for (const d of DIRS) {
      const j = neighbor(i, d);
      if (j === -1) continue;
      if (!grid[j]) { allNeighbsPlaced = false; continue; }
      if (grid[j].shape === params.adjacentTo) { hasAdj = true; break; }
    }
    if (!hasAdj && allNeighbsPlaced) violations.add(i);
  }
  const allShapeDown = allShapePlaced(state, params.shape);
  return { ok: allShapeDown && filledAll(grid) && violations.size === 0, violations };
}

// At most params.count distinct fabrics may appear in the solution's colours.
// Monotonic: once more than params.count fabrics are placed, that is a
// permanent violation — adding more cells cannot remove the surplus.
function ruleColourUsesAtMost(state, params) {
  const { grid, colors } = state;
  const used = new Set();
  for (const k in colors) used.add(colors[k]);
  if (used.size <= params.count) {
    return { ok: filledAll(grid) && fullyColoured(state), violations: new Set() };
  }
  const violations = new Set();
  for (let i = 0; i < NCELL; i++) {
    if (!grid[i]) continue;
    for (const part of partsOf(grid[i].shape)) {
      if (colors[i + ':' + part]) { violations.add(i); break; }
    }
  }
  return { ok: false, violations };
}

// Exact color kit: each fabric must appear params.kit[fabric] times in the
// solution, no more, no less. Over-count is a permanent violation; a fabric
// not in the kit is also a permanent violation. Under-count is only judged
// once the board is full and fully coloured.
function ruleColorKitExact(state, params) {
  const { grid, colors } = state;
  const counts = {};
  for (const k in colors) counts[colors[k]] = (counts[colors[k]] || 0) + 1;
  const violations = new Set();
  let anyOver = false;
  for (const k in colors) {
    const fab = colors[k];
    const max = params.kit[fab] || 0;
    if (max === 0 || (counts[fab] || 0) > max) {
      anyOver = true;
      violations.add(parseInt(k.split(':')[0], 10));
    }
  }
  if (anyOver) return { ok: false, violations };
  const fullBoard = filledAll(grid) && fullyColoured(state);
  if (!fullBoard) return { ok: false, violations: new Set() };
  for (const fab in params.kit) {
    if ((counts[fab] || 0) !== params.kit[fab]) {
      return { ok: false, violations: new Set() };
    }
  }
  return { ok: true, violations: new Set() };
}

// Parameterized rotation rule, exactly parallel to cellsAreShape. The named
// cells must each hold a piece rotated to params.rot. Monotonic: a placed
// cell with the wrong rotation is a permanent violation.
function ruleCellsAreRotation(state, params) {
  const { grid } = state;
  const violations = new Set();
  let allFilled = true;
  for (const i of params.cells) {
    if (!grid[i]) { allFilled = false; continue; }
    if (grid[i].rot !== params.rot) violations.add(i);
  }
  return { ok: allFilled && violations.size === 0, violations };
}

const PARAM_RULES = {
  cellsAreShape:      { group: 'structure', fn: ruleCellsAreShape },
  cellsAreRotation:   { group: 'structure', fn: ruleCellsAreRotation },
  noAdjacentShape:    { group: 'structure', fn: ruleNoAdjacentShape },
  cellsAvoidShape:    { group: 'structure', fn: ruleCellsAvoidShape },
  distinctRotations:  { group: 'structure', fn: ruleDistinctRotations },
  symmetryMirror:     { group: 'structure', fn: ruleSymmetryMirror },
  noLargeBlock:       { group: 'structure', fn: ruleNoLargeBlock },
  connectedShape:     { group: 'structure', fn: ruleConnectedShape },
  countShapeInRegion: { group: 'structure', fn: ruleCountShapeInRegion },
  mustBeAdjacent:     { group: 'structure', fn: ruleMustBeAdjacent },
  paletteUsesAtMost:  { group: 'colour',    fn: ruleColourUsesAtMost },
  colorKitExact:      { group: 'colour',    fn: ruleColorKitExact },
};

// ── Rule registry ────────────────────────────────────────────────
const RULES = {
  continuity:        { group: 'structure', label: 'Curves continue across every seam',          fn: ruleContinuity },
  symmetry:          { group: 'structure', label: 'The block has half-turn (180°) symmetry',     fn: ruleSymmetry },
  symmetry4:         { group: 'structure', label: 'The block has 4-fold rotational symmetry',    fn: ruleSymmetry4 },
  cornersTriangles:  { group: 'structure', label: 'Triangles fill the corners — and only there', fn: ruleCornersAreTriangles },
  centreCurves:      { group: 'structure', label: 'The four centre cells are curves',            fn: ruleCentreIsCurves },
  discsUnified:      { group: 'colour',    label: 'Every curve’s disc is the same fabric',        fn: ruleDiscsUnified },
  triangleHues:      { group: 'colour',    label: 'Each triangle’s two halves differ in hue',     fn: ruleTriangleHalvesDifferHue },
  fieldHue:          { group: 'colour',    label: 'Curve background fields stay cool or neutral', fn: ruleFieldHue },
  squaresDiffer:     { group: 'colour',    label: 'No two touching squares share a fabric',       fn: ruleNoAdjacentSquaresSameFabric },
};

// run the rule list; each entry is either a plain key (a fixed rule in
// RULES) or a parameterized instance { rule, ...params, label }.
// returns [{ key, group, label, ok, violations }]
function evaluateAll(state, ruleList) {
  return ruleList.map(entry => {
    if (typeof entry === 'string') {
      const def = RULES[entry];
      if (!def) throw new Error(`Unknown rule key: "${entry}"`);
      const res = def.fn(state);
      return { key: entry, group: def.group, label: def.label, ok: res.ok, violations: res.violations };
    }
    const def = PARAM_RULES[entry.rule];
    if (!def) throw new Error(`Unknown parameterized rule: "${entry.rule}"`);
    const res = def.fn(state, entry);
    return { key: entry.rule, group: def.group, label: entry.label || entry.rule, ok: res.ok, violations: res.violations };
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
    rot90, ruleSymmetry4, ruleNoAdjacentShape,
    ruleCellsAreShape, ruleCellsAreRotation, ruleCellsAvoidShape, ruleDistinctRotations,
    mirrorPartner, mirrorRot, ruleSymmetryMirror, ruleNoLargeBlock,
    ruleConnectedShape, ruleCountShapeInRegion, ruleMustBeAdjacent,
    ruleColourUsesAtMost,
    ruleColorKitExact,
    PARAM_RULES,
    RULES, evaluateAll, isSolved,
  };
}
