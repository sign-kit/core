<template>
  <div class="signer-root">
    <IntegrityBanner :integrity="integrity" :mode="mode" />

    <div class="pages">
      <div v-for="(sz, idx) in pageSizes" :key="idx" class="page-wrapper">
        <div class="page-canvas-wrap" :style="{ width: sz.width + 'px', height: sz.height + 'px' }">
          <canvas :ref="setCanvasRef(idx)" class="page-canvas"></canvas>
          <div class="overlay">
            <div
              v-for="f in fieldsOnPage(idx)"
              :key="f.id"
              class="field-overlay"
              :class="`field-type-${f.type}`"
              :data-field-id="f.id"
              :style="fieldStyle(f, idx)"
            >
              <FieldInput
                :field="f"
                :value="values[f.id]"
                :readonly="isFieldReadonly(f)"
                :placeholder="(f as any).placeholder || f.label || ''"
                @set-value="(v) => signerManager.setValue(f.id, v)"
                @open-choice="openChoice"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <SignatureChoiceModal
      v-if="activeChoiceField"
      :field="activeChoiceField"
      :initialTyped="props.signer?.name"
      :hasValue="!!values[activeChoiceField.id]"
      :padW="padWidth"
      :padH="padHeight"
      :targetW="
        pageSizes[activeChoiceField.page]
          ? activeChoiceField.width * pageSizes[activeChoiceField.page].width
          : padWidth
      "
      :targetH="
        pageSizes[activeChoiceField.page]
          ? activeChoiceField.height * pageSizes[activeChoiceField.page].height
          : padHeight
      "
      @save="onChoiceSave"
      @clear="onChoiceClear"
      @close="closeChoice"
    />

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
import type { Template, Field, SignerProps } from '../../types';
import FieldInput from './FieldInput.vue';
import SignatureChoiceModal from './SignatureChoiceModal.vue';
import IntegrityBanner from './IntegrityBanner.vue';
import { usePdfjs } from '../../composables/usePdfjs';
import { useSignerManager } from '../../composables/useSigner';
import { canonicalizeTemplate, computeSha256, computeValuesHash } from '../../utils/signer';

const props = defineProps<SignerProps>();

const emit = defineEmits<{
  (e: 'finalized', payload: { values: any[]; signedPdf: Blob; manifest: any }): void;
  (e: 'integrity-check', payload: any): void;
  (e: 'integrity-verification', payload: any): void;
}>();

const mode = props.mode ?? 'standard';

function buildFallbackTemplate(): Template {
  return {
    id: 'signer-template-pending',
    version: '1.0.0',
    pages: [],
    fields: [],
    createdAt: new Date().toISOString(),
  } as Template;
}

function getSafeTemplate(input: Template | null | undefined): Template {
  if (!input) return buildFallbackTemplate();
  if (!Array.isArray((input as any).fields) || !Array.isArray((input as any).pages)) {
    return buildFallbackTemplate();
  }
  return input;
}

const templateSafe = computed(() => getSafeTemplate((props as any).template));

// load PDF via usePdfjs (accepts File/ArrayBuffer/string)
const pdfSrcRef = ref(props.pdfSrc);
const { pdfDoc, numPages, pageSizes, loading, renderPage } = usePdfjs(pdfSrcRef as any);

