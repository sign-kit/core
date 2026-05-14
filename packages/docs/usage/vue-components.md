# Overview

Use @signkit/core as Vue 3 components with focused guides per surface area.

## Vue Guides

- [FormBuilder](./form-builder) - Build templates, customize inspector controls, export template JSON.
- [Signer](./signer) - Fill fields, collect signatures, and finalize signed artifacts.
- [Dynamic Fields](./dynamic-fields) - Configure host-driven inspector controls and nested field metadata.
- [useSignerManager](./use-signer-manager) - Drive signing flows programmatically from composables.

## Quick Start

```vue
<template>
  <FormBuilder :pdf="pdfUrl" v-model="template" />
  <Signer :pdf-src="pdfUrl" :template="template" @finalized="onSigned" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FormBuilder, Signer } from '@signkit/core'

const pdfUrl = ref('/sample.pdf')
const template = ref({ id: 'template-1', version: '1.0.0', pages: [], fields: [] })

function onSigned(payload: unknown) {
  console.log(payload)
}
</script>
```
