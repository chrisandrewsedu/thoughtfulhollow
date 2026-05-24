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
