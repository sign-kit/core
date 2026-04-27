# Styling Guide

Learn how to customize the appearance of `@signkit/core` components using CSS custom properties.

## CSS Custom Properties (Tokens)

All components use CSS variables that you can override:

```css
:root {
  /* Colors */
  --sk-color-action-primary: #0066cc;
  --sk-color-action-hover: #0052a3;
  --sk-color-action-active: #004080;
  --sk-color-text-primary: #1a1a1a;
  --sk-color-text-secondary: #666;
  --sk-color-border: #ccc;
  --sk-color-background: #fff;
  --sk-color-background-alt: #f9f9f9;
  --sk-color-error: #d32f2f;
  --sk-color-success: #388e3c;
  --sk-color-warning: #fbc02d;

  /* Field Styling */
  --sk-field-accent: #e3f2fd;
  --sk-field-border: #2196f3;
  --sk-field-border-width: 2px;
  --sk-field-opacity-selected: 0.1;

  /* Spacing */
  --sk-spacing-xs: 4px;
  --sk-spacing-sm: 8px;
  --sk-spacing-md: 16px;
  --sk-spacing-lg: 24px;
  --sk-spacing-xl: 32px;

  /* Typography */
  --sk-font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --sk-font-family-mono: 'Monaco', 'Courier New', monospace;
  --sk-font-size-sm: 12px;
  --sk-font-size-base: 14px;
  --sk-font-size-lg: 16px;
  --sk-font-size-xl: 18px;
  --sk-font-weight-normal: 400;
  --sk-font-weight-medium: 500;
  --sk-font-weight-bold: 700;

  /* Border Radius */
  --sk-radius-xs: 2px;
  --sk-radius-sm: 4px;
  --sk-radius-md: 8px;
  --sk-radius-lg: 12px;

  /* Shadows */
  --sk-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --sk-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --sk-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Z-index */
  --sk-z-dropdown: 1000;
  --sk-z-modal: 2000;
  --sk-z-tooltip: 1100;

  /* Transitions */
  --sk-transition-fast: 150ms ease-out;
  --sk-transition-normal: 250ms ease-out;
  --sk-transition-slow: 350ms ease-out;
}
```

## Basic Customization

### Change Primary Brand Color

```css
:root {
  --sk-color-action-primary: #ff6b35;      /* Your brand color */
  --sk-color-action-hover: #ff5520;
  --sk-color-action-active: #ff4400;
}
```

### Dark Mode

```css
@media (prefers-color-scheme: dark) {
  :root {
    --sk-color-background: #1a1a1a;
    --sk-color-background-alt: #2a2a2a;
    --sk-color-text-primary: #fff;
    --sk-color-text-secondary: #aaa;
    --sk-color-border: #444;
  }
}
```

### Compact Layout

```css
:root {
  --sk-spacing-sm: 6px;
  --sk-spacing-md: 12px;
  --sk-spacing-lg: 18px;
  --sk-font-size-base: 13px;
  --sk-radius-sm: 3px;
}
```

## Component-Specific Styles

### FormBuilder Customization

```css
/* Field highlighting */
.sk-field-box.selected {
  border-color: var(--sk-color-action-primary);
  box-shadow: 0 0 8px var(--sk-color-action-primary);
}

/* Toolbar styling */
.sk-builder-toolbar {
  background: linear-gradient(135deg, var(--sk-color-action-primary), var(--sk-color-action-hover));
  color: white;
}

/* Inspector panel */
.sk-inspector {
  border-left: 3px solid var(--sk-color-action-primary);
  background: var(--sk-color-background-alt);
}
```

### Signer Customization

```css
/* Field input highlight */
.sk-field-input:focus {
  border-color: var(--sk-color-action-primary);
  box-shadow: 0 0 0 3px var(--sk-color-action-primary);
  opacity: 0.1;
}

/* Signature pad */
.sk-signature-pad {
  background: var(--sk-color-background);
  border: 2px solid var(--sk-color-border);
}

/* Finalize button */
.sk-finalize-button {
  background: var(--sk-color-success);
  color: white;
  padding: var(--sk-spacing-md) var(--sk-spacing-lg);
}
```

## Advanced: Scoped Overrides

Style different instances of the component differently:

```vue
<template>
  <div class="builder-compact">
    <FormBuilder :pdf="pdfUrl" v-model="template" />
  </div>

  <div class="builder-full">
    <FormBuilder :pdf="pdfUrl" v-model="template2" />
  </div>
</template>

<style scoped>
.builder-compact {
  --sk-spacing-md: 12px;
  --sk-font-size-base: 13px;
}

.builder-full {
  --sk-spacing-md: 16px;
  --sk-font-size-base: 14px;
}
</style>
```

## CSS Override Examples

### Corporate Styling

```css
:root {
  --sk-color-action-primary: #003366;      /* Corporate blue */
  --sk-color-action-hover: #004499;
  --sk-color-text-primary: #1a1a1a;
  --sk-font-family-sans: 'Open Sans', sans-serif;
  --sk-font-weight-bold: 600;
  --sk-radius-sm: 8px;
}
```

### Minimal / Clean

