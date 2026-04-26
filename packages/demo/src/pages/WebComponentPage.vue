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
import { inject, ref, onMounted } from 'vue';
import sampleTemplate from '../data/sample-template.json';
import { registerPdfSignKitElements } from '../../../pdf-sign-kit/src/web-components/register';

const pdfUrl = inject('pdfUrl') as any;
const pdfUrlValue = pdfUrl?.value ?? '/sample/sample.pdf';
const manifest = ref<any | null>(null);

onMounted(() => {
  // register the custom elements (wraps Vue components)
  try {
    registerPdfSignKitElements();
  } catch (e) {
    // registration may have already happened
    console.warn('registerPdfSignKitElements failed or already registered', e);
  }

  const builder = document.getElementById('wc-builder') as any;
  const signer = document.getElementById('wc-signer') as any;

  if (builder) {
    builder.template = sampleTemplate;
    // pass a plain URL string so the component can fetch and load it
    builder.pdf = pdfUrlValue;
  }

  if (signer) {
    signer.template = sampleTemplate;
    // Signer component expects `pdfSrc` prop name
    signer.pdfSrc = pdfUrlValue;
    signer.addEventListener('finalized', (e: any) => {
      // CustomElements will put event payload on detail
      manifest.value = e?.detail?.manifest ?? e?.detail ?? e;
    });
    signer.addEventListener('integrity-verification', (e: any) => {
      console.log('integrity-verification', e.detail ?? e);
    });
  }
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
