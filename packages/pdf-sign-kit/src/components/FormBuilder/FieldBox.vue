<template>
  <div :class="['field-box','sk-field-box', `field-type-${field.type}`]" :style="style" @pointerdown.stop="onPointerDown" ref="root">
    <div class="label" ref="labelRef">{{ field.label || field.type }}</div>
    <button class="field-delete" ref="deleteRef" @click.stop="onDelete">✕</button>
    <div class="field-handle br" @pointerdown.stop.prevent="onResizeDown"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import type { Field, PageSize } from '../../types';

const props = defineProps<{
  field: Field;
  pageSize: PageSize;
  scale: number;
}>();
const emit = defineEmits<{
  (e: 'update-field', payload: Partial<Field> & { id: string }): void;
  (e: 'delete-field', id: string): void;
  (e: 'drag-end', id: string): void;
  (e: 'select', id: string): void;
}>();

const root = ref<HTMLElement | null>(null);
const labelRef = ref<HTMLElement | null>(null);
const deleteRef = ref<HTMLElement | null>(null);

const style = computed(() => {
  const f = props.field;
  const left = f.x * props.pageSize.width * props.scale;
  const top = f.y * props.pageSize.height * props.scale;
  const width = f.width * props.pageSize.width * props.scale;
  const height = f.height * props.pageSize.height * props.scale;
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${Math.max(20, width)}px`,
    height: `${Math.max(20, height)}px`,
  } as Record<string, string>;
});

let removeDragListeners: (() => void) | null = null;

const isDragging = ref(false);
let currentDx = 0;
let currentDy = 0;

function onPointerDown(e: PointerEvent) {
  const overlayEl = root.value?.parentElement as HTMLElement | null;
  if (!overlayEl || !root.value) return;
  const target = e.target as HTMLElement | null;
  // emit select so consumers can show an inspector
  try {
    emit('select', props.field.id);
  } catch (err) {}

  // If the pointerdown started on the delete button or resize handle, don't start a drag here.
  if (
    target &&
    (target.closest('.field-delete') ||
      target.closest('.field-handle') ||
      target.tagName === 'BUTTON')
  ) {
    return;
  }
  const overlayRect = overlayEl.getBoundingClientRect();
  const fieldRect = root.value.getBoundingClientRect();
  const pageW = props.pageSize.width * props.scale;
  const pageH = props.pageSize.height * props.scale;

  const startX = e.clientX;
  const startY = e.clientY;
  const offsetX = startX - fieldRect.left;
  const offsetY = startY - fieldRect.top;
  const pointerId = e.pointerId;

  try {
    (root.value as HTMLElement).setPointerCapture(pointerId);
  } catch {}

  isDragging.value = true;
  currentDx = 0;
  currentDy = 0;

  const startLeft = fieldRect.left - overlayRect.left;
  const startTop = fieldRect.top - overlayRect.top;

  const move = (ev: PointerEvent) => {
    const px = ev.clientX - overlayRect.left - offsetX;
    const py = ev.clientY - overlayRect.top - offsetY;
    currentDx = px - startLeft;
    currentDy = py - startTop;
    if (root.value) {
      (root.value as HTMLElement).style.transform = `translate(${currentDx}px, ${currentDy}px)`;
      (root.value as HTMLElement).style.zIndex = '1000';
      (root.value as HTMLElement).classList.add('dragging');
    }
  };

  const up = (ev?: PointerEvent) => {
    try {
      (root.value as HTMLElement).releasePointerCapture(pointerId);
    } catch {}
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    isDragging.value = false;
    if (root.value) {
      (root.value as HTMLElement).style.transform = '';
      (root.value as HTMLElement).style.zIndex = '';
      (root.value as HTMLElement).classList.remove('dragging');
    }
    // commit final position
    const f = { ...props.field };
    const finalLeft = fieldRect.left - overlayRect.left + currentDx;
    const finalTop = fieldRect.top - overlayRect.top + currentDy;
    const nx = Math.max(0, Math.min(1 - f.width, finalLeft / pageW));
    const ny = Math.max(0, Math.min(1 - f.height, finalTop / pageH));
    emit('update-field', { id: f.id, x: nx, y: ny });
    emit('drag-end', props.field.id);
  };

  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function onResizeDown(e: PointerEvent) {
  const overlayEl = root.value?.parentElement as HTMLElement | null;
  if (!overlayEl || !root.value) return;
  const overlayRect = overlayEl.getBoundingClientRect();
  const fieldRect = root.value.getBoundingClientRect();
  const pageW = props.pageSize.width * props.scale;
  const pageH = props.pageSize.height * props.scale;

  try {
    (root.value as HTMLElement).setPointerCapture(e.pointerId);
  } catch {}

  const f = { ...props.field };
  const initialLeft = f.x * pageW;
  const initialTop = f.y * pageH;

  // compute minimum sizes in pixels based on label and delete button
  const minLabelWidth = labelRef.value ? labelRef.value.scrollWidth + 12 : 40; // padding
  const deleteWidth = deleteRef.value ? deleteRef.value.offsetWidth || 20 : 20;
  const minWidthPx = Math.max(40, minLabelWidth + deleteWidth + 8);
  const minHeightPx = Math.max(20, labelRef.value ? labelRef.value.scrollHeight + 8 : 20);

  const move = (ev: PointerEvent) => {
    const px = ev.clientX - overlayRect.left;
    const py = ev.clientY - overlayRect.top;
    const newW = Math.max(minWidthPx, px - initialLeft);
    const newH = Math.max(minHeightPx, py - initialTop);
    if (root.value) {
      (root.value as HTMLElement).style.width = `${newW}px`;
      (root.value as HTMLElement).style.height = `${newH}px`;
    }
  };

  const up = () => {
    try {
      (root.value as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    if (root.value) {
      const finalW = parseFloat((root.value as HTMLElement).style.width || `${fieldRect.width}`);
      const finalH = parseFloat((root.value as HTMLElement).style.height || `${fieldRect.height}`);
      const minNW = minWidthPx / pageW;
      const minNH = minHeightPx / pageH;
      const nw = Math.max(minNW, Math.min(1 - f.x, finalW / pageW));
      const nh = Math.max(minNH, Math.min(1 - f.y, finalH / pageH));
      (root.value as HTMLElement).style.width = '';
      (root.value as HTMLElement).style.height = '';
      emit('update-field', { id: f.id, width: nw, height: nh });
      emit('drag-end', props.field.id);
    }
  };

  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function onDelete() {
  emit('delete-field', props.field.id);
}
</script>

<style scoped src="./FormBuilder.css"></style>
