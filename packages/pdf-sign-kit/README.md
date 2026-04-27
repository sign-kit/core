# @signkit/core

Client-first Vue 3 toolkit for building PDF form templates and collecting signatures — entirely in the browser, no backend required.

[![npm](https://img.shields.io/npm/v/@signkit/core)](https://www.npmjs.com/package/@signkit/core)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue)](https://github.com/sign-kit/core/blob/main/LICENSE)

**[Live Demo](https://demo.signkit.dev/) · [Documentation](https://docs.signkit.dev/) · [GitHub](https://github.com/sign-kit/core)**

---

> If this project saves you time, consider [buying me a coffee on Ko-fi](https://ko-fi.com/P5P22RTZ6). It helps keep the project maintained. ☕

---

## What it does

`@signkit/core` gives you two components:

- **`<FormBuilder>`** — Load a PDF, drag and drop signature/text/date/checkbox fields onto pages, and export a reusable template JSON.
- **`<Signer>`** — Load a PDF + template JSON, let users draw or type signatures and fill fields, then produce a signed PDF and a manifest JSON describing every field value and signing metadata.

Everything runs client-side via [pdf.js](https://mozilla.github.io/pdf.js/) for rendering and [pdf-lib](https://pdf-lib.js.org/) for PDF generation. No API keys, no servers.

---

## Installation

```bash
npm install @signkit/core
```

`pdfjs-dist` is a peer dependency. If you don't already have it:

```bash
npm install pdfjs-dist
```

---

## Vue component usage

### 1. Import styles

Add this once in your app entry (e.g. `main.ts`):

```ts
import '@signkit/core/styles.css'
```

### 2. Form Builder

Let users design a signing template by placing fields on a PDF:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { FormBuilder } from '@signkit/core'
import type { Template } from '@signkit/core'

const template = ref<Template | null>(null)
</script>

<template>
  <FormBuilder
    pdf="/your-document.pdf"
    v-model="template"
    @update:modelValue="(t) => console.log('template updated', t)"
  />
</template>
```

When the user clicks **Export**, the component emits the updated `Template` object via `v-model`. Save this JSON however your app needs — it's the input to the Signer.

### 3. Signer

Present the saved template to a signer and collect their signature:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Signer } from '@signkit/core'
import type { Template, Manifest } from '@signkit/core'

const props = defineProps<{
  template: Template
}>()

const manifest = ref<Manifest | null>(null)

function onFinalize(result: { signedPdfBytes: Uint8Array; manifest: Manifest }) {
  manifest.value = result.manifest
  // result.signedPdfBytes is the signed PDF — download or send it somewhere
}
</script>

<template>
  <Signer
    pdf-src="/your-document.pdf"
    :template="props.template"
    :signer="{ name: 'Jane Smith', email: 'jane@example.com' }"
    @finalize="onFinalize"
  />
</template>
```

`@finalize` receives `{ signedPdfBytes: Uint8Array, manifest: Manifest }`. The `manifest` is a plain JSON object — store it alongside the signed PDF for your records.

---

## Web Component usage

If you're not using Vue, the components are also available as standard custom elements.

### Script tag (CDN / vanilla HTML)

```html
<script src="https://unpkg.com/@signkit/core/dist/pdf-sign-kit.wc.iife.js"></script>

<!-- Form Builder -->
<pdf-form-builder id="builder"></pdf-form-builder>

<!-- Signer -->
<pdf-form-signer id="signer"></pdf-form-signer>

<script>
  const builder = document.getElementById('builder')
  builder.setAttribute('pdf', '/your-document.pdf')

  builder.addEventListener('template-exported', (e) => {
    const template = e.detail
    console.log('template', template)

    // Pass template to the signer as JSON
    const signer = document.getElementById('signer')
    signer.setAttribute('pdf-src', '/your-document.pdf')
    signer.setAttribute('template', JSON.stringify(template))
  })

  document.getElementById('signer').addEventListener('finalize', (e) => {
    const { manifest, signedPdfBytes } = e.detail
    console.log('manifest', manifest)
  })
</script>
```

### npm bundler

```ts
import '@signkit/core/webcomponents'
// then use <pdf-form-builder> and <pdf-form-signer> in your HTML/templates
```

---

## Theming

Styles are driven by CSS custom properties under the `--sk-` prefix. Override them on `:root` (or any container) after importing the stylesheet:

```css
:root {
  --sk-color-action-primary: #7b61ff;
  --sk-color-on-action: #ffffff;
  --sk-font-signature: 'Shadows Into Light', cursive;
  --sk-radius-md: 8px;
}
```

See the [Styling Guide](https://docs.signkit.dev/styling) for the full token reference.

---

## Key types

| Type | Description |
|---|---|
| `Template` | The form definition — fields, page sizes, metadata |
| `Manifest` | The signing record — field values, hashes, signer info |
| `Field` | Union of `SignatureField`, `TextField`, `DateField`, `CheckboxField` |
| `FormBuilderProps` | Props accepted by `<FormBuilder>` |
| `SignerProps` | Props accepted by `<Signer>` |

Full API reference at [docs.signkit.dev/api](https://docs.signkit.dev/api/README).

---

## License

Apache 2.0 — see [LICENSE](https://github.com/sign-kit/core/blob/main/LICENSE).
