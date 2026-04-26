# @signkit/core (monorepo)

A client-first Vue 3 toolkit for PDF form building and client-side signing.

Quick start

1. Install dependencies:

```bash
npm install
```

2. Run the demo app:

```bash
npm run dev:demo
```

3. Run the docs site:

```bash
npm run dev:docs
```

Repository layout

- `packages/pdf-sign-kit` - library source (TypeScript) and public API
- `packages/demo` - minimal Vite + Vue demo app
- `packages/docs` - VitePress documentation site
- `samples/` - place sample PDFs here for demo
- `AGENTS.md` - guidance for coding agents (automated contributors)

Rationale

Use a lightweight npm workspace to keep packages small, enable fast local iteration, and allow independent package scripts while sharing configs and types.