<template>
  <div class="pdf-builder">
    <div class="pdf-builder__toolbar">
      <slot name="toolbar">
        <div class="toolbar-left">
          <button @click="zoomIn">Zoom +</button>
          <button @click="zoomOut">Zoom -</button>
          <button @click="exportTemplateAction">Export</button>
        </div>
      </slot>
    </div>

    <div class="pdf-builder__content">
      <div class="pdf-builder__viewer" ref="viewerRef">
        <div v-for="(size, idx) in pageSizes" :key="idx" class="pdf-page" :style="pageStyle(size)">
          <canvas :ref="setCanvasRef(idx)" class="pdf-canvas"></canvas>
          <div
            class="overlay"
            :style="overlayStyle(size)"
            @dragover.prevent
            @drop.stop.prevent="onDrop($event, idx)"
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
            />
          </div>
        </div>
      </div>

      <aside class="pdf-builder__bank">
        <h4>Fields</h4>
        <div class="bank-list">
          <div
            v-for="t in fieldTypes"
            :key="t"
            class="bank-item"
            draggable="true"
            @dragstart="onDragStart($event, t)"
            @click="setActiveType(t)"
            :class="{ active: activeType === t }"
          >
            {{ t }}
          </div>
        </div>
        <div class="bank-hint">Drag a field onto the page to add it.</div>
      </aside>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue';
import type { Template, Field, PageSize } from '../../types';
import FieldBox from './FieldBox.vue';
import { usePdfjs } from '../../composables/usePdfjs';
import { useTemplate } from '../../composables/useTemplate';
import { pixelsToNormalized, normalizedToPixels } from '../../utils/coord';

// v-model: template (use defineModel for two-way binding)
const model = defineModel<Template | null>();

const props = defineProps<{
  pdf?: File | ArrayBuffer | string | null;
  initialZoom?: number;
  // optional override for date locale used by template (e.g. 'en-US')
  dateLocale?: string | null;
}>();
const emit = defineEmits<{
  (e: 'field-added', field: Field): void;
  (e: 'field-updated', field: Field): void;
  (e: 'field-removed', id: string): void;
}>();

const viewerRef = ref<HTMLElement | null>(null);
const canvasRefs = ref<Array<HTMLCanvasElement | null>>([]);
const overlayRefs = ref<Array<HTMLElement | null>>([]);

const pdfSource = ref(props.pdf ?? null);
const { pdfDoc, numPages, pageSizes, loading, renderPage } = usePdfjs(pdfSource as any);

const { template, setPages, addField, updateField, removeField, exportTemplate } = useTemplate(
  model.value ?? null,
);

const scale = ref(props.initialZoom ?? 1);
const fieldTypes = [
  'signature',
  'initials',
  'text',
  'date',
  'current_date',
  'checkbox',
  'name',
  'email',
];
const activeType = ref<Field['type']>(fieldTypes[0]);

const defaultSizes: Record<string, { w: number; h: number }> = {
  signature: { w: 0.28, h: 0.12 },
  initials: { w: 0.12, h: 0.06 },
  text: { w: 0.18, h: 0.05 },
  date: { w: 0.16, h: 0.05 },
  current_date: { w: 0.16, h: 0.05 },
  checkbox: { w: 0.04, h: 0.04 },
  name: { w: 0.2, h: 0.05 },
  email: { w: 0.22, h: 0.05 },
};

watch(pageSizes, (sizes) => {
  setPages(sizes as PageSize[]);
  // render pages after DOM update
  nextTick(() => renderAll());
});

watch(scale, () => {
  nextTick(() => renderAll());
});

function setCanvasRef(idx: number) {
  return (el: HTMLCanvasElement | null) => {
    canvasRefs.value[idx] = el;
    // render page when canvas is attached
    nextTick(() => renderPageIfReady(idx));
  };
}

function setOverlayRef(el: HTMLElement | null, idx: number) {
  overlayRefs.value[idx] = el;
}

async function renderPageIfReady(idx: number) {
  const c = canvasRefs.value[idx];
  if (!c) return;
  await renderPage(idx + 1, c, scale.value);
}

async function renderAll() {
  for (let i = 0; i < (pageSizes.value || []).length; i++) {
    await renderPageIfReady(i);
  }
}

function pageStyle(size: PageSize) {
  const w = Math.floor(size.width * scale.value);
  return { width: `${w}px` } as Record<string, string>;
}

function overlayStyle(size: PageSize) {
  const w = Math.floor(size.width * scale.value);
  const h = Math.floor(size.height * scale.value);
  return { width: `${w}px`, height: `${h}px` } as Record<string, string>;
}

function fieldsOnPage(page: number) {
  return template.value.fields.filter((f) => f.page === page);
}

// overlay click-to-add intentionally disabled — use drag from the bank only.

