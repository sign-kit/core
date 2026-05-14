# Dynamic Fields

Dynamic fields let host apps customize FormBuilder inspector controls and write values directly into field objects, including nested metadata paths.

## Why This Exists

Use dynamic fields when the default inspector rows are not enough, for example:

- Assigning fields to users from an external system.
- Capturing workflow metadata such as ticketReference or externalAccountId.
- Showing or hiding default controls by product role.

## Inspector Customization Model

FormBuilder supports two layers:

- Declarative controls via fieldInspectorControls for common controls.
- Escape hatch slot via field-inspector for fully custom UI.

## Declarative Controls Example

```vue
<template>
  <FormBuilder
    :pdf="pdfUrl"
    v-model="template"
    :fieldInspectorControls="fieldInspectorControls"
    :omitDefaultInspectorControls="['label']"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FormBuilder } from '@signkit/core'
import type { FieldInspectorControl, Template } from '@signkit/core'

const pdfUrl = ref('/sample.pdf')
const template = ref<Template>({
  id: 'template-1',
  version: '1.0.0',
  pages: [],
  fields: [],
  createdAt: new Date().toISOString(),
})

const fieldInspectorControls: FieldInspectorControl[] = [
  {
    key: 'assignee-user',
    type: 'select',
    label: 'Assign user',
    path: 'meta.assigneeUserId',
    helpText: 'Choose a user from your upstream system',
    options: [
      { label: 'Unassigned', value: null },
      { label: 'Jordan Example', value: 'usr_1001' },
      { label: 'Robin Chen', value: 'usr_1002' },
    ],
  },
  {
    key: 'ticket-reference',
    type: 'text',
    label: 'Ticket reference',
    path: 'meta.ticketReference',
    placeholder: 'TKT-12345',
  },
]
</script>
```

## Custom Slot Example

```vue
<template>
  <FormBuilder :pdf="pdfUrl" v-model="template">
    <template #field-inspector="{ field, getValue, setValue, save }">
      <label>External account id</label>
      <input
        :value="String(getValue('meta.externalAccountId') || '')"
        @input="onExternalAccountInput($event, setValue, save)"
      />
      <small>Editing {{ field.id }}</small>
    </template>
  </FormBuilder>
</template>

<script setup lang="ts">
function onExternalAccountInput(
  event: Event,
  setValue: (path: string, value: unknown) => void,
  save: () => void,
) {
  const target = event.target as HTMLInputElement | null
  setValue('meta.externalAccountId', target?.value || '')
  save()
}
</script>
```

## Update Behavior

- Inspector edits are made on a draft copy first.
- Save commits the draft back through the normal field update flow.
- Nested paths such as meta.assigneeUserId are supported.
- Use updateField from the slot for direct patch emissions when needed.

## Best Practices

- Keep custom keys under meta.* for backend-agnostic data.
- Use stable key names so templates remain diff-friendly.
- Keep control labels task-oriented for non-technical users.

## Related Guides

- [FormBuilder](./form-builder)
- [Vue Usage Overview](./vue-components)
