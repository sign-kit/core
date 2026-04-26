/**
 * ESM import check for the installed @sign-kit/core package.
 *
 * Run from within the fixture/ directory after `npm install`:
 *   node check-esm.mjs
 *
 * Verifies that all named exports declared in the package's index are
 * importable and have the expected runtime types. Vue SFC components are
 * exported as component-definition objects; utilities are functions.
 *
 * Note: pdfjs-dist is a peer dependency that is only loaded dynamically
 * inside composables when a component mounts — it is intentionally absent
 * from the fixture's dependencies and will not be requested at import time.
 */

import {
  FormBuilder,
  Signer,
  SignKitBuilder,
  SignKitSigner,
  canonicalizeTemplate,
  computeSha256,
  computeValuesHash,
  computePdfHash,
} from '@sign-kit/core';

/**
 * [name, expected typeof] pairs.
 * Vue component definitions are plain objects; utility exports are functions.
 */
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

const values = {
  FormBuilder,
  Signer,
  SignKitBuilder,
  SignKitSigner,
  canonicalizeTemplate,
  computeSha256,
  computeValuesHash,
  computePdfHash,
};

let failures = 0;

for (const [name, expected] of expectations) {
  const actual = typeof values[name];
  if (actual === expected) {
    console.log(`  ✓  ${name}: ${actual}`);
  } else {
    console.error(`  ✗  ${name}: expected "${expected}", got "${actual}"`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`\n  ${failures} ESM export(s) have unexpected types.`);
  process.exit(1);
}

console.log(`\n  All ${expectations.length} ESM exports OK.`);
