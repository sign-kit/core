import { ref, computed } from 'vue';
import type { Template, Field, FieldValue, Manifest } from '../types';
import { computeSha256, applyValuesToPdf, valuesToFieldArray } from '../utils/signer';

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
    expected?: { templateHash?: string; pdfHash?: string };
    signerInfo?: { id?: string; name?: string; email?: string };
    embedPdfHash?: boolean;
  }) {
    const { mode = 'standard', expected, signerInfo, embedPdfHash = false } = options || {};
    // perform validation first
    const v = validate();
    if (!v.ok) throw { validation: v.errors };

    // compute template hash
    const templateBuffer = new TextEncoder().encode(JSON.stringify(template));
    const templateHash = await computeSha256(templateBuffer.buffer);

    // compute original pdf hash if available
    let originalPdfHash: string | undefined = undefined;
    if (originalPdfBytes) {
      originalPdfHash = await computeSha256(originalPdfBytes);
    }

    // optional integrity check
    let integrityOk = true;
    const integrityDetails: Record<string, unknown> = {};
    if (mode === 'integrity' && expected) {
      if (expected.templateHash && expected.templateHash !== templateHash) integrityOk = false;
      if (expected.pdfHash && originalPdfHash && expected.pdfHash !== originalPdfHash)
        integrityOk = false;
      integrityDetails.expected = expected;
    }

    if (!originalPdfBytes) throw new Error('Original PDF bytes required for finalization');

    const signedPdfBytes = await applyValuesToPdf(originalPdfBytes, template, values.value, {
      pdfHash: originalPdfHash,
      embedPdfHash: embedPdfHash,
    });

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
        ok: integrityOk,
        details: integrityDetails,
      },
    };

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
