<template>
  <div class="modal-backdrop">
    <div class="modal">
      <h3>{{ field.label || field.id }}</h3>
      <div class="choice-tabs">
        <button :class="{ active: mode === 'type' }" @click="mode = 'type'">Type</button>
        <button :class="{ active: mode === 'draw' }" @click="mode = 'draw'">Draw</button>
      </div>
      <div class="choice-body">
        <div v-if="mode === 'type'">
          <input v-model="typedText" placeholder="Type your name" />
          <div class="modal-preview">
            <canvas ref="typedCanvas" :width="typedW" :height="typedH"></canvas>
          </div>
        </div>
        <div style="display: flex; justify-content: center" v-else>
          <SignaturePad ref="padRef" :width="padW" :height="padH" />
        </div>
      </div>
      <div class="modal-actions">
        <button class="primary" @click="handleSave">Save</button>
        <button v-if="hasValue" @click="handleClear">Clear</button>
        <button class="secondary" @click="$emit('close')">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import SignaturePad from './SignaturePad.vue';
import type { Field } from '../../types';

const props = defineProps<{
  field: Field;
  initialTyped?: string;
  hasValue?: boolean;
  padW?: number;
  padH?: number;
  // target display size (field bbox in page CSS pixels) - used to scale saved image
  targetW?: number;
  targetH?: number;
}>();
const emit = defineEmits<{
  (e: 'save', dataUrl: string | null): void;
  (e: 'clear'): void;
  (e: 'close'): void;
}>();

const mode = ref<'type' | 'draw'>('type');
const typedText = ref(props.initialTyped ?? '');
const typedCanvas = ref<HTMLCanvasElement | null>(null);
const typedW = ref(400);
const typedH = ref(120);
const padRef = ref<any>(null);
const padW = props.padW ?? 400;
const padH = props.padH ?? 120;

watch(
  () => props.initialTyped,
  (v) => {
    typedText.value = v ?? '';
  },
);

