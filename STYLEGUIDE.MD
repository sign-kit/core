## Design System: Color Palette, CSS Variables, and UI Shape Language

This project uses a fixed visual language for all package components, demo pages, docs examples, and web components.

The design should feel:

- clean
- modern
- trustworthy
- productized
- slightly friendly
- not overly playful
- not overly corporate
- minimal, but not sterile

This is a PDF builder + signer experience, so the UI should feel:
- precise
- stable
- predictable
- clear under stress
- safe for important actions

---

## Core Color Palette

Use this fixed palette unless there is a strong accessibility reason not to.

- **Jet Black** — `#292F36`
  - Primary dark neutral
- **Strong Cyan** — `#4ECDC4`
  - Primary action / selected state / interactive accent
- **Bright Snow** — `#F8F7F9`
  - Primary background / surface color
- **Grapefruit Pink** — `#FF6B6B`
  - Destructive / error / warning-emphasis color
- **Steel Blue** — `#4381C1`
  - Secondary action / informational / system color

---

## Required CSS Custom Properties

All styling should prefer CSS custom properties rather than hardcoded hex values.

Define these variables at the package root and expose them so host applications can override them if desired.

### Root Variables

```css
:root {
  /* Core palette */
  --color-jet-black: #292F36;
  --color-strong-cyan: #4ECDC4;
  --color-bright-snow: #F8F7F9;
  --color-grapefruit-pink: #FF6B6B;
  --color-steel-blue: #4381C1;

  /* Semantic aliases */
  --color-text-primary: var(--color-jet-black);
  --color-text-secondary: rgba(41, 47, 54, 0.72);
  --color-text-muted: rgba(41, 47, 54, 0.56);

  --color-bg-app: var(--color-bright-snow);
  --color-bg-surface: #FFFFFF;
  --color-bg-surface-subtle: rgba(248, 247, 249, 0.92);
  --color-bg-elevated: #FFFFFF;

  --color-border-default: rgba(41, 47, 54, 0.12);
  --color-border-strong: rgba(41, 47, 54, 0.22);
  --color-border-focus: var(--color-strong-cyan);

  --color-action-primary: var(--color-strong-cyan);
  --color-action-primary-hover: #3fbfb6;
  --color-action-primary-active: #33aea6;

  --color-action-secondary: var(--color-steel-blue);
  --color-action-secondary-hover: #376ea7;
  --color-action-secondary-active: #2f5f8f;

  --color-action-danger: var(--color-grapefruit-pink);
  --color-action-danger-hover: #f25555;
  --color-action-danger-active: #df4747;

  --color-state-success: var(--color-strong-cyan);
  --color-state-info: var(--color-steel-blue);
  --color-state-warning: var(--color-grapefruit-pink);
  --color-state-error: var(--color-grapefruit-pink);

  --color-overlay-backdrop: rgba(41, 47, 54, 0.42);

  /* PDF builder / signer specific */
  --color-field-selected: var(--color-strong-cyan);
  --color-field-hover: var(--color-steel-blue);
  --color-field-invalid: var(--color-grapefruit-pink);
  --color-signature-accent: var(--color-strong-cyan);
  --color-integrity-pass: var(--color-strong-cyan);
  --color-integrity-info: var(--color-steel-blue);
  --color-integrity-fail: var(--color-grapefruit-pink);

  /* Radius / shape */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;

  /* Controls */
  --control-height-sm: 32px;
  --control-height-md: 40px;
  --control-height-lg: 48px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(41, 47, 54, 0.06);
  --shadow-md: 0 6px 18px rgba(41, 47, 54, 0.10);
  --shadow-lg: 0 14px 32px rgba(41, 47, 54, 0.14);

  /* Focus */
  --focus-ring-width: 3px;
  --focus-ring-color: rgba(78, 205, 196, 0.28);

  /* Typography */
  --font-family-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 13px;
  --font-size-md: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;
  --font-size-2xl: 28px;

  /* Motion */
  --duration-fast: 120ms;
  --duration-normal: 180ms;
  --duration-slow: 260ms;
  --ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1);

  /* Layout */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
}