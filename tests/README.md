# E2E Tests — `@sign-kit/core`

Playwright browser tests that verify the demo application's three core user flows and the web component event-payload contract. All tests run against a locally served instance of `packages/demo`.

---

## Prerequisites

| Requirement | Details |
|---|---|
| Node ≥ 18 | Required by Playwright |
| Chromium browser | Installed automatically with `npx playwright install chromium` |
| WC bundle | Required for web component tests only — build with `npm --workspace=@sign-kit/core run build:wc` |

---

## Running the tests

```sh
# Build the WC bundle and run all tests (headless)
npm run test:e2e

# Run without rebuilding the WC bundle (faster on repeat runs)
npm run test:e2e:skip-build

# Run with a visible browser window
npm run test:e2e:headed

# Open Playwright's interactive UI
npm run test:e2e:ui
```

The demo dev server is started automatically on `http://localhost:5180` when Playwright launches. Set the `DEMO_URL` environment variable to target a different host (e.g. a preview deployment).

---

## Test structure

```
tests/
└── e2e/
    ├── helpers/
    │   ├── demo-selectors.ts   # Stable DOM selector constants
    │   └── payload-utils.ts    # Shared assertion helpers
    ├── demo-routes.spec.ts     # Smoke tests — all four routes load
    ├── builder-signer.spec.ts  # Builder and Signer flow
    ├── integrity.spec.ts       # Integrity page hash-check flow
    └── webcomponent-events.spec.ts  # Web component event-payload contract
```

### `helpers/demo-selectors.ts`

Centralised CSS selector constants for every surface in the demo app — app shell, nav links, builder, signer, integrity page, and web component elements. Using named constants instead of inline strings keeps tests readable and reduces the blast radius of markup changes.

### `helpers/payload-utils.ts`

Shared assertion utilities used across spec files:

| Export | Purpose |
|---|---|
| `waitForManifest(page, timeout)` | Polls until the manifest `<pre>` in the right panel contains parseable JSON, then returns the object |
| `assertManifestShape(m)` | Asserts the manifest has `manifestId`, `templateId`, `fields[]`, `integrity.ok`, `sessionHash`, and `signedAt` |
| `waitForEventLogEntry(page, prefix, timeout)` | Polls the event log `<pre>` until a line starting with `prefix` appears |
| `assertIntegrityCheckShape(payload)` | Validates the `integrity-check` event detail |
| `assertIntegrityVerificationShape(payload)` | Validates the `integrity-verification` event detail |
| `assertFieldEventShape(detail)` | Validates builder `field-added` / `field-removed` event detail |
| `waitForPdfCanvas(page, timeout)` | Waits until at least one `<canvas>` on the page has non-zero dimensions (confirms PDF bytes have loaded) |
| `extractJsonAfterColon(line)` | Parses the JSON portion from a `"label: {...}"` event-log line |

---

## Spec files

### `demo-routes.spec.ts` — Route navigation smoke tests

Baseline gate: each of the four demo routes loads without a JavaScript error and renders its primary structural landmark. If these fail, all other specs should be investigated for setup problems.

| Test | What it checks |
|---|---|
| `/builder` loads | `.pdf-builder` root visible; toolbar renders |
| `/signer` loads | `.signer-root` visible; Finalize button present |
| `/integrity` loads | Integrity heading, Compute Hashes, and Load Sample Template buttons present |
| `/webcomponent` loads | `<pdf-form-builder>` and `<pdf-form-signer>` elements attached to DOM |
| Nav links navigate | Clicking each nav link changes the active route without a full-page reload (SPA navigation confirmed) |

Page-level JavaScript errors are captured and surfaced in the test report after each test. `ResizeObserver loop` and PDF.js worker-teardown warnings are treated as benign.

---

### `builder-signer.spec.ts` — Builder → Signer end-to-end flow

Covers the two primary authoring components.

#### Form Builder

