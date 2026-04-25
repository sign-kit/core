# Contributing

Thank you for considering contributing to `@sign-kit/core`! This guide covers development setup, testing, and PR expectations.

## Getting Started

### Prerequisites

- Node.js 14+
- npm or yarn
- Git

### Development Setup

```bash
# Clone the repository
git clone https://github.com/sign-kit/core.git
cd core

# Install dependencies
npm install

# Start the demo dev server
npm run demo

# Run tests
npm test

# Run linting and type checking
npm run lint
npm run type-check

# Build library
npm run build
```

## Project Structure

```
packages/
  pdf-sign-kit/          # Main library
    src/
      components/        # Vue 3 components
      composables/       # Vue 3 composables
      utils/            # Utilities (signing, templates, etc.)
      styles/           # CSS tokens and base styles
      types.ts          # TypeScript interfaces
    test/               # Unit and integration tests
    package.json
  
  demo/                 # Interactive demo app
    src/
      pages/            # Demo pages (Builder, Signer, Integrity)
      App.vue
    package.json
  
  docs/                 # VitePress documentation
    docs/               # Markdown files
    package.json
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

### Unit Tests

Add tests for utility functions and composables:

```typescript
// src/utils/__tests__/coord.test.ts
import { describe, it, expect } from 'vitest'
import { normalizeCoord, denormalizeCoord } from '../coord'

describe('coord utilities', () => {
  it('normalizes coordinates 0-1 range', () => {
    expect(normalizeCoord(150, 300)).toBe(0.5)
  })

  it('denormalizes back to pixels', () => {
    expect(denormalizeCoord(0.5, 300)).toBe(150)
  })
})
```

### Component Tests

Test Vue components using `@testing-library/vue`:

```typescript
// src/components/__tests__/FormBuilder.test.ts
import { render, screen } from '@testing-library/vue'
import FormBuilder from '../FormBuilder.vue'

describe('FormBuilder', () => {
  it('renders PDF canvas', () => {
    render(FormBuilder, {
      props: { pdf: '/sample.pdf', modelValue: defaultTemplate },
    })
    expect(screen.getByRole('region')).toBeInTheDocument()
  })
})
```

### Integration Tests

Test end-to-end workflows:

```typescript
// test/signer.integration.test.ts
it('signs PDF and generates manifest', async () => {
  const pdfBytes = await loadPdf('/sample.pdf')
  const template = defaultTemplate
  const values = [{ id: 'f1', value: 'Test' }]

  const { signedPdfBytes, manifest } = await applyValuesToPdf(
    pdfBytes,
    template,
    values
  )

  expect(signedPdfBytes).toBeTruthy()
  expect(manifest.values).toEqual(values)
})
```

### Running Tests

```bash
npm test                  # Run all tests
npm test -- --watch      # Watch mode
npm test -- --coverage   # Coverage report
```

### Test Coverage

Aim for:
- **Utilities**: 90%+ coverage
- **Components**: 80%+ coverage for critical paths
- **Composables**: 85%+ coverage

## Making Changes

### Small Changes (Bug Fixes, Minor Features)

1. Fork the repo and create a branch:
   ```bash
   git checkout -b fix/signature-scaling
   ```

2. Make changes with tests and documentation

3. Run tests and linting:
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

4. Create a pull request with:
   - Clear title: "Fix: signature scaling respects bounding box"
   - Description of the problem and solution
   - Link to any related issues
   - Test coverage for the fix

### Large Changes (API Changes, New Features)

1. Open an issue first to discuss the change
2. Get consensus from maintainers
3. Create a detailed RFC if it affects public APIs
4. Submit PR with:
   - Tests for the new feature
   - Documentation updates
   - Migration guide (if breaking)
   - Changelog entry

## Documentation

### Update Docs for Any Public API Change

- Add JSDoc/TSDoc comments to new public functions/components
- Update relevant markdown files in `packages/docs/docs/`
- Include code examples
- Add to migration guide if breaking

### Documenting Components

```typescript
/**
 * FormBuilder component for designing PDF form templates
 *
 * @example
 * ```vue
 * <FormBuilder :pdf="pdfUrl" v-model="template" />
 * ```
 *
 * @props pdf - PDF source (URL, File, or ArrayBuffer)
 * @props modelValue - Template object (use v-model)
 * @props dateLocale - Locale for date formatting
 *
 * @emits update:modelValue - Emitted when template changes
 */
export default defineComponent({
  // ...
})
```

## Release Process

### Before Releasing

1. Update version in `package.json` (SemVer)
2. Update `CHANGELOG.md` with notable changes and breaking changes
3. Run full test suite: `npm test`
4. Run build: `npm run build`
5. Test in demo: `npm run demo`

### Breaking Changes

Always include a migration guide:

```markdown
## Migration Guide: v2.0.0

### Breaking: Template schema changed

The `pages` field now requires explicit `width` and `height`:

**Before**:
```json
{ "pages": [null, null] }
```

**After**:
```json
{ "pages": [{ "width": 612, "height": 792 }] }
```
```

### Versioning

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes (2.0.0)
- **MINOR**: Features, backwards-compatible (1.1.0)
- **PATCH**: Bugs, patches (1.0.1)

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
