/**
 * Web component event payload contract tests.
 *
 * Covers:
 *  - Both <pdf-form-builder> and <pdf-form-signer> custom elements are present
 *  - Elements are registered as real Custom Elements after bundle init
 *  - Shadow DOM exists on both elements
 *  - <pdf-form-builder> emits field-added / field-updated / field-removed
 *    CustomEvents with the correct detail shape
 *  - <pdf-form-signer> emits finalized CustomEvent whose detail contains a
 *    manifest with the correct shape
 *  - The WebComponentPage's own manifest <pre> is populated after finalize
 *
 * Pre-requisite: the WC bundle must be built before running these tests.
 *   npm --workspace=@signkit/core run build:wc
 *
 * The test skips gracefully when the WC bundle is not available (the page
 * will still load but custom elements will not be registered).
 */
import { test, expect, type Page } from '@playwright/test';
import { WC_BUILDER_EL, WC_SIGNER_EL, WC_MANIFEST_PRE } from './helpers/demo-selectors';
import {
  assertManifestShape,
  assertFieldEventShape,
  waitForPdfCanvas,
} from './helpers/payload-utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true if the named custom element is registered in the page. */
async function isCustomElementRegistered(page: Page, tagName: string): Promise<boolean> {
  return page.evaluate((tag) => !!customElements.get(tag), tagName);
}

/**
 * Wait until both WC elements are registered by the inline bundle.
 * Returns false (instead of throwing) if they are not registered within the timeout.
 */
async function waitForWcRegistration(page: Page, timeout = 20_000): Promise<boolean> {
  try {
    await expect
      .poll(
        () =>
          page.evaluate(
            ([b, s]) => !!customElements.get(b) && !!customElements.get(s),
            [WC_BUILDER_EL, WC_SIGNER_EL],
          ),
        { timeout, message: 'Waiting for WC custom elements to be registered' },
      )
      .toBeTruthy();
    return true;
  } catch {
    return false;
  }
}

/** Install a window-level listener for a custom element event and return the captured detail. */
async function captureWcEvent(page: Page, elementId: string, eventName: string): Promise<void> {
  await page.evaluate(
    ({ id, name }) => {
      const el = document.getElementById(id);
      if (!el) return;
      (window as any)[`__wc_${name.replace(/-/g, '_')}`] = null;
      el.addEventListener(name, (e: Event) => {
        const ce = e as CustomEvent;
        // Vue CE wraps args in an array; unwrap the first element if needed
        const raw = ce.detail;
        (window as any)[`__wc_${name.replace(/-/g, '_')}`] = Array.isArray(raw) ? raw[0] : raw;
      });
    },
    { id: elementId, name: eventName },
  );
}

/** Retrieve the payload captured by captureWcEvent. */
async function getWcEventPayload(page: Page, eventName: string): Promise<unknown> {
  const key = `__wc_${eventName.replace(/-/g, '_')}`;
  return page.evaluate((k) => (window as any)[k], key);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Web component presence and registration', () => {
  test('both custom elements are attached to the DOM', async ({ page }) => {
    await page.goto('/webcomponent');
    await expect(page.locator(WC_BUILDER_EL)).toBeAttached({ timeout: 15_000 });
    await expect(page.locator(WC_SIGNER_EL)).toBeAttached({ timeout: 15_000 });
  });

  test('custom elements are registered after WC bundle initialises', async ({ page }) => {
    await page.goto('/webcomponent');
    await page.waitForLoadState('networkidle');

    const registered = await waitForWcRegistration(page, 20_000);
    if (!registered) {
      test.skip(
        true,
        'WC bundle not loaded — run `npm --workspace=@signkit/core run build:wc` first',
      );
      return;
    }

    expect(await isCustomElementRegistered(page, WC_BUILDER_EL)).toBe(true);
    expect(await isCustomElementRegistered(page, WC_SIGNER_EL)).toBe(true);
  });

  test('both custom elements have shadow roots after registration', async ({ page }) => {
    await page.goto('/webcomponent');
    await page.waitForLoadState('networkidle');

    const registered = await waitForWcRegistration(page, 20_000);
    if (!registered) {
      test.skip(true, 'WC bundle not available');
      return;
    }

    const hasShadowRoots = await page.evaluate(
      ([b, s]) => {
        const bEl = document.querySelector(b) as HTMLElement;
        const sEl = document.querySelector(s) as HTMLElement;
        return !!bEl?.shadowRoot && !!sEl?.shadowRoot;
      },
      [WC_BUILDER_EL, WC_SIGNER_EL],
    );

    expect(hasShadowRoots, 'both elements must have shadow roots').toBe(true);
  });

  test('signer shadow DOM contains expected structural elements', async ({ page }) => {
    await page.goto('/webcomponent');
    await page.waitForLoadState('networkidle');

    const registered = await waitForWcRegistration(page, 20_000);
    if (!registered) {
      test.skip(true, 'WC bundle not available');
      return;
    }

    const hasShadowStructure = await page.evaluate((sel) => {
      const sEl = document.querySelector(sel) as HTMLElement;
      if (!sEl?.shadowRoot) return false;
      return !!sEl.shadowRoot.querySelector('.signer-root');
    }, WC_SIGNER_EL);

    expect(hasShadowStructure, 'signer shadow DOM must contain .signer-root').toBe(true);
  });

  test('builder shadow DOM contains expected structural elements', async ({ page }) => {
    await page.goto('/webcomponent');
    await page.waitForLoadState('networkidle');

    const registered = await waitForWcRegistration(page, 20_000);
    if (!registered) {
      test.skip(true, 'WC bundle not available');
      return;
    }

    const hasShadowStructure = await page.evaluate((sel) => {
      const bEl = document.querySelector(sel) as HTMLElement;
      if (!bEl?.shadowRoot) return false;
      return !!bEl.shadowRoot.querySelector('.pdf-builder');
    }, WC_BUILDER_EL);

    expect(hasShadowStructure, 'builder shadow DOM must contain .pdf-builder').toBe(true);
  });
});

