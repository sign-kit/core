/**
 * CJS require check for the installed @sign-kit/core package.
 *
 * Run from within the fixture/ directory after `npm install`:
 *   node check-cjs.cjs
 *
 * The .cjs extension forces CommonJS mode regardless of the fixture's
 * package.json "type": "module". Node resolves @sign-kit/core to the
 * "require" condition in its exports map → dist/pdf-sign-kit.cjs.js.
 *
 * Verifies the same exports as the ESM check but through the CJS entry.
 */

'use strict';

const pkg = require('@sign-kit/core');

const expectations = [
  ['FormBuilder', 'object'],
  ['Signer', 'object'],
  ['SignKitBuilder', 'object'],
  ['SignKitSigner', 'object'],
  ['canonicalizeTemplate', 'function'],
  ['computeSha256', 'function'],
  ['computeValuesHash', 'function'],
  ['computePdfHash', 'function'],
];

let failures = 0;

for (const [name, expected] of expectations) {
  const actual = typeof pkg[name];
  if (actual === expected) {
    console.log(`  ✓  ${name}: ${actual}`);
  } else {
    console.error(`  ✗  ${name}: expected "${expected}", got "${actual}"`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`\n  ${failures} CJS export(s) have unexpected types.`);
  process.exit(1);
}

console.log(`\n  All ${expectations.length} CJS exports OK.`);
