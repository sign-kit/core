# Integrity & Security Overview

This library provides optional **local integrity checks** via SHA-256 hashing. This guide explains what that means, what it does and doesn't provide, and how to use it.

## What Is Integrity Checking?

Integrity checking verifies that a PDF, template, and signed field values **have not been tampered with** after creation.

### How It Works

The Signer computes SHA-256 hashes of:

1. **Original PDF**: Hash of the unmodified PDF file
2. **Template**: Hash of the template JSON (canonicalized for consistency)
3. **Field Values**: Hash of all filled field values

These hashes are stored in the **manifest**. Later, anyone can recompute the hashes and compare:
- If hashes match: PDF and template are authentic
- If hashes differ: Something was modified

### Example Workflow

```
1. Designer creates template → Stores template hash
2. User signs PDF with template → Hashes computed, stored in manifest
3. Later, verify hashes match stored values → Authentic ✓
```

## What It Does NOT Provide

This library does **not** provide:

- **PKI/Digital Certificates**: No cryptographic proof of identity or signing authority
- **Legal Admissibility**: These signatures are not court-recognized or legally binding
- **Server Attestation**: No timestamp authority or external verification
- **Tamper Detection on Signatures**: The signature image itself can be modified in the PDF

For legally binding signatures or court-recognized proof, you must integrate with a server-side PKI solution.

## When to Use Integrity Mode

### Use Integrity Checking When:
- ✅ You want to detect accidental document tampering
- ✅ You need audit trails and basic verification
- ✅ You want users to verify "this PDF wasn't modified locally"
- ✅ You're signing sensitive internal documents (non-legal)

### Don't Use Integrity Checking When:
- ❌ You need legally binding signatures
- ❌ You need to prove WHO signed (no identity verification)
- ❌ You need to prove WHEN it was signed (no timestamp)
- ❌ You need server-backed cryptographic proof

## Usage

### Enable Integrity Mode

```vue
<Signer
  mode="integrity"
  :expected-hashes="{
    pdfHash: 'abc123...',
    templateHash: 'def456...'
  }"
  @finalized="onSigned"
/>
```

### Hash Verification Modes

```typescript
verification-mode="warn"    // Show warning if hashes don't match (default)
verification-mode="strict"  // Block finalization if hashes don't match
verification-mode="disabled" // Skip verification (for testing)
```

### Access Computed Hashes

```vue
<script setup>
function onHashComputed(hashes) {
  console.log('PDF Hash:', hashes.pdfHash)
  console.log('Template Hash:', hashes.templateHash)
  console.log('Values Hash:', hashes.valuesHash)
  
  // Store for later verification
  localStorage.setItem('original-hashes', JSON.stringify(hashes))
}
</script>

<Signer
  mode="integrity"
  @integrity-check="onHashComputed"
/>
```

## Verification Workflow

### First Signing: Capture Hashes

```typescript
// User signs the first time
const manifest = payload.manifest  // Contains hashes
const expectedHashes = {
  pdfHash: manifest.pdfHash,
  templateHash: manifest.template.hash,
  valuesHash: manifest.valuesHash,
}

// Store these for comparison later
await saveToDatabase(expectedHashes)
```

### Later: Verify Hashes Match

```typescript
// Load the same PDF and template
const signer = new Signer({
  mode: 'integrity',
  expectedHashes: expectedHashes,
  verificationMode: 'strict',
})

// If hashes don't match, the user sees a warning
// In strict mode, they can't finalize without overriding
```

## Example: Complete Verification Flow

```vue
<template>
  <div>
    <div v-if="verificationResult" class="verification-banner">
      <div v-if="verificationResult.summary === 'all-match'" class="success">
        ✓ All hashes match. Document is authentic.
      </div>
      <div v-else class="warning">
        ⚠️ Hash mismatch detected. Document may have been modified.
      </div>
    </div>

    <Signer
      mode="integrity"
      :expected-hashes="expectedHashes"
      verification-mode="strict"
      @integrity-verification="verificationResult = $event"
      @finalized="onSigned"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Signer } from '@sign-kit/core'

const verificationResult = ref(null)
const expectedHashes = ref({
  pdfHash: 'abc123...',
  templateHash: 'def456...',
  valuesHash: 'xyz789...',
})

function onSigned(payload) {
  console.log('Signed! New hashes:')
  console.log('  PDF:', payload.manifest.pdfHash)
  console.log('  Template:', payload.manifest.template.hash)
  console.log('  Values:', payload.manifest.valuesHash)
}
</script>

<style scoped>
.verification-banner {
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
}
.success {
  background: #e6ffed;
  color: #1a7f4a;
  border: 1px solid #1a7f4a;
}
.warning {
  background: #fff4e6;
  color: #9a5a00;
  border: 1px solid #9a5a00;
}
</style>
```

## Security Considerations

### Limitations

1. **Hashes are not secret**: Anyone with the manifest can see the hashes. They're for integrity, not confidentiality.
2. **Hash collisions are theoretically possible**: SHA-256 is cryptographically secure, but no hash is 100% collision-proof.
3. **No replay protection**: Nothing prevents someone from signing the same document twice.
4. **Signature image verification**: The signature image itself can't be verified; only the template and values can.

### Best Practices

- ✅ Store hashes in a tamper-proof location (signed audit log, blockchain, timestamp authority)
- ✅ Use integrity mode for sensitive internal workflows
- ✅ Combine with server-backed signatures for legal documents
- ✅ Include manifests in audit trails for accountability
- ✅ Display clear UI: tell users what integrity checking does and doesn't guarantee

## Server Integration

For legally binding signatures, integrate with a server:

```typescript
// After user signs locally, send to server for PKI signing
const manifest = payload.manifest

const response = await fetch('/api/sign-pki', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pdfHash: manifest.pdfHash,
    templateHash: manifest.template.hash,
    signer: manifest.signer,
  }),
})

const { signedPdfWithCert } = await response.json()
// Now you have a PKI-signed PDF with certificate
```

See [Server Integration](/integrity/server-integration) for detailed examples.

## FAQ

**Q: Can I verify a manifest without the original PDF?**  
A: No. You need the original PDF bytes to recompute the PDF hash. Store the original PDF alongside the manifest.

**Q: What if someone modifies the signature image in the PDF?**  
A: The signature image is stored as a raster (PNG bytes) in the PDF. Modifying it won't change the valuesHash (which hashes field text values), but you'll notice the signature image changed visually. Combine with server attestation for stronger guarantees.

**Q: Can I use this for e-signatures in regulated industries?**  
A: No. Regulatory frameworks (e.g., eIDAS, ESIGN Act) require PKI-backed signatures with timestamps and certificates. This library is for local workflows only. Integrate with a server PKI solution for compliance.

**Q: How do I handle hash mismatches in production?**  
A: Log the mismatch, alert the user, and block finalization. Ask the user to reupload the original PDF or contact support.
