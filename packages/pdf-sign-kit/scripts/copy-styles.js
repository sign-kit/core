#!/usr/bin/env node
/**
 * copy-styles.js
 *
 * Assembles the distributable CSS for @sign-kit/core.
 *
 * Produces two outputs in dist/styles/:
 *
 *   index.css  — fully inlined, import-free stylesheet that consumers can
 *                drop-in with a single `import '@sign-kit/core/styles.css'`.
 *                Contains: design tokens + base UI styles + compiled Vue SFC
 *                component styles (from Vite's dist/style.css).
 *
 *   *.css      — the individual source style files (tokens, base, etc.)
 *                for consumers who want to import selectively.
 *
 * The inlined approach avoids @import resolution problems when the CSS is
 * loaded from inside node_modules by various bundler configurations.
 *
 * Web-component builds are NOT affected: the WC bundle inlines its own
 * styles via ?inline imports in register.ts.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcStyles = path.join(root, 'src', 'styles');
const destStyles = path.join(root, 'dist', 'styles');
// Vite lib build extracts Vue SFC <style> blocks here:
const viteCss = path.join(root, 'dist', 'style.css');

// Order matters: tokens must be first so variables are defined before use.
const STYLE_FILES_IN_ORDER = [
  'tokens.css',
  'base.css',
  'buttons.css',
  'forms.css',
  'panels.css',
  'overlays.css',
];

async function copyDir(srcDir, destDir) {
  await fs.promises.mkdir(destDir, { recursive: true });
  const entries = await fs.promises.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

async function buildInlinedIndex() {
  const parts = [];

  // 1. Inline each base style file in order (no @import statements)
  for (const file of STYLE_FILES_IN_ORDER) {
    const filePath = path.join(srcStyles, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: source style file not found: ${file}`);
      continue;
    }
    const content = await fs.promises.readFile(filePath, 'utf-8');
    // Strip any @import lines — we are inlining everything ourselves.
    const stripped = content.replace(/@import\s+['"'][^'"]+['"]\s*;?\s*/g, '');
    parts.push(`/* ${file} */\n${stripped}`);
  }

  // 2. Append Vite's extracted Vue SFC component styles
  if (fs.existsSync(viteCss)) {
    const componentCss = await fs.promises.readFile(viteCss, 'utf-8');
    parts.push('/* Component styles (compiled from Vue SFC <style> blocks) */\n' + componentCss);
  } else {
    console.warn('Warning: dist/style.css not found — component styles will not be included.');
  }

  const inlined = parts.join('\n\n');
  const indexPath = path.join(destStyles, 'index.css');
  await fs.promises.writeFile(indexPath, inlined, 'utf-8');
  console.log(`Wrote inlined dist/styles/index.css (${(inlined.length / 1024).toFixed(1)} kB)`);
}

(async () => {
  try {
    await fs.promises.mkdir(destStyles, { recursive: true });
    // Copy individual files (for selective import use-cases)
    await copyDir(srcStyles, destStyles);
    // Overwrite index.css with the fully-inlined version
    await buildInlinedIndex();
    console.log('Copied styles to', destStyles);
  } catch (err) {
    console.error('Failed to copy styles:', err);
    process.exit(1);
  }
})();
