import type { Field, Template, Manifest } from '../types';

declare global {
  interface HTMLElementEventMap {
    signed: CustomEvent<{ pdfBlob: Blob; pdfBytes: Uint8Array; manifest: Manifest }>;
    'field-added': CustomEvent<{ field: Field }>;
    'field-updated': CustomEvent<{ field: Field }>;
    'field-removed': CustomEvent<{ id: string }>;
  }
}

export {};