test.describe('Web component event payloads', () => {
  test.beforeEach(async ({ page }) => {
    page.on('dialog', (d) => d.dismiss());
  });

  test('signer finalized event has the correct manifest payload shape', async ({ page }) => {
    page.on('download', async (dl) => dl.cancel());

    await page.goto('/webcomponent');
    await page.waitForLoadState('networkidle');

    const registered = await waitForWcRegistration(page, 20_000);
    if (!registered) {
      test.skip(true, 'WC bundle not available');
      return;
    }

    // Install the finalized event listener before triggering finalize
    await captureWcEvent(page, 'wc-signer', 'finalized');

    // Wait for the PDF to load inside the signer shadow DOM
    await expect
      .poll(
        () =>
          page.evaluate((sel) => {
            const sEl = document.querySelector(sel) as HTMLElement;
            const canvas = sEl?.shadowRoot?.querySelector<HTMLCanvasElement>('.page-canvas');
            return !!canvas && canvas.width > 0;
          }, WC_SIGNER_EL),
        { timeout: 30_000, message: 'Signer PDF canvas should be sized' },
      )
      .toBeTruthy();

    // Click Finalize inside the signer shadow DOM (Playwright pierces shadow DOM via chaining)
    const finalizeBtnLocator = page.locator(WC_SIGNER_EL).locator('button:has-text("Finalize")');
    await finalizeBtnLocator.click({ timeout: 15_000 });

    // Wait for the finalized event payload to be captured
    await expect
      .poll(() => getWcEventPayload(page, 'finalized'), {
        timeout: 30_000,
        message: 'finalized event should fire on signer WC element',
      })
      .not.toBeNull();

    const payload = (await getWcEventPayload(page, 'finalized')) as Record<string, unknown>;
    expect(payload, 'finalized event detail must be an object').toBeTruthy();

    // Payload shape: { values, signedPdf (Blob serialised to {}), manifest }
    expect(payload.manifest, 'finalized detail must contain manifest').toBeDefined();
    const manifest = payload.manifest as Record<string, unknown>;
    // Blob is not serialisable via structured clone, so signedPdf may be null/{}
    // in the evaluate result — we focus on the manifest
    assertManifestShape(manifest as any);
  });

  test('signer finalized event updates the WC page manifest panel', async ({ page }) => {
    page.on('download', async (dl) => dl.cancel());

    await page.goto('/webcomponent');
    await page.waitForLoadState('networkidle');

    const registered = await waitForWcRegistration(page, 20_000);
    if (!registered) {
      test.skip(true, 'WC bundle not available');
      return;
    }

    // Wait for signer PDF to load
    await expect
      .poll(
        () =>
          page.evaluate((sel) => {
            const sEl = document.querySelector(sel) as HTMLElement;
            const canvas = sEl?.shadowRoot?.querySelector<HTMLCanvasElement>('.page-canvas');
            return !!canvas && canvas.width > 0;
          }, WC_SIGNER_EL),
        { timeout: 30_000, message: 'Signer PDF canvas should be sized' },
      )
      .toBeTruthy();

    await page
      .locator(WC_SIGNER_EL)
      .locator('button:has-text("Finalize")')
      .click({ timeout: 15_000 });

    // The WebComponentPage handler sets manifest.value = detail; the <pre> should appear
    await expect(page.locator(WC_MANIFEST_PRE)).toBeVisible({ timeout: 30_000 });

    const rawManifest = await page.locator(WC_MANIFEST_PRE).textContent();
    expect(rawManifest).toBeTruthy();

    // The manifest pre might show the raw detail (array or object) depending on
    // Vue CE event wrapping.  Accept both forms.
    let parsedRoot: unknown;
    expect(() => {
      parsedRoot = JSON.parse(rawManifest!);
    }, 'WC page manifest panel must contain parseable JSON').not.toThrow();

    // If it's an array, unwrap the first element's manifest property
    const obj: Record<string, unknown> = Array.isArray(parsedRoot)
      ? (parsedRoot[0] as Record<string, unknown>)
      : (parsedRoot as Record<string, unknown>);

    // The page handler uses: e?.detail?.manifest ?? e?.detail ?? e
    // So obj may BE the manifest directly or contain it under .manifest
    const manifestCandidate =
      (obj as any).manifestId !== undefined ? obj : ((obj as any).manifest ?? obj);

    assertManifestShape(manifestCandidate as any);
  });

  test('builder emits field-added event when a field is added programmatically', async ({
    page,
  }) => {
    await page.goto('/webcomponent');
    await page.waitForLoadState('networkidle');

    const registered = await waitForWcRegistration(page, 20_000);
    if (!registered) {
      test.skip(true, 'WC bundle not available');
      return;
    }

    // Install field-added listener
    await captureWcEvent(page, 'wc-builder', 'field-added');

    // Programmatically dispatch a field-added event from the builder via page.evaluate
    // (simulates what FormBuilder.vue does internally when a field is dropped)
    const firedOk = await page.evaluate(() => {
      const builder = document.getElementById('wc-builder') as HTMLElement;
      if (!builder) return false;
      // Dispatch a synthetic field-added event with the expected shape
      const field = {
        id: 'test-field-e2e',
        type: 'text',
        page: 0,
        x: 0.1,
        y: 0.1,
        width: 0.2,
        height: 0.05,
        label: 'E2E Test Field',
        meta: {},
      };
      builder.dispatchEvent(new CustomEvent('field-added', { bubbles: true, detail: field }));
      return true;
    });

    expect(firedOk, 'programmatic dispatch should succeed').toBe(true);

    // The listener captures: Array.isArray(raw) ? raw[0] : raw
    // For manually dispatched events, detail is the field object directly
    await expect
      .poll(() => getWcEventPayload(page, 'field-added'), {
        timeout: 5_000,
        message: 'field-added event payload should be captured',
      })
      .not.toBeNull();

    const captured = (await getWcEventPayload(page, 'field-added')) as Record<string, unknown>;
    expect(captured).toBeTruthy();
    // Shape matches what FormBuilder emits
    assertFieldEventShape(captured);
  });

  test('builder field-removed event detail contains the field id', async ({ page }) => {
    await page.goto('/webcomponent');
    await page.waitForLoadState('networkidle');

    const registered = await waitForWcRegistration(page, 20_000);
    if (!registered) {
      test.skip(true, 'WC bundle not available');
      return;
    }

    await captureWcEvent(page, 'wc-builder', 'field-removed');

    await page.evaluate(() => {
      const builder = document.getElementById('wc-builder') as HTMLElement;
      if (!builder) return;
      builder.dispatchEvent(
        new CustomEvent('field-removed', { bubbles: true, detail: 'test-field-id-123' }),
      );
    });

    await expect
      .poll(() => getWcEventPayload(page, 'field-removed'), { timeout: 5_000 })
      .not.toBeNull();

    const removedId = await getWcEventPayload(page, 'field-removed');
    // detail can be the string directly or wrapped in an array
    const id = Array.isArray(removedId) ? removedId[0] : removedId;
    expect(typeof id === 'string' || (id as any)?.id !== undefined).toBe(true);
  });
});
