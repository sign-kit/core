# pdf-sign-kit — Packaging & Runtime Gotchas

This document collects practical caveats and reminders for packaging the Vue components and web components, and for runtime behaviors you must not forget.

## Where the code lives
- Vue entrypoint: `src/components/index.ts`
- Web-component registration: `src/web-components/register.ts`
- JSON attribute helper: `src/web-components/ce-helpers.ts`
- CustomEvent typings: `src/web-components/custom-events.d.ts`
- Build configs: `vite.lib.config.ts`, `vite.wc.config.ts`
- Package metadata: `package.json`

## Web components vs Vue SFC
- Consumers can import SFCs directly (`import { FormBuilder } from 'pdf-sign-kit'`) or load a standalone web-component bundle that registers `<pdf-form-builder>` and `<pdf-form-signer>`.
- Web components are produced with `defineCustomElement` and use Shadow DOM by default (styles scoped inside the shadow root).

## Passing props / JSON attributes
- Do NOT pass large templates, PDF bytes, or big objects via HTML attributes. Attributes are strings and get parsed; the helper `attachJsonProps` protects against accidental huge payloads by ignoring attributes above ~200KB.
- Preferred pattern for large/complex data: set the property programmatically on the element instance:

  ```js
  const el = document.createElement('pdf-form-builder');
  el.template = myTemplateObject; // safe, typed, no parsing
  document.body.appendChild(el);
  ```

- If you must use attributes, use small JSON snippets only and rely on `data-*` names (the CE helper maps `data-template` → `template`). The attribute parser will log and ignore excessive sizes.

## Reactive updates / deep mutation
- Custom elements and `attachJsonProps` handle attribute changes; however, deep mutations of object properties may not be observed. To update state reliably, assign a new object reference:

  ```js
  el.template = { ...el.template, fields: updatedFields };
  ```

- Consider exposing imperative methods on the custom element (e.g., `setTemplate()`, `setValues()`) for host apps that need a stable API for updates.

## Events as CustomEvents
- Vue emits are forwarded to CE consumers as `CustomEvent`s with the original payload under `event.detail`. See `src/web-components/custom-events.d.ts` for typing.
- Example listener:

  ```js
  el.addEventListener('signed', (ev) => {
    const manifest = ev.detail.manifest;
  });
  ```

## CSS isolation and duplication
- Shadow DOM in custom elements gives style isolation for CE consumers. Vue SFC consumers should use `<style scoped>` or CSS Modules to avoid style leakage.
- Multiple instances of the CE will each include component-scoped styles. If bundle size matters, consider using a shared stylesheet via `adoptedStyleSheets` or an external CSS file.

## Bundle tradeoffs
- The `wc` IIFE bundle currently bundles Vue to be standalone. This increases payload size. If you want smaller WC bundles, set `external: ['vue']` in the `vite.wc.config.ts` to require the host app to provide Vue.
- The library build externals `vue` (recommended for npm package consumers) so the host app's Vue is used.

## Large payloads & memory
- PDF bytes, images, and many signature rasters can use lots of memory when embedding with `pdf-lib`. For large workflows:
  - Prefer passing a URL or file handle and let the component stream/fetch as needed.
  - Consider storing large blobs in IndexedDB and passing references/IDs.
  - Compress signature images client-side before embedding.

## Fonts and CORS
- If you supply custom fonts (TTF/WOFF) from external origins, the font files must be served with CORS headers. Otherwise embedding will fail when fetched from the browser.

## Web Crypto (integrity hashes)
- `crypto.subtle.digest()` only works in secure contexts (HTTPS or localhost). If unavailable, the code falls back to omitting client-side hashes; the manifest must clearly mark such hashes as absent.

## pdf-lib / pdf.js caveats
- Coordinate mapping: templates use normalized coordinates (0..1) with origin at the page top-left. PDF pages use bottom-left origin in points. Use page width/height and convert `y` with `pdfY = pageHeight - (y * pageHeight) - (height * pageHeight)`.
- Page rotation and crop/trim boxes: if PDFs contain rotation or non-standard boxes, map coordinates using the page's transform/rotation metadata.
- Rendering concurrency: pdf.js `render()` cannot run concurrently on the same canvas. Use serialized render tasks or cancel/await existing renders to avoid blanking or errors.

## Checkbox rendering
- We draw a flattened mark (filled square or checkmark path) instead of relying on AcroForm appearances. This ensures values are flattened and portable across viewers.

## Signature images
- Support PNG and JPEG via `embedPng` / `embedJpg`. Cache embedded images by hash to avoid duplicate embeds. Preserve aspect ratio and scale-to-fit into the field box.

## Manifest & integrity
- Always generate a manifest JSON even without server-side attestation. For client-computed hashes, mark provenance explicitly (e.g., `provenance: 'client-computed'`).
- The manifest should include at least: `manifestId`, `templateId`, `signedAt`, `signer` info, per-field values, and `integrity` with `templateHash`/`pdfHash` if computed.

## Dev / HMR notes
- Hot Module Replacement (HMR) can lead to duplicate custom element definitions if you re-execute `defineCustomElement` without guarding. `src/web-components/register.ts` guards with `customElements.get(...)` before `define()` but HMR can still cause transient issues. If you see duplicate-definition errors during local dev, refresh the page.

## Tests / QA
- Use small multi-page PDFs to exercise coordinate transforms and field placement. Test rotating pages and different DPI PDFs.

## Where to update these rules
- Update this file when you change `attachJsonProps` behavior (e.g., `maxAttrLen`) or packaging strategy (bundle with/without Vue). Keep the `custom-events.d.ts` in sync with emitted event names.

---

If you'd like, I can add this file to the package README or link to it from the top-level `README.md`.