```css
:root {
  --sk-color-action-primary: #333;
  --sk-color-border: #f0f0f0;
  --sk-field-border-width: 1px;
  --sk-shadow-md: none;                   /* Remove shadows */
  --sk-radius-sm: 0px;                    /* Square corners */
}
```

### Colorful / Modern

```css
:root {
  --sk-color-action-primary: #7c3aed;     /* Purple */
  --sk-color-action-hover: #6d28d9;
  --sk-field-accent: #ede9fe;
  --sk-color-success: #10b981;
  --sk-color-warning: #f59e0b;
  --sk-radius-sm: 12px;                   /* Rounded */
}
```

## Responsive Styles

Adjust tokens for different screen sizes:

```css
/* Mobile */
@media (max-width: 768px) {
  :root {
    --sk-spacing-md: 12px;
    --sk-font-size-base: 13px;
  }
}

/* Tablet */
@media (768px <= width <= 1024px) {
  :root {
    --sk-spacing-md: 14px;
    --sk-font-size-base: 14px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  :root {
    --sk-spacing-md: 16px;
    --sk-font-size-base: 14px;
  }
}
```

## Accessibility Considerations

### High Contrast

```css
@media (prefers-contrast: more) {
  :root {
    --sk-color-border: #000;
    --sk-color-text-primary: #000;
    --sk-color-background: #fff;
  }
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --sk-transition-fast: 0ms;
    --sk-transition-normal: 0ms;
    --sk-transition-slow: 0ms;
  }
}
```

## Theming with CSS-in-JS

If using CSS-in-JS (styled-components, emotion, etc.):

```typescript
import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  :root {
    --sk-color-action-primary: ${props => props.theme.primary};
    --sk-color-action-hover: ${props => props.theme.primaryHover};
    --sk-field-accent: ${props => props.theme.accentLight};
  }
`

export default GlobalStyle
```

## Combining with Tailwind CSS

If using Tailwind:

```css
@layer base {
  :root {
    --sk-color-action-primary: theme('colors.blue.600');
    --sk-color-text-primary: theme('colors.gray.900');
    --sk-font-family-sans: theme('fontFamily.sans');
  }
}
```

## Theming Best Practices

1. **Define tokens at `:root` level** for global application
2. **Use cascade for component overrides** (scoped CSS)
3. **Test with browser DevTools** to inspect computed styles
4. **Use CSS variables** for consistency across components
5. **Document your custom tokens** for your team

## Web Components: Shadow DOM + Constructable Stylesheets

`@signkit/core` web components now inject shared styles directly into each component's shadow root at runtime using **Constructable Stylesheets** (`adoptedStyleSheets`).

This gives you:

1. Isolated, component-local default styles
2. A runtime theme layer you can override without rebuilding
3. A way to sync your global `:root` token values into the web components

### API

Import from the web components entry:

```ts
import {
  registerPdfSignKitElements,
  setPdfSignKitTheme,
  syncPdfSignKitThemeFromRoot,
} from '@signkit/core/webcomponents'
```

### 1) Register Elements

```ts
registerPdfSignKitElements()
```

### 2) Override Theme Tokens at Runtime

Pass either a token map or a CSS string.

```ts
setPdfSignKitTheme({
  '--sk-color-action-primary': '#003366',
  '--sk-color-action-primary-hover': '#004499',
  '--sk-font-family-sans': 'Open Sans, sans-serif',
})
```

```ts
setPdfSignKitTheme(`
  :host {
    --sk-color-action-primary: #111827;
    --sk-color-action-primary-hover: #1f2937;
    --sk-radius-sm: 10px;
  }
`)
```

### 3) Sync App `:root` Tokens into Web Components

If your app already defines theme variables on `:root`, mirror them into all mounted `<pdf-form-builder>` / `<pdf-form-signer>` instances:

```css
:root {
  --sk-color-action-primary: #0f766e;
  --sk-color-action-primary-hover: #115e59;
  --sk-color-text-primary: #0b1324;
}
```

```ts
// Reads current :root values and applies them to web components runtime theme sheet.
syncPdfSignKitThemeFromRoot()
```

If your app supports live theme switching, call `syncPdfSignKitThemeFromRoot()` after your theme changes.

## Common Issues

### Styles Not Applying

Check the specificity:
```css
/* Too specific - won't override */
html > body > div.app > #root .sk-component {
  --sk-color-action-primary: red;
}

/* Better - at :root level */
:root {
  --sk-color-action-primary: red;
}
```

### Inheritance Not Working

Ensure you're modifying CSS variables, not component props:
```vue
<!-- ❌ Won't work -->
<FormBuilder style="color: red" />

<!-- ✅ Use CSS variables -->
<style>
  :root {
    --sk-color-text-primary: red;
  }
</style>
```

## Testing Styles

Use your browser's DevTools to inspect and test styles:

1. Open DevTools (F12)
2. Inspect a component element
3. In the Styles panel, edit CSS variables in real-time
4. Copy the values that work to your stylesheet

---

For detailed component structure and more styles, check [FormBuilder Props](/api/interfaces/FormBuilderProps) and [Signer Props](/api/interfaces/SignerProps) in the API docs.
