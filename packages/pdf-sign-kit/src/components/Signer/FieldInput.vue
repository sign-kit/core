<template>
  <div>
    <template v-if="isText">
      <input
        :disabled="readonly"
        type="text"
        :placeholder="placeholder"
        :value="value"
        @input="onInput($event)"
      />
    </template>

    <template v-else-if="isDate">
      <input type="date" :disabled="readonly" :value="value || ''" @input="onInput($event)" />
    </template>

    <template v-else-if="isCheckbox">
      <input type="checkbox" :disabled="readonly" :checked="!!value" @change="onCheckbox($event)" />
    </template>

    <template v-else-if="isSignature">
      <div class="signature-field" :class="{ empty: !value }" @click.stop="onClick" role="button">
        <img v-if="value" :src="value as string" class="sig-preview" />
        <div v-else class="empty-placeholder">{{ placeholderText }}</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Field } from '../../types';
const props = defineProps<{
  field: Field;
  value: any;
  readonly?: boolean;
  placeholder?: string;
}>();
const emit = defineEmits<{
  (e: 'set-value', v: any): void;
  (e: 'open-choice', field: Field): void;
}>();

const isText = computed(() => ['text', 'name', 'email'].includes(props.field.type));
const isDate = computed(() => ['date', 'current_date'].includes(props.field.type));
const isCheckbox = computed(() => props.field.type === 'checkbox');
const isSignature = computed(() => ['signature', 'initials'].includes(props.field.type));

const placeholderText = computed(() => {
  if (props.field.type === 'initials') return 'No initials';
  if (props.field.type === 'signature') return 'No signature';
  return 'No value';
});

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  emit('set-value', target.value);
}

function onCheckbox(e: Event) {
  const target = e.target as HTMLInputElement;
  emit('set-value', target.checked);
}

function onClick() {
  if (props.readonly) return;
  emit('open-choice', props.field);
}
</script>

<style scoped>
.signature-field {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sk-color-bg-surface-subtle);
  box-shadow: var(--sk-shadow-sm);
  border: 1px dashed var(--sk-color-border-default);
  border-radius: var(--sk-radius-sm);
  color: var(--sk-color-text-primary);
  font-weight: 600;
  text-align: center;
  padding: 4px;
  cursor: pointer;
}
.sig-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
</style>
