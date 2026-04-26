# @sign-kit/core

A **client-first Vue 3 + TypeScript** toolkit for building PDF signing experiences in the browser. Design form templates, let users draw/type signatures, and export signed PDFs-all offline, no backend required.

## Key Features

- **Form Builder**: Load a PDF in the browser, place and configure form fields (text, signature, date, checkbox, etc.), export template JSON
- **PDF Signer**: Load a PDF + template, let users fill fields and sign, generate a signed PDF and manifest JSON with integrity hashes
- **Client-Side Signing**: Everything runs in the browser-no server dependencies
- **Web Components**: Use as custom HTML elements (`<pdf-form-builder>`, `<pdf-signer>`)
- **Vue 3 Components**: Composable, type-safe Vue 3 components for seamless integration
- **Integrity Checks**: Optional SHA-256 hashing for local verification that PDFs and templates haven't been modified
- **Backend-Agnostic**: Emit clean JSON for templates and manifests; you choose persistence and distribution

## Quick Start

```bash
npm install @sign-kit/core
```

```vue
<template>
  <div>
    <FormBuilder :pdf="pdfUrl" v-model="template" />
    <Signer :pdfSrc="pdfUrl" :template="template" @finalized="onSigned" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FormBuilder, Signer } from '@sign-kit/core'

const pdfUrl = ref('/sample.pdf')
const template = ref({ id: 't1', fields: [], pages: [] })

function onSigned(payload) {
  console.log('Signed PDF:', payload.signedPdf)
  console.log('Manifest:', payload.manifest)
}
</script>
```

## How It Works

1. **Builder Phase**: Load a PDF, drag/place/resize fields, export a template JSON
2. **Signer Phase**: Load the PDF + template, users fill fields and sign, get a signed PDF + manifest
3. **Verify (Optional)**: Use integrity hashes to verify PDFs and templates match expected values

### Builder
![Builder Screenshot](/Builder-preview.png)

### Signer
![Signer Screenshot](/Signer-preview.png)

## Learn More

- [Getting Started](/getting-started) - Overview and core concepts
- [Installation](/installation) - Setup instructions
- [Vue Components](/usage/vue-usage) - Build with Vue 3
- [Web Components](/usage/web-components) - Use as custom elements
- [API Reference](/api/README) - Generated API docs (props, types, utilities)
- [FormBuilder Props](/api/interfaces/FormBuilderProps) - Builder component props
- [Signer Props](/api/interfaces/SignerProps) - Signer component props
- [Integrity & Security](/integrity/overview) - Hash verification and server integration
- [Styling Guide](/styling) - CSS tokens and customization
- [Demo](/demo-walkthrough) - Interactive walkthrough
- [FAQ](/faq) - Common questions
- [Contributing](/contributing) - Contribute to the project

## Limitations

This library focuses on **local, client-side form management and signing**. It does NOT provide:
- PKI/digital certificates
- Legal admissibility or court-recognized signatures
- Server-backed cryptographic attestation (but supports it via extension points)

For legally binding signatures, integrate with a server-side PKI solution. See [Sample Server Integration](/integrity/server-integration) for examples.

## License

Apache License 2.0
