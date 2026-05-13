# Installation

## NPM

```bash
npm install @signkit/core
```

## Yarn

```bash
yarn add @signkit/core
```

## PNPM

```bash
pnpm add @signkit/core
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
import { FormBuilder, Signer } from '@signkit/core'
import '@signkit/core/dist/styles.css'
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
    <link rel="stylesheet" href="https://unpkg.com/@signkit/core@latest/dist/web-components.css" />
  </head>
  <body>
    <pdf-form-builder pdf="/sample.pdf"></pdf-form-builder>
    
    <script src="https://unpkg.com/@signkit/core@latest/dist/web-components.js"></script>
    <script>
      const builder = document.querySelector('pdf-form-builder')
      builder.addEventListener('template-updated', (e) => {
        console.log('Template:', e.detail.template)
      })
    </script>
  </body>
</html>
```

### Web Components (React)

After installing `@signkit/core`, register the custom elements once and render them like normal JSX tags.

```tsx
import { useEffect, useRef } from 'react'
import '@signkit/core/webcomponents'
import '@signkit/core/styles.css'

export default function SignKitReactExample() {
  const builderRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const builderEl = builderRef.current
    if (!builderEl) return

    const onTemplateExported = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('Template:', customEvent.detail)
    }

    builderEl.addEventListener('template-exported', onTemplateExported)
    return () => builderEl.removeEventListener('template-exported', onTemplateExported)
  }, [])

  return <pdf-form-builder ref={builderRef} pdf="/sample.pdf" />
}
```

If TypeScript reports unknown JSX tags, add this once in your React app (for example in `src/custom-elements.d.ts`):

```ts
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'pdf-form-builder': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
      'pdf-form-signer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}
```

### TypeScript Types

All components and utilities are fully typed. Types are auto-included:

```typescript
import type { Template, Field, Manifest } from '@signkit/core'

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
import '@signkit/core/dist/styles.css'
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
