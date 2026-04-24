# @sign-kit/core — Styling & Theming

This package exposes CSS design tokens and shared styles so consumers can easily customize the look and feel.

Quick guide

- Include styles (recommended):

  - After installing the package, import the compiled stylesheet from the package entry:

    import '@sign-kit/core/styles.css'

  - This imports `dist/styles/index.css` which bundles the token definitions and component styles.

- Override tokens to customize theme:

  - Tokens are CSS custom properties defined on `:root` in `--sk-` namespace (see `--sk-color-*`, `--sk-radius-*`, `--sk-font-*`).
  - Example: change the primary action color and signature font in your app's global CSS:

    :root {
      --sk-color-action-primary: #7b61ff;
      --sk-color-on-action: #ffffff;
      --sk-font-signature: 'Shadows Into Light', cursive;
    }

  - Load your overrides *after* the package CSS so they take precedence.

- Importing tokens only (advanced):

  - If you want to control the entire styling surface, import tokens and then your own component CSS:

    import '@sign-kit/core/dist/styles/tokens.css'
    import './my-signkit-overrides.css'

- Notes:

  - The package uses CSS tokens for colors, spacing, radii and fonts. Where a component renders onto a canvas (typed signature preview, signature pad), the canvas drawing reads tokens at runtime so your overrides affect drawn output as well.
  - If your build system strips CSS custom properties at runtime (rare), prefer importing a custom CSS file that overrides variables in `:root`.

If you'd like, I can also add an example theme file under `packages/pdf-sign-kit/demo/themes/` and wire it into the demo app.
