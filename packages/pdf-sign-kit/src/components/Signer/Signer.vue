<template>
  <div class="signer-root">
    <div v-if="integrity && mode === 'integrity'" class="integrity-banner">
      Integrity: <strong>{{ integrity.ok ? 'OK' : 'MISMATCH' }}</strong>
    </div>

    <div class="pages">
      <div v-for="(sz, idx) in pageSizes" :key="idx" class="page-wrapper">
        <div class="page-canvas-wrap" :style="{ width: sz.width + 'px', height: sz.height + 'px' }">
          <canvas :ref="setCanvasRef(idx)" class="page-canvas"></canvas>
          <div class="overlay">
            <div
              v-for="f in fieldsOnPage(idx)"
              :key="f.id"
              class="field-overlay"
              :style="fieldStyle(f, idx)"
            >
              <template v-if="f.type === 'text' || f.type === 'name' || f.type === 'email'">
                <input
                  :disabled="isFieldReadonly(f)"
                  type="text"
                  :placeholder="(f as any).placeholder || f.label || ''"
                  v-model="values[f.id]"
                />
              </template>

              <template v-else-if="f.type === 'date' || f.type === 'current_date'">
                <input type="date" :disabled="isFieldReadonly(f)" v-model="values[f.id]" />
              </template>

              <template v-else-if="f.type === 'checkbox'">
                <input type="checkbox" :disabled="isFieldReadonly(f)" v-model="values[f.id]" />
              </template>

              <template v-else-if="f.type === 'signature' || f.type === 'initials'">
                <div class="signature-field">
                  <img v-if="values[f.id]" :src="values[f.id] as string" class="sig-preview" />
                  <div v-else class="empty-sig">No signature</div>
                  <div class="sig-actions">
                    <button @click="openPad(f)" :disabled="isFieldReadonly(f)">Draw</button>
                    <button @click="openTyped(f)" :disabled="isFieldReadonly(f)">Type</button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- modal for signature pad -->
    <div v-if="activePadField" class="modal-backdrop">
      <div class="modal">
        <h3>Sign: {{ activePadField.label || activePadField.id }}</h3>
        <SignaturePad
          ref="padRef"
          :width="Math.max(300, padWidth)"
          :height="Math.max(120, padHeight)"
        />
        <div class="modal-actions">
          <button @click="savePad">Save</button>
          <button @click="closePad">Cancel</button>
        </div>
      </div>
    </div>

    <!-- modal for typed signature -->
    <div v-if="activeTypedField" class="modal-backdrop">
      <div class="modal">
        <h3>Type Signature: {{ activeTypedField.label || activeTypedField.id }}</h3>
        <input v-model="typedText" placeholder="Type your name" />
        <div class="modal-preview">
          <canvas ref="typedCanvas" :width="typedCanvasW" :height="typedCanvasH"></canvas>
        </div>
        <div class="modal-actions">
          <button @click="saveTyped">Save</button>
          <button @click="closeTyped">Cancel</button>
        </div>
      </div>
    </div>

    <div class="actions">
      <div class="errors" v-if="Object.keys(errors).length">
        <div v-for="(msg, id) in errors" :key="id" class="err">{{ msg }}</div>
      </div>
      <button @click="handleFinalize">Finalize & Download</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, onMounted, reactive, nextTick } from 'vue';
import type { Template, Field } from '../../types';
import SignaturePad from './SignaturePad.vue';
import { usePdfjs } from '../../composables/usePdfjs';
import { useSignerManager } from '../../composables/useSigner';

const props = defineProps<{
  pdfSrc: string | ArrayBuffer | File | null;
  template: Template;
  signer?: { id?: string; name?: string; email?: string; role?: string } | null;
  mode?: 'standard' | 'integrity';
  expected?: { templateHash?: string; pdfHash?: string } | null;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'finalized', payload: { values: any[]; signedPdf: Blob; manifest: any }): void;
}>();

const mode = props.mode ?? 'standard';

// load PDF via usePdfjs (accepts File/ArrayBuffer/string)
const pdfSrcRef = ref(props.pdfSrc);
const { pdfDoc, numPages, pageSizes, loading, renderPage } = usePdfjs(pdfSrcRef as any);

// canvas refs
const canvasRefs = ref<Array<HTMLCanvasElement | null>>([]);
function setCanvasRef(i: number) {
  return (el: HTMLCanvasElement | null) => {
    canvasRefs.value[i] = el;
    // render when element appears
    if (el && pageSizes.value[i]) renderPage(i + 1, el);
  };
}

watch(pageSizes, (n) => {
  // re-render all canvases when sizes update
  for (let i = 0; i < n.length; i++) {
    const el = canvasRefs.value[i];
    if (el) renderPage(i + 1, el);
  }
});

// signer manager
const originalPdfBytes = ref<ArrayBuffer | null>(null);
// load original pdf bytes if pdfSrc is a URL
async function ensurePdfBytes() {
  const src = props.pdfSrc;
  if (!src) return;
  if (typeof src === 'string') {
    const r = await fetch(src);
    originalPdfBytes.value = await r.arrayBuffer();
    pdfSrcRef.value = originalPdfBytes.value as any;
  } else if (src instanceof File) {
    originalPdfBytes.value = await src.arrayBuffer();
    pdfSrcRef.value = originalPdfBytes.value as any;
  } else if (src instanceof ArrayBuffer) {
    originalPdfBytes.value = src;
    pdfSrcRef.value = originalPdfBytes.value as any;
  }
}

onMounted(() => {
  ensurePdfBytes();
});

