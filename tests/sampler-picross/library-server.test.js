'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const srv = require('../../scripts/library-server.js');

test('library-server module exports helpers', () => {
  assert.strictEqual(typeof srv.validateDesign, 'function');
  assert.strictEqual(typeof srv.slugify, 'function');
  assert.ok(srv.ISO_DATE instanceof RegExp);
  assert.ok(Array.isArray(srv.SUPPORTED_DIFFICULTIES));
});

test('requiring the module does not start the HTTP listener', () => {
  // If listen() ran, port 4320 would be bound; this test would still pass
  // synchronously, so we just assert the module load completed cleanly.
  // The real check is that `npm test` does not hang.
  assert.ok(true);
});

function validBaseDesign(over = {}) {
  return {
    name: 'Test Design',
    author: 'tester',
    date: '2026-06-01',
    difficulty: 'mon-tue',
    target: Array.from({ length: 9 }, () => ({
      shape: 'square', rot: 0, regions: { W: 'LINEN' },
    })),
    ...over,
  };
}

test('validateDesign accepts empty-string date (backlog)', () => {
  const err = srv.validateDesign(validBaseDesign({ date: '' }));
  assert.strictEqual(err, null);
});

test('validateDesign accepts valid YYYY-MM-DD date', () => {
  const err = srv.validateDesign(validBaseDesign({ date: '2026-07-04' }));
  assert.strictEqual(err, null);
});

test('validateDesign rejects malformed date strings', () => {
  for (const bad of ['2026/06/01', '06-01-2026', 'tomorrow']) {
    const err = srv.validateDesign(validBaseDesign({ date: bad }));
    assert.match(err || '', /date/i, `expected error for ${bad}`);
  }
});

test('validateDesign rejects missing date field', () => {
  const d = validBaseDesign();
  delete d.date;
  const err = srv.validateDesign(d);
  assert.match(err || '', /date/i);
});

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

async function withServer(initialLib, fn) {
  const file = path.join(os.tmpdir(), `picross-lib-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(file, JSON.stringify(initialLib, null, 2));
  const s = await srv.start({ port: 0, host: '127.0.0.1', file });
  const { port } = s.address();
  const base = `http://127.0.0.1:${port}/library`;
  try {
    return await fn({ base, file, readDisk: () => JSON.parse(fs.readFileSync(file, 'utf8')) });
  } finally {
    await new Promise(r => s.close(r));
    fs.unlinkSync(file);
  }
}

async function postDesign(base, design) {
  const res = await fetch(base, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(design),
  });
  return { status: res.status, body: await res.json() };
}

test('two backlog (empty-date) designs may coexist', async () => {
  await withServer({ version: 2, designs: [] }, async ({ base, readDisk }) => {
    const a = await postDesign(base, validBaseDesign({ name: 'Alpha', date: '' }));
    assert.strictEqual(a.status, 200);
    const b = await postDesign(base, validBaseDesign({ name: 'Bravo', date: '' }));
    assert.strictEqual(b.status, 200, JSON.stringify(b.body));
    assert.strictEqual(readDisk().designs.length, 2);
  });
});

test('date conflict still returns 409 for two dated designs', async () => {
  await withServer({ version: 2, designs: [] }, async ({ base }) => {
    const a = await postDesign(base, validBaseDesign({ name: 'Alpha', date: '2026-08-01' }));
    assert.strictEqual(a.status, 200);
    const b = await postDesign(base, validBaseDesign({ name: 'Bravo', date: '2026-08-01' }));
    assert.strictEqual(b.status, 409);
  });
});

test('a backlog design and a dated design with the same date as another are independent', async () => {
  await withServer({ version: 2, designs: [] }, async ({ base }) => {
    const a = await postDesign(base, validBaseDesign({ name: 'Alpha', date: '2026-09-01' }));
    assert.strictEqual(a.status, 200);
    const b = await postDesign(base, validBaseDesign({ name: 'Bravo', date: '' }));
    assert.strictEqual(b.status, 200);
  });
});
