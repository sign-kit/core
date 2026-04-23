<template>
  <div class="page">
    <h2>Integrity Demo</h2>
    <p>Compute PDF & template hashes locally and optionally compare against expected hashes.</p>

    <div class="form">
      <label>PDF URL <input v-model="pdfUrlValue" /></label>
      <label>Template JSON <textarea v-model="templateJson" rows="8"></textarea></label>
      <div class="row">
        <button @click="computeHashes">Compute Hashes</button>
        <button @click="loadSampleTemplate">Load Sample Template</button>
      </div>
    </div>

    <div class="results">
      <h4>Computed</h4>
      <div>
        <strong>pdfHash:</strong> <code>{{ pdfHash }}</code>
      </div>
      <div>
        <strong>templateHash:</strong> <code>{{ templateHash }}</code>
      </div>
      <div>
        <strong>valuesHash:</strong> <code>{{ valuesHash }}</code>
      </div>

      <h4 style="margin-top: 12px">Compare (paste expected values)</h4>
      <label>Expected PDF hash <input v-model="expectedPdf" /></label>
      <label>Expected Template hash <input v-model="expectedTemplate" /></label>
      <div style="margin-top: 8px">
        <button @click="compareExpected">Compare</button>
      </div>

      <div v-if="compareResult" style="margin-top: 12px">
        <h4>Comparison</h4>
        <pre>{{ JSON.stringify(compareResult, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject, ref } from 'vue';
import { canonicalizeTemplate, computePdfHash, computeValuesHash } from '../../../pdf-sign-kit/src';

const pdfUrl = inject('pdfUrl') as any;
const pdfUrlValue = ref(pdfUrl?.value ?? '/sample/sample.pdf');
const templateJson = ref('');
const pdfHash = ref<string | null>(null);
const templateHash = ref<string | null>(null);
const valuesHash = ref<string | null>(null);

const expectedPdf = ref('');
const expectedTemplate = ref('');
const compareResult = ref<any | null>(null);

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
.form {
  display: flex;
  gap: 12px;
  flex-direction: column;
  max-width: 800px;
}
textarea {
  width: 100%;
  box-sizing: border-box;
}
.results {
  margin-top: 12px;
  background: var(--color-bg-surface, #fff);
  padding: 12px;
  border-radius: 8px;
}
.row {
  margin-top: 8px;
}
</style>