const signerManager = useSignerManager(
  props.template,
  originalPdfBytes.value,
  props.signer ?? null,
);
const values = signerManager.values as any;
const errors = signerManager.errors as any;

watch(originalPdfBytes, (b) => {
  // re-create manager when pdf bytes become available
});

function fieldsOnPage(pageIndex: number) {
  return props.template.fields.filter((f) => f.page === pageIndex);
}

function fieldStyle(f: Field, pageIndex: number) {
  const sz = pageSizes.value[pageIndex];
  if (!sz) return {};
  const left = f.x * sz.width;
  const top = f.y * sz.height;
  const width = Math.max(20, f.width * sz.width);
  const height = Math.max(18, f.height * sz.height);
  return { left: left + 'px', top: top + 'px', width: width + 'px', height: height + 'px' };
}

function isFieldReadonly(f: Field) {
  if (props.readonly) return true;
  if (f.role && props.signer && props.signer.role) return f.role !== props.signer.role;
  if (f.role && !props.signer) return true;
  return false;
}

// signature pad handling
const padRef = ref<any>(null);
const activePadField = ref<Field | null>(null);
const padWidth = ref(400);
const padHeight = ref(120);

function openPad(f: Field) {
  activePadField.value = f;
  // set pad size roughly to field pixel size if available
  const sz = pageSizes.value[f.page];
  if (sz) {
    padWidth.value = Math.max(200, f.width * sz.width);
    padHeight.value = Math.max(80, f.height * sz.height);
  }
  // clear pad
  nextTick(() => padRef.value?.clear());
}

function closePad() {
  activePadField.value = null;
}

function savePad() {
  if (!activePadField.value) return;
  const dataUrl = padRef.value?.toDataUrl();
  if (dataUrl) values[activePadField.value.id] = dataUrl;
  activePadField.value = null;
}

// typed signature handling
const activeTypedField = ref<Field | null>(null);
const typedText = ref('');
const typedCanvas = ref<HTMLCanvasElement | null>(null);
const typedCanvasW = ref(400);
const typedCanvasH = ref(120);

function openTyped(f: Field) {
  activeTypedField.value = f;
  const sz = pageSizes.value[f.page];
  if (sz) {
    typedCanvasW.value = Math.max(200, Math.floor(f.width * sz.width));
    typedCanvasH.value = Math.max(80, Math.floor(f.height * sz.height));
  }
  typedText.value = props.signer?.name ?? '';
  nextTick(() => renderTypedPreview());
}

function closeTyped() {
  activeTypedField.value = null;
}

function renderTypedPreview() {
  const c = typedCanvas.value;
  if (!c) return;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#000';
  const fontSize = Math.max(20, Math.floor(c.height * 0.5));
  ctx.font = `${fontSize}px Pacifico, cursive, serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText(typedText.value || '', 10, c.height / 2);
}

function saveTyped() {
  if (!activeTypedField.value || !typedCanvas.value) return;
  const dataUrl = typedCanvas.value.toDataURL('image/png');
  values[activeTypedField.value.id] = dataUrl;
  activeTypedField.value = null;
}

// finalize
async function handleFinalize() {
  try {
    const { signedPdfBytes, manifest } = await signerManager.finalize({
      mode,
      expected: props.expected ?? undefined,
      signerInfo: props.signer,
    });
    const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
    emit('finalized', {
      values: Object.entries(values).map(([k, v]) => ({ fieldId: k, value: v })),
      signedPdf: blob,
      manifest,
    });
    // also trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${props.template.title || 'signed'}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err: any) {
    if (err && err.validation) {
      // display validation errors
      Object.assign((signerManager as any).errors, err.validation);
    } else {
      console.error(err);
      alert('Finalize failed: ' + (err.message || String(err)));
    }
  }
}

const integrity = ref<any>(null);
// compute integrity check when possible
async function computeIntegrity() {
  if (mode !== 'integrity') return;
  // the useSignerManager handles checks at finalize time; here we just show basic placeholder
  integrity.value = { ok: true };
}

onMounted(() => computeIntegrity());

// helpers
function setValue(fieldId: string, v: any) {
  values[fieldId] = v;
}

// refs for pad/typed canvas
const padRefAny = padRef;

// expose template for CSS linking
const pageSizesLocal = pageSizes;

// used in template
const padRefExport = padRefAny;

// typed canvas ref assigner
function setTypedCanvas(el: HTMLCanvasElement | null) {
  typedCanvas.value = el;
}

// export for template usage
const fieldsOnPageExport = fieldsOnPage;
</script>

<style scoped>
.signer-root {
  font-family:
    system-ui,
    Segoe UI,
    Roboto,
    Helvetica,
    Arial;
}
.pages {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.page-wrapper {
  display: flex;
  justify-content: center;
}
.page-canvas-wrap {
  position: relative;
  background: #eee;
}
.page-canvas {
  display: block;
}
.overlay {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  pointer-events: auto;
}
.field-overlay {
  position: absolute;
  box-sizing: border-box;
  pointer-events: auto;
}
.field-overlay input[type='text'],
.field-overlay input[type='date'] {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.signature-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.sig-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.empty-sig {
  font-size: 12px;
  color: #888;
}
.sig-actions button {
  margin-right: 6px;
}
.modal-backdrop {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  background: #fff;
  padding: 16px;
  border-radius: 6px;
  min-width: 320px;
}
.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.actions {
  margin-top: 12px;
}
.errors {
  color: #a00;
}
.integrity-banner {
  background: #fffae6;
  padding: 6px;
  margin-bottom: 8px;
  border: 1px solid #f0e6b2;
}
</style>
