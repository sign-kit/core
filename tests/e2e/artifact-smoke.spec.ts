/**
 * Artifact smoke tests — validate the *built* dist/ bundles directly without
 * relying on the demo dev-server or workspace source aliases.
 *
 * These tests are intentionally separate from the main e2e suite so they
 * can be run on their own to verify pre-publish correctness:
 *
 *   npx playwright test tests/e2e/artifact-smoke.spec.ts
 *
 * Pre-requisites (run once before this spec):
 *   npm --workspace=@signkit/core run build
 *
 * The tests skip gracefully when dist/ artifacts are absent so that CI
 * runs focused on other specs are not blocked.
 */

import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const DIST = resolve(__dirname, '../../packages/pdf-sign-kit/dist');
const WC_BUNDLE = resolve(DIST, 'pdf-sign-kit.wc.iife.js');
const ESM_BUNDLE = resolve(DIST, 'pdf-sign-kit.es.js');
const CJS_BUNDLE = resolve(DIST, 'pdf-sign-kit.cjs.js');
const TYPES_FILE = resolve(DIST, 'index.d.ts');
const CSS_FILE = resolve(DIST, 'styles/index.css');

// ── Dist file presence ─────────────────────────────────────────────────────────

test.describe('artifact: dist file presence', () => {
  const expectedFiles: [string, string][] = [
    ['ESM bundle', ESM_BUNDLE],
    ['CJS bundle', CJS_BUNDLE],
    ['WC IIFE bundle', WC_BUNDLE],
    ['TypeScript types', TYPES_FILE],
    ['CSS styles', CSS_FILE],
  ];

  for (const [label, filePath] of expectedFiles) {
    test(`${label} exists`, () => {
      expect(existsSync(filePath), `Expected dist file not found:\n  ${filePath}`).toBe(true);
    });
  }
});

// ── ESM bundle static analysis ─────────────────────────────────────────────────

