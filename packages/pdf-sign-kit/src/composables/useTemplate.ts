import { ref, watch } from 'vue';
import type { Template, Field, FieldType, PageSize } from '../types';

function genId(prefix = 'f') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function useTemplate(initial?: Template | null) {
  const template = ref<Template>(
    initial || {
      id: genId('tmpl'),
      version: '1.0.0',
      title: 'Untitled template',
      pdfHash: null,
      pages: [],
      fields: [],
      // store creation locale so date formatting can default to the creator's browser
      meta:
        typeof navigator !== 'undefined' && (navigator as any).language
          ? { dateLocale: (navigator as any).language }
          : {},
      createdAt: new Date().toISOString(),
    },
  );

  function setPages(sizes: PageSize[]) {
    template.value.pages = sizes;
    template.value.updatedAt = new Date().toISOString();
  }

  function addField(opts: {
    type: FieldType;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    role?: string;
    defaultValue?: string | boolean | null;
    meta?: Record<string, unknown>;
  }): Field {
    const f: Field = {
      id: genId('field'),
      type: opts.type,
      page: opts.page,
      x: opts.x,
      y: opts.y,
      width: opts.width,
      height: opts.height,
      required: false,
      label: opts.label || opts.type,
      role: opts.role,
      defaultValue: opts.defaultValue ?? null,
      meta: opts.meta ?? {},
      createdAt: new Date().toISOString(),
    } as Field;
    template.value.fields.push(f);
    template.value.updatedAt = new Date().toISOString();
    return f;
  }

  function updateField(id: string, patch: Partial<Field>) {
    const idx = template.value.fields.findIndex((f) => f.id === id);
    if (idx === -1) return;
    template.value.fields[idx] = { ...template.value.fields[idx], ...patch } as Field;
    template.value.updatedAt = new Date().toISOString();
  }

  function removeField(id: string) {
    template.value.fields = template.value.fields.filter((f) => f.id !== id);
    template.value.updatedAt = new Date().toISOString();
  }

  function exportTemplate() {
    const j = JSON.parse(JSON.stringify(template.value)) as Template;

    return j;
  }

  return { template, setPages, addField, updateField, removeField, exportTemplate };
}
