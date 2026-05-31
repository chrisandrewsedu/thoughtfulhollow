#!/usr/bin/env node
// Usage: node scripts/generate-admin-hash.js <password>
// Prints the SHA-256 hash to paste into admin-auth.js

const crypto = require('crypto');
const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/generate-admin-hash.js <password>');
  process.exit(1);
}

const hash = crypto.createHash('sha256').update(password, 'utf8').digest('hex');
console.log(hash);
console.log('\nPaste this value into admin-auth.js as the HASH constant.');
