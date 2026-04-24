SignKit styling guide (concise)

- All design tokens live under `packages/pdf-sign-kit/src/styles/tokens.css` and use the `--sk-` prefix.
- Consumers can import the combined stylesheet at `packages/pdf-sign-kit/src/styles/index.css`.

Overriding tokens

To customize the theme, override variables on `:root` or a container element:

.demo-purple-theme {
  --sk-color-action-primary: #7c3aed;
  --sk-radius-md: 8px;
}

Class naming

- UI primitives use the `sk-` prefix, e.g. `.sk-button`, `.sk-card`, `.sk-input`.
- Prefer tokens (variables) for colors, spacing, radius.

Important notes

- Do not rely on these styles being bundled into the package; consuming apps should import the CSS entrypoint or copy tokens into their global CSS.
- Web components that use Shadow DOM still receive CSS variables from the host document if the variables are declared on `:root` or an ancestor element of the shadow host.

