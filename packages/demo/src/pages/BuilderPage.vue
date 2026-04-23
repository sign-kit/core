<template>
  <div class="page">
    <h2>Builder</h2>
    <p>Load a PDF and edit template fields. Export/Import template JSON.</p>
    <div class="builder-grid">
      <div class="left cardify">
        <FormBuilder :pdf="pdfUrlValue" v-model="template" />
      </div>
    </div>
    <div class="cardify">
      <h4>Template JSON</h4>
      <textarea v-model="templateJson" rows="20"></textarea>
      <div class="row">
        <button @click="exportTemplate">Export JSON</button>
        <input type="file" @change="importTemplate" accept="application/json" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject, ref, watch } from 'vue';
import { FormBuilder } from '../../../pdf-sign-kit/src';

const pdfUrl = inject('pdfUrl') as any;
const pdfUrlValue = pdfUrl?.value ?? '/sample/sample.pdf';

const template = ref<any>({
  id: 'demo-tmpl',
  version: '1.0.0',
  pages: [],
  fields: [],
  createdAt: new Date().toISOString(),
});
const templateJson = ref(JSON.stringify(template.value, null, 2));

// if the demo provides a global currentTemplate ref, update it when the builder changes
const currentTemplate = inject('currentTemplate') as any;

// keep the JSON textarea in sync with the v-model `template`
watch(
  template,
  (t) => {
    try {
      templateJson.value = JSON.stringify(t, null, 2);
    } catch (e) {
      templateJson.value = '';
    }
    try {
      if (currentTemplate && 'value' in currentTemplate) currentTemplate.value = t;
    } catch (e) {}
  },
  { deep: true },
);

function exportTemplate() {
  const blob = new Blob([templateJson.value], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${template.value.id || 'template'}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importTemplate(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  const txt = await f.text();
  try {
    const parsed = JSON.parse(txt);
    template.value = parsed;
    templateJson.value = JSON.stringify(parsed, null, 2);
  } catch (err) {
    alert('Invalid JSON');
  }
}
</script>

<style scoped>
.page {
  padding: 12px;
}
.builder-grid {
  display: flex;
  gap: 12px;
}
.left {
  flex: 1;
}
.right {
  width: 420px;
}
textarea {
  width: 100%;
  box-sizing: border-box;
}
.row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
}
</style>
