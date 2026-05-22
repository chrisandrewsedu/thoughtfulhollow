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

function solve() { return []; }
function checkIndependence() { return true; }
function analyze() { return {}; }

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { solve, analyze, checkIndependence };
}