function onDragStart(ev: DragEvent, type: string) {
  try {
    const dt = ev.dataTransfer;
    if (dt) {
      dt.setData('text/plain', type);
      dt.effectAllowed = 'copy';

      // create a visual drag preview that matches the FieldBox appearance
      try {
        const def = defaultSizes[type] || { w: 0.18, h: 0.05 };
        // base page width fallback
        const basePage = pageSizes.value && pageSizes.value[0] ? pageSizes.value[0].width : 600;
        const previewW = Math.max(48, Math.floor(def.w * basePage * (scale.value || 1)));
        const previewH = Math.max(28, Math.floor(def.h * basePage * (scale.value || 1)));
        const preview = document.createElement('div');
        preview.className = 'bank-drag-preview';
        preview.style.width = previewW + 'px';
        preview.style.height = previewH + 'px';
        preview.style.position = 'absolute';
        preview.style.left = '-9999px';
        preview.style.top = '0px';
        // inner structure to match FieldBox: label, delete bubble, handle
        preview.innerHTML = `
          <div class="bank-preview-label">${type}</div>
          <div class="bank-preview-delete">✕</div>
          <div class="bank-preview-handle"></div>
        `;
        document.body.appendChild(preview);
        dt.setDragImage(preview, Math.floor(previewW / 2), Math.floor(previewH / 2));
        // remove preview after a short delay
        setTimeout(() => {
          try {
            preview.remove();
          } catch (e) {}
        }, 0);
      } catch (e) {
        // ignore drag image failures
      }
    }
  } catch (e) {}
}

function setActiveType(t: Field['type']) {
  activeType.value = t;
}

function onDrop(ev: DragEvent, pageIndex: number) {
  const type = ev.dataTransfer?.getData('text/plain') || activeType.value;
  const overlay = overlayRefs.value[pageIndex];
  if (!overlay) return;
  const rect = overlay.getBoundingClientRect();
  const dropX = (ev as DragEvent).clientX - rect.left;
  const dropY = (ev as DragEvent).clientY - rect.top;
  const pageSize = pageSizes.value[pageIndex];
  if (!pageSize) return;
  // compute preview size the same way the bank drag preview was created
  const def = defaultSizes[type] || { w: 0.18, h: 0.05 };
  const basePage =
    pageSizes.value && pageSizes.value[0] ? pageSizes.value[0].width : pageSize.width;
  const previewW = Math.max(48, Math.floor(def.w * basePage * (scale.value || 1)));
  const previewH = Math.max(28, Math.floor(def.h * basePage * (scale.value || 1)));
  const pxW = pageSize.width * scale.value;
  const pxH = pageSize.height * scale.value;
  const boxW = previewW;
  const boxH = previewH;
  const norm = pixelsToNormalized(
    dropX - boxW / 2,
    dropY - boxH / 2,
    boxW,
    boxH,
    pageSize,
    scale.value,
  );
  const field = addField({
    type: type as any,
    page: pageIndex,
    x: Math.max(0, Math.min(1 - norm.width, norm.x)),
    y: Math.max(0, Math.min(1 - norm.height, norm.y)),
    width: Math.min(1, norm.width),
    height: Math.min(1, norm.height),
    label: type,
    meta: {},
  });
  emit('field-added', field);
  // sync v-model with the new template
  model.value = exportTemplate();
}

function onUpdateField(patch: Partial<Field> & { id: string }) {
  updateField(patch.id, patch as Partial<Field>);
  const f = template.value.fields.find((x) => x.id === patch.id)!;
  emit('field-updated', f);
  // note: do not emit whole-model updates on every pointermove — emit on drag-end to avoid layout thrash
}

function onDeleteField(id: string) {
  removeField(id);
  emit('field-removed', id);
  model.value = exportTemplate();
}

function onFieldDragEnd(id: string) {
  const f = template.value.fields.find((x) => x.id === id)!;
  emit('field-updated', f);
  model.value = exportTemplate();
}

function zoomIn() {
  scale.value = Math.min(4, scale.value * 1.2);
}
function zoomOut() {
  scale.value = Math.max(0.25, scale.value / 1.2);
}

function exportTemplateAction() {
  // sync v-model with exported template
  model.value = exportTemplate();
}

// watch incoming v-model
// watch incoming v-model
watch(
  () => model.value,
  (v) => {
    if (v) {
      // replace local template - simple shallow assignment
      template.value = v as Template;
      // if a dateLocale prop override is provided, apply it to the template meta
      if (props.dateLocale) {
        template.value.meta = template.value.meta || {};
        (template.value.meta as any).dateLocale = props.dateLocale;
        // propagate back to model
        model.value = exportTemplate();
      }
    }
  },
);

// if the consumer provided an explicit dateLocale prop, keep the model meta in sync
watch(
  () => props.dateLocale,
  (loc) => {
    if (!loc) return;
    template.value.meta = template.value.meta || {};
    (template.value.meta as any).dateLocale = loc;
    model.value = exportTemplate();
  },
);

// initial render attempt
nextTick(() => renderAll());
</script>

<style src="./FormBuilder.css"></style>
