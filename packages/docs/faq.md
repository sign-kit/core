# FAQ

Common questions and answers about `@sign-kit/core`.

## General Questions

### What is this library for?

This library helps you:
1. Design PDF form templates in the browser
2. Let users sign those PDFs (draw signatures, type, fill fields)
3. Export signed PDFs and metadata (manifest JSON)
4. Optionally verify integrity via hashing

All offline, in the browser, no server needed.

### Do I need a backend?

**No**. The library works fully offline in the browser. You can optionally add a server to:
- Store templates and manifests
- Apply PKI signatures (for legally binding documents)
- Log signing events for audit trails

### Can I use this for legally binding signatures?

**Not alone**. Local client-side signing is not legally binding. To make signatures legally binding, integrate with a server-side PKI solution. See [Server Integration](/integrity/server-integration).

### Is it secure?

The library uses:
- **Web Crypto API** for SHA-256 hashing (cryptographically secure)
- **Client-side processing** (nothing sent to servers unless you configure it)
- **PDF.js + pdf-lib** (widely used, battle-tested libraries)

However, security depends on your threat model:
- ✅ Detects local tampering (hashing)
- ❌ Does not prove signer identity (no PKI)
- ❌ Does not provide legal proof (no timestamps/certificates)

### What are the browser requirements?

- Chrome/Edge 90+
- Firefox 90+
- Safari 14+
- Any browser with Web Crypto API support

Older browsers: use a polyfill or Vue components in an older-compatible environment.

## Usage Questions

### How do I use it with Vue?

```vue
<script setup>
import { FormBuilder, Signer } from '@sign-kit/core'
</script>

<template>
  <FormBuilder :pdf="url" v-model="template" />
  <Signer :pdf-src="url" :template="template" @finalized="onSigned" />
</template>
```

See [Vue Usage](/usage/vue-usage).

### How do I use it without Vue?

Use Web Components:

```html
<pdf-form-builder pdf="/sample.pdf"></pdf-form-builder>
<pdf-signer pdf="/sample.pdf" template='{ "id": "t1", "fields": [] }'></pdf-signer>

    <script src="https://unpkg.com/@sign-kit/core/dist/web-components.js"></script>
```

See [Web Components](/usage/web-components).

### Can I customize the styling?

Yes. Override CSS custom properties (tokens):

```css
:root {
  --sk-color-action-primary: #0066cc;
  --sk-field-accent: #f0f0f0;
  --sk-radius-sm: 4px;
}
```

See the [Styling Guide](/styling) for all tokens.

### How do I load a PDF from a file upload?

```vue
<script setup>
function handleFileUpload(e) {
  const file = e.target.files[0]
  pdfSource.value = file // Can be File object
}
</script>

<template>
  <input type="file" accept=".pdf" @change="handleFileUpload" />
  <FormBuilder :pdf="pdfSource" />
</template>
```

### How do I load a PDF from a URL?

```vue
<template>
  <FormBuilder pdf="https://example.com/sample.pdf" />
</template>
```

CORS must be enabled on the server.

### How do I load a PDF from an ArrayBuffer?

```javascript
const arrayBuffer = await fetch('/sample.pdf').then(r => r.arrayBuffer())
pdfSource.value = arrayBuffer
```

## Integrity & Hashing Questions

### What is integrity checking?

Integrity checking uses SHA-256 hashing to verify that:
- The PDF hasn't been modified
- The template hasn't been modified
- The field values haven't been modified

It does **not** verify who signed or that signing was legally valid. See [Integrity Overview](/integrity/overview).

### When should I use integrity mode?

Use it for:
- ✅ Internal document workflows
- ✅ Audit trails and verification
- ✅ Detecting accidental tampering

Don't use it for:
- ❌ Legally binding documents (integrate server PKI)
- ❌ Proving signer identity (no authentication)

### How do I verify hashes later?

