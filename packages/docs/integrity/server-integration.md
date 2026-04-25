# Server Integration

Learn how to integrate server-backed PKI signing with `@sign-kit/core` for legally binding signatures.

## Overview

The library handles client-side form design and signing. For court-admissible, legally binding signatures, integrate with a server that provides:

- **PKI Certificates**: Proof of signer identity
- **Timestamps**: Proof of when signed
- **Digital Signatures**: Cryptographic proof (PAdES, CMS, etc.)

The typical flow:

```
1. Client signs locally (draw signature, fill fields)
   ↓
2. Client sends manifest to server
   ↓
3. Server verifies manifest, applies PKI signature
   ↓
4. Server returns PDF with embedded certificate
   ↓
5. PDF is legally binding ✓
```

## Client-Side: Capture Signing Data

```vue
<template>
  <Signer
    :pdf-src="pdfUrl"
    :template="template"
    mode="integrity"
    @finalized="sendToServer"
  />
</template>

<script setup lang="ts">
async function sendToServer(payload) {
  const {
    values,          // Filled field values
    signedPdf,       // User-signed PDF (Blob)
    manifest,        // Manifest with hashes
  } = payload

  // Send to server
  const formData = new FormData()
  formData.append('signedPdf', signedPdf)
  formData.append('manifest', JSON.stringify(manifest))
  formData.append('signer', JSON.stringify(manifest.signer))

  const response = await fetch('/api/finalize-with-pki', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Server signing failed')
  }

  const { pdfWithCert } = await response.json()
  // Download legally binding PDF
  downloadPdf(pdfWithCert, 'signed-legally-binding.pdf')
}
</script>
```

## Server-Side: Apply PKI Signature

Here's a Node.js example with a PKI service (e.g., AWS IoT Jobs, Azure Key Vault, DigiCert):

```typescript
import express from 'express'
import pdfLib from 'pdf-lib'
import crypto from 'crypto'

const app = express()

app.post('/api/finalize-with-pki', async (req, res) => {
  try {
    // 1. Parse request
    const { signedPdf, manifest, signer } = req.body
    const pdfBytes = Buffer.from(signedPdf, 'base64')

    // 2. Verify manifest integrity (optional but recommended)
    const manifestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(manifest))
      .digest('hex')

    if (manifestHash !== manifest.templateHash) {
      return res.status(400).json({ error: 'Manifest tampered with' })
    }

    // 3. Load PDF with pdf-lib
    const pdfDoc = await pdfLib.PDFDocument.load(pdfBytes)

    // 4. Call PKI service (example: AWS Signer, DigiCert, Entrust, etc.)
    const { signature, timestamp, certificate } = await signWithPKI(
      pdfBytes,
      signer
    )

    // 5. Embed PKI signature in PDF (varies by format)
    // For simplicity, here we add metadata; real implementations use CMS/PAdES
    const page = pdfDoc.getPage(0)
    page.drawText(`Signed: ${signer.name} at ${timestamp}`, {
      x: 50,
      y: 50,
      size: 12,
    })

    // 6. Save and return
    const pdfWithCert = await pdfDoc.save()
    res.json({
      pdfWithCert: Buffer.from(pdfWithCert).toString('base64'),
      signature,
      timestamp,
      certificate,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

async function signWithPKI(pdfBytes, signer) {
  // Integrate with your PKI provider
  // Examples:
  // - AWS Signer (KMS)
  // - DigiCert (API)
  // - Entrust
  // - Azure Key Vault
  // - OpenDSU/OpenESSIF

  const timestamp = new Date().toISOString()
  const signature = crypto.sign(
    'sha256',
    pdfBytes,
    {
      key: process.env.PRIVATE_KEY,
    }
  )

  return {
    signature: signature.toString('base64'),
    timestamp,
    certificate: process.env.CERTIFICATE,
  }
}

app.listen(3000)
```

## PKI Service Integration Examples

### AWS Signer (KMS)

```typescript
import { SignerClient, SignCommand } from '@aws-sdk/client-signer'

async function signWithAWS(pdfBytes, signer) {
  const client = new SignerClient()
  const command = new SignCommand({
    profileName: 'prod-signer',
    signatureAlgorithm: 'ECDSA',
    messageFormat: 'RAW',
    message: pdfBytes,
  })
  const response = await client.send(command)
  return {
    signature: response.signature,
    timestamp: response.signingTime,
    certificate: response.certificate,
  }
}
```

### DigiCert API

