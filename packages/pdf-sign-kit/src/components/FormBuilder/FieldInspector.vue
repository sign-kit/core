<template>
  <aside class="field-inspector">
    <h4>Field</h4>
    <div
      v-for="control in activeControls"
      :key="control.key"
      class="inspector-row inspector-row--stacked"
    >
      <label :for="`field-inspector-${control.key}`">{{ control.label }}</label>

      <input
        v-if="control.type === 'text'"
        :id="`field-inspector-${control.key}`"
        class="inspector-input"
        :placeholder="control.placeholder"
        :value="getTextValue(control.path)"
        @input="onTextInput(control.path, $event)"
      />

      <textarea
        v-else-if="control.type === 'textarea'"
        :id="`field-inspector-${control.key}`"
        class="inspector-input inspector-input--textarea"
        :placeholder="control.placeholder"
        :value="getTextValue(control.path)"
        @input="onTextareaInput(control.path, $event)"
      />

      <select
        v-else-if="control.type === 'select'"
        :id="`field-inspector-${control.key}`"
        class="inspector-input"
        :value="getSelectValue(control.path)"
        @change="onSelectInput(control, $event)"
      >
        <option
          v-for="option in control.options || []"
          :key="`${control.key}-${serializeValue(option.value)}`"
          :value="serializeValue(option.value)"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>

      <label v-else class="inspector-checkbox" :for="`field-inspector-${control.key}`">
        <input
          :id="`field-inspector-${control.key}`"
          type="checkbox"
          :checked="getCheckboxValue(control.path)"
          @change="onCheckboxInput(control.path, $event)"
        />
        <span>{{ control.helpText || 'Enabled' }}</span>
      </label>

      <p v-if="control.helpText && control.type !== 'checkbox'" class="inspector-help">
        {{ control.helpText }}
      </p>
    </div>

    <slot
      name="custom-fields"
      :field="props.field"
      :draft="draft"
      :getValue="getValue"
      :setValue="setValue"
      :save="save"
      :remove="del"
      :updateField="applyPatch"
    />

    <div class="inspector-actions">
      <button
        v-if="!props.hideInspectorSaveButton"
        class="sk-button sk-button--primary"
        @click="save"
      >
        Save
      </button>
      <button class="sk-button sk-button--danger" @click="del">Delete</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Field, FieldInspectorControl } from '../../types';
import { cloneWithValueAtPath, getValueAtPath } from '../../utils/objectPath';

// Guard flag: true while draft is being reset from an incoming prop change so the
// deep draft watcher doesn't echo the update back to the parent and cause a loop.
let isResettingFromProp = false;

const props = defineProps<{
  field: Field;
  controls?: FieldInspectorControl[];
  showDefaultControls?: boolean;
  omitDefaultControls?: string[];
  autoSave?: boolean;
  hideInspectorSaveButton?: boolean;
}>();
const emit = defineEmits<{
  (e: 'update-field', patch: Partial<Field> & { id: string }): void;
  (e: 'delete-field', id: string): void;
}>();

const defaultControls: FieldInspectorControl[] = [
  {
    key: 'label',
    type: 'text',
    label: 'Label',
    path: 'label',
  },
  {
    key: 'required',
    type: 'checkbox',
    label: 'Required',
    path: 'required',
    helpText: 'Require this field before signing',
  },
  {
    key: 'role',
    type: 'text',
    label: 'Role',
    path: 'role',
    placeholder: 'approver',
  },
];

const draft = ref<Field>(cloneField(props.field));

const activeControls = computed(() => {
  const hiddenControls = new Set(props.omitDefaultControls || []);
  const controls = [
    ...(props.showDefaultControls === false
      ? []
      : defaultControls.filter((control) => !hiddenControls.has(control.key))),
    ...(props.controls || []),
  ];

  return controls.filter((control) => {
    if (!control.fieldTypes || control.fieldTypes.length === 0) return true;
    return control.fieldTypes.includes(props.field.type);
  });
});

watch(
  () => props.field,
  (f) => {
    isResettingFromProp = true;
    draft.value = cloneField(f);
    isResettingFromProp = false;
  },
  { flush: 'sync' },
);

watch(
  () => draft.value,
  (newDraft) => {
    if (isResettingFromProp) return;
    if (props.autoSave !== false) {
      emit('update-field', newDraft);
    }
  },
  { deep: true, flush: 'sync' },
);

function cloneField(field: Field): Field {
  return { ...field };
}

function getValue(path: string) {
  return getValueAtPath(draft.value, path);
}

function setValue(path: string, value: unknown) {
  draft.value = cloneWithValueAtPath(draft.value, path, value);
}

function getTextValue(path: string) {
  const value = getValue(path);
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function getCheckboxValue(path: string) {
  return !!getValue(path);
}

function serializeValue(value: unknown) {
  return JSON.stringify(value ?? null);
}

function getSelectValue(path: string) {
  return serializeValue(getValue(path));
}

function onTextInput(path: string, event: Event) {
  setValue(path, (event.target as HTMLInputElement).value);
}

function onTextareaInput(path: string, event: Event) {
  setValue(path, (event.target as HTMLTextAreaElement).value);
}

function onCheckboxInput(path: string, event: Event) {
  setValue(path, (event.target as HTMLInputElement).checked);
}

function onSelectInput(control: FieldInspectorControl, event: Event) {
  const nextValue = (event.target as HTMLSelectElement).value;
  const matchedOption = (control.options || []).find(
    (option) => serializeValue(option.value) === nextValue,
  );
  setValue(pathOrThrow(control), matchedOption ? matchedOption.value : nextValue);
}

function pathOrThrow(control: FieldInspectorControl) {
  return control.path;
}

function applyPatch(patch: Partial<Field> & { id: string }) {
  emit('update-field', patch);
}

function save() {
  emit('update-field', draft.value);
}

function del() {
  emit('delete-field', props.field.id);
}
</script>

<style scoped>
.field-inspector {
  margin-top: 12px;
  padding: 12px;
  background: var(--sk-color-bg-surface);
  border: 1px solid var(--sk-color-border-default);
  border-radius: var(--sk-radius-sm);
}
.inspector-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.inspector-row--stacked {
  flex-direction: column;
  align-items: stretch;
}
.inspector-row label {
  font-weight: 600;
}
.inspector-input {
  width: 100%;
  box-sizing: border-box;
}
.inspector-input--textarea {
  min-height: 88px;
  resize: vertical;
}
.inspector-checkbox {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 400;
}
.inspector-help {
  margin: 0;
  font-size: 12px;
  color: var(--sk-color-text-muted, #667085);
}
.inspector-actions {
  display: flex;
  gap: 8px;
}
</style>
