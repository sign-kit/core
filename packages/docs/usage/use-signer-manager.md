# useSignerManager

`useSignerManager` is the low-level signing engine behind the `Signer` UI component.

If `Signer` is the ready-made screen, `useSignerManager` is the programmatic API you use when you want to build your own custom signing screen.

## Mental Model

You initialize the manager once with:

1. A template (what fields exist)
2. PDF bytes (what file is being signed)
3. Optional signer metadata (who is signing)

Then you use four core operations:

1. `setValue(fieldId, value)` to update a field value
2. `getValue(fieldId)` to read field value
3. `validate()` to check required/invalid fields
4. `finalize(options)` to produce signed PDF bytes and manifest

Use this composable when you need custom UX flows, multi-step wizards, or app-specific validation before signing.

## Example

```vue
<script setup lang="ts">
import { useSignerManager } from '@signkit/core'

const pdfBytes = await fetch('/sample.pdf').then((r) => r.arrayBuffer())
const template = { id: 'template-1', version: '1.0.0', pages: [], fields: [] }

const manager = useSignerManager(template, pdfBytes, { name: 'John' })

// 1) Set field values from your own form controls
manager.setValue('field-id', 'value')

// 2) Read values whenever you need to sync UI
const value = manager.getValue('field-id')

// 3) Validate before allowing final submission
const { ok, errors } = manager.validate()

// 4) Finalize to produce signed artifacts
const { signedPdfBytes, manifest } = await manager.finalize({
  mode: 'integrity',
  embedPdfHash: true,
})

console.log(value, ok, errors, signedPdfBytes, manifest)
</script>
```

## Typical Flow

1. Load template JSON and PDF bytes
2. Initialize manager
3. Render your own inputs bound to `setValue`/`getValue`
4. Call `validate` when the user clicks Continue/Submit
5. If valid, call `finalize`
6. Save or upload `signedPdfBytes` and `manifest`

## Minimal Custom UI Pattern

```ts
const manager = useSignerManager(template, pdfBytes, signer)

function onInput(fieldId: string, value: string | boolean | null) {
  manager.setValue(fieldId, value)
}

async function onSubmit() {
  const { ok, errors } = manager.validate()
  if (!ok) {
    console.error(errors)
    return
  }

  const result = await manager.finalize({ mode: 'standard' })
  // result.signedPdfBytes
  // result.manifest
}
```

## When to Use

- You need a fully custom signing UI rather than the built-in `Signer` component.
- You want to control exactly when validation runs and when finalization is allowed.
- You need to integrate signing into existing app workflows or multi-step forms.
- You want to trigger integrity-mode finalize logic from your own submit actions.

## When Not to Use

- If you just need a drop-in signing UI, use `Signer` directly.
- If you do not need custom control flow, the component is simpler and faster.

## Related Guides

- [Signer](./signer)