```typescript
async function signWithDigiCert(pdfBytes, signer) {
  const response = await fetch('https://api.digicert.com/v2/sign', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DIGICERT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pdf_base64: Buffer.from(pdfBytes).toString('base64'),
      signer_name: signer.name,
      signer_email: signer.email,
    }),
  })
  const data = await response.json()
  return {
    signature: data.signature,
    timestamp: data.timestamp,
    certificate: data.certificate_chain,
  }
}
```

### Azure Key Vault

```typescript
import { CryptographyClient, KryptographyKeyClient } from '@azure/keyvault-keys'

async function signWithAzureKV(pdfBytes, signer) {
  const client = new CryptographyClient(vaultUrl, credential)
  const signResult = await client.sign('RS256', pdfBytes)
  return {
    signature: signResult.result.toString('base64'),
    timestamp: new Date().toISOString(),
    certificate: process.env.AZURE_CERT,
  }
}
```

## PAdES Embedding (Advanced)

For advanced use cases, embed PKI signatures in PAdES format (PDF Advanced Electronic Signatures):

```typescript
import { PDFDocument } from 'pdf-lib'
import { CMS } from 'pkijs'

async function embedPADeS(pdfBytes, signature, certificate) {
  // PAdES requires specific PDF structure + CMS signature container
  // Libraries: PDFtk, iText (Java), pdfbox (Java), OpenPGP.js

  // Simplified example:
  const pdfDoc = await PDFDocument.load(pdfBytes)

  // Create CMS container with signature
  const cms = new CMS.SignedData({
    version: 3,
    digestAlgorithms: [{ algorithm: '2.16.840.1.101.3.4.2.1' }], // SHA-256
    contentInfo: { contentType: '1.2.840.113549.1.7.1' },
    certificates: [certificate],
    signerInfos: [
      {
        version: 3,
        sid: { issuerAndSerialNumber: { issuer: certificate.issuer } },
        digestAlgorithm: { algorithm: '2.16.840.1.101.3.4.2.1' },
        signatureAlgorithm: { algorithm: '1.2.840.113549.1.1.11' }, // sha256WithRSAEncryption
        signature: signature,
      },
    ],
  })

  // Embed in PDF signature field
  // (requires specialized PDF signing library)

  return pdfDoc
}
```

For production PAdES, consider using:
- **iText** (Java/C#/.NET) - Full PAdES support
- **PDFtk** - Command-line PAdES
- **OpenDSU** - Open-source PKI/PAdES
- **LTV (Long-Term Validation)** - Add timestamps and OCSP responses

## Verification Flow

Users can verify a PKI-signed PDF with command-line tools or dedicated libraries:

```bash
# Verify signature on Linux/Mac
openssl cms -verify -in signed.pdf -inform DER -nointern -nosigs -certfile cert.pem
```

Or in JavaScript:

```typescript
import { verifyPDF } from 'pdf-signing-library'

const result = await verifyPDF('signed-legally-binding.pdf')
console.log(result)
// {
//   valid: true,
//   signer: 'Alice Johnson',
//   timestamp: '2024-01-15T10:00:00Z',
//   certificate: { subject: '...', issuer: '...' },
// }
```

## Compliance & Regulations

Different jurisdictions require different signing formats:

| Region | Law | Format | Library |
|--------|-----|--------|---------|
| EU | eIDAS | PAdES, CMS | iText, OpenDSU |
| USA | ESIGN Act, UETA | CMS, XML-DSig | iText, JSXSign |
| Canada | PIPEDA | PAdES, CMS | iText |
| Globally | ISO 32000 | PDF/A-3 with XAdES | PDFtk, iText |

Always consult legal counsel for your jurisdiction's requirements.

## Example: Complete End-to-End Flow

**Client-side**:
```vue
<Signer
  mode="integrity"
  @finalized="(p) => sendToServer(p)"
/>
```

**Server-side**:
```typescript
app.post('/api/finalize-with-pki', async (req, res) => {
  const manifest = req.body.manifest
  
  // Verify manifest
  if (!verifyManifestHash(manifest)) {
    return res.status(400).json({ error: 'Integrity check failed' })
  }

  // Sign with PKI
  const { pdfWithPKI } = await applyPKISignature(manifest)
  
  // Return to client
  res.json({ pdfWithPKI })
})
```

**Result**: Client has a locally signed PDF, server applies PKI, client downloads legally binding version.

## Tips

- ✅ Always verify manifest integrity before applying PKI
- ✅ Use HTTPS for all communication
- ✅ Log all signing events for audit trails
- ✅ Include timestamps from a trusted authority
- ✅ Test with your jurisdiction's requirements
- ❌ Don't claim security without proper PKI integration
- ❌ Don't store private keys in your client code
