# Limitations & Scope

This document clearly describes what `@signkit/core` does and doesn't do.

## What It Does

✅ **Local PDF form design and signing**
- Create fillable PDF form templates in the browser
- Let users draw signatures, type names, fill text fields
- Export signed PDFs with embedded signatures
- All in the browser, no server required

✅ **Client-side manifest generation**
- Export JSON metadata about signed documents
- Include signer info, timestamp, field values
- Optional SHA-256 hashing for integrity

✅ **Integrity verification**
- Compute and compare SHA-256 hashes
- Detect local tampering (PDF/template modification)
- Audit trails via manifest JSON

✅ **Full offline operation**
- Works with no internet connection
- No tracking or telemetry
- User data never leaves their device

✅ **Flexible deployment**
- Vue 3 components
- Web Components (custom HTML elements)
- TypeScript support
- ESM + UMD builds

## What It Does NOT Do

❌ **PKI/Digital Certificates**
- No X.509 certificates
- No signer identity verification
- No Certificate Authority (CA) integration
- See [Server Integration](/integrity/server-integration) for PKI setup

❌ **Legal/Court-Admissible Signatures**
- Signatures produced are NOT legally binding
- No compliance with eIDAS (EU), ESIGN Act (US), or other regulations
- Not suitable for contracts or official documents without server PKI

❌ **Timestamps**
- No trusted timestamp authority integration
- No proof of "when" something was signed
- Timestamps in manifests are local device time (unreliable)

❌ **Server-Side Signing**
- Cannot sign documents on the server
- Cannot enforce approval workflows server-side
- Cannot integrate directly with HSMs or key vaults
  - **BUT**: Provides extension points for you to add this

❌ **Encryption**
- No document encryption
- No password protection
- No end-to-end encryption
- Consider external tools (e.g., PDF encryption utilities) if needed

❌ **PDF Form Field Types**
- Only supports custom form fields (text, signature, checkbox, date)
- Does NOT extract or preserve native PDF form fields
- Cannot work with existing fillable PDFs designed in Adobe Acrobat

❌ **Multi-Party Workflows**
- No sequential approval workflows
- No routing logic
- No notification/reminder system
- You build this at the application level

❌ **Biometric Signatures**
- No fingerprint integration
- No face recognition
- Signatures are graphical only

❌ **Blockchain/Distributed Ledgers**
- No blockchain hashing or verification
- No smart contract integration
- Consider external services if needed

## Architectural Constraints

### Client-Side Only

Everything happens in the browser. This means:
- ✅ Instant feedback, no network latency
- ✅ Privacy (documents stay on user's device)
- ❌ Cannot enforce business logic server-side
- ❌ Cannot prevent users from modifying documents locally

### PDF Compatibility

- **Supported**: Standard PDF files (ISO 32000)
- **Partially supported**: Forms with embedded fonts (works but may not render perfectly)
- **Not supported**: Encrypted PDFs, dynamic XFA forms, JavaScript actions, specific PDF features (media, 3D)

### Field Types

Limited to these types:
- `text`, `name`, `email` - Text input
- `date` - Date picker
- `current_date` - Auto-filled current date
- `checkbox` - Boolean toggle
- `signature`, `initials` - Drawn/typed signature

Cannot directly render custom field types.

## Performance Constraints

- **Large PDFs (>100MB)**: May be slow to load/process in browser
- **High-Resolution Signatures**: Larger file sizes if using high DPI
- **Many Fields**: Proportional slowdown with hundreds of fields

For production high-volume use, consider:
- Server-side PDF processing
- Batch operations
- CDN delivery of PDFs

## Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 90+ | Full support |
| Firefox | 90+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support |
| IE 11 | ❌ | Not supported |
| Mobile (iOS) | Safari 14+ | Touch drawing works |
| Mobile (Android) | Chrome 90+ | Touch drawing works |

Web Crypto API required. Use polyfills for older browsers or Vue components in a compatibility layer.

## Data Retention

This library:
- ✅ Does NOT send data to external servers
- ✅ Does NOT store data locally (beyond what you configure)
- ✅ Does NOT track user activity
- ✅ Does NOT use cookies or fingerprinting

YOU are responsible for:
- Storing manifests and PDFs
- Archiving audit trails
- Complying with data protection (GDPR, CCPA, etc.)

## Security Considerations

### What It Provides

- **Code integrity**: TypeScript, no runtime eval
- **Data integrity**: SHA-256 hashing
- **Privacy**: Everything stays in browser
- **Standards**: Uses Web Crypto API (no custom crypto)

### What It Does NOT Provide

- **Signer identity verification** (no PKI)
- **Tamper-proof signatures** (local checking only)
- **Legal admissibility**
- **Server attestation**

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| User modifies PDF locally | Detected by hash verification |
| User modifies template | Detected by hash verification |
| MITM attack on template delivery | Use HTTPS when downloading templates |
| Signer identity spoofing | Integrate server PKI |
| Timestamp forgery | Integrate trusted timestamp service |
| Document repudiation | Use server-signed manifests |

## Regulatory Compliance

### NOT Compliant With

- **eIDAS** (EU electronic signature regulation)
- **ESIGN Act** (USA)
- **PIPEDA** (Canada)
- **Any jurisdiction requiring PKI-backed signatures**

### ONLY Compliant With (Maybe)

- Internal document workflows (subject to your jurisdiction)
- Non-binding forms and surveys
- In-house agreements (not enforceable)

**Always consult legal counsel** for your specific use case.

## Scope Creep Prevention

This library will NOT add:

- ❌ Blockchain/distributed ledger features
- ❌ Biometric authentication
- ❌ Server-side workflow orchestration
- ❌ Document encryption
- ❌ Multi-party approval chains
- ❌ Native app integrations (iOS/Android)
- ❌ Custom PDF form field types beyond the scope

## When to Use This Library

### ✅ Good Use Cases

- Internal document signing (proposals, approvals, timesheets)
- Form filling and local verification
- Feedback forms and surveys
- Prototypes and MVPs
- Learning/demo purposes
- Client-side PDF manipulation

### ❌ Bad Use Cases

- Legal contracts
- Financial transactions
- Healthcare records
- Government documents
- Anything requiring legal proof
- Anything requiring identity verification

### ⚠️ Maybe (Requires Additional Work)

- E-commerce (add server PKI)
- Employee onboarding (add approval workflows)
- Loan applications (add identity verification)
- Mortgage documents (add full PKI + notarization)

## Where to Go From Here

If you need features beyond this library's scope:

1. **PKI/Legal signatures**: [Server Integration Guide](/integrity/server-integration)
2. **Biometric auth**: Integrate auth0, Okta, or similar
3. **Blockchain**: Integrate with Ethereum or similar (if needed)
4. **Workflow routing**: Build at application level with your backend
5. **Encryption**: Use external PDF tools + your encryption layer

---

This library is designed to do **one thing well**: client-side PDF form design, signing, and local verification. For everything else, integrate with specialized services or build additional layers on top.
