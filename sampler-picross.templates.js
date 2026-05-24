'use strict';
// Sampler picross templates — thin wrapper around the JSON library.
//
// The single source of truth is sampler-picross.templates.json. Authoring
// happens through the local library server, which mutates that file; the
// inliner script embeds the JSON into the HTML for production builds.
//
// In Node we read the JSON from disk. In the browser the inliner replaces
// this whole block with a literal `__LIBRARY__` constant assigned from the
// embedded JSON. See scripts/inline-picross.js.

let LIBRARY;
if (typeof require !== 'undefined') {
  LIBRARY = require('./sampler-picross.templates.json');
} else if (typeof window !== 'undefined' && window.__PICROSS_LIBRARY__) {
  LIBRARY = window.__PICROSS_LIBRARY__;
} else {
  LIBRARY = { version: 1, designs: [] };
}

const TARGETS = LIBRARY.designs.map(d => ({
  id: d.id,
  name: d.name,
  difficulty: d.difficulty,
  notes: d.notes,
  target: d.target,
}));

const PicrossTargets = { TARGETS, LIBRARY };

if (typeof module !== 'undefined' && module.exports) module.exports = PicrossTargets;
if (typeof window !== 'undefined') window.PicrossTargets = PicrossTargets;
