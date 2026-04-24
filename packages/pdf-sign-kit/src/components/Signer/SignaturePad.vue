<template>
  <div class="signature-pad" :style="{ width: `${width}px`, height: `${height}px` }">
    <canvas ref="canvas" class="sig-canvas" />
    <div class="controls" v-if="showControls">
      <button type="button" @click="clearCanvas">Clear</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, defineProps, watch, onBeforeUnmount, nextTick } from 'vue';

const props = defineProps<{
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  showControls?: boolean;
}>();

const width = props.width ?? 400;
const height = props.height ?? 120;
const strokeColor =
  props.strokeColor ??
  (typeof window !== 'undefined'
    ? getComputedStyle(document.documentElement)
        .getPropertyValue('--sk-color-text-primary')
        .trim() || '#000'
    : '#000');
const strokeWidth = props.strokeWidth ?? 2;
const showControls = props.showControls ?? true;

const canvas = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let drawing = false;
let lastX = 0;
let lastY = 0;

function setupCanvas() {
  const el = canvas.value;
  if (!el) return;
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  el.width = Math.floor(width * ratio);
  el.height = Math.floor(height * ratio);
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;
  ctx = el.getContext('2d');
  if (!ctx) return;
  ctx.scale(ratio, ratio);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
}

function pointerDown(e: PointerEvent) {
  drawing = true;
  const rect = (canvas.value as HTMLCanvasElement).getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
}

function pointerMove(e: PointerEvent) {
  if (!drawing || !ctx) return;
  const rect = (canvas.value as HTMLCanvasElement).getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
  lastX = x;
  lastY = y;
}

function pointerUp() {
  drawing = false;
}

function clearCanvas() {
  if (!ctx || !canvas.value) return;
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
}

function toDataUrl(type = 'image/png', quality?: number) {
  if (!canvas.value) return null;
  return canvas.value.toDataURL(type, quality);
}

function loadImage(dataUrl: string) {
  return new Promise<void>((resolve) => {
    if (!canvas.value || !ctx) return resolve();
    const img = new Image();
    img.onload = () => {
      ctx!.clearRect(0, 0, canvas.value!.width, canvas.value!.height);
      // draw scaled to canvas size
      ctx!.drawImage(img, 0, 0, width, height);
      resolve();
    };
    img.src = dataUrl;
  });
}

onMounted(() => {
  setupCanvas();
  const el = canvas.value as HTMLCanvasElement;
  el.addEventListener('pointerdown', pointerDown);
  window.addEventListener('pointermove', pointerMove);
  window.addEventListener('pointerup', pointerUp);
});

onBeforeUnmount(() => {
  const el = canvas.value as HTMLCanvasElement | null;
  if (el) el.removeEventListener('pointerdown', pointerDown);
  window.removeEventListener('pointermove', pointerMove);
  window.removeEventListener('pointerup', pointerUp);
});

// Expose simple API to parent via template ref
// Methods: clear, toDataUrl, loadImage
export type SignaturePadHandle = {
  clear: () => void;
  toDataUrl: (type?: string, quality?: number) => string | null;
  loadImage: (dataUrl: string) => Promise<void>;
};

// @ts-ignore - expose wrapper object
const handle: SignaturePadHandle = {
  clear: clearCanvas,
  toDataUrl: toDataUrl as (type?: string, quality?: number) => string | null,
  loadImage,
};

// Using `defineExpose` in script setup
// to make methods available to parent via ref
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
defineExpose(handle);
</script>

<style scoped>
.signature-pad {
  position: relative;
  user-select: none;
  background: var(--sk-field-accent-rgba);
  padding: 8px;
  border-radius: var(--sk-radius-sm);
  box-shadow: var(--sk-shadow-sm);
}
.sig-canvas {
  display: block;
  touch-action: none;
  background: #fff;
  border: var(--sk-field-border-width) solid var(--sk-field-accent);
  border-radius: var(--sk-radius-sm);
  width: 100%;
  height: auto;
}
.controls {
  position: static;
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.controls button {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--sk-color-border-default);
  background: rgba(255,255,255,0.95);
  color: var(--sk-color-text-primary);
  font-weight: 600;
}
</style>
