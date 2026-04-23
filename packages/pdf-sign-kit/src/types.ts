/**
 * Template and Field Types for @your-scope/pdf-sign-kit
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

export interface Template {
  id: string;
  version: string; // semver-like '1.0.0'
  title?: string;
  pdfHash?: string | null; // optional fingerprint placeholder
  pages: PageSize[];
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
    details?: {
      checks?: Array<{
        name: string;
        result: 'match' | 'mismatch';
        expected?: string;
        actual?: string;
        details?: Record<string, unknown>;
      }>;
    } | Record<string, unknown>;
  };
  // session-level canonical hash combining pdfHash, templateHash and valuesHash
  sessionHash?: string;
}

// NOTE: 'current_date' field type must be created in the template but its value is resolved
// by the Signer at signing time (it does not require user entry).
