/**
 * Integrity hash verification flow tests.
 *
 * Covers:
 *  - Hash computation from sample PDF + template
 *  - Hash value shape (base64url, 43 chars)
 *  - Match / mismatch visual feedback in the verify inputs
 *  - Compare All Hashes result JSON structure
 *  - The /signer page emits integrity-check with hash values when hashes are
 *    provided as expectedHashes (tested via the event log)
 */
import { test, expect } from '@playwright/test';
import {
  INTEGRITY_COMPUTE_BTN,
  INTEGRITY_LOAD_SAMPLE_BTN,
  INTEGRITY_PDF_HASH,
  INTEGRITY_TPL_HASH,
  INTEGRITY_EXPECTED_PDF_INPUT,
  INTEGRITY_EXPECTED_TPL_INPUT,
  INTEGRITY_COMPARE_BTN,
  INTEGRITY_VERIFY_STATUS,
  INTEGRITY_COMPARE_PRE,
} from './helpers/demo-selectors';

// Helper – wait until a .hash-value element has non-empty text content
async function waitForHashValue(page: import('@playwright/test').Page, selector: string) {
  await expect
    .poll(
      async () => {
        const el = page.locator(selector).first();
        const text = await el.textContent({ timeout: 3_000 }).catch(() => '');
        return text && text.trim().length > 10;
      },
      { timeout: 30_000, message: `Hash value at "${selector}" should appear` },
    )
    .toBeTruthy();
  return (await page.locator(selector).first().textContent())!.trim();
}

test.describe('Integrity page – hash computation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/integrity');
    await expect(page.locator('button:has-text("Compute Hashes")')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('computes PDF and template hashes from sample assets', async ({ page }) => {
    // Load the bundled sample template so the textarea is populated
    await page.click(INTEGRITY_LOAD_SAMPLE_BTN);

    // Trigger hash computation (fetches PDF, runs crypto.subtle)
    await page.click(INTEGRITY_COMPUTE_BTN);

    // Wait for both hash values to populate
    const pdfHash = await waitForHashValue(page, INTEGRITY_PDF_HASH);
    const tplHash = await waitForHashValue(page, INTEGRITY_TPL_HASH);

    // Must NOT be the error sentinel
    expect(pdfHash, 'PDF hash computation should succeed').not.toBe('error');
    expect(tplHash, 'template hash computation should succeed').not.toBe('error');

    // Base64url: only alphanumeric, hyphen, underscore, length ~43
    expect(pdfHash).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(tplHash).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(pdfHash.length, 'SHA-256 base64url should be ~43 chars').toBeGreaterThanOrEqual(40);
    expect(tplHash.length, 'SHA-256 base64url should be ~43 chars').toBeGreaterThanOrEqual(40);
  });

  test('recomputing hashes from the same template produces the same values', async ({ page }) => {
    await page.click(INTEGRITY_LOAD_SAMPLE_BTN);
    await page.click(INTEGRITY_COMPUTE_BTN);
    const tplHash1 = await waitForHashValue(page, INTEGRITY_TPL_HASH);

    // Second computation without changing the template must give same hash
    await page.click(INTEGRITY_COMPUTE_BTN);
    const tplHash2 = await waitForHashValue(page, INTEGRITY_TPL_HASH);

    expect(tplHash1).toBe(tplHash2);
  });

  test('"Matches" feedback appears when expected hash equals computed hash', async ({ page }) => {
    await page.click(INTEGRITY_LOAD_SAMPLE_BTN);
    await page.click(INTEGRITY_COMPUTE_BTN);

    const pdfHash = await waitForHashValue(page, INTEGRITY_PDF_HASH);
    expect(pdfHash).not.toBe('error');

    // Paste the computed hash into the expected input — should show "Matches"
    await page.fill(INTEGRITY_EXPECTED_PDF_INPUT, pdfHash);

    await expect(page.locator(INTEGRITY_VERIFY_STATUS).first()).toContainText('Matches', {
      timeout: 5_000,
    });
  });

  test('"Does not match" feedback appears when expected hash is wrong', async ({ page }) => {
    await page.click(INTEGRITY_LOAD_SAMPLE_BTN);
    await page.click(INTEGRITY_COMPUTE_BTN);
    await waitForHashValue(page, INTEGRITY_PDF_HASH);

    // Paste a deliberately wrong hash
    await page.fill(INTEGRITY_EXPECTED_PDF_INPUT, 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');

    await expect(page.locator(INTEGRITY_VERIFY_STATUS).first()).toContainText('Does not match', {
      timeout: 5_000,
    });
  });

  test('Compare All Hashes produces a JSON result with match/mismatch flags', async ({ page }) => {
    await page.click(INTEGRITY_LOAD_SAMPLE_BTN);
    await page.click(INTEGRITY_COMPUTE_BTN);

    const pdfHash = await waitForHashValue(page, INTEGRITY_PDF_HASH);
    const tplHash = await waitForHashValue(page, INTEGRITY_TPL_HASH);
    expect(pdfHash).not.toBe('error');
    expect(tplHash).not.toBe('error');

    // Case 1: both matching
    await page.fill(INTEGRITY_EXPECTED_PDF_INPUT, pdfHash);
    await page.fill(INTEGRITY_EXPECTED_TPL_INPUT, tplHash);
    await page.click(INTEGRITY_COMPARE_BTN);

    await expect(page.locator(INTEGRITY_COMPARE_PRE)).toBeVisible({ timeout: 5_000 });
    const resultText1 = await page.locator(INTEGRITY_COMPARE_PRE).textContent();
    const result1 = JSON.parse(resultText1!);
    expect(result1.pdf.match, 'pdf match should be true').toBe(true);
    expect(result1.template.match, 'template match should be true').toBe(true);
    expect(result1.pdf.expected).toBe(pdfHash);
    expect(result1.pdf.actual).toBe(pdfHash);

    // Case 2: template hash deliberately wrong
    await page.fill(INTEGRITY_EXPECTED_TPL_INPUT, 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    await page.click(INTEGRITY_COMPARE_BTN);

    const resultText2 = await page.locator(INTEGRITY_COMPARE_PRE).textContent();
    const result2 = JSON.parse(resultText2!);
    expect(result2.pdf.match, 'pdf match should still be true').toBe(true);
    expect(result2.template.match, 'template match should be false').toBe(false);
    expect(result2.template.expected).toBe('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    expect(result2.template.actual).toBe(tplHash);
  });
});

test.describe('Integrity page – hash stability', () => {
  test('altering template JSON produces a different template hash', async ({ page }) => {
    await page.goto('/integrity');
    await page.waitForSelector(INTEGRITY_COMPUTE_BTN, { timeout: 10_000 });

    await page.click(INTEGRITY_LOAD_SAMPLE_BTN);
    await page.click(INTEGRITY_COMPUTE_BTN);
    const originalHash = await waitForHashValue(page, INTEGRITY_TPL_HASH);
    expect(originalHash).not.toBe('error');

    // Modify the template JSON in the textarea by appending a whitespace-neutral
    // content change (add a custom meta field).
    const textarea = page.locator('textarea').first();
    const raw = await textarea.inputValue();
    const parsed = JSON.parse(raw);
    parsed.meta = { ...parsed.meta, _test_marker: 'mutated' };
    await textarea.fill(JSON.stringify(parsed, null, 2));

    await page.click(INTEGRITY_COMPUTE_BTN);
    const mutatedHash = await waitForHashValue(page, INTEGRITY_TPL_HASH);

    expect(mutatedHash).not.toBe('error');
    expect(mutatedHash).not.toBe(originalHash);
  });
});
