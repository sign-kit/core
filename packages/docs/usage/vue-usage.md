# Vue Components

Use the library as Vue 3 components for seamless integration with your Vue app.

## FormBuilder

The `FormBuilder` component lets users design PDF templates by placing and configuring fields.

### Basic Usage

```vue
<template>
  <FormBuilder :pdf="pdfUrl" v-model="template" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FormBuilder } from '@signkit/core'
import '@signkit/core/dist/styles.css'

const pdfUrl = ref('/sample.pdf')
const template = ref({
  id: 'template-1',
  version: '1.0.0',
  pages: [],
  fields: [],
})
</script>
```

### Props

- **`pdf`** (string | File | ArrayBuffer): PDF source (URL, File object, or ArrayBuffer)
- **`modelValue`** (Template): The template object (use `v-model`)
- **`dateLocale`** (string, optional): Locale for date formatting (e.g., `en-US`, `de-DE`)

### Events

- **`update:modelValue`** (Template): Emitted when template changes

### Example: Save Template

```vue
<template>
  <div>
    <FormBuilder :pdf="pdfUrl" v-model="template" />
    <button @click="saveTemplate">Save Template</button>
  </div>
</template>

<script setup lang="ts">
function saveTemplate() {
  const json = JSON.stringify(template.value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'template.json'
  a.click()
}
</script>
```

## Signer

The `Signer` component lets users fill fields, draw/type signatures, and export a signed PDF.

### Basic Usage

```vue
<template>
  <Signer
    :pdf-src="pdfUrl"
    :template="template"
    @finalized="onSigned"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Signer } from '@signkit/core'
import type { Manifest } from '@signkit/core'

const pdfUrl = ref('/sample.pdf')
const template = ref({ /* ... */ })

function onSigned(payload: {
  values: any[]
  signedPdf: Blob
  manifest: Manifest
}) {
  console.log('Signed! Manifest:', payload.manifest)
  // Upload or save as needed
}
</script>
```

### Props

- **`pdfSrc`** (string | File | ArrayBuffer): PDF source
- **`template`** (Template): Template object with fields
- **`signer`** (object, optional): Signer info `{ id?, name?, email?, role? }`
- **`mode`** ('standard' | 'integrity', default: 'standard'): Signing mode
- **`expectedHashes`** (object, optional): Expected `{ templateHash?, pdfHash?, valuesHash? }` for integrity mode
- **`verificationMode`** ('disabled' | 'warn' | 'strict', default: 'warn'): Hash verification behavior
- **`allowOverride`** (boolean, default: false): Allow finalization even if verification fails
- **`readonly`** (boolean, default: false): Make all fields readonly
- **`embedPdfHash`** (boolean, default: false): Embed PDF hash in the signed PDF footer

### Events

- **`finalized`** (payload): Emitted when user clicks "Finalize & Download"
- **`integrity-check`** (payload): Emitted with computed hashes
- **`integrity-verification`** (payload): Emitted with verification results

### Example: Role-Based Fields

Restrict certain fields to specific signers:

```vue
<template>
  <Signer
    :pdf-src="pdfUrl"
    :template="template"
    :signer="{ name: 'John', role: 'approver' }"
  />
</template>

<script setup lang="ts">
const template = ref({
  fields: [
    { id: 'f1', type: 'signature', role: 'approver', /* ... */ },
    { id: 'f2', type: 'text', role: 'requester', /* ... */ },
  ],
})
</script>
```

Only the `approver` can sign the signature field; the `requester` can fill the text field.

## Composables

### useSignerManager

Manage signer state programmatically:

```vue
<script setup lang="ts">
import { useSignerManager } from '@signkit/core'

const pdfBytes = await fetch('/sample.pdf').then(r => r.arrayBuffer())
const template = { /* ... */ }

const manager = useSignerManager(template, pdfBytes, { name: 'John' })

// Get/set values
manager.setValue('field-id', 'value')
const value = manager.getValue('field-id')

// Validate
const { ok, errors } = manager.validate()

// Finalize
const { signedPdfBytes, manifest } = await manager.finalize({
  mode: 'integrity',
  embedPdfHash: true,
})
</script>
```

## Styling

Override CSS custom properties:

```css
:root {
  --sk-color-action-primary: #0066cc;
  --sk-color-text-primary: #333;
  --sk-field-accent: #f0f0f0;
  --sk-radius-sm: 4px;
  --sk-font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

See the [Styling Guide](/styling) for a complete list.
