# Agents Guide for @signkit/core

This file documents guidance for coding agents and contributors working on the `@signkit/core` repository. It captures project goals, constraints, preferred libraries, testing and release expectations, and rules for safe, maintainable changes.

## Project Overview

- Purpose: A Vue 3 + TypeScript client-first toolkit for building PDF signing experiences in the browser. The package contains a PDF form-builder and a PDF signer that can produce a signed PDF and a manifest JSON describing field values and signing metadata.
- Two main features:
  - Form Builder: load PDF in browser, render pages with pdf.js, allow drag/place/resize of fields, export template JSON.
  - Signer: load original PDF + template JSON, let users draw/type signatures and fill fields, produce final signed PDF (client-side via `pdf-lib`) and a manifest JSON.

## Core Principles

- Client-first: Everything must work fully offline in the browser without a backend.
- Framework-first: Primary UX components are Vue 3 components written in TypeScript and designed for composition.
- Interop-friendly: Emit backend-agnostic JSON schema for templates and manifests — hosts choose persistence and distribution.
- Minimal assumptions: No hardcoded APIs or persistence; `meta` is preserved as-is for host apps.
- Incremental, testable improvements: Prefer small, well-tested changes that preserve backward compatibility.

## Architecture Constraints

- UI layer: Vue 3 + TypeScript + Vite. Components should be library-friendly (no app-level assumptions).
- Rendering: Use `pdf.js` for high-fidelity PDF rendering in the browser.
- PDF generation: Use `pdf-lib` for client-side PDF manipulation and to flatten/embed signatures.
- Bundling: Package must support standard ESM exports and provide Web Components (custom elements) build.
- No required server: All core flows must work with zero backend dependencies. Server-side crypto is optional and explicitly out-of-band.

## Security / Integrity Position

- Local integrity: The library MAY compute local SHA-256 hashes of the original PDF and a canonicalized template JSON for optional integrity checks, and include results in the manifest.
- Not a PKI product: Do NOT claim the package provides certificate-backed or court-admissible digital signatures. v1 explicitly does NOT implement PKI/PAdES/CMS.
- User education: Documentation must clearly explain the difference between local integrity checks and server-backed signing.
- Optional server workflows: Support hooks and extension points so host apps can integrate server-side signing if they choose, but do not require it.

## Tech Stack

- Framework: Vue 3 (Composition API) with TypeScript
- Build: Vite for library + demo site
- Rendering: `pdfjs-dist` for PDF page rendering — declared as a root-level workspace dependency and externalized from the library bundle; host apps must provide it
- PDF manipulation: `pdf-lib` to compose and flatten signed PDFs
- Web Components: Vue's built-in `defineCustomElement` — no third-party WC plugin required. Registered tags: `<pdf-form-builder>` and `<pdf-form-signer>`.
- Docs: VitePress for documentation site; API reference generated with `typedoc` + `typedoc-plugin-markdown`
- Testing: Vitest for unit and composable tests; Puppeteer for browser smoke tests
- Linting/Formatting: ESLint + Prettier + TypeScript compiler checks

## Repository Expectations

- Exports: Clean, explicit exports in `package.json` with TypeScript typings (`types`/`exports`). The library exports a compiled CSS file at `./styles.css`.
- Monorepo layout: Three packages under `packages/`:
  - `packages/pdf-sign-kit` — the publishable library (`@signkit/core`), with `src/components`, `src/composables`, `src/utils`, `src/styles`, and `src/web-components`.
  - `packages/demo` — minimal Vite + Vue app showcasing form-builder and signer.
  - `packages/docs` — VitePress documentation site.
- Styleguide: CSS design tokens live in `packages/pdf-sign-kit/src/styles/tokens.css` under the `--sk-` prefix. UI primitives use the `sk-` class prefix. Consumers override tokens on `:root` or a container; Shadow DOM elements inherit host-document CSS variables. See `STYLEGUIDE.MD` (root) and `packages/pdf-sign-kit/STYLEGUIDE.md` for full details.
- Docs: `packages/docs/` powered by VitePress; API reference auto-generated via `typedoc` (`docs:gen` script at the root).
- CI: Run lint, type-checking, and tests on PRs. Build artifacts only on release workflows.

## Coding Standards

- Type Safety: All public APIs must be strongly typed. Use TypeScript interfaces for template/schema and manifest formats.
- Small functions: Prefer small, pure utility functions. Keep side-effects isolated.
- No app assumptions: Library code must not assume global CSS, global stores, or specific router setups.
- Preserve `meta`: Every field object in templates must include an unmodified `meta` object provided by the host.
- Accessibility: Components must be keyboard-accessible and announceable to assistive tech where applicable.
- Documentation-first: Public APIs and components must include concise JSDoc/TSDoc comments.

## Testing Expectations

- Unit tests: Use Vitest for composable logic, utility functions, and schema validation.
- Integration tests: Critical flows (loading template, placing fields, saving JSON, signing, generating PDF + manifest) should have integration tests that validate expected JSON and PDF bytes where possible. See `packages/pdf-sign-kit/test/`.
- Smoke tests: Puppeteer smoke tests in `scripts/` verify that the demo app renders pages and the browser console is error-free. Run via `scripts/demo-smoke.js` against a locally served demo.
- Headless scripts: `scripts/headless-finalize.js` exercises the finalize flow without a browser UI.
- CI enforcement: Tests must run on pull requests; new features must include tests for expected behavior and edge cases.

## Documentation Expectations

- Getting Started: Step-by-step guide for installing, embedding components, and a minimal demo.
- API Reference: Typed component props, events, emitted JSON schema, and manifest structure.
- Security/Integrity: Honest section describing what local integrity checks do and do not prove.
- Migration guides: When changing the template or manifest schema, include migration instructions.

## Release Expectations

- Versioning: Follow SemVer. Breaking changes require a major version bump and a migration guide.
- Changelog: Keep a human-readable changelog (e.g., `CHANGELOG.md`) with notable changes and migration notes.
- Build artifacts: Always produce ESM (`pdf-sign-kit.es.js`) and CJS (`pdf-sign-kit.cjs.js`) bundles for the library, plus an IIFE bundle (`pdf-sign-kit.wc.iife.js`) for the standalone web-component build. Ensure TypeScript declarations accompany published packages. UMD is not produced.

## Anti-Patterns to Avoid

- Claiming server-backed signature guarantees when none exist.
- Tight coupling to a single host backend or persistence mechanism.
- Large, monolithic PRs that mix refactors, feature work, and styling changes.
- Hiding metadata or mutating host-provided `meta` fields.
- Adding heavy runtime dependencies that bloat the client bundle without clear benefit.

## Definition of Done

For any new feature, fix, or change:

1. Code compiles with TypeScript and passes linting.
2. Unit and integration tests covering the change are added and passing.
3. Documentation updated (README, docs site) with examples demonstrating the change.
4. Public API surface is typed and unchanged unless intentionally bumped; breaking changes are documented in a migration guide.
5. Demo updated to showcase the feature where appropriate.
6. PR includes a clear description, a changelog entry, and links to relevant docs or issues.

---

If you're an automated agent making edits: be conservative, run tests, and always prefer adding code with extensive tests and docs. If you are unsure about a design decision, create a short RFC/issue and request human review rather than guessing.
