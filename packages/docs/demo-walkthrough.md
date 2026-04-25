# Demo Walkthrough

Launch the interactive demo to explore all features in action!

## Visit the Demo Site

Visit our live demo at **TODO** to see the Form Builder and Signer in action without installing anything.


## Run it Locally

The easiest way to experience `@sign-kit/core` is through our interactive demo:

```bash
# From the root of the project
npm run dev:demo
```

Then open your browser to **http://localhost:5173** and explore:

- **Form Builder** - Design PDF form templates with drag-and-drop fields
- **PDF Signer** - Sign documents and export signed PDFs with manifests  
- **Integrity Verification** - Verify hashes and validate document authenticity

## Demo Features

### Form Builder Page
- Load any PDF (sample invoice included)
- Drag to place form fields on the PDF
- Configure field types: text, signature, date, checkbox, email, etc.
- Customize labels, validation rules, and metadata
- Download template as JSON for reuse

### Signer Page  
- Upload a PDF and existing template
- Fill in all form fields with values
- Draw or type signatures with real-time preview
- Finalize and download signed PDF + manifest JSON
- Review field values and signer metadata

### Integrity Page
- Auto-sync with templates from the Builder
- Compute SHA-256 hashes for verification
- Compare expected vs. actual hashes (copy buttons included)
- Instant visual feedback for tamper detection

## Learn More

For detailed walkthroughs of each feature, see:
- [Vue Components Usage](/usage/vue-usage)
- [Web Components Usage](/usage/web-components)
- [FormBuilder API](/api/form-builder)
- [Signer API](/api/signer)

## Next Steps

- [Installation Guide](/installation) - Install in your own project
- [Getting Started](/getting-started) - Core concepts and workflow
- [API Reference](/api/form-builder) - Component props and events
