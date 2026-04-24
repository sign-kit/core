import type { Template } from '../types';

export function ensurePdfRoot(t: Template): Template {
  if (!t.pdf) {
    (t as any).pdf = {
      source: { type: 'url', value: '' },
      fingerprint: undefined,
      hash: null,
      pageCount: (t.pages && t.pages.length) || 0,
      pages: (t.pages || []).map((p: any, i: number) => ({
        page: i,
        width: p.width,
        height: p.height,
      })),
    };
  }
  return t;
}

export function migratePdfSourceFromLegacy(t: Template): Template {
  // simple migration: if pdf.source missing and template.meta?.pdfUrl present, move it
  try {
    const meta = t.meta as any;
    if (meta && meta.pdfUrl && (!t.pdf || !t.pdf.source || !t.pdf.source.value)) {
      t.pdf = t.pdf || ({} as any);
      t.pdf.source = { type: 'url', value: meta.pdfUrl, label: 'migrated' };
    }
  } catch (e) {}
  return t;
}
