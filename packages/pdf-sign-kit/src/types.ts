/**
 * Template and Field Types for @signkit/core
 *
 * Coordinates: x, y, width, height are normalized values in range 0..1 relative to page dimensions.
 * page: 0-based page index
 */

export type FieldType =
  | 'signature'
  | 'initials'
  | 'text'
  | 'date'
  | 'current_date'
  | 'checkbox'
  | 'name'
  | 'email'
  | string; // allow extension for future field types

export interface ValidationRuleBase {
  message?: string;
}

export interface TextValidation extends ValidationRuleBase {
  maxLength?: number;
  pattern?: string; // regex string
}

export interface EmailValidation extends ValidationRuleBase {
  pattern?: string; // optional override
}

export interface DateValidation extends ValidationRuleBase {
  earliest?: string; // ISO date
  latest?: string; // ISO date
  format?: string; // e.g., 'YYYY-MM-DD'
}

export type FieldValidation = TextValidation | EmailValidation | DateValidation | null;

export interface FieldBase {
  id: string;
  type: FieldType;
  page: number; // 0-based page index
  x: number; // normalized 0..1 (left)
  y: number; // normalized 0..1 (top)
  width: number; // normalized 0..1
  height: number; // normalized 0..1
  required?: boolean;
  label?: string;
  role?: string; // signer role or assignment key
  defaultValue?: string | boolean | null;
  meta?: Record<string, unknown>;
  validation?: FieldValidation;
  createdAt?: string;
  updatedAt?: string;
}

export interface SignatureField extends FieldBase {
  type: 'signature' | 'initials';
  appearance?: {
    strokeWidth?: number;
    strokeColor?: string;
    scale?: number;
  };
}

export interface TextField extends FieldBase {
  type: 'text' | 'name' | 'email';
  placeholder?: string;
}

export interface DateField extends FieldBase {
  type: 'date' | 'current_date';
  format?: string;
}

export interface CheckboxField extends FieldBase {
  type: 'checkbox';
  defaultValue?: boolean;
}

export type Field = SignatureField | TextField | DateField | CheckboxField | FieldBase;

export interface PageSize {
  width: number; // in PDF points or pixels depending on `unit`
  height: number;
  unit?: 'pt' | 'px' | 'mm' | string;
}

export interface PdfSource {
  type: 'url' | 'document-store' | 'file-name' | 'custom' | string;
  value: string;
  label?: string;
  meta?: Record<string, unknown>;
}

export interface PdfInfo {
  source?: PdfSource;
  fingerprint?: string;
  hash?: {
    algorithm: 'SHA-256' | string;
    encoding: 'base64url' | 'hex' | string;
    value: string;
  } | null;
  pageCount?: number;
  pages?: Array<{ page: number; width: number; height: number; rotation?: number }>;
}

export interface Template {
  id: string;
  version: string; // semver-like '1.0.0'
  title?: string;
  // New `pdf` root for template-level PDF metadata (backwards-compatible with `pages` below)
  pdf?: PdfInfo;
  pdfHash?: string | null; // optional fingerprint placeholder (legacy)
  pages: PageSize[]; // legacy/top-level pages array (kept for compatibility)
  fields: Field[];
  meta?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface FieldValue {
  fieldId: string;
  value: string | boolean | null; // signatures as base64/svg/png strings when appropriate
}

export interface Manifest {
  manifestId: string;
  templateId: string;
  templateVersion?: string;
  pdfHash?: string;
  signedAt: string;
  signer?: {
    name?: string;
    email?: string;
    id?: string;
  };
  fields: FieldValue[];
  meta?: Record<string, unknown>;
  integrity?: {
    templateHash?: string;
    pdfHash?: string;
    valuesHash?: string;
    ok: boolean;
    verdict?: 'pass' | 'warn' | 'fail';
    details?:
      | {
          checks?: Array<{
            name: string;
            result: 'match' | 'mismatch';
            expected?: string;
            actual?: string;
            details?: Record<string, unknown>;
          }>;
        }
      | Record<string, unknown>;
  };
  // session-level canonical hash combining pdfHash, templateHash and valuesHash
  sessionHash?: string;
}

// NOTE: 'current_date' field type must be created in the template but its value is resolved
// by the Signer at signing time (it does not require user entry).

// ---------------------------------------------------------------------------
// Component prop interfaces — exported for host-app type safety and TypeDoc
// ---------------------------------------------------------------------------

/** Props accepted by the `<FormBuilder>` component. */
export interface FormBuilderProps {
  /** PDF source to render. Accepts a URL string, `File`, or `ArrayBuffer`. */
  pdf?: File | ArrayBuffer | string | null;
  /** Initial zoom scale (default `1`). */
  initialZoom?: number;
  /** BCP-47 locale used when formatting date fields (e.g. `'en-US'`). */
  dateLocale?: string | null;
}

/** Signer identity passed to the `<Signer>` component. */
export interface SignerInfo {
  id?: string;
  name?: string;
  email?: string;
  /** Role key used to restrict which fields this signer may fill. */
  role?: string;
}

/** Pre-computed hashes supplied to the `<Signer>` for integrity verification. */
export interface ExpectedHashes {
  /** SHA-256 base64url hash of the canonicalized template JSON. */
  templateHash?: string;
  /** SHA-256 base64url hash of the original PDF bytes. */
  pdfHash?: string;
  /** SHA-256 base64url hash of the canonicalized field values. */
  valuesHash?: string;
}

/** Props accepted by the `<Signer>` component. */
export interface SignerProps {
  /** PDF source to render and sign. Accepts a URL string, `File`, or `ArrayBuffer`. */
  pdfSrc: string | ArrayBuffer | File | null;
  /** Template describing the fields to present for signing. */
  template: Template;
  /** Identity of the current signer. Controls role-based field access. */
  signer?: SignerInfo | null;
  /**
   * Display mode.
   * - `'standard'` — basic signing UI.
   * - `'integrity'` — shows the integrity banner with hash verification results.
   */
  mode?: 'standard' | 'integrity';
  /** Expected hashes for integrity verification. Only used when `mode` is `'integrity'`. */
  expectedHashes?: ExpectedHashes | null;
  /**
   * How to respond when integrity verification fails.
   * - `'disabled'` — no checks performed.
   * - `'warn'` — show a warning but allow signing.
   * - `'strict'` — block signing if verification fails.
   */
  verificationMode?: 'disabled' | 'warn' | 'strict';
  /** When `true`, signers may override a failed integrity check to proceed anyway. */
  allowOverride?: boolean;
  /** When `true`, all fields are rendered as read-only. */
  readonly?: boolean;
  /** When `true`, embeds the PDF hash into the manifest at finalize time. */
  embedPdfHash?: boolean;
}
