<template>
  <div class="page">
    <h2>PDF Signer</h2>
    <div class="instructions">
      <h3>How to use:</h3>
      <ol>
        <li><strong>Enter signer information</strong> (name, email) in the left panel.</li>
        <li>
          <strong>Fill in all form fields</strong> on the PDF pages below. Click signature fields to
          draw or type your signature.
        </li>
        <li>
          <strong>Choose a signing mode:</strong>
          <ul style="margin: 4px 0; margin-left: 20px">
            <li>
              <strong>Standard:</strong> Basic signing with fields. No integrity verification.
            </li>
            <li>
              <strong>Integrity:</strong> Adds hash checks to verify template and PDF weren't
              modified.
            </li>
          </ul>
        </li>
        <li>
          <strong>Click "Finalize & Download"</strong> to generate a signed PDF and manifest JSON
          with all field values and metadata.
        </li>
      </ol>
      <p
        style="
          margin-top: 8px;
          padding: 6px 8px;
          background: rgba(67, 129, 193, 0.08);
          border-radius: 4px;
          font-size: 12px;
          color: var(--color-text-primary);
        "
      >
        Watch the <strong>Events & Manifest</strong> panel on the right to see what happens during
        signing.
      </p>
    </div>

    <teleport to="#left-panel-option">
      <div class="controls">
        <label>
          Signer name
          <input v-model="signer.name" />
        </label>
        <label>
          Signer email
          <input v-model="signer.email" />
        </label>
        <label>
          Mode
          <select v-model="mode">
            <option value="standard">standard</option>
            <option value="integrity">integrity</option>
          </select>
        </label>
        <label><input type="checkbox" v-model="embedPdfHash" /> Embed pdfHash in PDF</label>
      </div>
    </teleport>

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
.instructions {
  background: linear-gradient(135deg, rgba(67, 129, 193, 0.08) 0%, rgba(67, 129, 193, 0.02) 100%);
  border: 1px solid rgba(67, 129, 193, 0.2);
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.instructions h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--color-action-primary, #4381c1);
}
.instructions ol {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.6;
}
.instructions li {
  margin-bottom: 6px;
}
.instructions ul {
  font-size: 13px;
  line-height: 1.5;
}
.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}
.signer-wrap {
  border-radius: 8px;
  background: var(--color-bg-surface, #f6f7fb);
  padding: 12px;
}
</style>
