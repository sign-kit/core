<template>
  <div class="page">
    <h2>Form Builder</h2>
    <div class="instructions">
      <h3>How to use:</h3>
      <ol>
        <li>
          <strong>Click on the PDF pages</strong> to place new fields (text, signature, date,
          checkbox, email, name).
        </li>
        <li>
          <strong>Drag to move</strong> fields around the page.
          <strong>Drag the corner handle</strong> to resize.
        </li>
        <li>
          <strong>Inspect fields</strong> on the right to edit labels, set required/readonly, and
          configure validation.
        </li>
        <li>
          <strong>Export the template JSON</strong> below, then use it in the
          <router-link to="/signer">Signer</router-link> to let users fill and sign.
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
      <div class="props-group">
        <p class="props-title">Field inspector controls</p>
        <label class="props-check">
          <input type="checkbox" v-model="showBuiltInInspectorControls" />
          Enable built-in controls
        </label>
        <div class="props-nested" v-if="showBuiltInInspectorControls">
          <label class="props-check">
            <input type="checkbox" v-model="builtInInspectorControlState.label" />
            Label
          </label>
          <label class="props-check">
            <input type="checkbox" v-model="builtInInspectorControlState.required" />
            Required
          </label>
          <label class="props-check">
            <input type="checkbox" v-model="builtInInspectorControlState.role" />
            Role
          </label>
        </div>
      </div>
      <div class="props-group">
        <p class="props-title">Custom inspector controls</p>

        <label class="props-check">
          <input type="checkbox" v-model="customInspectorControlState.assignee.enabled" />
          Enable assignee dropdown
        </label>
        <div class="props-nested" v-if="customInspectorControlState.assignee.enabled">
          <label class="props-label" for="assignee-label">Assignee label</label>
          <input
            id="assignee-label"
            class="props-input"
            v-model="customInspectorControlState.assignee.label"
          />

          <label class="props-label" for="assignee-help">Assignee help text</label>
          <input
            id="assignee-help"
            class="props-input"
            v-model="customInspectorControlState.assignee.helpText"
          />

          <label class="props-check">
            <input
              type="checkbox"
              v-model="customInspectorControlState.assignee.includeUnassigned"
            />
            Include "Unassigned" option
          </label>
        </div>

        <label class="props-check" style="margin-top: 8px">
          <input type="checkbox" v-model="customInspectorControlState.ticket.enabled" />
          Enable ticket reference field
        </label>
        <div class="props-nested" v-if="customInspectorControlState.ticket.enabled">
          <label class="props-label" for="ticket-label">Ticket label</label>
          <input
            id="ticket-label"
            class="props-input"
            v-model="customInspectorControlState.ticket.label"
          />

          <label class="props-label" for="ticket-placeholder">Ticket placeholder</label>
          <input
            id="ticket-placeholder"
            class="props-input"
            v-model="customInspectorControlState.ticket.placeholder"
          />

          <label class="props-label" for="ticket-help">Ticket help text</label>
          <input
            id="ticket-help"
            class="props-input"
            v-model="customInspectorControlState.ticket.helpText"
          />
        </div>
      </div>
    </teleport>
    <div class="builder-grid">
      <div class="left cardify">
        <FormBuilder
          :pdf="pdfUrlValue"
          v-model="template"
          :dateLocale="dateLocale"
          :fieldInspectorControls="fieldInspectorControls"
          :showDefaultInspectorControls="showBuiltInInspectorControls"
          :omitDefaultInspectorControls="omitDefaultInspectorControls"
        >
          <template #field-inspector="{ field, getValue, setValue, save }">
            <div class="custom-inspector-note">
              <strong>Custom panel:</strong>
              Add data from another system directly into the selected field.
            </div>
            <div class="custom-inspector-row">
              <label for="external-account-id">External account id</label>
              <input
                id="external-account-id"
                :value="String(getValue('meta.externalAccountId') || '')"
                placeholder="acct_123"
                @input="onExternalAccountInput($event, setValue, save)"
              />
            </div>
            <p class="custom-inspector-hint">Editing field {{ field.id }}</p>
          </template>
        </FormBuilder>
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
import type { FieldInspectorControl } from '../../../pdf-sign-kit/src';

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

const externalUsers = [
  { label: 'Jordan Example (approver)', value: 'usr_1001' },
  { label: 'Robin Chen (finance)', value: 'usr_1002' },
  { label: 'Casey Patel (legal)', value: 'usr_1003' },
];

const customInspectorControlState = ref({
  assignee: {
    enabled: true,
    label: 'Assign user',
    helpText: 'Choose a user from your upstream system',
    includeUnassigned: true,
  },
  ticket: {
    enabled: true,
    label: 'Ticket reference',
    placeholder: 'TKT-12345',
    helpText: 'Optional correlation id stored with the field',
  },
});

const fieldInspectorControls = computed<FieldInspectorControl[]>(() => {
  const controls: FieldInspectorControl[] = [];
  const state = customInspectorControlState.value;

  if (state.assignee.enabled) {
    controls.push({
      key: 'assignee-user',
      type: 'select',
      label: state.assignee.label,
      path: 'meta.assigneeUserId',
      helpText: state.assignee.helpText,
      options: [
        ...(state.assignee.includeUnassigned ? [{ label: 'Unassigned', value: null }] : []),
        ...externalUsers,
      ],
    });
  }

  if (state.ticket.enabled) {
    controls.push({
      key: 'ticket-reference',
      type: 'text',
      label: state.ticket.label,
      path: 'meta.ticketReference',
      placeholder: state.ticket.placeholder,
      helpText: state.ticket.helpText,
    });
  }

  return controls;
});

const showBuiltInInspectorControls = ref(true);
const builtInInspectorControlState = ref({
  label: false,
  required: true,
  role: true,
});

const omitDefaultInspectorControls = computed(() => {
  if (!showBuiltInInspectorControls.value) return [];
  const state = builtInInspectorControlState.value;
  const omit: string[] = [];
  if (!state.label) omit.push('label');
  if (!state.required) omit.push('required');
  if (!state.role) omit.push('role');
  return omit;
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

function onExternalAccountInput(
  event: Event,
  setValue: (path: string, value: unknown) => void,
  save: () => void,
) {
  const target = event.target as HTMLInputElement | null;
  setValue('meta.externalAccountId', target?.value || '');
  // Keep the demo obvious: update the selected field object immediately.
  save();
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
.custom-inspector-note {
  margin-top: 4px;
  margin-bottom: 8px;
  font-size: 12px;
  padding: 8px;
  border-radius: 6px;
  background: rgba(67, 129, 193, 0.08);
}
.custom-inspector-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
.custom-inspector-row label {
  font-size: 12px;
  font-weight: 600;
}
.custom-inspector-hint {
  margin: 0;
  font-size: 11px;
  color: var(--color-text-muted);
}
.props-group {
  border-top: 1px solid var(--color-border-default, rgba(0, 0, 0, 0.08));
  margin-top: 10px;
  padding-top: 10px;
}
.props-title {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 700;
}
.props-check {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  margin-bottom: 6px;
}
.props-nested {
  margin-left: 16px;
  margin-top: 6px;
}
.props-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  margin: 8px 0 4px 0;
}
.props-input {
  width: 100%;
  box-sizing: border-box;
  min-height: 28px;
}
</style>
