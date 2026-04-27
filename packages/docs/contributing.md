# Contributing

Thank you for considering contributing to `@signkit/core`! This guide covers development setup, testing, and PR expectations.

## Getting Started

### Prerequisites

- Node.js 20+
- npm (the repo uses npm workspaces)
- Git

### Development Setup

```bash
# Clone the repository
git clone https://github.com/sign-kit/core.git
cd core

# Install dependencies
npm install

# Start the demo dev server
npm run dev:demo

# Start the docs site locally
npm run dev:docs

# Run unit tests (Vitest)
npm test

# Run Playwright e2e tests against the demo
npm run test:e2e

# Run linting
npm run lint

# Build the library
npm run build
```

## Project Structure

```
packages/
  pdf-sign-kit/          # Publishable library (@signkit/core)
    src/
      components/        # Vue 3 components
      composables/       # Vue 3 composables
      utils/             # Utilities (signing, templates, integrity)
      styles/            # CSS tokens and base styles
      web-components/    # Custom element wrappers
      types.ts           # TypeScript interfaces
    test/                # Vitest unit & integration tests
    package.json

  demo/                  # Interactive demo app
    src/
      pages/             # Builder, Signer, Integrity, WebComponents pages
      App.vue
    package.json

  docs/                  # VitePress documentation site
    *.md                 # Markdown pages (getting-started, api/, etc.)
    package.json

tests/
  e2e/                   # Playwright browser tests (run against the demo)
    builder-signer.spec.ts
    demo-routes.spec.ts
    integrity.spec.ts
    webcomponent-events.spec.ts
```

## Code Standards

### TypeScript

- All public APIs must be strongly typed
- No `any` types (except where absolutely necessary, then comment why)
- Use interfaces for data structures, not type aliases (for better IDE support)

```typescript
// Good
interface Field {
  id: string
  type: FieldType
}

// Avoid
type Field = {
  id: string
  type: FieldType
}
```

### Vue Components

- Use Composition API with `<script setup>`
- Provide explicit TypeScript types for props and emits

```vue
<script setup lang="ts">
interface Props {
  pdf: string | File | ArrayBuffer
  modelValue: Template
  dateLocale?: string
}

const props = withDefaults(defineProps<Props>(), {
  dateLocale: 'en-US',
})

const emit = defineEmits<{
  'update:modelValue': [Template]
}>()
</script>
```

### Utilities

- Prefer small, pure functions
- Avoid side effects
- Add JSDoc comments for public functions

```typescript
/**
 * Compute SHA-256 hash of data
 * @param data - Bytes to hash
 * @returns Hex-encoded hash string
 */
export async function computeSha256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
```

### Styling

- Use CSS custom properties for colors, spacing, fonts
- Define tokens in `src/styles/tokens.css`
- No hardcoded colors or spacing values in component styles

```css
/* Good */
.field {
  background: var(--sk-field-accent);
  color: var(--sk-color-text-primary);
  border-radius: var(--sk-radius-sm);
}

/* Avoid */
.field {
  background: #f0f0f0;
  color: #333;
  border-radius: 4px;
}
```

## Testing

There are two layers of tests.

### Vitest unit tests

Live in `packages/pdf-sign-kit/test/`. Run them with:

```bash
npm test
```

The three test files cover:

- **`utils.test.ts`** — integrity utilities: `canonicalizeTemplate`, `computePdfHash`, `computeValuesHash`
- **`template.test.ts`** — template helpers: `ensurePdfRoot`, `migratePdfSourceFromLegacy`
- **`finalize.test.ts`** — the full finalize flow: loads `sample.pdf` from disk, calls `useSignerManager`, and asserts the returned manifest has the expected shape

When adding a utility or composable, add a test in `packages/pdf-sign-kit/test/`. Keep tests focused — one `describe` block per module is fine.

### Playwright e2e tests

Live in `tests/e2e/` at the repo root and run against the locally served demo. Playwright spins up a dev server automatically (see `playwright.config.ts`).

```bash
# Build the web component bundle, then run all tests headlessly
npm run test:e2e

# Skip the WC build (faster on repeat runs)
npm run test:e2e:skip-build

# Open the Playwright interactive UI
npm run test:e2e:ui
```

The four spec files test:

- **`builder-signer.spec.ts`** — Builder renders with the sample PDF; Signer finalizes and emits a valid manifest
- **`demo-routes.spec.ts`** — all demo routes load without errors
- **`integrity.spec.ts`** — the integrity-verification event fires with the correct shape after finalize
- **`webcomponent-events.spec.ts`** — the `<pdf-form-builder>` and `<pdf-form-signer>` custom elements emit the right events

For new features that touch the demo UI or the web component event contract, add or update a spec in `tests/e2e/`.

## Making Changes

1. Fork the repo and create a branch with a descriptive name:
   ```bash
   git checkout -b fix/signature-scaling
   git checkout -b feat/date-field-validation
   ```

2. Make your changes. If you're adding something new, include tests.

3. Before opening a PR, make sure everything passes:
   ```bash
   npm test
   npm run lint
   ```

4. Open a pull request with a clear description of **what** changed and **why**. If it fixes a bug, explain how to reproduce it. If it's a new feature, show how it's used. Link any related issues.

For larger changes or anything that touches the public API, open an issue first to discuss the approach — it avoids wasted effort if the direction needs adjustment.

## Documentation

The API reference under `packages/docs/api/` is auto-generated from TSDoc comments via `typedoc` — you don't need to write or edit those files by hand. The `docs:gen` script handles it.

What contributors should do:

- Add TSDoc comments to any new public functions, composables, or component props. This is what gets picked up by `typedoc`.
- If your change affects how the library is used (new prop, changed behavior, new utility), update the relevant guide in `packages/docs/` — e.g. `usage/vue-usage.md`, `getting-started.md`, or the integrity docs.
- For breaking changes, note what needs to migrate in the PR description. A migration guide can be added to the docs as part of the release.

## Releases

Releases are handled by the maintainer and the release pipeline — contributors don't need to bump versions, update the changelog, or tag releases. Just make sure your PR is clearly described so changes are easy to categorize.

## Code Review

### What to Expect

- **Tests**: All PRs must include tests
- **TypeScript**: Must pass type-checking
- **Linting**: ESLint + Prettier
- **Documentation**: Public APIs need docs
- **Performance**: Large features need performance discussion

### What Reviewers Look For

- ✅ Code clarity and simplicity
- ✅ Test coverage
- ✅ No unnecessary dependencies
- ✅ Consistency with existing code
- ✅ Performance impact
- ✅ Backwards compatibility (unless breaking is intentional)

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add role-based field access control
fix: signature scaling respects bounding box
docs: add server integration guide
test: add integrity hash verification tests
refactor: simplify field coordinate system
```

Format: `<type>: <description>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `chore`: Build, deps, tooling

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vue 3 Guide](https://vuejs.org/)
- [Vitest Docs](https://vitest.dev/)
- [pdf-lib API](https://pdf-lib.js.org/)
- [PDF.js API](https://mozilla.github.io/pdf.js/api/)

## Questions?

Open an issue or start a discussion on GitHub. We're happy to help!

---

Thank you for contributing! ❤️
