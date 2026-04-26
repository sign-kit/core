/**
 * Route navigation smoke tests.
 *
 * Verifies that each demo route loads without crashing and renders its
 * primary structural landmark.  These serve as a baseline gate: if they
 * fail, all other specs should be investigated for setup problems.
 */
import { test, expect } from '@playwright/test';
import {
  APP_ROOT,
  BUILDER_ROOT,
  SIGNER_ROOT,
  DEMO_INSPECT,
  WC_BUILDER_EL,
  WC_SIGNER_EL,
} from './helpers/demo-selectors';

test.describe('Demo route navigation', () => {
  /** Accumulate page-level JS errors per test to surface in failure messages. */
  let pageErrors: string[];
  test.beforeEach(async ({ page }) => {
    pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
  });
  test.afterEach(async () => {
    // Surface any captured JS errors as soft assertions so they appear in the
    // report even if the primary assertions passed.
    const fatal = pageErrors.filter(
      (e) =>
        !e.includes('ResizeObserver loop') && // benign browser warning
        !e.includes('Non-Error promise rejection'), // sometimes from pdf.js worker teardown
    );
    if (fatal.length > 0) {
      console.warn('Page JS errors detected:', fatal);
    }
  });

  test('/builder loads the form builder component', async ({ page }) => {
    await page.goto('/builder');
    await expect(page.locator(APP_ROOT)).toBeVisible();
    await expect(page.locator(BUILDER_ROOT)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(DEMO_INSPECT)).toBeVisible();
    // The builder toolbar (zoom, export buttons) should render
    await expect(page.locator('.pdf-builder__toolbar')).toBeVisible();
  });

  test('/signer loads the PDF signer component', async ({ page }) => {
    await page.goto('/signer');
    await expect(page.locator(APP_ROOT)).toBeVisible();
    await expect(page.locator(SIGNER_ROOT)).toBeVisible({ timeout: 15_000 });
    // Finalize button is always present (enabled/disabled state is runtime logic)
    await expect(page.locator('button:has-text("Finalize")')).toBeVisible({ timeout: 10_000 });
  });

  test('/integrity loads the integrity page', async ({ page }) => {
    await page.goto('/integrity');
    await expect(page.locator(APP_ROOT)).toBeVisible();
    await expect(page.locator('h2')).toContainText('Integrity');
    await expect(page.locator('button:has-text("Compute Hashes")')).toBeVisible();
    await expect(page.locator('button:has-text("Load Sample Template")')).toBeVisible();
  });

  test('/webcomponent loads custom elements on the page', async ({ page }) => {
    await page.goto('/webcomponent');
    await expect(page.locator(APP_ROOT)).toBeVisible();
    await expect(page.locator('h2')).toContainText('Web Component');
    // Both custom elements should be attached to the DOM (even before the WC
    // bundle registers them — they appear as unknown elements in HTML).
    await expect(page.locator(WC_BUILDER_EL)).toBeAttached({ timeout: 15_000 });
    await expect(page.locator(WC_SIGNER_EL)).toBeAttached({ timeout: 15_000 });
  });

  test('nav links navigate between all routes without full-page reload', async ({ page }) => {
    await page.goto('/builder');

    await page.click('nav a[href="/signer"]');
    await expect(page).toHaveURL('/signer');
    await expect(page.locator(SIGNER_ROOT)).toBeVisible({ timeout: 10_000 });

    await page.click('nav a[href="/integrity"]');
    await expect(page).toHaveURL('/integrity');
    await expect(page.locator('h2')).toContainText('Integrity');

    await page.click('nav a[href="/webcomponent"]');
    await expect(page).toHaveURL('/webcomponent');
    await expect(page.locator(WC_SIGNER_EL)).toBeAttached({ timeout: 10_000 });

    await page.click('nav a[href="/builder"]');
    await expect(page).toHaveURL('/builder');
    await expect(page.locator(BUILDER_ROOT)).toBeVisible({ timeout: 10_000 });
  });
});
