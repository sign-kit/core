import { describe, it, expect, beforeAll } from 'vitest';
import { ensurePdfRoot, migratePdfSourceFromLegacy } from '../src/utils/template';
import { webcrypto as nodeCrypto } from 'crypto';

beforeAll(() => {
  if (!(globalThis as any).crypto || !(globalThis as any).crypto.subtle) {
    (globalThis as any).crypto = nodeCrypto;
  }
});

describe('template helpers', () => {
  it('ensurePdfRoot creates a pdf root from legacy pages', () => {
    const t: any = {
      id: 't1',
      version: '1.0',
      pages: [{ width: 612, height: 792 }],
      fields: [],
      createdAt: new Date().toISOString(),
    };
    ensurePdfRoot(t);
    expect(t.pdf).toBeDefined();
    expect(t.pdf.pageCount).toBe(1);
    expect(Array.isArray(t.pdf.pages)).toBe(true);
    expect(t.pdf.pages[0].width).toBe(612);
  });

  it('migratePdfSourceFromLegacy moves meta.pdfUrl into pdf.source when present', () => {
    const t: any = {
      id: 't2',
      version: '1.0',
      pages: [],
      fields: [],
      meta: { pdfUrl: 'https://example.com/doc.pdf' },
      createdAt: new Date().toISOString(),
    };
    const out = migratePdfSourceFromLegacy(t);
    expect(out.pdf).toBeDefined();
    expect(out.pdf.source).toBeDefined();
    expect(out.pdf.source.value).toBe('https://example.com/doc.pdf');
  });
});
