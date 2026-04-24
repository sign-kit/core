<template>
  <aside class="pdf-builder__bank">
    <h4>Fields</h4>
    <div class="bank-list">
      <div
        v-for="t in fieldTypes"
        :key="t"
        class="bank-item"
        draggable="true"
        @dragstart="handleDragStart($event, t)"
        @click="handleClick(t)"
        :class="{ active: activeType === t }"
      >
        {{ t }}
      </div>
    </div>
    <div class="bank-hint">Drag a field onto the page to add it.</div>
  </aside>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue';
import type { Field } from '../../types';

const props = defineProps<{
  fieldTypes: string[];
  activeType: Field['type'];
}>();

const emit = defineEmits<{
  (e: 'drag-start', ev: DragEvent, type: string): void;
  (e: 'set-active', type: Field['type']): void;
}>();

function handleDragStart(ev: DragEvent, t: string) {
  emit('drag-start', ev, t);
}

function handleClick(t: Field['type']) {
  emit('set-active', t);
}
</script>

<style scoped>
/* Styling is shared from FormBuilder.css and tokens; keep local rules minimal */
</style>
