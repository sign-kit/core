<template>
  <div class="page">
    <h2>Signer</h2>
    <div class="controls">
      <label>Signer name <input v-model="signer.name" /></label>
      <label>Signer email <input v-model="signer.email" /></label>
      <label
        >Mode
        <select v-model="mode">
          <option value="standard">standard</option>
          <option value="integrity">integrity</option>
        </select>
      </label>
      <label><input type="checkbox" v-model="embedPdfHash" /> Embed pdfHash</label>
    </div>

    <div class="signer-wrap">
      <Signer
        :pdfSrc="pdfUrlValue"
        :template="demoTemplate"
        :signer="signer"
        :mode="mode"
        :expectedHashes="expected"
        :embedPdfHash="embedPdfHash"
        @finalized="onFinalized"
        @integrity-check="onIntegrityCheck"
        @integrity-verification="onIntegrityVerification"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject, ref } from 'vue';
import { Signer } from '../../../pdf-sign-kit/src';
import sampleTemplate from '../data/sample-template.json';

const pdfUrl = inject('pdfUrl') as any;
const pdfUrlValue = pdfUrl?.value ?? '/sample/sample.pdf';
// capture injected refs during setup so handlers can use them later
const injectedEventLog = inject('eventLog') as any;
const injectedManifest = inject('manifest') as any;

const injectedTemplate = inject('currentTemplate') as any;
const demoTemplate = ref<any>(
  injectedTemplate && injectedTemplate.value ? injectedTemplate.value : sampleTemplate,
);
if (injectedTemplate && 'value' in injectedTemplate) {
  // keep in sync if builder updates
  try {
    injectedTemplate.value && (demoTemplate.value = injectedTemplate.value);
  } catch (e) {}
}
const signer = ref({ name: 'Demo User', email: 'demo@example.com' });
const mode = ref<'standard' | 'integrity'>('standard');
const embedPdfHash = ref(false);

const expected = ref<any>({});

function onFinalized(payload: any) {
  try {
    if (injectedEventLog && injectedEventLog.value && Array.isArray(injectedEventLog.value)) {
      injectedEventLog.value.push('finalized: ' + new Date().toISOString());
    } else {
      console.warn('eventLog not available via inject("eventLog")');
    }
  } catch (e) {
    console.warn('failed to push eventLog', e);
  }
  if (injectedManifest && 'value' in injectedManifest) injectedManifest.value = payload.manifest;
  else console.warn('manifest not available via inject("manifest")');
}

function onIntegrityCheck(payload: any) {
  try {
    if (injectedEventLog && injectedEventLog.value && Array.isArray(injectedEventLog.value)) {
      injectedEventLog.value.push('integrity-check: ' + JSON.stringify(payload));
    } else {
      console.warn('eventLog not available for integrity-check');
    }
  } catch (e) {
    console.warn('failed to push integrity-check', e);
  }
}
function onIntegrityVerification(payload: any) {
  try {
    if (injectedEventLog && injectedEventLog.value && Array.isArray(injectedEventLog.value)) {
      injectedEventLog.value.push('integrity-verification: ' + JSON.stringify(payload));
    } else {
      console.warn('eventLog not available for integrity-verification');
    }
  } catch (e) {
    console.warn('failed to push integrity-verification', e);
  }
}
</script>

<style scoped>
.page {
  padding: 12px;
}
.controls {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}
.signer-wrap {
  border-radius: 8px;
  background: var(--color-bg-surface, #fff);
  padding: 12px;
}
</style>
