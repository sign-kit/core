import { expect, type Page } from '@playwright/test';
import { LOG_PRE, MANIFEST_PRE } from './demo-selectors';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ManifestShape {
  manifestId?: string;
  templateId?: string;
  fields?: unknown[];
  integrity?: {
    ok: boolean;
    templateHash?: string;
    pdfHash?: string;
    valuesHash?: string;
    details?: {
      checks?: Array<{ name: string; result: string; expected?: string; actual?: string }>;
    };
  };
  sessionHash?: string;
  signedAt?: string;
  pdfHash?: string;
}

// ── Manifest panel helpers ─────────────────────────────────────────────────────

/**
 * Read and parse the manifest JSON from the right-panel inspect area.
 * Returns null if the element is absent or text is not valid JSON.
 */
export async function readManifestFromPanel(page: Page): Promise<ManifestShape | null> {
  const preEl = page.locator(MANIFEST_PRE);
  const visible = await preEl.isVisible().catch(() => false);
  if (!visible) return null;
  const text = await preEl.textContent({ timeout: 3_000 }).catch(() => null);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Poll the manifest panel until JSON appears, then return it.
 * Throws if the manifest does not appear within the given timeout.
 */
export async function waitForManifest(page: Page, timeout = 30_000): Promise<ManifestShape> {
  let manifest: ManifestShape | null = null;
  await expect
    .poll(
      async () => {
        manifest = await readManifestFromPanel(page);
        return manifest !== null;
      },
      { timeout, message: 'Expected manifest to appear in inspect panel' },
    )
    .toBeTruthy();
  return manifest!;
}

/**
 * Assert the structural shape of a finalized manifest object.
 */
export function assertManifestShape(m: ManifestShape): void {
  expect(typeof m.manifestId, 'manifestId should be a string').toBe('string');
  expect(m.manifestId, 'manifestId should start with m-').toMatch(/^m-\d+$/);
  expect(typeof m.templateId, 'templateId should be a string').toBe('string');
  expect(Array.isArray(m.fields), 'fields should be an array').toBe(true);
  expect(m.integrity, 'integrity block must exist').toBeDefined();
  expect(typeof m.integrity!.ok, 'integrity.ok should be boolean').toBe('boolean');
  expect(typeof m.sessionHash, 'sessionHash should be a string').toBe('string');
  expect(m.sessionHash!.length, 'sessionHash should not be empty').toBeGreaterThan(0);
  expect(typeof m.signedAt, 'signedAt should be a string').toBe('string');
}

// ── Event log helpers ─────────────────────────────────────────────────────────

/**
 * Read all lines from the event-log panel.
 */
export async function readEventLog(page: Page): Promise<string[]> {
  const preEl = page.locator(LOG_PRE);
  const visible = await preEl.isVisible().catch(() => false);
  if (!visible) return [];
  const text = await preEl.textContent().catch(() => '');
  return (text ?? '').split('\n').filter(Boolean);
}

/**
 * Poll until an event-log entry whose text starts with `prefix` appears.
 * Returns the full matching line.
 */
export async function waitForEventLogEntry(
  page: Page,
  prefix: string,
  timeout = 30_000,
): Promise<string> {
  let found = '';
  await expect
    .poll(
      async () => {
        const lines = await readEventLog(page);
        const match = lines.find((l) => l.startsWith(prefix));
        if (match) found = match;
        return !!match;
      },
      { timeout, message: `Expected event log to contain entry starting with: ${prefix}` },
    )
    .toBeTruthy();
  return found;
}

// ── Specific payload shape assertions ────────────────────────────────────────

/**
 * Assert an integrity-check event payload emitted from the Signer component.
 */
export function assertIntegrityCheckShape(payload: Record<string, unknown>): void {
  expect(typeof payload.ok, 'integrity-check ok should be boolean').toBe('boolean');
  expect(typeof payload.templateHash, 'integrity-check templateHash should be a string').toBe(
    'string',
  );
  expect(
    payload.templateHash as string,
    'integrity-check templateHash should be base64url',
  ).toMatch(/^[A-Za-z0-9_-]+$/);
}

/**
 * Assert an integrity-verification event payload emitted from the Signer component.
 */
export function assertIntegrityVerificationShape(payload: Record<string, unknown>): void {
  expect(payload.integrity, 'integrity-verification must have integrity block').toBeDefined();
  const intg = payload.integrity as Record<string, unknown>;
  expect(typeof intg.ok, 'integrity-verification integrity.ok should be boolean').toBe('boolean');
}

/**
 * Assert the shape of a builder field-added / field-updated event detail.
 */
export function assertFieldEventShape(detail: Record<string, unknown>): void {
  expect(typeof detail.id, 'field event id should be string').toBe('string');
  expect(typeof detail.type, 'field event type should be string').toBe('string');
  expect(typeof detail.page, 'field event page should be number').toBe('number');
  expect(typeof detail.x, 'field event x should be number').toBe('number');
  expect(typeof detail.y, 'field event y should be number').toBe('number');
  expect(typeof detail.width, 'field event width should be number').toBe('number');
  expect(typeof detail.height, 'field event height should be number').toBe('number');
}

// ── Misc helpers ──────────────────────────────────────────────────────────────

/**
 * Wait until the PDF canvas in the Signer component has been sized by pdf.js
 * (canvas.width > 0), indicating that originalPdfBytes have been loaded.
 */
export async function waitForPdfCanvas(page: Page, timeout = 30_000): Promise<void> {
  await page.waitForFunction(
    () => {
      const canvases = document.querySelectorAll<HTMLCanvasElement>('.page-canvas');
      return canvases.length > 0 && canvases[0].width > 0;
    },
    { timeout },
  );
}

/**
 * Extract JSON from a string that may include a prefix label, e.g.
 * "integrity-check: {...}".  Returns null if extraction fails.
 */
export function extractJsonAfterColon(line: string): Record<string, unknown> | null {
  const idx = line.indexOf(': {');
  if (idx === -1) return null;
  try {
    return JSON.parse(line.slice(idx + 2));
  } catch {
    return null;
  }
}
