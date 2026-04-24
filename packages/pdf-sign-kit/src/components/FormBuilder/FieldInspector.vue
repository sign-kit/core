<template>
  <aside class="field-inspector">
    <h4>Field</h4>
    <div class="inspector-row">
      <label>Label</label>
      <input v-model="local.label" />
    </div>
    <div class="inspector-row">
      <label>Required</label>
      <input type="checkbox" v-model="local.required" />
    </div>
    <div class="inspector-row">
      <label>Role</label>
      <input v-model="local.role" />
    </div>
    <div class="inspector-actions">
      <button class="sk-button sk-button--primary" @click="save">Save</button>
      <button class="sk-button sk-button--danger" @click="del">Delete</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { reactive, toRefs, watch } from 'vue';
import type { Field } from '../../types';

const props = defineProps<{ field: Field }>();
const emit = defineEmits<{
  (e: 'update-field', patch: Partial<Field> & { id: string }): void;
  (e: 'delete-field', id: string): void;
}>();

const local = reactive({ label: props.field.label || '', required: !!props.field.required, role: props.field.role || '' });

watch(() => props.field, (f) => {
  local.label = f.label || '';
  local.required = !!f.required;
  local.role = f.role || '';
});

function save() {
  emit('update-field', { id: props.field.id, label: local.label, required: local.required, role: local.role });
}
function del() {
  emit('delete-field', props.field.id);
}
</script>

<style scoped>
.field-inspector { margin-top:12px; padding:12px; background:var(--sk-color-bg-surface); border:1px solid var(--sk-color-border-default); border-radius:var(--sk-radius-sm) }
.inspector-row { display:flex; gap:8px; align-items:center; margin-bottom:8px }
.inspector-row label { min-width:70px; font-weight:600 }
.inspector-actions { display:flex; gap:8px; }
</style>
