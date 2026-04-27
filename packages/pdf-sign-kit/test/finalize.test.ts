import { describe, it, expect, beforeAll } from 'vitest';
import { useSignerManager } from '../src/composables/useSigner';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { webcrypto as nodeCrypto } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

beforeAll(() => {
  if (!(globalThis as any).crypto || !(globalThis as any).crypto.subtle) {
    (globalThis as any).crypto = nodeCrypto;
  }
});

describe('finalize flow', () => {
  it('finalize returns signedPdfBytes and manifest', async () => {
    const samplePdfPath = path.resolve(
      __dirname,
      '..',
      '..',
      'demo',
      'public',
      'sample',
      'sample.pdf',
    );
    const buf = await fs.readFile(samplePdfPath);
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    const template = {
      id: 't-finalize',
      version: '1.0.0',
      pages: [{ width: 612, height: 792 }],
      fields: [
        { id: 'f1', type: 'text', page: 0, x: 0.1, y: 0.1, width: 0.3, height: 0.05 },
        { id: 'sig1', type: 'signature', page: 0, x: 0.1, y: 0.2, width: 0.4, height: 0.06 },
      ],
      createdAt: new Date().toISOString(),
    } as any;

    const mgr = useSignerManager(template, arrayBuffer, { name: 'Tester' });
    // set a simple text value
    mgr.setValue('f1', 'Test User');
    // leave signature empty to keep simple

    const { signedPdfBytes, manifest } = await mgr.finalize({
      mode: 'standard',
      embedPdfHash: false,
    });

    expect(signedPdfBytes).toBeDefined();
    expect((signedPdfBytes as any).length).toBeGreaterThan(0);
    expect(manifest).toBeDefined();
    expect(manifest.manifestId).toBeTruthy();
    expect(manifest.pdfHash).toBeTruthy();
    expect(manifest.integrity).toBeDefined();
    // manifest.sessionHash should be embedded as a small footer string in the PDF output
    expect(manifest.sessionHash).toBeTruthy();
  }, 20000);
});