// canvas refs
const canvasRefs = ref<Array<HTMLCanvasElement | null>>([]);
function setCanvasRef(i: number) {
  return (el: any) => {
    canvasRefs.value[i] = el as HTMLCanvasElement | null;
    // render when element appears
    if (el && pageSizes.value[i]) renderPage(i + 1, el as HTMLCanvasElement);
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

watch(
  () => props.pdfSrc,
  () => {
    ensurePdfBytes();
  },
);

let signerManager = useSignerManager(
  templateSafe.value,
  originalPdfBytes.value,
  props.signer ?? null,
);
let values = signerManager.values as any;
let errors = signerManager.errors as any;

watch([originalPdfBytes, templateSafe, () => props.signer], ([b, tmpl]) => {
  signerManager = useSignerManager(tmpl, b ?? null, props.signer ?? null);
  values = signerManager.values as any;
  errors = signerManager.errors as any;
});

function fieldsOnPage(pageIndex: number) {
  return templateSafe.value.fields.filter((f) => f.page === pageIndex);
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

// signature handling (choice modal)
const padWidth = ref(400);
const padHeight = ref(120);
const activeChoiceField = ref<Field | null>(null);

function openChoice(f: Field) {
  if (isFieldReadonly(f)) return;
  activeChoiceField.value = f;
  const sz = pageSizes.value[f.page];
  if (sz) {
    padWidth.value = Math.max(200, f.width * sz.width);
    padHeight.value = Math.max(80, f.height * sz.height);
  }
}

function closeChoice() {
  activeChoiceField.value = null;
}

function onChoiceSave(dataUrl: string | null) {
  const f = activeChoiceField.value;
  if (!f) return;
  signerManager.setValue(f.id, dataUrl);
  activeChoiceField.value = null;
}

function onChoiceClear() {
  const f = activeChoiceField.value;
  if (!f) return;
  signerManager.setValue(f.id, null);
  activeChoiceField.value = null;
}

// finalize
async function handleFinalize() {
  try {
    const { signedPdfBytes, manifest } = await signerManager.finalize({
      mode,
      expected: props.expectedHashes ?? undefined,
      signerInfo: props.signer ?? undefined,
      embedPdfHash: props.embedPdfHash ?? false,
      verificationMode: props.verificationMode ?? 'warn',
      allowOverride: props.allowOverride ?? false,
    });
    // if warn-mode and integrity failed and overrides not allowed, block
    if (
      props.verificationMode === 'warn' &&
      manifest.integrity &&
      manifest.integrity.ok === false &&
      !props.allowOverride
    ) {
      alert('Integrity check reported mismatches; finalize blocked by configuration.');
      return;
    }

    // copy bytes into a fresh buffer to avoid errors from detached ArrayBuffers
    let pdfCopy: Uint8Array;
    if (signedPdfBytes instanceof Uint8Array) pdfCopy = signedPdfBytes.slice();
    else pdfCopy = new Uint8Array(signedPdfBytes).slice();
    const blob = new Blob([pdfCopy.buffer as ArrayBuffer], { type: 'application/pdf' });
    emit('finalized', {
      values: Object.entries(values.value).map(([k, v]) => ({ fieldId: k, value: v })),
      signedPdf: blob,
      manifest,
    });
    // emit integrity verification summary
    emit('integrity-verification', {
      integrity: manifest.integrity,
      sessionHash: (manifest as any)?.meta?.sessionHash ?? (manifest as any)?.sessionHash,
    });
    // also trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(templateSafe.value as any).title || 'signed'}.pdf`;
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
  try {
    const tmplCanonical = canonicalizeTemplate(templateSafe.value);
    const templateHash = await computeSha256(new TextEncoder().encode(tmplCanonical).buffer);
    let pdfHash: string | undefined = undefined;
    if (originalPdfBytes.value) pdfHash = await computeSha256(originalPdfBytes.value);
    const valuesHash = await computeValuesHash(values.value || {});
    const checks = [] as any[];
    if (props.expectedHashes?.templateHash)
      checks.push({
        name: 'templateHash',
        expected: props.expectedHashes.templateHash,
        actual: templateHash,
      });
    if (props.expectedHashes?.pdfHash)
      checks.push({ name: 'pdfHash', expected: props.expectedHashes.pdfHash, actual: pdfHash });
    if (props.expectedHashes?.valuesHash)
      checks.push({
        name: 'valuesHash',
        expected: props.expectedHashes.valuesHash,
        actual: valuesHash,
      });
    const ok = checks.every((c) => !c.expected || c.expected === c.actual);
    integrity.value = { ok, templateHash, pdfHash, valuesHash, checks };
    emit('integrity-check', { ok, templateHash, pdfHash, valuesHash, checks });
  } catch (e) {
    integrity.value = { ok: false, error: String(e) };
    emit('integrity-check', { ok: false, error: String(e) });
  }
}

onMounted(() => computeIntegrity());
// recompute integrity when inputs change
watch([originalPdfBytes, () => props.template, () => props.expectedHashes], () => {
  computeIntegrity();
});

// helpers
function setValue(fieldId: string, v: any) {
  signerManager.setValue(fieldId, v as any);
}

// helpers exposed to template
const pageSizesLocal = pageSizes;
</script>

<style scoped>
.signer-root {
  font-family: var(--sk-font-family-sans);
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
  background: var(--sk-color-bg-surface-subtle);
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
  overflow: hidden;
}
.field-overlay.field-type-signature,
.field-overlay.field-type-initials {
  border: var(--sk-field-border-width) solid var(--sk-field-accent);
  background: var(--sk-field-accent-rgba);
  border-radius: var(--sk-radius-sm);
  padding: 4px;
}
.field-overlay.field-type-signature .signature-field.empty .empty-placeholder,
.field-overlay.field-type-initials .signature-field.empty .empty-placeholder {
  border: none;
  background: transparent;
  box-shadow: none;
}
.field-overlay .signature-field {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.field-overlay .signature-field.empty .empty-placeholder {
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
  color: var(--sk-color-text-secondary);
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
  background: var(--sk-color-bg-surface);
  padding: 16px;
  border-radius: var(--sk-radius-lg);
  min-width: 320px;
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
  color: #fff;
  border: none;
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
  color: #fff;
  border-color: var(--sk-color-action-primary);
}
.choice-body input {
  width: 100%;
  padding: 8px 10px;
  border-radius: var(--sk-radius-sm);
  border: 1px solid var(--sk-color-border-default);
  box-sizing: border-box;
  font-size: 14px;
}
.modal-preview {
  margin-top: 8px;
}
.modal-preview canvas {
  width: 100%;
  height: auto;
  border: 1px solid var(--sk-color-border-default);
  border-radius: var(--sk-radius-sm);
}
.modal-actions button.secondary {
  background: transparent;
  color: var(--sk-color-text-secondary);
  border: 1px solid var(--sk-color-border-default);
}
.modal-actions button:hover {
  transform: translateY(-1px);
}
.actions {
  margin-top: 12px;
}
.errors {
  color: var(--sk-color-action-danger);
}
.integrity-banner {
  background: var(--sk-color-bg-surface-subtle);
  padding: 6px;
  margin-bottom: 8px;
  border: 1px solid var(--sk-color-border-default);
}
</style>
