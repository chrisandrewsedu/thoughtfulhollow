#!/usr/bin/env node
'use strict';
//
// Glossari vetting + editing server.
//
//   GET    /glossari.json                              → serve glossari.json
//   PUT    /api/themes/:idx/tiers/:tier/sets/:setIdx  → update one word set
//   PUT    /api/practice/:tier/:groupIdx/sets/:setIdx → update one practice set
//   GET    /api/words/search?q=...                    → proxy Datamuse (word discovery)
//   GET    /api/words/:word                           → proxy Free Dictionary API
//   GET    /*                                         → static files from repo root
//
// Usage:  npm run glossari-server
//         Binds to 127.0.0.1:4321 by default. Override with PORT / HOST env.

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = parseInt(process.env.PORT || '4321', 10);
const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'glossari.json');

const VALID_TIERS = ['easy', 'medium', 'hard'];
const VALID_TYPES = ['definition', 'synonym', 'antonym', 'example'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// ── data helpers ─────────────────────────────────────────────────────────────

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n');
}

function validateSet(s) {
  if (!s || typeof s !== 'object') return 'set must be an object';
  if (!VALID_TYPES.includes(s.type)) return `type must be one of: ${VALID_TYPES.join(', ')}`;
  if (typeof s.clue !== 'string' || !s.clue.trim()) return 'clue is required';
  if (!Array.isArray(s.parts) || s.parts.length !== 3) return 'parts must be an array of exactly 3 strings';
  if (s.parts.some(p => typeof p !== 'string' || !p.trim())) return 'each part must be a non-empty string';
  if (typeof s.pos !== 'string' || !s.pos.trim()) return 'pos is required';
  return null;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(payload);
}

function err(res, status, msg) {
  json(res, status, { error: msg });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(new Error('invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function fetchExternal(targetUrl) {
  return new Promise((resolve, reject) => {
    https.get(targetUrl, { headers: { 'User-Agent': 'glossari-admin/1.0' } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString('utf8')) });
        } catch (e) {
          resolve({ status: res.statusCode, body: null });
        }
      });
    }).on('error', reject);
  });
}

