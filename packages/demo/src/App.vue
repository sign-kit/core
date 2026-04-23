<template>
  <div>
    <h1>pdf-sign-kit demo</h1>

    <div class="tabs">
      <button :class="{ active: mode === 'template' }" @click="mode = 'template'">Template</button>
      <button :class="{ active: mode === 'sign' }" @click="mode = 'sign'">Sign</button>
    </div>

    <div v-if="mode === 'template'">
      <h2>Template Builder</h2>
      <FormBuilder :pdf="pdfUrl" v-model="template" />
      <div style="margin-top: 12px">
        <button @click="loadDefault">Load default template</button>
      </div>
      <h3>Template JSON</h3>
      <pre style="white-space: pre-wrap">{{ JSON.stringify(template, null, 2) }}</pre>
    </div>

    <div v-else>
      <h2>Signer / Fill</h2>
      <Signer
        :pdfSrc="pdfUrl"
        :template="template"
        :signer="{ name: 'Demo User', email: 'demo@example.com' }"
        @finalized="onFinalized"
      />

      <div v-if="lastManifest" style="margin-top: 12px">
        <h3>Last manifest</h3>
        <pre style="white-space: pre-wrap">{{ JSON.stringify(lastManifest, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { FormBuilder, Signer } from '../../pdf-sign-kit/src';

const pdfUrl = '/sample/sample.pdf';

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

function loadDefault() {
  template.value = JSON.parse(JSON.stringify(defaultTemplate));
}

function onFinalized(payload: any) {
  lastManifest.value = payload.manifest;
  // also offer download already handled by Signer; we can show a message
  console.log('Finalized', payload);
}
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.tabs button {
  padding: 6px 12px;
}
.tabs button.active {
  background: #007acc;
  color: #fff;
}
</style>
