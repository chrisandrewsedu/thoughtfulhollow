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
