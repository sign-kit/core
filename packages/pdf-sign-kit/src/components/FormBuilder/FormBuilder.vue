<template>
  <div class="pdf-builder">
    <div class="pdf-builder__toolbar">
      <slot name="toolbar">
        <BuilderToolbar @zoom-in="zoomIn" @zoom-out="zoomOut" @export="exportTemplateAction" />
      </slot>
    </div>

    <div class="pdf-builder__content">
      <PdfCanvas
        :pageSizes="pageSizes"
        :scale="scale"
        :setCanvasRef="setCanvasRef"
        :setOverlayRef="setOverlayRef"
        :fieldsOnPage="fieldsOnPage"
        :onDrop="onDrop"
        :onUpdateField="onUpdateField"
        :onDeleteField="onDeleteField"
        :onFieldDragEnd="onFieldDragEnd"
        :onSelect="onFieldSelect"
      />

      <div style="display: flex; flex-direction: column; gap: 12px">
        <FieldPalette
          :fieldTypes="fieldTypes"
          :activeType="activeType"
          @drag-start="onDragStart"
          @set-active="setActiveType"
        />
        <FieldInspector
          v-if="selectedField"
          :field="selectedField"
          @update-field="onUpdateField"
          @delete-field="onDeleteField"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, computed } from 'vue';
import type { Template, Field, PageSize, FormBuilderProps } from '../../types';
import PdfCanvas from './PdfCanvas.vue';
import FieldPalette from './FieldPalette.vue';
import BuilderToolbar from './BuilderToolbar.vue';
import FieldInspector from './FieldInspector.vue';
import { usePdfjs } from '../../composables/usePdfjs';
import { useTemplate } from '../../composables/useTemplate';
import { pixelsToNormalized } from '../../utils/coord';
import { ensurePdfRoot } from '../../utils/template';

// v-model: template (use defineModel for two-way binding)
const model = defineModel<Template | null>();

const props = defineProps<FormBuilderProps>();
const emit = defineEmits<{
  (e: 'field-added', field: Field): void;
  (e: 'field-updated', field: Field): void;
  (e: 'field-removed', id: string): void;
}>();

const viewerRef = ref<HTMLElement | null>(null);
const canvasRefs = ref<Array<HTMLCanvasElement | null>>([]);
const overlayRefs = ref<Array<HTMLElement | null>>([]);

const pdfSource = ref(props.pdf ?? null);
console.debug('[FormBuilder] initial props.pdf ->', props.pdf);
const { pdfDoc, numPages, pageSizes, loading, renderPage } = usePdfjs(pdfSource as any);

watch(loading, (v) => console.debug('[FormBuilder] pdf loading ->', v));

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

const selectedFieldId = ref<string | null>(null);
const selectedField = computed(
  () => template.value.fields.find((f) => f.id === selectedFieldId.value) || null,
);

watch(pageSizes, (sizes) => {
  try {
    console.debug(
      '[FormBuilder] pageSizes -> length=',
      (sizes && sizes.length) || 0,
    );
  } catch (e) {
    console.debug('[FormBuilder] pageSizes -> (unable to read length)');
  }
  setPages(sizes as PageSize[]);
  // render pages after DOM update
  nextTick(() => renderAll());
});

watch(scale, () => {
  nextTick(() => renderAll());
});

// if parent provides a pdf source (url/file), populate template.pdf.source for metadata
watch(
  () => props.pdf,
  async (p) => {
    console.debug('[FormBuilder] props.pdf changed ->', p);
    // update internal pdfSource used by usePdfjs so it reloads when parent changes
    if (!p) return;
    try {
      const setPdfSource = (source: { type: string; value: string }) => {
        ensurePdfRoot(template.value as any);
        (template.value.pdf as any).source = source;
      };

      if (typeof p === 'string') {
        // prefer loading the PDF into an ArrayBuffer to avoid worker/cors issues
        try {
          const r = await fetch(p);
          if (r.ok) {
            const buf = await r.arrayBuffer();
            pdfSource.value = buf as any;
            setPdfSource({ type: 'url', value: p });
          } else {
            pdfSource.value = p as any;
            setPdfSource({ type: 'url', value: p });
          }
        } catch (e) {
          // fallback to URL if fetch fails
          pdfSource.value = p as any;
          setPdfSource({ type: 'url', value: p });
        }
      } else if (p instanceof File) {
        try {
          const ab = await p.arrayBuffer();
          pdfSource.value = ab as any;
        } catch (e) {
          pdfSource.value = p as any;
        }
        setPdfSource({ type: 'file-name', value: p.name || '' });
      } else {
        pdfSource.value = p as any;
      }
      // ensure pdf root exists
      ensurePdfRoot(template.value as any);
      // propagate back to model
      model.value = exportTemplate();
    } catch (e) {
      console.error('[FormBuilder] failed to handle props.pdf change', e);
    }
  },
);

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

function onFieldSelect(id: string) {
  selectedFieldId.value = id;
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
  // keep inspector selection synced when updates come from inspector
  selectedFieldId.value = patch.id;
}

function onDeleteField(id: string) {
  removeField(id);
  emit('field-removed', id);
  model.value = exportTemplate();
  if (selectedFieldId.value === id) selectedFieldId.value = null;
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
watch(
  () => model.value,
  (v) => {
    if (v) {
      // replace local template - simple shallow assignment
      template.value = v as Template;
      // if a dateLocale prop override is provided, apply it to the template meta
      if (props.dateLocale) {
        template.value.meta = template.value.meta || {};
        const current = (template.value.meta as any).dateLocale;
        if (current !== props.dateLocale) {
          (template.value.meta as any).dateLocale = props.dateLocale;
          // propagate back to model only when a real change occurred
          model.value = exportTemplate();
        }
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
    const cur = (template.value.meta as any).dateLocale;
    if (cur !== loc) {
      (template.value.meta as any).dateLocale = loc;
      model.value = exportTemplate();
    }
  },
);

// initial render attempt
nextTick(() => renderAll());
</script>

<style src="./FormBuilder.css"></style>
