'use strict';
// Sampler picross solver — constraint propagation over multiset clues.
// Works on any supported grid size (3,4,5,6,7,8,9); size is taken from clues.size.

const E =
  typeof require !== 'undefined'
    ? require('./sampler-picross.engine.js')
    : (typeof window !== 'undefined' ? window.PicrossEngine : null);

const { SHAPES, DEFAULT_ROT, ROT_COUNT, FABRICS,
        rowOf, colOf, rowCells, colCells, partnerOf, partsOf,
        partnerSymmetry, regionColor } = E;

// Generate every piece option a cell could hold: all (shape, rot) combinations.
function allPieceOptions() {
  const out = [];
  for (const shape of SHAPES) {
    for (let rot = 0; rot < ROT_COUNT[shape]; rot++) {
      out.push({ shape, rot });
    }
  }
  return out;
}
const PIECE_OPTIONS = allPieceOptions();

function countShapeInCells(grid, cellIndices, shape) {
  let n = 0;
  for (const i of cellIndices) if (grid[i] && grid[i].shape === shape) n++;
  return n;
}
function countNonDefaultRotInCells(grid, cellIndices, shape) {
  let n = 0;
  for (const i of cellIndices) {
    const p = grid[i];
    if (p && p.shape === shape && p.rot !== DEFAULT_ROT[shape]) n++;
  }
  return n;
}

function bandShapeFeasible(grid, cellIndices, bandClue) {
  const requiredShapes = bandClue.shape || {};
  for (const s of SHAPES) {
    const have = countShapeInCells(grid, cellIndices, s);
    const want = requiredShapes[s] || 0;
    if (have > want) return false;
  }
  const empties = cellIndices.filter(i => !grid[i]).length;
  let totalNeeded = 0;
  for (const s of SHAPES) {
    const have = countShapeInCells(grid, cellIndices, s);
    const want = requiredShapes[s] || 0;
    if (want < have) return false;
    totalNeeded += (want - have);
  }
  if (totalNeeded > empties) return false;
  return true;
}

function bandRotationFeasible(grid, cellIndices, bandClue) {
  const reqRot = bandClue.rotation || {};
  const reqShapes = bandClue.shape || {};
  for (const s of SHAPES) {
    if (!reqShapes[s]) continue;
    const want = reqRot[s] || 0;
    const haveRotated = countNonDefaultRotInCells(grid, cellIndices, s);
    const haveShape   = countShapeInCells(grid, cellIndices, s);
    const remainingShapeNeeded = reqShapes[s] - haveShape;
    if (haveRotated > want) return false;
    if (haveRotated + remainingShapeNeeded < want) return false;
  }
  return true;
}

function localCheck(grid, clues, i, size) {
  const r = rowOf(i, size), c = colOf(i, size);
  const rowI = rowCells(r, size), colI = colCells(c, size);
  if (!bandShapeFeasible(grid, rowI, clues.rows[r])) return false;
  if (!bandShapeFeasible(grid, colI, clues.cols[c])) return false;
  if (!bandRotationFeasible(grid, rowI, clues.rows[r])) return false;
  if (!bandRotationFeasible(grid, colI, clues.cols[c])) return false;
  return true;
}

function finalCheck(grid, clues, size) {
  for (let r = 0; r < size; r++) {
    const cells = rowCells(r, size);
    const want = clues.rows[r];
    for (const s of SHAPES) {
      const have = countShapeInCells(grid, cells, s);
      const w = want.shape?.[s] || 0;
      if (have !== w) return false;
    }
    for (const s of SHAPES) {
      if (!(want.shape?.[s])) continue;
      const haveRot = countNonDefaultRotInCells(grid, cells, s);
      const wRot = want.rotation?.[s] || 0;
      if (haveRot !== wRot) return false;
    }
  }
  for (let c = 0; c < size; c++) {
    const cells = colCells(c, size);
    const want = clues.cols[c];
    for (const s of SHAPES) {
      const have = countShapeInCells(grid, cells, s);
      const w = want.shape?.[s] || 0;
      if (have !== w) return false;
    }
    for (const s of SHAPES) {
      if (!(want.shape?.[s])) continue;
      const haveRot = countNonDefaultRotInCells(grid, cells, s);
      const wRot = want.rotation?.[s] || 0;
      if (haveRot !== wRot) return false;
    }
  }
  return true;
}

function partnerRot(piece) {
  return partnerSymmetry(piece.shape, piece.rot).rot;
}

