import { ref, computed } from 'vue';
import type { Template, Field, FieldValue, Manifest } from '../types';
import {
  computeSha256,
  applyValuesToPdf,
  valuesToFieldArray,
  canonicalizeTemplate,
  computeValuesHash,
} from '../utils/signer';

export type SignerInfo = { id?: string; name?: string; email?: string; role?: string } | null;

export function useSignerManager(
  template: Template,
  originalPdfBytes: ArrayBuffer | null,
  signer: SignerInfo = null,
) {
  const values = ref<Record<string, string | boolean | null>>({});
  const errors = ref<Record<string, string>>({});

  // initialize defaults and current_date resolution
  for (const f of template.fields) {
    if (values.value[f.id] === undefined) {
      if (f.type === 'current_date') {
        values.value[f.id] = new Date().toISOString().split('T')[0];
      } else if (f.defaultValue !== undefined) {
        values.value[f.id] = f.defaultValue as string | boolean | null;
      } else {
        values.value[f.id] = null;
      }
    }
  }

  function setValue(fieldId: string, value: string | boolean | null) {
    values.value[fieldId] = value;
  }

  function getValue(fieldId: string) {
    return values.value[fieldId];
  }

  function validate(): { ok: boolean; errors: Record<string, string> } {
    const out: Record<string, string> = {};
    for (const f of template.fields) {
      const v = values.value[f.id];
      if (f.required) {
        if (v === null || v === undefined || v === '') {
          out[f.id] =
            f.validation && (f.validation as any).message
              ? (f.validation as any).message
              : 'Required';
          continue;
        }
      }
      if (v != null && typeof v === 'string') {
        if (f.validation && (f.validation as any).maxLength) {
          const ml = (f.validation as any).maxLength as number;
          if ((v as string).length > ml) out[f.id] = `Must be ${ml} characters or fewer`;
        }
        if (f.type === 'email') {
          const emailRegex = /\S+@\S+\.\S+/;
          if (!emailRegex.test(v as string)) out[f.id] = 'Invalid email';
        }
      }
    }
    errors.value = out;
    return { ok: Object.keys(out).length === 0, errors: out };
  }

  async function finalize(options?: {
    mode?: 'standard' | 'integrity';
    expected?: { templateHash?: string; pdfHash?: string; valuesHash?: string };
    signerInfo?: { id?: string; name?: string; email?: string };
    embedPdfHash?: boolean;
    verificationMode?: 'disabled' | 'warn' | 'strict';
    allowOverride?: boolean;
  }) {
    const { mode = 'standard', expected, signerInfo, embedPdfHash = false } = options || {};
    // perform validation first
    const v = validate();
    if (!v.ok) throw { validation: v.errors };

    // compute template hash (canonicalized)
    const canonical = canonicalizeTemplate(template);
    const templateHash = await computeSha256(new TextEncoder().encode(canonical).buffer);

    // compute original pdf hash if available
    let originalPdfHash: string | undefined = undefined;
    if (originalPdfBytes) {
      originalPdfHash = await computeSha256(originalPdfBytes);
    }

    // compute values hash
    const valuesHash = await computeValuesHash(values.value);

    // derive session hash
    const sessionCanonical = JSON.stringify({ pdfHash: originalPdfHash, templateHash, valuesHash });
    const sessionHash = await computeSha256(new TextEncoder().encode(sessionCanonical).buffer);

    // integrity checks
    const integrityDetails: Record<string, any> = { checks: [] };
    let integrityOk = true;
    const vm = options?.verificationMode ?? (options?.mode === 'integrity' ? 'warn' : 'disabled');
    const expected = options?.expected;
    if (expected?.templateHash) {
      const ok = expected.templateHash === templateHash;
      integrityDetails.checks.push({
        name: 'templateHash',
        result: ok ? 'match' : 'mismatch',
        expected: expected.templateHash,
        actual: templateHash,
      });
      if (!ok) integrityOk = false;
    }
    if (expected?.pdfHash && originalPdfHash) {
      const ok = expected.pdfHash === originalPdfHash;
      integrityDetails.checks.push({
        name: 'pdfHash',
        result: ok ? 'match' : 'mismatch',
        expected: expected.pdfHash,
        actual: originalPdfHash,
      });
      if (!ok) integrityOk = false;
    }
    if (expected?.valuesHash) {
      const ok = expected.valuesHash === valuesHash;
      integrityDetails.checks.push({
        name: 'valuesHash',
        result: ok ? 'match' : 'mismatch',
        expected: expected.valuesHash,
        actual: valuesHash,
      });
      if (!ok) integrityOk = false;
    }

    if (!originalPdfBytes) throw new Error('Original PDF bytes required for finalization');

    // if strict verification and disagreement, block
    if (vm === 'strict' && !integrityOk) {
      const err: any = new Error('Integrity check failed');
      err.name = 'IntegrityError';
      err.integrity = { ok: false, details: integrityDetails };
      throw err;
    }

    const manifest: Manifest = {
      manifestId: `m-${Date.now()}`,
      templateId: template.id,
      templateVersion: template.version,
      pdfHash: originalPdfHash ?? undefined,
      signedAt: new Date().toISOString(),
      signer: signerInfo
        ? { name: signerInfo.name, email: signerInfo.email, id: signerInfo.id }
        : undefined,
      fields: valuesToFieldArray(values.value),
      integrity: {
        templateHash,
        pdfHash: originalPdfHash ?? undefined,
        valuesHash,
        ok: integrityOk,
        details: integrityDetails,
      },
      sessionHash,
    } as any;

    const signedPdfBytes = await applyValuesToPdf(originalPdfBytes, template, values.value, {
      pdfHash: originalPdfHash,
      embedPdfHash: options?.embedPdfHash ?? false,
      manifest: manifest,
    });

    return { signedPdfBytes, manifest };
  }

  return {
    values,
    errors: computed(() => errors.value),
    setValue,
    getValue,
    validate,
    finalize,
  };
}
