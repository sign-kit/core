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
- Rendering: `pdfjs-dist` for PDF page rendering
- PDF manipulation: `pdf-lib` to compose and flatten signed PDFs
- Web Components: `@vue/web-component-wrapper` or `vite-plugin-web-components` (evaluate options)
- Docs: VitePress for documentation site
- Testing: Vitest + @testing-library/vue for unit/component tests
- Linting/Formatting: ESLint + Prettier + TypeScript compiler checks

## Repository Expectations

- Exports: Clean, explicit exports in `package.json` with TypeScript typings (`types`/`exports`).
- Mono-package: Keep a single package layout unless the project grows; prefer internal directories (e.g., `src/components`, `src/composables`, `src/utils`).
- Demo: Include a `demo/` or `examples/` folder with a minimal Vite app showcasing form-builder and signer.
- Docs: `docs/` powered by VitePress with guides, API reference, and a security/integrity explainer.
- CI: Run lint, type-checking, and tests on PRs. Build artifacts only on release workflows.

## Coding Standards

- Type Safety: All public APIs must be strongly typed. Use TypeScript interfaces for template/schema and manifest formats.
- Small functions: Prefer small, pure utility functions. Keep side-effects isolated.
- No app assumptions: Library code must not assume global CSS, global stores, or specific router setups.
- Preserve `meta`: Every field object in templates must include an unmodified `meta` object provided by the host.
- Accessibility: Components must be keyboard-accessible and announceable to assistive tech where applicable.
- Documentation-first: Public APIs and components must include concise JSDoc/TSDoc comments.

## Testing Expectations

- Unit tests: Use Vitest and @testing-library/vue for UI behavior and composable logic.
- Integration tests: Critical flows (loading template, placing fields, saving JSON, signing, generating PDF + manifest) should have integration tests that validate expected JSON and PDF bytes where possible.
- CI enforcement: Tests must run on pull requests; new features must include tests for expected behavior and edge cases.

## Documentation Expectations

- Getting Started: Step-by-step guide for installing, embedding components, and a minimal demo.
- API Reference: Typed component props, events, emitted JSON schema, and manifest structure.
- Security/Integrity: Honest section describing what local integrity checks do and do not prove.
- Migration guides: When changing the template or manifest schema, include migration instructions.

## Release Expectations

- Versioning: Follow SemVer. Breaking changes require a major version bump and a migration guide.
- Changelog: Keep a human-readable changelog (e.g., `CHANGELOG.md`) with notable changes and migration notes.
- Build artifacts: Produce ESM + UMD (optional) bundles and ensure type declarations accompany published packages.

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