function renderTypedPreview() {
  const c = typedCanvas.value;
  if (!c) return;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, c.width, c.height);
  const rootStyles =
    typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
  const textColor =
    rootStyles && rootStyles.getPropertyValue('--sk-color-text-primary')
      ? rootStyles.getPropertyValue('--sk-color-text-primary').trim()
      : '#000';
  ctx.fillStyle = textColor;
  const padding = 8;
  const family =
    rootStyles && rootStyles.getPropertyValue('--sk-font-signature')
      ? rootStyles.getPropertyValue('--sk-font-signature').trim()
      : 'Pacifico, cursive, serif';
  let fontSize = Math.max(20, Math.floor((c.height - padding * 2) * 0.6));
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${fontSize}px ${family}`;
  const text = typedText.value || '';
  let metrics = ctx.measureText(text);
  const availW = Math.max(10, c.width - padding * 2);
  if (metrics.width > availW && metrics.width > 0) {
    const scale = availW / metrics.width;
    fontSize = Math.max(12, Math.floor(fontSize * scale));
    ctx.font = `${fontSize}px ${family}`;
    metrics = ctx.measureText(text);
  }
  const ascent = (metrics.actualBoundingBoxAscent as number) || fontSize * 0.75;
  const descent = (metrics.actualBoundingBoxDescent as number) || fontSize * 0.25;
  const baselineY = (c.height + ascent - descent) / 2;
  ctx.fillText(text, padding, baselineY);
}

watch(typedText, () => nextTick(() => renderTypedPreview()));

function handleSave() {
  if (mode.value === 'type') {
    const c = typedCanvas.value;
    if (!c) return emit('save', null);
    // scale down to target field size if provided (do not upscale)
    if (props.targetW && props.targetH) {
      const outW = Math.max(1, Math.floor(props.targetW));
      const outH = Math.max(1, Math.floor(props.targetH));
      const srcW = c.width || typedW.value;
      const srcH = c.height || typedH.value;
      const scale = Math.min(1, Math.min(outW / srcW, outH / srcH));
      const drawW = Math.max(1, Math.floor(srcW * scale));
      const drawH = Math.max(1, Math.floor(srcH * scale));
      const tmp = document.createElement('canvas');
      tmp.width = outW;
      tmp.height = outH;
      const tctx = tmp.getContext('2d');
      if (tctx) {
        tctx.clearRect(0, 0, outW, outH);
        const offsetX = Math.floor((outW - drawW) / 2);
        const offsetY = Math.floor((outH - drawH) / 2);
        tctx.imageSmoothingEnabled = true;
        tctx.imageSmoothingQuality = 'high';
        tctx.drawImage(c, 0, 0, srcW, srcH, offsetX, offsetY, drawW, drawH);
        emit('save', tmp.toDataURL('image/png'));
        return;
      }
    }
    emit('save', c.toDataURL('image/png'));
  } else {
    // prefer cropped export to trim whitespace and fit target field
    if (typeof padRef.value?.toDataUrlCropped === 'function' && props.targetW && props.targetH) {
      (padRef.value as any)
        .toDataUrlCropped(props.targetW, props.targetH)
        .then((url: string | null) => emit('save', url ?? null))
        .catch(() => {
          const url = padRef.value?.toDataUrl?.();
          emit('save', url ?? null);
        });
      return;
    }
    const url = padRef.value?.toDataUrl?.();
    emit('save', url ?? null);
  }
}

function handleClear() {
  emit('clear');
}
</script>

<style scoped>
.choice-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.choice-tabs button {
  padding: 6px 10px;
  border-radius: var(--sk-radius-sm);
  border: 1px solid var(--sk-color-border-default);
  background: var(--sk-color-bg-surface);
  cursor: pointer;
  color: var(--sk-color-text-primary);
}
.choice-tabs button.active {
  background: var(--sk-color-action-primary);
  color: var(--sk-color-on-action);
  border-color: var(--sk-color-action-primary);
}
.modal-preview canvas {
  width: 100%;
  height: auto;
  border: 1px solid var(--sk-color-border-default);
  border-radius: var(--sk-radius-sm);
  margin-top: 5px;
}
.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.modal-actions button {
  padding: 8px 12px;
  border-radius: var(--sk-radius-sm);
  border: 1px solid var(--sk-color-border-default);
  background: var(--sk-color-bg-surface);
  cursor: pointer;
  font-weight: 600;
}
.modal-actions button.primary {
  background: var(--sk-color-action-primary);
  color: var(--sk-color-on-action);
  border: none;
}
.choice-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.choice-body .pad-wrap {
  background: var(--sk-field-accent-rgba);
  padding: 8px;
  border-radius: var(--sk-radius-sm);
  box-shadow: var(--sk-shadow-sm);
}

/* Modal backdrop and container (component-scoped) */
.modal-backdrop {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal {
  background: var(--sk-color-bg-surface);
  padding: 18px;
  border-radius: var(--sk-radius-lg);
  min-width: 320px;
  max-width: min(30vw, 760px);
  width: 50vw;
  box-shadow: var(--sk-shadow-lg);
}
.modal > h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  text-align: left;
}
.choice-body input {
  width: 100%;
  padding: 8px 10px;
  border-radius: var(--sk-radius-sm);
  border: 1px solid var(--sk-color-border-default);
  .choice-body .pad-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 8px;
    min-height: 120px;
    width: 100%;
    max-width: 620px;
    margin: 0 auto;
    background: transparent;
    box-sizing: border-box;
  }
  padding: 6px 0;
}
.modal-preview canvas {
  border: var(--sk-field-border-width) solid var(--sk-field-accent);
  border-radius: var(--sk-radius-sm);
}
.choice-body .pad-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  min-height: 140px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.modal-actions button {
  padding: 8px 12px;
  border-radius: var(--sk-radius-sm);
  border: 1px solid var(--sk-color-border-default);
  background: var(--sk-color-bg-surface);
  cursor: pointer;
  font-weight: 600;
}
.modal-actions button.primary {
  background: var(--sk-color-action-primary);
  color: var(--sk-color-on-action);
  border: none;
}

.choice-tabs {
  display: flex;
  gap: 8px;
}
.choice-tabs button {
  padding: 6px 10px;
  border-radius: var(--sk-radius-sm);
  border: 1px solid var(--sk-color-border-default);
  background: var(--sk-color-bg-surface);
  cursor: pointer;
  color: var(--sk-color-text-primary);
}
.choice-tabs button.active {
  background: var(--sk-color-action-primary);
  color: var(--sk-color-on-action);
  border-color: var(--sk-color-action-primary);
}
</style>