function enumeratePieces(clues, givens, maxSolutions, opts) {
  const size = clues.size;
  const N = size * size;
  const halfTurnSym = !!(opts && opts.halfTurnSymmetric);
  const grid = new Array(N).fill(null);
  if (givens) {
    for (const [k, p] of Object.entries(givens)) {
      grid[+k] = { shape: p.shape, rot: p.rot };
    }
  }
  for (let r = 0; r < size; r++) {
    if (!bandShapeFeasible(grid, rowCells(r, size), clues.rows[r])) return [];
    if (!bandRotationFeasible(grid, rowCells(r, size), clues.rows[r])) return [];
  }
  for (let c = 0; c < size; c++) {
    if (!bandShapeFeasible(grid, colCells(c, size), clues.cols[c])) return [];
    if (!bandRotationFeasible(grid, colCells(c, size), clues.cols[c])) return [];
  }

  const results = [];
  function recurse(idx) {
    if (results.length >= maxSolutions) return;
    while (idx < N && grid[idx]) idx++;
    if (idx === N) {
      if (finalCheck(grid, clues, size)) results.push(grid.slice());
      return;
    }
    for (const opt of PIECE_OPTIONS) {
      grid[idx] = opt;
      const j = halfTurnSym ? partnerOf(idx, size) : -1;
      let mirrored = false;
      if (halfTurnSym && j !== idx) {
        if (grid[j] && (grid[j].shape !== opt.shape || grid[j].rot !== partnerRot(opt))) {
          grid[idx] = null;
          continue;
        }
        if (!grid[j]) {
          grid[j] = { shape: opt.shape, rot: partnerRot(opt) };
          mirrored = true;
        }
      }
      if (localCheck(grid, clues, idx, size) && (j === -1 || localCheck(grid, clues, j, size))) {
        recurse(idx + 1);
      }
      if (mirrored) grid[j] = null;
      if (results.length >= maxSolutions) { grid[idx] = null; return; }
      grid[idx] = null;
    }
  }
  recurse(0);
  return results;
}

function enumerateFabrics(pieceGrid, clues, givenFabrics, maxSolutions, opts) {
  const size = clues.size;
  const N = size * size;
  const halfTurnSym = !!(opts && opts.halfTurnSymmetric);
  const regions = [];
  for (let i = 0; i < N; i++) {
    const p = pieceGrid[i];
    for (const part of partsOf(p.shape)) {
      regions.push({ key: `${i}:${part}`, cell: i, part, row: rowOf(i, size), col: colOf(i, size) });
    }
  }
  const allFabrics = new Set();
  for (const band of [...clues.rows, ...clues.cols]) {
    for (const f of Object.keys(band.fabric || {})) allFabrics.add(f);
  }
  const fabricList = [...allFabrics];
  if (fabricList.length === 0) return [{}];

  const assign = Object.create(null);
  if (givenFabrics) Object.assign(assign, givenFabrics);

  const partnerForKey = Object.create(null);
  if (halfTurnSym) {
    for (const reg of regions) {
      const piece = pieceGrid[reg.cell];
      const sym = partnerSymmetry(piece.shape, piece.rot);
      const partnerPart = sym.swap
        ? (reg.part === 'A' ? 'B' : reg.part === 'B' ? 'A' : reg.part)
        : reg.part;
      partnerForKey[reg.key] = `${partnerOf(reg.cell, size)}:${partnerPart}`;
    }
  }

  function countFabricInRow(r, f) {
    let n = 0;
    for (const reg of regions) if (reg.row === r && assign[reg.key] === f) n++;
    return n;
  }
  function countFabricInCol(c, f) {
    let n = 0;
    for (const reg of regions) if (reg.col === c && assign[reg.key] === f) n++;
    return n;
  }
  function feasibleAfter(reg, f) {
    const want = clues.rows[reg.row].fabric || {};
    if (countFabricInRow(reg.row, f) > (want[f] || 0)) return false;
    const wantC = clues.cols[reg.col].fabric || {};
    if (countFabricInCol(reg.col, f) > (wantC[f] || 0)) return false;
    return true;
  }
  function finalFabricCheck() {
    for (let r = 0; r < size; r++) {
      const want = clues.rows[r].fabric || {};
      for (const f of fabricList) {
        if (countFabricInRow(r, f) !== (want[f] || 0)) return false;
      }
    }
    for (let c = 0; c < size; c++) {
      const want = clues.cols[c].fabric || {};
      for (const f of fabricList) {
        if (countFabricInCol(c, f) !== (want[f] || 0)) return false;
      }
    }
    return true;
  }

  const out = [];
  function recurse(idx) {
    if (out.length >= maxSolutions) return;
    while (idx < regions.length && assign[regions[idx].key] != null) idx++;
    if (idx === regions.length) {
      if (finalFabricCheck()) out.push({ ...assign });
      return;
    }
    const reg = regions[idx];
    for (const f of fabricList) {
      assign[reg.key] = f;
      let mirroredKey = null;
      if (halfTurnSym) {
        const pk = partnerForKey[reg.key];
        if (pk && pk !== reg.key) {
          if (assign[pk] != null && assign[pk] !== f) {
            delete assign[reg.key];
            continue;
          }
          if (assign[pk] == null) {
            assign[pk] = f;
            mirroredKey = pk;
          }
        }
      }
      if (feasibleAfter(reg, f)) recurse(idx + 1);
      if (mirroredKey) delete assign[mirroredKey];
      delete assign[reg.key];
      if (out.length >= maxSolutions) return;
    }
  }
  recurse(0);
  return out;
}

