<template>
  <div class="page">
    <h2>Web Components Demo</h2>

    <p>This page demonstrates using the library as native Web Components.</p>

    <teleport to="#left-panel-option">
      <div class="controls">
        <div>PDF URL:</div>
        <div style="font-size: 13px; color: var(--color-text-muted)">{{ pdfUrlValue }}</div>
      </div>
    </teleport>

    <div class="wc-wrap">
      <div class="wc-col">
        <h4>Builder (web component)</h4>
        <pdf-form-builder id="wc-builder"></pdf-form-builder>
      </div>

      <div class="wc-col">
        <h4>Signer (web component)</h4>
        <pdf-form-signer id="wc-signer"></pdf-form-signer>
      </div>
    </div>

    <div style="margin-top: 12px">
      <h4>Manifest</h4>
      <pre v-if="manifest">{{ JSON.stringify(manifest, null, 2) }}</pre>
      <div v-else class="muted">No manifest yet. Sign using the Signer component.</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject, ref, onMounted, computed, watch } from 'vue';
import sampleTemplate from '../data/sample-template.json';
import { registerPdfSignKitElements } from '../../../pdf-sign-kit/src/web-components/register';

const pdfUrl = inject('pdfUrl') as any;
const pdfUrlValue = computed(() => pdfUrl?.value ?? '/sample/sample.pdf');
const manifest = ref<any | null>(null);

// Keep signer defaults aligned with SignerPage.vue.
const defaultSigner = { name: 'Demo User', email: 'demo@example.com' };
const defaultMode: 'standard' = 'standard';
const defaultExpectedHashes = {};
const defaultEmbedPdfHash = false;
const defaultTemplate = cloneTemplate(sampleTemplate);
const liveTemplate = ref<any>(cloneTemplate(defaultTemplate));

function isTemplateLike(value: any): boolean {
  return !!value && Array.isArray(value.fields) && Array.isArray(value.pages);
}

function cloneTemplate(template: any) {
  try {
    return structuredClone(template);
  } catch {
    return JSON.parse(JSON.stringify(template));
  }
}

function getBuilderTemplateSnapshot(builder: any) {
  const candidates = [
    builder?.modelValue,
    builder?.template,
    builder?.value,
    builder?.__vueParentComponent?.props?.modelValue,
  ];
  for (const candidate of candidates) {
    if (isTemplateLike(candidate)) return cloneTemplate(candidate);
  }
  return cloneTemplate(defaultTemplate);
}

function upsertFieldInTemplate(nextTemplate: any, field: any) {
  if (!field || !field.id) return nextTemplate;
  const fields = Array.isArray(nextTemplate.fields) ? [...nextTemplate.fields] : [];
  const index = fields.findIndex((f: any) => f.id === field.id);
  if (index >= 0) fields[index] = { ...fields[index], ...field };
  else fields.push(field);
  return { ...nextTemplate, fields };
}

function removeFieldInTemplate(nextTemplate: any, fieldId: string) {
  const fields = Array.isArray(nextTemplate.fields) ? nextTemplate.fields : [];
  return { ...nextTemplate, fields: fields.filter((f: any) => f.id !== fieldId) };
}

onMounted(() => {
  try {
    registerPdfSignKitElements();
  } catch (e) {
    console.warn('registerPdfSignKitElements failed or already registered', e);
  }

  const builder = document.getElementById('wc-builder') as any;
  const signer = document.getElementById('wc-signer') as any;

  const pushTemplateToSigner = () => {
    if (!signer) return;
    signer.template = cloneTemplate(liveTemplate.value);
  };

  const syncFromBuilderSnapshot = () => {
    liveTemplate.value = getBuilderTemplateSnapshot(builder);
    pushTemplateToSigner();
  };

  if (builder) {
    const initialTemplate = cloneTemplate(defaultTemplate);
    liveTemplate.value = cloneTemplate(initialTemplate);
    // defineModel in FormBuilder maps to modelValue in CE runtime.
    builder.modelValue = initialTemplate;
    // keep legacy assignment for compatibility with prior integrations.
    builder.template = initialTemplate;
    // pass a plain URL string so the component can fetch and load it
    builder.pdf = pdfUrlValue.value;
  }

  if (signer) {
    pushTemplateToSigner();
    // Signer component expects `pdfSrc` prop name
    signer.pdfSrc = pdfUrlValue.value;
    signer.signer = { ...defaultSigner };
    signer.mode = defaultMode;
    signer.expectedHashes = { ...defaultExpectedHashes };
    signer.embedPdfHash = defaultEmbedPdfHash;

    if (builder) {
      // Full template replacement when model updates are available.
      builder.addEventListener('update:modelValue', (e: any) => {
        const next = e?.detail?.[0] ?? e?.detail?.value ?? e?.detail;
        if (isTemplateLike(next)) {
          liveTemplate.value = cloneTemplate(next);
          pushTemplateToSigner();
          return;
        }
        syncFromBuilderSnapshot();
      });

      // Incremental updates from builder field events.
      builder.addEventListener('field-added', (e: any) => {
        const field = e?.detail?.field ?? e?.detail;
        liveTemplate.value = upsertFieldInTemplate(cloneTemplate(liveTemplate.value), field);
        pushTemplateToSigner();
      });

      builder.addEventListener('field-updated', (e: any) => {
        const field = e?.detail?.field ?? e?.detail;
        liveTemplate.value = upsertFieldInTemplate(cloneTemplate(liveTemplate.value), field);
        pushTemplateToSigner();
      });

      builder.addEventListener('field-removed', (e: any) => {
        const id = e?.detail?.id ?? e?.detail;
        if (!id) return;
        liveTemplate.value = removeFieldInTemplate(cloneTemplate(liveTemplate.value), id);
        pushTemplateToSigner();
      });

      syncFromBuilderSnapshot();
    }

    signer.addEventListener('finalized', (e: any) => {
      // CustomElements will put event payload on detail
      manifest.value = e?.detail?.manifest ?? e?.detail ?? e;
    });
    signer.addEventListener('integrity-verification', (e: any) => {
      console.log('integrity-verification', e.detail ?? e);
    });
  }

  watch(
    pdfUrlValue,
    (nextPdf) => {
      if (builder) builder.pdf = nextPdf;
      if (signer) signer.pdfSrc = nextPdf;
    },
    { immediate: true },
  );
});
</script>

<style scoped>
.page {
  padding: 12px;
}
.wc-wrap {
  display: flex;
  gap: 16px;
}
.wc-col {
  flex: 1;
  background: var(--color-bg-surface, #fff);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.muted {
  color: var(--color-text-muted, rgba(0, 0, 0, 0.56));
}
</style>
