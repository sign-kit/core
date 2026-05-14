# Signer

The Signer component lets users fill fields, draw or type signatures, and export signed artifacts.

## Basic Usage

```vue
<template>
  <Signer :pdf-src="pdfUrl" :template="template" @finalized="onSigned" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Signer } from '@signkit/core'
import type { Manifest } from '@signkit/core'

const pdfUrl = ref('/sample.pdf')
const template = ref({ id: 'template-1', version: '1.0.0', pages: [], fields: [] })

function onSigned(payload: { values: unknown[]; signedPdf: Blob; manifest: Manifest }) {
  console.log('Signed', payload.manifest)
}
</script>
```

## Props

- `pdfSrc` (`string | File | ArrayBuffer`, default `undefined`): PDF source to render and sign.
- `template` (`Template`, default `undefined`): Template object with fields.
- `signer` (`{ id?, name?, email?, role? }`, default `undefined`): Current signer identity and role context.
- `mode` (`'standard' | 'integrity'`, default `'standard'`): UI/behavior mode for signing.
- `expectedHashes` (`{ templateHash?, pdfHash?, valuesHash? }`, default `undefined`): Expected hash values used in integrity mode.
- `verificationMode` (`'disabled' | 'warn' | 'strict'`, default `'warn'`): How integrity mismatches are handled.
- `allowOverride` (`boolean`, default `false`): Allows user override when verification fails.
- `readonly` (`boolean`, default `false`): Makes all fields read-only.
- `embedPdfHash` (`boolean`, default `false`): Embeds PDF hash in signed output metadata.

## Events

| Event | Payload | Description |
|---|---|---|
| `finalized` | `{ values, signedPdf, manifest }` | Fired when user finalizes signing. |
| `integrity-check` | `{ templateHash, pdfHash, valuesHash }` | Fired with computed hash values. |
| `integrity-verification` | `{ ok, verdict, details }` | Fired with integrity verification outcome. |

## Role-Based Example

```vue
<template>
  <Signer :pdf-src="pdfUrl" :template="template" :signer="{ name: 'John', role: 'approver' }" />
</template>

<script setup lang="ts">
const template = {
  fields: [
    { id: 'f1', type: 'signature', role: 'approver' },
    { id: 'f2', type: 'text', role: 'requester' },
  ],
}
</script>
```

Only the approver can sign the signature field while the requester can fill requester fields.

## Related Guides

- [FormBuilder](./form-builder)
- [useSignerManager](./use-signer-manager)