1. Save the manifest JSON after signing
2. Load the same PDF + template + manifest in the Signer
3. Set `mode="integrity"` and `expected-hashes`
4. Signer computes new hashes and compares
5. Green checkmarks = authentic ✓

### Can hashes be faked?

Theoretically, yes someone could modify the PDF, recompute the hash, and fake a new manifest. This is why integrity checking is for **local verification** only. For proof, integrate with a server timestamp or PKI solution.

## Technical Questions

### What file formats does this support?

- **Input**: PDF only (via pdf-lib)
- **Output**: PDF (signed) and JSON (manifest)

For other formats (Word, PowerPoint), you'd need a different tool.

### How large can PDFs be?

In-browser signing performance depends on:
- PDF file size (larger = slower parsing)
- Number of fields (more fields = more processing)
- Signature resolution (higher = larger file)

Typically, PDFs < 50MB work fine. For larger files, consider server-side processing.

### Can I embed images in signatures?

Yes. Signatures are stored as PNG images. You can provide a data URL:

```javascript
const dataUrl = await canvas.toDataURL('image/png')
manager.setValue('signature-field', dataUrl)
```

### How do I validate fields before finalizing?

Use the manifest's `values` array:

```javascript
function validateRequired(fields, values) {
  const valueMap = Object.fromEntries(values.map(v => [v.id, v.value]))
  for (const field of fields) {
    if (field.required && !valueMap[field.id]) {
      return { ok: false, missing: field.id }
    }
  }
  return { ok: true }
}
```

Or use `useSignerManager.validate()`.

### Can I access the PDF bytes after signing?

Yes. The `finalized` event returns a Blob:

```vue
<script setup>
async function onSigned(payload) {
  const pdfBytes = await payload.signedPdf.arrayBuffer()
  console.log('PDF size:', pdfBytes.byteLength)
}
</script>
```

## Advanced Questions

### Can I add custom validation rules?

Yes. Add a `validation` object to fields:

```json
{
  "id": "email",
  "type": "email",
  "validation": {
    "email": true,
    "pattern": "^[a-zA-Z0-9._%+-]+@company\\.com$"
  }
}
```

Then validate before finalizing.

### Can I add digital signatures (with certificates)?

Not with this library alone. You need a server-side PKI solution. See [Server Integration](/integrity/server-integration).

### Can I implement workflow routing?

Yes. Use the manifest's `signer` info and role-based fields:

```typescript
const manifest = payload.manifest
if (manifest.signer.role === 'approver') {
  // Route to archive
} else if (manifest.signer.role === 'requester') {
  // Route to workflow next step
}
```

### Can I use TypeScript?

Yes. The library is fully typed:

```typescript
import type { Template, Field, Manifest } from '@sign-kit/core'

const template: Template = { /* ... */ }
const manifest: Manifest = { /* ... */ }
```

All interfaces are exported.

### Can I extend the library with custom components?

Yes. The components are composable Vue 3 components. You can:
- Wrap them in custom shells
- Override event handlers
- Combine with your own UI

## Performance Questions

### Is signing slow?

No. Signing happens instantly on modern browsers:
- PDF parsing: ~100ms for typical 10-page PDF
- Signature rendering: <50ms
- PDF generation: ~200ms

Total: typically under 1 second.

### Will this work on mobile?

Yes. Web Components and Vue components work on:
- iOS Safari
- Android Chrome
- Any mobile browser with Web Crypto support

Touch events work for drawing signatures.

### Can I pre-compute hashes for offline verification?

Yes. Compute and store hashes when creating the template:

```typescript
const templateHash = await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(JSON.stringify(template))
)
```

Store this and compare later during verification.

## Support & Troubleshooting

### Where can I report bugs?

Open an issue on [GitHub](https://github.com/sign-kit/core).

### Can I contribute?

Yes! See [Contributing](/contributing).

### How do I get help?

- Check the [Documentation](/getting-started)
- Review [Demo Walkthrough](/demo-walkthrough)
- Open an issue on GitHub

### Is there a community?

Not yet. This is a new library. Contributions welcome!
