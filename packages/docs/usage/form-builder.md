# FormBuilder

The FormBuilder component lets users design PDF templates by placing and configuring fields.

## Basic Usage

```vue
<template>
  <FormBuilder :pdf="pdfUrl" v-model="template" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FormBuilder } from '@signkit/core'
import '@signkit/core/dist/styles.css'

const pdfUrl = ref('/sample.pdf')
const template = ref({
  id: 'template-1',
  version: '1.0.0',
  pages: [],
  fields: [],
})
</script>
```

## Props

- `pdf` (`string | File | ArrayBuffer`, default `undefined`): PDF source URL, `File`, or `ArrayBuffer`.
- `modelValue` (`Template`, default `undefined`): The template object (use `v-model`).
- `dateLocale` (`string`, default `undefined`): Locale for date formatting, such as `en-US`.
- `fieldInspectorControls` (`FieldInspectorControl[]`, default `[]`): Additional configurable inspector controls.
- `showDefaultInspectorControls` (`boolean`, default `true`): Show or hide built-in inspector rows.
- `omitDefaultInspectorControls` (`string[]`, default `[]`): Hide specific built-in rows. Available keys: `label`, `required`, `role`.

## Events

| Event | Payload | Description |
|---|---|---|
| `update:modelValue` | `Template` | Emitted when template state changes. |
| `field-added` | `Field` | Emitted when a new field is dropped on a page. |
| `field-updated` | `Field` | Emitted when a field position, size, or inspector value changes. |
| `field-removed` | `string` | Emitted with the removed field id. |

## Save Template Example

```vue
<template>
  <div>
    <FormBuilder :pdf="pdfUrl" v-model="template" />
    <button @click="saveTemplate">Save Template</button>
  </div>
</template>

<script setup lang="ts">
function saveTemplate() {
  const json = JSON.stringify(template.value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'template.json'
  a.click()
}
</script>
```

## Related Guides

- [Dynamic Fields](./dynamic-fields)
- [Signer](./signer)
