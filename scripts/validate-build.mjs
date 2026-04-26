#!/usr/bin/env node
/**
 * validate-build.mjs
 *
 * Pre-publish validation script for @sign-kit/core.
 *
 * Phases:
 *   1. Build the library (produces dist/ artifacts).
 *   2. Assert all expected dist files are present.
 *   3. Pack the library into a .tgz tarball via `npm pack`.
 *   4. Install the tarball into an isolated fixture project that has
 *      no workspace aliases — exactly like a real consumer would.
 *   5. Run ESM import checks against the installed package.
 *   6. Run CJS require checks against the installed package.
 *
 * Usage:
 *   node scripts/validate-build.mjs
 *   node scripts/validate-build.mjs --skip-build   # reuse existing dist/
 */

import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, existsSync, rmSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PKG_DIR = join(ROOT, 'packages', 'pdf-sign-kit');
const TMP_PACK = join(ROOT, 'tmp-pack');
const FIXTURE_DIR = join(ROOT, 'fixture');

const skipBuild = process.argv.includes('--skip-build');

let failures = 0;

// ── Helpers ────────────────────────────────────────────────────────────────────

function run(cmd, cwd = ROOT, label = '') {
  console.log(`  $ ${label || cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function pass(msg) {
  console.log(`  ✓  ${msg}`);
}
function fail(msg) {
  console.error(`  ✗  ${msg}`);
  failures++;
}

function section(title) {
  const bar = '─'.repeat(56);
  console.log(`\n${bar}\n  ${title}\n${bar}`);
}

// ── Step 1: Build ──────────────────────────────────────────────────────────────

if (!skipBuild) {
  section('Step 1 · Build @sign-kit/core');
  run('npm run build', PKG_DIR, 'npm run build');
} else {
  section('Step 1 · Build skipped (--skip-build)');
}

// ── Step 2: Assert dist files ──────────────────────────────────────────────────

section('Step 2 · Verify dist artifacts');

const EXPECTED_DIST_FILES = [
  'dist/pdf-sign-kit.es.js',
  'dist/pdf-sign-kit.cjs.js',
  'dist/pdf-sign-kit.wc.iife.js',
  'dist/index.d.ts',
  'dist/styles/index.css',
];

for (const rel of EXPECTED_DIST_FILES) {
  const abs = join(PKG_DIR, rel);
  if (existsSync(abs)) {
    pass(rel);
  } else {
    fail(`Missing dist file: ${rel}`);
  }
}

if (failures > 0) {
  console.error('\n  Dist artifact check failed — aborting.');
  process.exit(1);
}

// ── Step 3: npm pack ───────────────────────────────────────────────────────────

section('Step 3 · Pack tarball');

mkdirSync(TMP_PACK, { recursive: true });

// Remove any stale tarballs from previous runs
readdirSync(TMP_PACK)
  .filter((f) => f.endsWith('.tgz'))
  .forEach((f) => rmSync(join(TMP_PACK, f)));

run(`npm pack --pack-destination "${TMP_PACK}"`, PKG_DIR, 'npm pack');

const tgzName = readdirSync(TMP_PACK).find((f) => f.endsWith('.tgz'));
if (!tgzName) {
  console.error('  npm pack produced no .tgz file — aborting.');
  process.exit(1);
}
pass(`Tarball: ${tgzName}`);

// ── Step 4: Install tarball into isolated fixture ──────────────────────────────

section('Step 4 · Install tarball into isolated fixture');

mkdirSync(FIXTURE_DIR, { recursive: true });

// Remove previous installation so npm always installs the freshly-packed tarball.
const fixtureModules = join(FIXTURE_DIR, 'node_modules');
if (existsSync(fixtureModules)) {
  console.log('  Removing stale fixture/node_modules...');
  rmSync(fixtureModules, { recursive: true, force: true });
}

// Write a fresh package.json pointing at the just-packed tarball.
// This file is gitignored; only the check scripts inside fixture/ are tracked.
writeFileSync(
  join(FIXTURE_DIR, 'package.json'),
  JSON.stringify(
    {
      name: 'sign-kit-validate-fixture',
      private: true,
      type: 'module',
      dependencies: {
        '@sign-kit/core': `file:../tmp-pack/${tgzName}`,
        vue: '^3.4.0',
      },
    },
    null,
    2,
  ) + '\n',
);

run('npm install --no-package-lock', FIXTURE_DIR, 'npm install (fixture)');
pass(`@sign-kit/core installed from ${tgzName}`);

// ── Step 5: ESM import check ───────────────────────────────────────────────────

section('Step 5 · ESM import check');
try {
  run('node check-esm.mjs', FIXTURE_DIR, 'node check-esm.mjs');
  pass('ESM imports resolved');
} catch {
  fail('ESM import check failed (see output above)');
}

// ── Step 6: CJS require check ─────────────────────────────────────────────────

section('Step 6 · CJS require check');
try {
  run('node check-cjs.cjs', FIXTURE_DIR, 'node check-cjs.cjs');
  pass('CJS require resolved');
} catch {
  fail('CJS require check failed (see output above)');
}

// ── Summary ───────────────────────────────────────────────────────────────────

const bar = '═'.repeat(56);
console.log(`\n${bar}`);
if (failures === 0) {
  console.log('  ✓  All checks passed — safe to publish.');
  console.log(`${bar}\n`);
} else {
  console.error(`  ✗  ${failures} check(s) failed — do NOT publish.`);
  console.error(`${bar}\n`);
  process.exit(1);
}
