<template>
  <div class="pdf-builder__viewer">
    <div v-for="(size, idx) in pageSizes" :key="idx" class="pdf-page" :style="pageStyle(size)">
      <canvas :ref="setCanvasRef(idx)" class="pdf-canvas"></canvas>
      <div
        class="overlay"
        :style="overlayStyle(size)"
        @dragover.prevent
        @drop.stop.prevent="handleDrop($event, idx)"
        :ref="(el) => setOverlayRef(el, idx)"
      >
        <FieldBox
          v-for="f in fieldsOnPage(idx)"
          :key="f.id"
          :field="f"
          :pageSize="size"
          :scale="scale"
          @update-field="onUpdateField"
          @delete-field="onDeleteField"
          @drag-end="onFieldDragEnd"
          @select="(id) => onSelect && onSelect(id)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// defineProps is a compiler macro — don't import it
import { toRef } from 'vue';
import type { PageSize, Field } from '../../types';
import FieldBox from './FieldBox.vue';

const props = defineProps<{
  pageSizes: PageSize[];
  scale: number;
  setCanvasRef: (idx: number) => (el: HTMLCanvasElement | null) => void;
  setOverlayRef: (el: HTMLElement | null, idx: number) => void;
  fieldsOnPage: (page: number) => Field[];
  onDrop: (ev: DragEvent, pageIndex: number) => void;
  onUpdateField: (patch: Partial<Field> & { id: string }) => void;
  onDeleteField: (id: string) => void;
  onFieldDragEnd: (id: string) => void;
  onSelect?: (id: string) => void;
}>();

// keep reactivity: use toRef for reactive props so changes propagate
const pageSizes = toRef(props as any, 'pageSizes');
const scale = toRef(props as any, 'scale');
const setCanvasRef = (props as any).setCanvasRef;
const setOverlayRef = (props as any).setOverlayRef;
const fieldsOnPage = (props as any).fieldsOnPage;
const onDrop = (props as any).onDrop;
const onUpdateField = (props as any).onUpdateField;
const onDeleteField = (props as any).onDeleteField;
const onFieldDragEnd = (props as any).onFieldDragEnd;
const onSelect = (props as any).onSelect;

try {
  // runtime debug to help root-cause empty viewer
  console.debug(
    '[PdfCanvas] received pageSizes length ->',
    (pageSizes && pageSizes.value && pageSizes.value.length) || 0,
  );
} catch (e) {}

function pageStyle(size: PageSize) {
  const s =
    typeof (scale && (scale as any).value) === 'number'
      ? (scale as any).value
      : (scale as any) || 1;
  const w = Math.floor(size.width * s);
  return { width: `${w}px` } as Record<string, string>;
}

function overlayStyle(size: PageSize) {
  const s =
    typeof (scale && (scale as any).value) === 'number'
      ? (scale as any).value
      : (scale as any) || 1;
  const w = Math.floor(size.width * s);
  const h = Math.floor(size.height * s);
  return { width: `${w}px`, height: `${h}px` } as Record<string, string>;
}

function handleDrop(ev: DragEvent, idx: string | number) {
  const i = typeof idx === 'number' ? idx : Number(idx);
  if (typeof onDrop === 'function') onDrop(ev, i);
}
</script>

<style scoped>
/* Canvas/viewer styles live in FormBuilder.css; localized tweaks can go here if needed */
</style>
