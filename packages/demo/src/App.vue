<template>
  <div class="demo-root">
    <header class="demo-header">
      <h1>pdf-sign-kit demo</h1>
      <div class="tabs">
        <button :class="{ active: mode === 'template' }" @click="mode = 'template'">
          Template
        </button>
        <button :class="{ active: mode === 'sign' }" @click="mode = 'sign'">Sign</button>
      </div>
    </header>

    <main class="demo-grid">
      <aside class="demo-setup">
        <h3>Setup</h3>
        <label>PDF URL</label>
        <input v-model="pdfUrl" />

        <div class="block">
          <label>Component</label>
          <div class="chip">{{ mode === 'template' ? 'FormBuilder' : 'Signer' }}</div>
        </div>

        <div v-if="mode === 'sign'">
          <h4>Signer props</h4>
          <label>Signer name</label>
          <input v-model="signerName" />
          <label>Signer email</label>
          <input v-model="signerEmail" />
          <label>Signer role (optional)</label>
          <input v-model="signerRole" />
          <label>Mode</label>
          <select v-model="signerMode">
            <option value="standard">standard</option>
            <option value="integrity">integrity</option>
          </select>
          <label><input type="checkbox" v-model="embedPdfHash" /> Embed pdfHash on final PDF</label>
          <label><input type="checkbox" v-model="signerReadonly" /> Readonly</label>
          <label>Expected templateHash (for integrity)</label>
          <input v-model="expectedTemplateHash" />
          <label>Expected pdfHash (for integrity)</label>
          <input v-model="expectedPdfHash" />
        </div>

        <div v-if="mode === 'template'" style="margin-top: 12px">
          <h4>Template</h4>
          <button @click="loadDefault">Load default template</button>
          <div style="margin-top: 8px">
            <label>Edit JSON</label>
            <textarea v-model="templateJsonText" rows="10"></textarea>
            <div class="row">
              <button @click="applyTemplateJson">Apply JSON</button>
              <button @click="resetTemplateJson">Reset</button>
            </div>
            <div v-if="templateJsonError" class="err">{{ templateJsonError }}</div>
          </div>
        </div>
      </aside>

      <section class="demo-render">
        <h3>Rendered component</h3>
        <div class="component-wrap">
          <FormBuilder v-if="mode === 'template'" :pdf="pdfUrl" v-model="template" />
          <Signer
            v-else
            :pdfSrc="pdfUrl"
            :template="template"
            :signer="{ name: signerName, email: signerEmail, role: signerRole }"
            :mode="signerMode"
            :expected="{
              templateHash: expectedTemplateHash || undefined,
              pdfHash: expectedPdfHash || undefined,
            }"
            :readonly="signerReadonly"
            :embedPdfHash="embedPdfHash"
            @finalized="onFinalized"
          />
        </div>
      </section>

      <aside class="demo-manifest">
        <h3>Manifest</h3>
        <div v-if="lastManifest">
          <pre>{{ JSON.stringify(lastManifest, null, 2) }}</pre>
        </div>
        <div v-else>
          <p>No manifest yet. Finalize a signature to generate one.</p>
        </div>
      </aside>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { FormBuilder, Signer } from '../../pdf-sign-kit/src';

import { watch } from 'vue';

const pdfUrl = ref('/sample/sample.pdf');

const defaultTemplate = {
  id: 'tmpl_test',
  version: '1.0.0',
  title: 'Test template',
  pdfHash: null,
  pages: [{ width: 612, height: 792 }],
  fields: [
    {
      id: 'field_ne4yr8o',
      type: 'signature',
      page: 0,
      x: 0.5830269607843137,
      y: 0.5196890782828283,
      width: 0.3728562091503268,
      height: 0.05243838383838384,
      required: false,
      label: 'signature',
      defaultValue: null,
      meta: {},
      createdAt: '2026-04-23T14:30:31.610Z',
    },
  ],
  meta: {},
  createdAt: '2026-04-23T04:46:22.136Z',
  updatedAt: '2026-04-23T14:41:35.599Z',
};

const template = ref<any>(defaultTemplate);
const mode = ref<'template' | 'sign'>('template');
const lastManifest = ref<any | null>(null);

// signer controls
const signerName = ref('Demo User');
const signerEmail = ref('demo@example.com');
const signerRole = ref('');
const signerMode = ref<'standard' | 'integrity'>('standard');
const embedPdfHash = ref(false);
const signerReadonly = ref(false);
const expectedTemplateHash = ref('');
const expectedPdfHash = ref('');

// template JSON editor
const templateJsonText = ref(JSON.stringify(template.value, null, 2));
const templateJsonError = ref<string | null>(null);

watch(template, (t) => {
  templateJsonText.value = JSON.stringify(t, null, 2);
});

function loadDefault() {
  template.value = JSON.parse(JSON.stringify(defaultTemplate));
}

function applyTemplateJson() {
  try {
    const parsed = JSON.parse(templateJsonText.value);
    template.value = parsed;
    templateJsonError.value = null;
  } catch (e: any) {
    templateJsonError.value = e.message || String(e);
  }
}

function resetTemplateJson() {
  templateJsonText.value = JSON.stringify(template.value, null, 2);
  templateJsonError.value = null;
}

function onFinalized(payload: any) {
  lastManifest.value = payload.manifest;
  // also offer download already handled by Signer; we can show a message
  console.log('Finalized', payload);
}

// expose functions/values for template mode buttons
function applyTemplateJsonSafe() {
  applyTemplateJson();
}
</script>

<style scoped>
.demo-root {
  max-width: 1200px;
  margin: 18px auto;
  padding: 12px;
  background: #fafafa;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
}
.demo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.tabs {
  display: flex;
  gap: 8px;
}
.tabs button {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  cursor: pointer;
}
.tabs button.active {
  background: #007acc;
  color: #fff;
  border-color: rgba(0, 0, 0, 0.08);
}
.demo-grid {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 18px;
  margin-top: 12px;
}
.demo-setup,
.demo-manifest {
  background: #fff;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}
.demo-render {
  background: #fff;
  padding: 12px;
  border-radius: 8px;
  min-height: 560px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}
.demo-setup label {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  color: #333;
}
.demo-setup input,
.demo-setup textarea,
.demo-setup select {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  margin-top: 6px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.demo-setup textarea {
  font-family: monospace;
  font-size: 12px;
}
.component-wrap {
  height: 100%;
}
.err {
  color: #a00;
  margin-top: 6px;
  font-size: 13px;
}
.block {
  margin-top: 8px;
}
.chip {
  display: inline-block;
  padding: 6px 10px;
  background: #eef6ff;
  border-radius: 999px;
  color: #036;
  font-weight: 600;
}
.row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.row button {
  padding: 8px 10px;
}
</style>
