<template>
  <div class="page">
    <h2>Form Builder</h2>
    <div class="instructions">
      <h3>How to use:</h3>
      <ol>
        <li>
          <strong>Click on the PDF pages</strong> to place new fields (text, signature, date, checkbox, email, name).
        </li>
        <li>
          <strong>Drag to move</strong> fields around the page. <strong>Drag the corner handle</strong> to resize.
        </li>
        <li>
          <strong>Inspect fields</strong> on the right to edit labels, set required/readonly, and configure validation.
        </li>
        <li>
          <strong>Export the template JSON</strong> below, then use it in the <router-link to="/signer">Signer</router-link> to let users fill and sign.
        </li>
      </ol>
      <p style="margin-top: 8px; padding: 6px 8px; background: rgba(67, 129, 193, 0.08); border-radius: 4px; font-size: 12px; color: var(--color-text-primary)">
        Tip: The same template JSON can be imported here for editing later.
      </p>
    </div>
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
      <p style="margin-top: 0; margin-bottom: 8px; font-size: 12px; color: var(--color-text-muted)">
        Export this template to use in the Signer, or import a previous template to edit.
      </p>
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
  'en-US',
  'en-GB',
  'en-CA',
  'en-AU',
  'es-ES',
  'es-MX',
  'fr-FR',
  'fr-CA',
  'de-DE',
  'it-IT',
  'pt-BR',
  'pt-PT',
  'nl-NL',
  'sv-SE',
  'no-NO',
  'da-DK',
  'fi-FI',
  'pl-PL',
  'cs-CZ',
  'hu-HU',
  'ro-RO',
  'sk-SK',
  'sl-SI',
  'hr-HR',
  'tr-TR',
  'el-GR',
  'ru-RU',
  'uk-UA',
  'he-IL',
  'ar-SA',
  'ar-EG',
  'hi-IN',
  'bn-BD',
  'bn-IN',
  'pa-IN',
  'ta-IN',
  'th-TH',
  'vi-VN',
  'id-ID',
  'ms-MY',
  'zh-CN',
  'zh-TW',
  'zh-HK',
  'ja-JP',
  'ko-KR',
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
.instructions a {
  color: var(--color-action-primary, #4381c1);
  text-decoration: none;
  font-weight: 600;
}
.instructions a:hover {
  text-decoration: underline;
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
