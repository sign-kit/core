<template>
  <div class="page">
    <h2>Builder</h2>
    <p>Load a PDF and edit template fields. Export/Import template JSON.</p>
    <teleport to="#left-panel-option">
      <div class="row" style="margin-bottom: 8px; align-items: center">
        <label style="font-weight: 600; margin-right: 8px">Date locale:</label>
        <select v-model="dateLocale">
          <option value="">(browser default)</option>
          <option v-for="loc in localeOptions" :key="loc" :value="loc">{{ loc }}</option>
        </select>
      </div>
    </teleport>
    <div class="builder-grid">
      <div class="left cardify">
        <FormBuilder :pdf="pdfUrlValue" v-model="template" :dateLocale="dateLocale" />
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
import { inject, ref, watch, computed } from 'vue';
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
const dateLocale = ref(
  (template.value && template.value.meta && template.value.meta.dateLocale) ||
    (navigator && navigator.language) ||
    '',
);

const commonLocales = [
  'en-US','en-GB','en-CA','en-AU','es-ES','es-MX','fr-FR','fr-CA','de-DE','it-IT','pt-BR','pt-PT',
  'nl-NL','sv-SE','no-NO','da-DK','fi-FI','pl-PL','cs-CZ','hu-HU','ro-RO','sk-SK','sl-SI','hr-HR',
  'tr-TR','el-GR','ru-RU','uk-UA','he-IL','ar-SA','ar-EG','hi-IN','bn-BD','bn-IN','pa-IN','ta-IN',
  'th-TH','vi-VN','id-ID','ms-MY','zh-CN','zh-TW','zh-HK','ja-JP','ko-KR'
];

const localeOptions = computed(() => {
  const list: string[] = [];
  try {
    const nav = (navigator && (navigator.languages || [navigator.language])) || [];
    for (const l of nav) if (l && !list.includes(l)) list.push(l);
  } catch (e) {}
  for (const l of commonLocales) if (!list.includes(l)) list.push(l);
  return list;
});

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

watch(dateLocale, (d) => {
  try {
    if (!template.value.meta) template.value.meta = {};
    (template.value.meta as any).dateLocale = d;
    templateJson.value = JSON.stringify(template.value, null, 2);
    if (currentTemplate && 'value' in currentTemplate) currentTemplate.value = template.value;
  } catch (e) {}
});

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