| Test | What it checks |
|---|---|
| Renders with template JSON | At least one canvas appears (PDF.js loaded); the template `<textarea>` contains valid JSON with `id` and `fields` properties |
| Field palette visible | Draggable/button items for each field type (signature, text, etc.) are rendered |

#### Signer finalize flow

All signer tests wait for `waitForPdfCanvas` to confirm PDF bytes have loaded before clicking Finalize.

| Test | What it checks |
|---|---|
| Produces a well-formed manifest | Finalize triggers a PDF download; the manifest `<pre>` populates with an object that passes `assertManifestShape`; `integrity.ok` is `true`; `pdfHash` is present; the event log shows a `finalized:` entry |
| Fields array shape | `manifest.fields` is a non-empty array; each entry has `fieldId` and `value` |
| Integrity-verification event | The event log contains an `integrity-verification:` entry; the parsed payload passes `assertIntegrityVerificationShape` |
| Validation errors for required fields | When required fields are left empty the signer surfaces visible error feedback instead of finalizing |

---

### `integrity.spec.ts` — Integrity hash computation and verification

Tests the `/integrity` demo page which uses `crypto.subtle` to produce SHA-256 hashes of the PDF and template, and lets users compare them against expected values.

| Test | What it checks |
|---|---|
| Computes hashes | After loading the sample template and clicking Compute Hashes, both hash fields populate with base64url strings (alphanumeric + `-_`, ≥ 40 chars) |
| Hash stability | Recomputing from the same template returns the same hash value |
| "Matches" feedback | Pasting the computed hash into the expected-hash input shows a "Matches" status indicator |
| "Does not match" feedback | Pasting a wrong hash shows a "Does not match" status indicator |
| Compare All Hashes — both match | Filling both expected inputs with the correct hashes and clicking Compare returns JSON with `pdf.match: true` and `template.match: true` |
| Compare All Hashes — template mismatch | Providing a wrong template hash produces `template.match: false` in the result |
| Altering template changes hash | Modifying the template JSON textarea produces a different hash on next compute |

---

### `webcomponent-events.spec.ts` — Web component event-payload contract

Validates that `<pdf-form-builder>` and `<pdf-form-signer>`, loaded as standalone custom elements via the IIFE bundle (`dist/pdf-sign-kit.wc.iife.js`), emit well-shaped `CustomEvent`s. Tests skip gracefully when the WC bundle has not been built.

> **Note:** Vue's `defineCustomElement` wraps emitted event arguments in an array (`detail = [payload]`). The test helpers unwrap this automatically.

| Test | What it checks |
|---|---|
| Elements attached to DOM | Both `<pdf-form-builder>` and `<pdf-form-signer>` are present in the document |
| Elements registered | `customElements.get('pdf-form-builder')` and `...('pdf-form-signer')` are defined after bundle init |
| Shadow roots exist | Both elements expose a `shadowRoot` |
| Signer shadow DOM structure | The signer shadow contains `.signer-root` |
| Builder shadow DOM structure | The builder shadow contains `.pdf-builder` |
| `finalized` payload shape | After clicking Finalize inside the signer shadow, the emitted `detail` passes `assertManifestShape` |
| `finalized` updates page manifest panel | The host page's manifest `<pre>` reflects the signed manifest after the event fires |
| `field-added` event shape | Programmatically adding a field causes a `field-added` event whose `detail` passes `assertFieldEventShape` |
| `field-removed` event detail | Removing a field emits a `field-removed` event with the correct `fieldId` |

---

## Configuration

See [`playwright.config.ts`](../playwright.config.ts) at the repo root for:

- `baseURL` — defaults to `http://localhost:5180`; override with `DEMO_URL`
- `timeout` — 60 s per test
- `workers: 1` — serial execution (the demo dev server is a shared resource)
- `trace: 'on-first-retry'` — Playwright traces saved on first retry
- `screenshot: 'only-on-failure'` — screenshots captured on failure