function serveStatic(res, filePath) {
  fs.readFile(filePath, (readErr, data) => {
    if (readErr) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

// ── route handlers ────────────────────────────────────────────────────────────

async function handlePutThemeSet(res, parts) {
  const [, , themeIdx, , tier, , setIdx] = parts;
  const tIdx = parseInt(themeIdx, 10);
  const sIdx = parseInt(setIdx, 10);

  if (!VALID_TIERS.includes(tier)) return err(res, 400, 'invalid tier');

  let body;
  try { body = await readBody(arguments[0]); } catch (e) { return err(res, 400, e.message); }
  // arguments[0] is req — see caller passing req below

  const validErr = validateSet(body);
  if (validErr) return err(res, 400, validErr);

  const data = readData();
  if (tIdx < 0 || tIdx >= data.themes.length) return err(res, 404, 'theme not found');
  const theme = data.themes[tIdx];
  if (!theme.tiers || !theme.tiers[tier]) return err(res, 404, 'tier not found');
  if (sIdx < 0 || sIdx >= theme.tiers[tier].sets.length) return err(res, 404, 'set not found');

  const existing = theme.tiers[tier].sets[sIdx];
  theme.tiers[tier].sets[sIdx] = { ...existing, ...body };
  writeData(data);
  json(res, 200, { ok: true });
}

async function handlePutPracticeSet(res, segments) {
  const [, , tier, groupIdx, , setIdx] = segments;
  const gIdx = parseInt(groupIdx, 10);
  const sIdx = parseInt(setIdx, 10);

  if (!VALID_TIERS.includes(tier)) return err(res, 400, 'invalid tier');

  let body;
  try { body = await readBody(arguments[0]); } catch (e) { return err(res, 400, e.message); }

  const validErr = validateSet(body);
  if (validErr) return err(res, 400, validErr);

  const data = readData();
  const group = (data.practice[tier] || [])[gIdx];
  if (!group) return err(res, 404, 'practice group not found');
  if (sIdx < 0 || sIdx >= group.sets.length) return err(res, 404, 'set not found');

  const existing = group.sets[sIdx];
  group.sets[sIdx] = { ...existing, ...body };
  writeData(data);
  json(res, 200, { ok: true });
}

async function handleWordSearch(res, query) {
  if (!query) return err(res, 400, 'q is required');
  try {
    const apiUrl = `https://api.datamuse.com/words?ml=${encodeURIComponent(query)}&max=20&md=d`;
    const { status, body } = await fetchExternal(apiUrl);
    if (status !== 200 || !body) return err(res, 502, 'upstream error');
    // Return word + first definition if available
    const results = body.map(item => ({
      word: item.word,
      score: item.score,
      def: item.defs ? item.defs[0].replace(/^[^:]+:\s*/, '') : null,
    }));
    json(res, 200, results);
  } catch (e) {
    err(res, 502, 'could not reach Datamuse API');
  }
}

async function handleWordDetails(res, word) {
  try {
    const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const { status, body } = await fetchExternal(apiUrl);
    if (status === 404 || !body || !Array.isArray(body) || body.length === 0) {
      return json(res, 200, { word, found: false });
    }
    // Extract first entry
    const entry = body[0];
    const meanings = entry.meanings || [];
    let definition = null, pos = null, synonyms = [], antonyms = [], example = null;
    for (const m of meanings) {
      if (!pos) pos = m.partOfSpeech;
      for (const def of (m.definitions || [])) {
        if (!definition) definition = def.definition;
        if (!example && def.example) example = def.example;
        synonyms.push(...(def.synonyms || []));
        antonyms.push(...(def.antonyms || []));
      }
      synonyms.push(...(m.synonyms || []));
      antonyms.push(...(m.antonyms || []));
    }
    json(res, 200, {
      word,
      found: true,
      pos: pos || '',
      definition: definition || '',
      synonyms: [...new Set(synonyms)].slice(0, 10).join(', '),
      antonyms: [...new Set(antonyms)].slice(0, 10).join(', '),
      example: example || '',
    });
  } catch (e) {
    err(res, 502, 'could not reach Free Dictionary API');
  }
}

// ── main router ───────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method.toUpperCase();

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  // GET /glossari.json
  if (method === 'GET' && pathname === '/glossari.json') {
    return serveStatic(res, DATA_FILE);
  }

  // GET /api/words/search?q=...
  if (method === 'GET' && pathname === '/api/words/search') {
    return handleWordSearch(res, parsed.query.q);
  }

  // GET /api/words/:word
  const wordMatch = pathname.match(/^\/api\/words\/([^/]+)$/);
  if (method === 'GET' && wordMatch) {
    return handleWordDetails(res, decodeURIComponent(wordMatch[1]));
  }

  // PUT /api/themes/:idx/tiers/:tier/sets/:setIdx
  const themeSetMatch = pathname.match(/^\/api\/themes\/(\d+)\/tiers\/(\w+)\/sets\/(\d+)$/);
  if (method === 'PUT' && themeSetMatch) {
    const [, tIdx, tier, sIdx] = themeSetMatch;
    let body;
    try { body = await readBody(req); } catch (e) { return err(res, 400, e.message); }
    const validErr = validateSet(body);
    if (validErr) return err(res, 400, validErr);
    if (!VALID_TIERS.includes(tier)) return err(res, 400, 'invalid tier');
    const data = readData();
    const tI = parseInt(tIdx, 10), sI = parseInt(sIdx, 10);
    if (tI < 0 || tI >= data.themes.length) return err(res, 404, 'theme not found');
    const th = data.themes[tI];
    if (!th.tiers || !th.tiers[tier]) return err(res, 404, 'tier not found');
    if (sI < 0 || sI >= th.tiers[tier].sets.length) return err(res, 404, 'set not found');
    th.tiers[tier].sets[sI] = { ...th.tiers[tier].sets[sI], ...body };
    writeData(data);
    return json(res, 200, { ok: true });
  }

  // PUT /api/practice/:tier/:groupIdx/sets/:setIdx
  const practiceSetMatch = pathname.match(/^\/api\/practice\/(\w+)\/(\d+)\/sets\/(\d+)$/);
  if (method === 'PUT' && practiceSetMatch) {
    const [, tier, gIdx, sIdx] = practiceSetMatch;
    let body;
    try { body = await readBody(req); } catch (e) { return err(res, 400, e.message); }
    const validErr = validateSet(body);
    if (validErr) return err(res, 400, validErr);
    if (!VALID_TIERS.includes(tier)) return err(res, 400, 'invalid tier');
    const data = readData();
    const gI = parseInt(gIdx, 10), sI = parseInt(sIdx, 10);
    const group = (data.practice[tier] || [])[gI];
    if (!group) return err(res, 404, 'practice group not found');
    if (sI < 0 || sI >= group.sets.length) return err(res, 404, 'set not found');
    group.sets[sI] = { ...group.sets[sI], ...body };
    writeData(data);
    return json(res, 200, { ok: true });
  }

  // Static fallback
  if (method === 'GET') {
    const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    let filePath = path.join(ROOT, safePath);
    // Default index
    if (safePath === '/' || safePath === '') filePath = path.join(ROOT, 'index.html');
    return serveStatic(res, filePath);
  }

  err(res, 405, 'method not allowed');
});

server.listen(PORT, HOST, () => {
  console.log(`Glossari server running at http://${HOST}:${PORT}`);
  console.log(`  Admin: http://${HOST}:${PORT}/admin/glossari-admin.html`);
  console.log(`  Editor: http://${HOST}:${PORT}/admin/glossari-vet.html`);
});