function solve(clues, givens, opts) {
  const size = clues.size;
  const N = size * size;
  const pieceGivens = {};
  const fabricGivens = {};
  if (givens) {
    for (const [k, v] of Object.entries(givens)) {
      if (v.shape != null && v.rot != null) pieceGivens[k] = { shape: v.shape, rot: v.rot };
      if (v.regions) {
        for (const [part, f] of Object.entries(v.regions)) {
          // Pattern is decorative; solver works at the color level only.
          fabricGivens[`${k}:${part}`] = regionColor(f);
        }
      }
    }
  }
  const pieceSolutions = enumeratePieces(clues, pieceGivens, 4, opts);
  const targets = [];
  for (const pg of pieceSolutions) {
    const fabricAssignments = enumerateFabrics(pg, clues, fabricGivens, 2, opts);
    for (const fa of fabricAssignments) {
      const target = pg.map((p, i) => {
        const regions = {};
        for (const part of partsOf(p.shape)) regions[part] = fa[`${i}:${part}`];
        return { shape: p.shape, rot: p.rot, regions };
      });
      targets.push(target);
      if (targets.length >= 2) break;
    }
    if (targets.length >= 2) break;
  }
  return { unique: targets.length === 1, solutions: targets };
}

function nextHint(clues, partial) {
  const size = clues.size;
  const N = size * size;
  const pieceGivens = {};
  const fabricGivens = {};
  for (let i = 0; i < N; i++) {
    const p = partial?.[i];
    if (!p) continue;
    if (p.shape != null && p.rot != null) pieceGivens[i] = { shape: p.shape, rot: p.rot };
    if (p.regions) {
      for (const [part, f] of Object.entries(p.regions)) {
        const c = regionColor(f);
        if (c != null) fabricGivens[`${i}:${part}`] = c;
      }
    }
  }
  const { solutions } = solve(clues, {
    ...Object.fromEntries(Object.entries(pieceGivens).map(([k, v]) => [k, {
      ...v,
      regions: Object.fromEntries(
        Object.entries(fabricGivens)
          .filter(([rk]) => rk.startsWith(k + ':'))
          .map(([rk, f]) => [rk.split(':')[1], f])
      ),
    }])),
  });
  if (solutions.length === 0) return null;
  for (let i = 0; i < N; i++) {
    const sol0 = solutions[0][i];
    const knownPiece = pieceGivens[i] != null;
    if (!knownPiece) {
      const allSame = solutions.every(s => s[i].shape === sol0.shape && s[i].rot === sol0.rot);
      if (allSame) return { cell: i, piece: { shape: sol0.shape, rot: sol0.rot } };
    }
    for (const part of partsOf(sol0.shape)) {
      const k = `${i}:${part}`;
      if (fabricGivens[k]) continue;
      const f0 = sol0.regions[part];
      const allSame = solutions.every(s => {
        if (!s[i] || s[i].shape !== sol0.shape) return false;
        return s[i].regions?.[part] === f0;
      });
      if (allSame) return { cell: i, regionPart: part, fabric: f0 };
    }
  }
  return null;
}

const PicrossSolver = { enumeratePieces, enumerateFabrics, solve, nextHint };
if (typeof module !== 'undefined' && module.exports) module.exports = PicrossSolver;
if (typeof window !== 'undefined') window.PicrossSolver = PicrossSolver;
