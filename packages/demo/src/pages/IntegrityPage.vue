<template>
  <div class="page">
    <h2>Integrity & Hash Verification</h2>
    <div class="instructions">
      <h3>What is integrity checking?</h3>
      <p>
        Integrity checking uses hash values to verify that PDFs and templates haven't been modified. This is <strong>optional</strong> and works client-side only.
      </p>
      <h3>How to use this demo:</h3>
      <ol>
        <li>
          <strong>Compute hashes</strong> from a PDF and template. This creates SHA-256 hashes of the PDF file and template structure.
        </li>
        <li>
          <strong>Save or send the hashes</strong> to your users as expected values.
        </li>
        <li>
          <strong>During signing,</strong> paste the expected hashes in the left sidebar on the Signer page and select <strong>integrity</strong> mode.
        </li>
        <li>
          <strong>The signer app will verify</strong> that the PDF and template match the expected hashes before allowing finalization.
        </li>
      </ol>
      <p style="margin-top: 8px; padding: 6px 8px; background: rgba(233, 174, 0, 0.08); border-radius: 4px; font-size: 12px; color: var(--color-text-primary)">
        <strong>Note:</strong> Hash verification does NOT provide cryptographic signatures or legal proof. It only checks that files match expected values.
      </p>
    </div>

    <div class="form cardify">
      <h4>Compute Hashes</h4>
      <p style="margin-top: 0; margin-bottom: 8px; font-size: 12px; color: var(--color-text-muted)">
        The template below is auto-populated from the Builder. The PDF is loaded from the PDF Source in the left panel. Edit the template or load a sample to compare.
      </p>
      <label>Template JSON <textarea v-model="templateJson" rows="8" placeholder="Load from Builder or paste template JSON"></textarea></label>
      <div class="row">
        <button @click="computeHashes">Compute Hashes</button>
        <button @click="loadSampleTemplate">Load Sample Template</button>
      </div>
    </div>

    <div class="results cardify" v-if="pdfHash || templateHash">
      <h4>Computed Hashes</h4>
      <div class="hash-row">
        <div class="hash-label">PDF Hash:</div>
        <code class="hash-value" :title="pdfHash">{{ pdfHash }}</code>
        <button class="copy-btn" @click="copyToClipboard(pdfHash, 'PDF hash copied')">Copy</button>
      </div>
      <div class="hash-row">
        <div class="hash-label">Template Hash:</div>
        <code class="hash-value" :title="templateHash">{{ templateHash }}</code>
        <button class="copy-btn" @click="copyToClipboard(templateHash, 'Template hash copied')">Copy</button>
      </div>
      <div class="hash-row">
        <div class="hash-label">Values Hash (empty):</div>
        <code class="hash-value" :title="valuesHash">{{ valuesHash }}</code>
        <button class="copy-btn" @click="copyToClipboard(valuesHash, 'Values hash copied')">Copy</button>
      </div>

      <h4 style="margin-top: 20px; margin-bottom: 12px">Verify Against Expected Hashes</h4>
      <p style="font-size: 12px; color: var(--color-text-muted); margin: 0 0 12px 0">
        Paste the hash values you expect to match. If they match, integrity is verified.
      </p>
      <div class="verify-grid">
        <div class="verify-item">
          <label class="verify-label">Expected PDF Hash</label>
          <input v-model="expectedPdf" class="verify-input" placeholder="Paste PDF hash to verify" />
          <div v-if="expectedPdf" class="verify-status" :class="{ match: expectedPdf === pdfHash, mismatch: expectedPdf !== pdfHash }">
            {{ expectedPdf === pdfHash ? 'Matches' : 'Does not match' }}
          </div>
        </div>
        <div class="verify-item">
          <label class="verify-label">Expected Template Hash</label>
          <input v-model="expectedTemplate" class="verify-input" placeholder="Paste template hash to verify" />
          <div v-if="expectedTemplate" class="verify-status" :class="{ match: expectedTemplate === templateHash, mismatch: expectedTemplate !== templateHash }">
            {{ expectedTemplate === templateHash ? 'Matches' : 'Does not match' }}
          </div>
        </div>
      </div>
      <div style="margin-top: 16px">
        <button @click="compareExpected" :disabled="!expectedPdf && !expectedTemplate">Compare All Hashes</button>
      </div>

      <div v-if="compareResult" style="margin-top: 16px; padding: 12px; background: var(--color-bg-surface-subtle, #f5f5f5); border-radius: 6px;">
        <h4 style="margin-top: 0">Comparison Result</h4>
        <pre>{{ JSON.stringify(compareResult, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject, ref, watch, computed } from 'vue';
import { canonicalizeTemplate, computePdfHash, computeValuesHash } from '../../../pdf-sign-kit/src';

const pdfUrl = inject('pdfUrl') as any;
const pdfUrlValue = computed(() => pdfUrl?.value ?? '/sample/sample.pdf');
const currentTemplate = inject('currentTemplate') as any;

const templateJson = ref('');
const pdfHash = ref<string | null>(null);
const templateHash = ref<string | null>(null);
const valuesHash = ref<string | null>(null);

const expectedPdf = ref('');
const expectedTemplate = ref('');
const compareResult = ref<any | null>(null);

// Watch for template changes from Builder
watch(() => currentTemplate?.value, (newVal) => {
  if (newVal) {
    try {
      templateJson.value = JSON.stringify(newVal, null, 2);
    } catch (e) {
      // ignore
    }
  }
}, { deep: true });

function copyToClipboard(text: string | null, message: string) {
  if (!text) return;
  navigator.clipboard.writeText(text);
  // Simple toast-like feedback
  const btn = event?.target as HTMLElement;
  if (btn) {
    const origText = btn.textContent;
    btn.textContent = message;
    setTimeout(() => {
      btn.textContent = origText;
    }, 1500);
  }
}

function loadSampleTemplate() {
  // load demo sample template shipped with demo
  fetch('/sample/template.json')
    .then((r) => r.json())
    .then((t) => (templateJson.value = JSON.stringify(t, null, 2)));
}

async function computeHashes() {
  pdfHash.value = null;
  templateHash.value = null;
  valuesHash.value = null;
  // compute pdf hash
  try {
    const r = await fetch(pdfUrlValue.value);
    const buf = await r.arrayBuffer();
    pdfHash.value = await computePdfHash(buf);
  } catch (e) {
    pdfHash.value = 'error';
  }

  // compute template hash
  try {
    const tmpl = JSON.parse(templateJson.value || '{}');
    const canonical = canonicalizeTemplate(tmpl);
    templateHash.value = await computePdfHash(new TextEncoder().encode(canonical).buffer);
  } catch (e) {
    templateHash.value = 'error';
  }

  // compute values hash (empty values example)
  try {
    const vals = {};
    valuesHash.value = await computeValuesHash(vals as any);
  } catch (e) {
    valuesHash.value = 'error';
  }
}

function compareExpected() {
  compareResult.value = {
    pdf: {
      expected: expectedPdf.value,
      actual: pdfHash.value,
      match: expectedPdf.value === pdfHash.value,
    },
    template: {
      expected: expectedTemplate.value,
      actual: templateHash.value,
      match: expectedTemplate.value === templateHash.value,
    },
  };
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
  margin: 8px 0;
  font-size: 14px;
  color: var(--color-action-primary, #4381c1);
}
.instructions h3:first-child {
  margin-top: 0;
}
.instructions p {
  margin: 6px 0;
  font-size: 13px;
  line-height: 1.5;
}
.instructions ol {
  margin: 6px 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.6;
}
.instructions li {
  margin-bottom: 6px;
}
.form {
  display: flex;
  gap: 12px;
  flex-direction: column;
  max-width: 800px;
  margin-bottom: 16px;
}
textarea {
  width: 100%;
  box-sizing: border-box;
  font-family: monospace;
  font-size: 12px;
}
.results {
  margin-top: 0;
  background: var(--color-bg-surface, #fff);
  padding: 12px;
  border-radius: 8px;
}
.hash-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  font-size: 12px;
}
.hash-label {
  min-width: 100px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.hash-value {
  font-family: monospace;
  background: var(--color-bg-surface-subtle, #f5f5f5);
  padding: 6px 8px;
  border-radius: 4px;
  word-break: break-all;
  flex: 1;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 40px;
  overflow-y: auto;
}
.copy-btn {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--color-border-default, #ddd);
  background: var(--color-bg-surface, #fff);
  cursor: pointer;
  font-size: 11px;
  white-space: nowrap;
  transition: background 0.2s;
}
.copy-btn:hover {
  background: var(--color-bg-surface-subtle, #f5f5f5);
}
.verify-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 12px;
}
.verify-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.verify-label {
  font-weight: 600;
  font-size: 12px;
  color: var(--color-text-primary);
}
.verify-input {
  padding: 8px 10px;
  border: 1px solid var(--color-border-default, #ddd);
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  width: 100%;
  box-sizing: border-box;
}
.verify-status {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 6px;
  border-radius: 4px;
}
.verify-status.match {
  background: rgba(34, 177, 76, 0.1);
  color: #22b14c;
}
.verify-status.mismatch {
  background: rgba(237, 28, 36, 0.1);
  color: #ed1c24;
}
.row {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
</style>