test.describe('artifact: ESM bundle shape', () => {
  test('ESM bundle exports key named symbols', () => {
    test.skip(!existsSync(ESM_BUNDLE), 'ESM bundle not built — run: npm run build');

    const content = readFileSync(ESM_BUNDLE, 'utf-8');

    const expectedExports = [
      'FormBuilder',
      'Signer',
      'canonicalizeTemplate',
      'computeSha256',
      'computeValuesHash',
    ];

    for (const name of expectedExports) {
      expect(content, `Named export '${name}' not found in ESM bundle`).toContain(name);
    }
  });

  test('ESM bundle does not bundle vue (vue must be external)', () => {
    test.skip(!existsSync(ESM_BUNDLE), 'ESM bundle not built — run: npm run build');

    const content = readFileSync(ESM_BUNDLE, 'utf-8');

    // The bundle must import vue, not inline it. The vue runtime core is
    // ~100 KB; if it appears inlined the externals configuration broke.
    // A reliable signal is that "createApp" from vue internals is NOT
    // present as a function definition in the bundle.
    expect(
      content,
      'vue appears to be bundled — check rollupOptions.external in vite.lib.config.ts',
    ).not.toMatch(/function\s+createApp\s*\(/);
  });
});

// ── CJS bundle static analysis ─────────────────────────────────────────────────

test.describe('artifact: CJS bundle shape', () => {
  test('CJS bundle has CommonJS wrapper', () => {
    test.skip(!existsSync(CJS_BUNDLE), 'CJS bundle not built — run: npm run build');

    const content = readFileSync(CJS_BUNDLE, 'utf-8');

    expect(content, "CJS bundle missing 'use strict'").toMatch(/['"]use strict['"]/);
    expect(content, 'CJS bundle missing exports assignments').toMatch(/exports\./);
  });
});

// ── TypeScript declarations ────────────────────────────────────────────────────

test.describe('artifact: TypeScript declarations', () => {
  test('index.d.ts re-exports components and utilities', () => {
    test.skip(!existsSync(TYPES_FILE), 'Types not generated — run: npm run build:types');

    const content = readFileSync(TYPES_FILE, 'utf-8');

    // index.d.ts uses re-export syntax — the actual type names live in types.d.ts.
    // Check that the index barrel file re-exports from the correct source files.
    const expectedReExports = ['FormBuilder', 'Signer', 'canonicalizeTemplate', 'computeSha256'];

    for (const name of expectedReExports) {
      expect(content, `Re-export '${name}' not found in dist/index.d.ts`).toContain(name);
    }
  });

  test('types.d.ts declares Manifest and FieldBase interfaces', () => {
    const typesDts = resolve(DIST, 'types.d.ts');
    test.skip(!existsSync(typesDts), 'types.d.ts not generated — run: npm run build:types');

    const content = readFileSync(typesDts, 'utf-8');

    const expectedDeclarations = ['Manifest', 'FieldBase', 'Template', 'Field'];
    for (const name of expectedDeclarations) {
      expect(content, `Type declaration '${name}' not found in dist/types.d.ts`).toContain(name);
    }
  });
});

// ── Web-component bundle: browser registration ─────────────────────────────────

test.describe('artifact: web-component bundle (browser)', () => {
  test('WC bundle registers pdf-form-builder and pdf-form-signer', async ({ page }) => {
    test.skip(!existsSync(WC_BUNDLE), 'WC bundle not built — run: npm run build:wc');

    const wcScript = readFileSync(WC_BUNDLE, 'utf-8');

    await page.goto('about:blank');
    await page.setContent('<!DOCTYPE html><html><body></body></html>');
    await page.addScriptTag({ content: wcScript });

    const builderDefined = await page.evaluate(() => !!customElements.get('pdf-form-builder'));
    const signerDefined = await page.evaluate(() => !!customElements.get('pdf-form-signer'));

    expect(builderDefined, 'pdf-form-builder custom element was not registered').toBe(true);
    expect(signerDefined, 'pdf-form-signer custom element was not registered').toBe(true);
  });

  test('WC bundle does not throw runtime errors on element creation', async ({ page }) => {
    test.skip(!existsSync(WC_BUNDLE), 'WC bundle not built — run: npm run build:wc');

    const wcScript = readFileSync(WC_BUNDLE, 'utf-8');
    const runtimeErrors: string[] = [];

    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('about:blank');
    await page.setContent('<!DOCTYPE html><html><body></body></html>');
    await page.addScriptTag({ content: wcScript });

    // Instantiate both elements and attach them to the DOM
    await page.evaluate(() => {
      const builder = document.createElement('pdf-form-builder');
      const signer = document.createElement('pdf-form-signer');
      document.body.appendChild(builder);
      document.body.appendChild(signer);
    });

    // Allow brief async init tasks (Vue reactivity, Shadow DOM setup) to settle
    await page.waitForTimeout(500);

    // Filter out known benign browser noise unrelated to the bundle
    const significant = runtimeErrors.filter((e) => !/ResizeObserver|non-passive event/i.test(e));

    expect(
      significant,
      `Unexpected runtime errors after WC element creation:\n${significant.join('\n')}`,
    ).toHaveLength(0);
  });

  test('WC custom elements have shadow roots after attachment', async ({ page }) => {
    test.skip(!existsSync(WC_BUNDLE), 'WC bundle not built — run: npm run build:wc');

    const wcScript = readFileSync(WC_BUNDLE, 'utf-8');

    await page.goto('about:blank');
    await page.setContent('<!DOCTYPE html><html><body></body></html>');
    await page.addScriptTag({ content: wcScript });

    await page.evaluate(() => {
      const builder = document.createElement('pdf-form-builder');
      const signer = document.createElement('pdf-form-signer');
      document.body.appendChild(builder);
      document.body.appendChild(signer);
    });

    await page.waitForTimeout(300);

    const [builderHasShadow, signerHasShadow] = await page.evaluate(() => [
      !!document.querySelector('pdf-form-builder')?.shadowRoot,
      !!document.querySelector('pdf-form-signer')?.shadowRoot,
    ]);

    expect(builderHasShadow, 'pdf-form-builder has no shadow root').toBe(true);
    expect(signerHasShadow, 'pdf-form-signer has no shadow root').toBe(true);
  });
});
