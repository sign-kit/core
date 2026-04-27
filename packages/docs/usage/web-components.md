# Web Components

Use `@signkit/core` as Web Components (custom HTML elements) in any HTML/JS framework.

## Overview

Web Components allow you to use the library without Vue:
- `<pdf-form-builder>` - Design templates
- `<pdf-signer>` - Sign PDFs

## Setup

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="https://unpkg.com/@signkit/core/dist/web-components.css" />
  </head>
  <body>
    <script src="https://unpkg.com/@signkit/core/dist/web-components.js"></script>
  </body>
</html>
```

## pdf-form-builder

```html
<pdf-form-builder pdf="/sample.pdf"></pdf-form-builder>

<script>
  const builder = document.querySelector('pdf-form-builder')
  
  // Listen for template updates
  builder.addEventListener('template-changed', (e) => {
    const template = e.detail
    console.log('Template:', template)
    // Save to server, localStorage, etc.
  })
  
  // Set initial template
  builder.template = {
    id: 't1',
    version: '1.0.0',
    pages: [],
    fields: [],
  }
</script>
```

### Attributes

- **`pdf`** (string): URL to PDF file
- **`template`** (object, JS property): Template object

### Events

- **`template-changed`** (CustomEvent): Fired when template is modified. Detail contains updated template.

### Example: Save and Load

```html
<html>
  <body>
    <button @click="saveTemplate">Save Template</button>
    <input type="file" @change="loadTemplate" accept="application/json" />
    <pdf-form-builder pdf="/sample.pdf"></pdf-form-builder>

    <script>
      const builder = document.querySelector('pdf-form-builder')

      builder.addEventListener('template-changed', (e) => {
        localStorage.setItem('template', JSON.stringify(e.detail))
      })

      function saveTemplate() {
        const template = builder.template
        const json = JSON.stringify(template, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template.json'
        a.click()
      }

      function loadTemplate(e) {
        const file = e.target.files[0]
        if (!file) return
        file.text().then(text => {
          builder.template = JSON.parse(text)
        })
      }
    </script>
  </body>
</html>
```

## pdf-signer

```html
<pdf-signer
  pdf="/sample.pdf"
  template='{"id":"t1","fields":[]}'
></pdf-signer>

<script>
  const signer = document.querySelector('pdf-signer')
  
  signer.addEventListener('finalized', (e) => {
    const { signedPdf, manifest } = e.detail
    console.log('Signed PDF:', signedPdf)
    console.log('Manifest:', manifest)
  })
  
  signer.signer = { name: 'John Doe', email: 'john@example.com' }
</script>
```

### Attributes

- **`pdf`** (string): URL to PDF
- **`template`** (string, JSON): Template as JSON string
- **`signer`** (object, JS property): Signer info `{ id?, name?, email?, role? }`
- **`mode`** (string): 'standard' or 'integrity'
- **`readonly`** (boolean): Make fields readonly

### Events

- **`finalized`** (CustomEvent): Fired when user clicks "Finalize & Download". Detail:
  ```javascript
  {
    values: [...],
    signedPdf: Blob,
    manifest: { /* ... */ }
  }
  ```

### Example: Complete Workflow

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="https://unpkg.com/@signkit/core/dist/web-components.css" />
  </head>
  <body>
    <div id="app">
      <h2 id="stage-title"></h2>
      <div id="container"></div>
    </div>

    <script src="https://unpkg.com/@signkit/core/dist/web-components.js"></script>
    <script>
      let stage = 'builder' // or 'signer'
      let template = { id: 't1', fields: [], pages: [] }
      const container = document.getElementById('container')
      const title = document.getElementById('stage-title')

      function showBuilder() {
        stage = 'builder'
        title.textContent = 'Design Template'
        const builder = document.createElement('pdf-form-builder')
        builder.pdf = '/sample.pdf'
        builder.template = template
        builder.addEventListener('template-changed', (e) => {
          template = e.detail
        })
        container.innerHTML = ''
        container.appendChild(builder)
        
        const btn = document.createElement('button')
        btn.textContent = 'Next: Sign'
        btn.onclick = showSigner
        container.appendChild(btn)
      }

      function showSigner() {
        stage = 'signer'
        title.textContent = 'Sign PDF'
        const signer = document.createElement('pdf-signer')
        signer.pdf = '/sample.pdf'
        signer.template = template
        signer.signer = { name: 'John Doe' }
        signer.addEventListener('finalized', (e) => {
          console.log('Done! PDF:', e.detail.signedPdf)
        })
        container.innerHTML = ''
        container.appendChild(signer)
      }

      showBuilder()
    </script>
  </body>
</html>
```

## Styling

Web Components use the same CSS tokens as Vue components:

```css
:root {
  --sk-color-action-primary: #0066cc;
  --sk-color-text-primary: #333;
  --sk-field-accent: #f0f0f0;
  --sk-radius-sm: 4px;
}
```

Override in your stylesheet to customize appearance.

## Browser Support

Web Components work in all modern browsers:
- Chrome/Edge 90+
- Firefox 90+
- Safari 14+

For older browsers, use a polyfill for Web Components or use Vue components instead.
