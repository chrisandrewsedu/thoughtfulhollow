#!/usr/bin/env node
'use strict';
// Local-only library server for sampler-picross authoring.
//
//   GET    /library           → full JSON
//   GET    /library/:id       → one design
//   POST   /library           → upsert a design (body = JSON design or {design})
//   DELETE /library/:id       → remove a design
//
// Binds to 127.0.0.1 only — this is a dev tool, never deployed.
//
// Usage:  npm run library-server
//         (defaults to port 4320; pass PORT=… to override)

const http = require('http');
const fs   = require('fs');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = parseInt(process.env.PORT || '4320', 10);
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_FILE = path.join(ROOT, 'sampler-picross.templates.json');
let FILE = process.env.LIBRARY_FILE || DEFAULT_FILE;

const SUPPORTED_DIFFICULTIES = ['mon-tue', 'wed-th', 'fri-sat', 'sun'];
const SUPPORTED_SIZES = [3, 4, 5, 6, 8];

function backfillCreatedAt(design) {
  if (design.createdAt) return design;
  // Legacy dated designs: synthesize from date so the sort key is stable.
  // Undated legacy designs (shouldn't exist in v2 data, but defensive):
  // pin to epoch so they sort to the start.
  const synth = design.date && ISO_DATE.test(design.date)
    ? `${design.date}T00:00:00.000Z`
    : '1970-01-01T00:00:00.000Z';
  return { ...design, createdAt: synth };
}

function readLibrary() {
  const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  raw.designs = (raw.designs || []).map(backfillCreatedAt);
  return raw;
}
function writeLibrary(lib) {
  fs.writeFileSync(FILE, JSON.stringify(lib, null, 2) + '\n');
}

function slugify(name) {
  return String(name).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'untitled';
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function validateDesign(d) {
  if (!d || typeof d !== 'object') return 'design must be an object';
  if (!d.name || typeof d.name !== 'string') return 'name is required';
  if (!d.author || typeof d.author !== 'string') return 'author is required';
  if (typeof d.date !== 'string') return 'date must be a string';
  if (d.date !== '' && !ISO_DATE.test(d.date)) {
    return 'date must be YYYY-MM-DD or empty string for backlog';
  }
  if (!SUPPORTED_DIFFICULTIES.includes(d.difficulty)) {
    return `difficulty must be one of ${SUPPORTED_DIFFICULTIES.join(', ')}`;
  }
  if (!Array.isArray(d.target)) return 'target must be an array';
  const n = Math.round(Math.sqrt(d.target.length));
  if (n * n !== d.target.length || !SUPPORTED_SIZES.includes(n)) {
    return 'target length must be a square of a supported size (3,4,5,6,8)';
  }
  for (let i = 0; i < d.target.length; i++) {
    const cell = d.target[i];
    if (!cell || typeof cell !== 'object') return `cell ${i}: missing`;
    if (!['square', 'triangle', 'curve'].includes(cell.shape)) {
      return `cell ${i}: bad shape '${cell.shape}'`;
    }
    if (typeof cell.rot !== 'number') return `cell ${i}: rot must be number`;
    if (!cell.regions || typeof cell.regions !== 'object') {
      return `cell ${i}: regions missing`;
    }
  }
  return null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', c => { buf += c; if (buf.length > 1e6) reject(new Error('payload too large')); });
    req.on('end', () => resolve(buf));
    req.on('error', reject);
  });
}

function json(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return json(res, 204, {});

    const url = new URL(req.url, `http://${HOST}:${PORT}`);
    const m = url.pathname.match(/^\/library(?:\/([^/]+))?$/);
    if (!m) return json(res, 404, { error: 'not found' });
    const id = m[1] ? decodeURIComponent(m[1]) : null;

    if (req.method === 'GET') {
      const lib = readLibrary();
      if (!id) return json(res, 200, lib);
      const d = lib.designs.find(x => x.id === id);
      if (!d) return json(res, 404, { error: 'design not found' });
      return json(res, 200, d);
    }

    if (req.method === 'POST' && !id) {
      const raw = await readBody(req);
      let payload;
      try { payload = JSON.parse(raw); }
      catch { return json(res, 400, { error: 'invalid JSON' }); }
      const design = payload.design || payload;
      const err = validateDesign(design);
      if (err) return json(res, 400, { error: err });

      // Generate / preserve id from the name.
      const lib = readLibrary();
      const designId = design.id || slugify(design.name);
      const existingIdx = lib.designs.findIndex(x => x.id === designId);
      // Refuse if a *different* design already claims the same date.
      if (design.date !== '') {
        const dateConflictIdx = lib.designs.findIndex(x => x.date === design.date && x.id !== designId);
        if (dateConflictIdx >= 0) {
          return json(res, 409, {
            error: `date ${design.date} already used by '${lib.designs[dateConflictIdx].id}'`,
            conflict: lib.designs[dateConflictIdx],
          });
        }
      }
      const existing = existingIdx >= 0 ? lib.designs[existingIdx] : null;
      const stored = {
        id: designId,
        name: design.name,
        author: design.author,
        difficulty: design.difficulty,
        date: design.date,
        notes: design.notes || '',
        createdAt: existing?.createdAt || new Date().toISOString(),
        target: design.target,
      };
      if (existingIdx >= 0) lib.designs[existingIdx] = stored;
      else                  lib.designs.push(stored);
      // Keep the file sorted by date for tidy diffs.
      lib.designs.sort((a, b) => a.date.localeCompare(b.date));
      writeLibrary(lib);
      return json(res, 200, { ok: true, design: stored, replaced: existingIdx >= 0 });
    }

    if (req.method === 'DELETE' && id) {
      const lib = readLibrary();
      const idx = lib.designs.findIndex(x => x.id === id);
      if (idx < 0) return json(res, 404, { error: 'design not found' });
      const [removed] = lib.designs.splice(idx, 1);
      writeLibrary(lib);
      return json(res, 200, { ok: true, removed });
    }

    json(res, 405, { error: 'method not allowed' });
  } catch (e) {
    json(res, 500, { error: e.message });
  }
});

function start({ port = PORT, host = HOST, file } = {}) {
  if (file) FILE = file;
  return new Promise((resolve) => {
    server.listen(port, host, () => resolve(server));
  });
}

if (require.main === module) {
  start().then(() => {
    console.log(`picross library server listening on http://${HOST}:${PORT}`);
    console.log(`  GET    /library           → ${FILE}`);
    console.log(`  GET    /library/:id`);
    console.log(`  POST   /library           (body: design or { design })`);
    console.log(`  DELETE /library/:id`);
  });
}

module.exports = {
  validateDesign,
  slugify,
  backfillCreatedAt,
  start,
  server,
  ISO_DATE,
  SUPPORTED_DIFFICULTIES,
  SUPPORTED_SIZES,
};
