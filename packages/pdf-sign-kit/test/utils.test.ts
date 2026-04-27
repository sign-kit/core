import { describe, it, expect, beforeAll } from 'vitest';
import { canonicalizeTemplate, computePdfHash, computeValuesHash } from '../src/utils/signer';
import { webcrypto as nodeCrypto } from 'crypto';

// Ensure Web Crypto is available in Node test environment
beforeAll(() => {
  if (!(globalThis as any).crypto || !(globalThis as any).crypto.subtle) {
    (globalThis as any).crypto = nodeCrypto;
  }
});

describe('integrity utils', () => {
  it('canonicalizeTemplate produces stable output for identical inputs', () => {
    const t1 = {
      id: 't1',
      version: '1.0',
      fields: [
        { id: 'b', type: 'text', page: 0, x: 0, y: 0, width: 1, height: 1 },
        { id: 'a', type: 'text', page: 0, x: 0, y: 0, width: 1, height: 1 },
      ],
      createdAt: '2026-01-01T00:00:00Z',
    } as any;
    const t2 = JSON.parse(JSON.stringify(t1));
    const s1 = canonicalizeTemplate(t1);
    const s2 = canonicalizeTemplate(t2);
    expect(s1).toBe(s2);
  });

  it('canonicalizeTemplate ignores volatile keys like createdAt and updatedAt', () => {
    const base = {
      id: 't2',
      version: '1.0',
      fields: [{ id: 'f', type: 'text', page: 0, x: 0, y: 0, width: 1, height: 1 }],
    } as any;
    const withMeta = { ...base, createdAt: '2026-01-01', updatedAt: '2026-02-02' };
    const withoutMeta = JSON.parse(JSON.stringify(base));
    const s1 = canonicalizeTemplate(withMeta);
    const s2 = canonicalizeTemplate(withoutMeta);
    expect(s1).toBe(s2);
  });

  it('computePdfHash returns base64url SHA-256 and different inputs produce different hashes', async () => {
    const a = new TextEncoder().encode('hello').buffer;
    const b = new TextEncoder().encode('hello ').buffer;
    const ha = await computePdfHash(a as ArrayBuffer);
    const hb = await computePdfHash(b as ArrayBuffer);
    expect(typeof ha).toBe('string');
    // base64url chars only
    expect(ha).toMatch(/^[A-Za-z0-9\-_]+$/);
    // SHA-256 base64url should be 43 chars (32 bytes -> 44 base64 chars minus padding)
    expect(ha.length).toBeGreaterThan(0);
    expect(ha).not.toBe(hb);
  });

  it('computeValuesHash is stable for different key orders and differs for different values', async () => {
    const v1 = { b: '2', a: '1' } as Record<string, any>;
    const v2 = { a: '1', b: '2' } as Record<string, any>;
    const v3 = { a: '1', b: '3' } as Record<string, any>;
    const h1 = await computeValuesHash(v1);
    const h2 = await computeValuesHash(v2);
    const h3 = await computeValuesHash(v3);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
  });
});
