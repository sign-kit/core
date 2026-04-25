# Installation

## NPM

```bash
npm install @sign-kit/core
```

## Yarn

```bash
yarn add @sign-kit/core
```

## PNPM

```bash
pnpm add @sign-kit/core
```

## Requirements

- **Node.js**: 14+
- **Vue**: 3.2+ (if using Vue components)
- **Browser**: Modern browser with Web Crypto API support (all modern browsers)

## Setup

### Vue 3 Components

Import components directly in your Vue app:

```vue
<script setup>
import { FormBuilder, Signer } from '@sign-kit/core'
import '@sign-kit/core/dist/style.css'
</script>

<template>
  <FormBuilder :pdf="pdfUrl" v-model="template" />
</template>
```

### Web Components (Vanilla JS)

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="https://unpkg.com/@sign-kit/core@latest/dist/web-components.css" />
  </head>
  <body>
    <pdf-form-builder pdf="/sample.pdf"></pdf-form-builder>
    
    <script src="https://unpkg.com/@sign-kit/core@latest/dist/web-components.js"></script>
    <script>
      const builder = document.querySelector('pdf-form-builder')
      builder.addEventListener('template-updated', (e) => {
        console.log('Template:', e.detail.template)
      })
    </script>
  </body>
</html>
```

### TypeScript Types

All components and utilities are fully typed. Types are auto-included:

```typescript
import type { Template, Field, Manifest } from '@sign-kit/core'

const template: Template = {
  id: 't1',
  version: '1.0.0',
  pages: [{ width: 612, height: 792 }],
  fields: [],
}
```

## Styles

Import CSS to apply default styling:

```javascript
import '@sign-kit/core/dist/style.css'
```

All CSS custom properties (tokens) can be overridden:

```css
:root {
  --sk-color-action-primary: #0066cc;
  --sk-color-text-primary: #333;
  --sk-font-family-sans: 'Inter', sans-serif;
  /* see source for full list */
}
```

## Next Steps

- [Vue Components Usage](/usage/vue-usage)
- [Web Components Usage](/usage/web-components)
