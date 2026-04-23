import { Template, Field, FieldValue } from '../types';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Compute SHA-256 and return base64url (no padding) string
export async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashBytes = new Uint8Array(hashBuffer);
  let binary = '';
  for (let i = 0; i < hashBytes.length; i++) binary += String.fromCharCode(hashBytes[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Stable stringify that sorts object keys deterministically.
function stableStringify(v: any): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map((i) => stableStringify(i)).join(',') + ']';
  const keys = Object.keys(v).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
}

export function canonicalizeTemplate(template: Template, options?: { exclude?: string[] }): string {
  // create a shallow copy then remove volatile keys
  const t: any = JSON.parse(JSON.stringify(template));
  const exclude = new Set(options?.exclude || ['createdAt', 'updatedAt']);
  for (const k of Object.keys(t)) if (exclude.has(k)) delete t[k];
  // canonicalize fields: sort by id
  if (Array.isArray(t.fields)) {
    t.fields = t.fields.map((f: any) => {
      const copy = JSON.parse(JSON.stringify(f));
      // remove volatile field props
      delete copy.createdAt;
      delete copy.updatedAt;
      return copy;
    });
    t.fields.sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));
  }
  return stableStringify(t);
}

export async function computeValuesHash(
  values: Record<string, string | boolean | null>,
): Promise<string> {
  // canonicalize by sorting keys
  const normalized: Record<string, any> = {};
  const keys = Object.keys(values).sort();
  for (const k of keys) normalized[k] = values[k] === null ? null : values[k];
  const s = stableStringify(normalized);
  return computeSha256(new TextEncoder().encode(s).buffer);
}

export const computePdfHash = computeSha256;

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function applyValuesToPdf(
  pdfBytes: ArrayBuffer,
  template: Template,
  values: Record<string, string | boolean | null>,
  options?: { pdfHash?: string; embedPdfHash?: boolean; manifest?: any },
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const field of template.fields) {
    const pageIndex = Math.max(0, Math.min(field.page, pages.length - 1));
    const page = pages[pageIndex];
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    const x = field.x * pageWidth;
    const w = field.width * pageWidth;
    const h = field.height * pageHeight;
    // pdf-lib coordinate system origin is bottom-left
    const y = pageHeight - field.y * pageHeight - h;

    const raw = values[field.id];
    if (raw == null) continue;

    if (
      field.type === 'text' ||
      field.type === 'name' ||
      field.type === 'email' ||
      field.type === 'date' ||
      field.type === 'current_date'
    ) {
      // for date fields, allow formatting based on field.format or template.meta.dateLocale
      let text = String(raw);
      if (field.type === 'date' || field.type === 'current_date') {
        try {
          const dstr = String(raw);
          // try parse YYYY-MM-DD safely (avoid timezone shift)
          let dateObj: Date | null = null;
          const ymd = dstr.split('T')[0];
          const parts = ymd.split('-');
          if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const dd = parseInt(parts[2], 10);
            if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(dd)) {
              dateObj = new Date(y, m - 1, dd);
            }
          }
          if (!dateObj) dateObj = new Date(dstr);

          // prefer explicit per-field format tokens (YYYY, MM, DD)
          const df = (field as any).format as string | undefined;
          if (df && /Y|M|D/.test(df) && dateObj) {
            const Y = String(dateObj.getFullYear());
            const MM = String(dateObj.getMonth() + 1).padStart(2, '0');
            const DD = String(dateObj.getDate()).padStart(2, '0');
            text = df.replace(/YYYY/g, Y).replace(/MM/g, MM).replace(/DD/g, DD);
          } else if (template && template.meta && (template.meta as any).dateLocale) {
            try {
              text = new Intl.DateTimeFormat((template.meta as any).dateLocale).format(dateObj!);
            } catch (e) {
              text = dateObj!.toLocaleDateString();
            }
          } else if (dateObj) {
            text = dateObj.toLocaleDateString();
          }
        } catch (e) {
          text = String(raw);
        }
      }
      const fontSize = Math.max(8, Math.min(14, h * 0.6));
      page.drawText(text, {
        x,
        y: y + (h - fontSize) / 2,
        size: fontSize,
        font: helv,
        color: rgb(0, 0, 0),
      });
    } else if (field.type === 'signature' || field.type === 'initials') {
      const dataUrl = String(raw || '');
      try {
        const imgBytes = dataUrlToUint8Array(dataUrl);
        let image: any;
        if (dataUrl.startsWith('data:image/png')) image = await pdfDoc.embedPng(imgBytes);
        else image = await pdfDoc.embedJpg(imgBytes);
        const dims = image.scale(1);
        // scale to fit field
        const scaleX = w / dims.width;
        const scaleY = h / dims.height;
        const scale = Math.min(scaleX, scaleY);
        const drawW = dims.width * scale;
        const drawH = dims.height * scale;
        // center horizontally and vertically inside the field
        const drawX = x + (w - drawW) / 2;
        const drawY = y + (h - drawH) / 2;
        page.drawImage(image, { x: drawX, y: drawY, width: drawW, height: drawH });
      } catch (e) {
        // ignore embed failures
      }
    } else if (field.type === 'checkbox') {
      const checked = raw === true || raw === 'true';
      if (checked) {
        // draw simple X
        page.drawLine({
          start: { x: x + 2, y: y + 2 },
          end: { x: x + w - 2, y: y + h - 2 },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
        page.drawLine({
          start: { x: x + w - 2, y: y + 2 },
          end: { x: x + 2, y: y + h - 2 },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
      }
    }
  }

  // Optionally embed the pdfHash as a small signature line on the last page
  if (options?.embedPdfHash && options.pdfHash) {
    try {
      const lastPage = pages[pages.length - 1];
      const sigText = `signature: ${options.pdfHash}`;
      const fontSize = 8;
      const textWidth = (helv as any).widthOfTextAtSize
        ? (helv as any).widthOfTextAtSize(sigText, fontSize)
        : sigText.length * fontSize * 0.5;
      const x = Math.max(10, (lastPage.getWidth() - textWidth) / 2);
      const y = 10; // 10 units from bottom
      lastPage.drawText(sigText, { x, y, size: fontSize, font: helv, color: rgb(0.2, 0.2, 0.2) });
    } catch (e) {
      // ignore any failures embedding the hash
    }
  }

  // If a manifest is provided, attempt to attach it and draw a small footer with sessionHash
  if (options?.manifest) {
    try {
      const manifestStr =
        typeof options.manifest === 'string'
          ? options.manifest
          : JSON.stringify(options.manifest, null, 2);
      const manifestBytes = new TextEncoder().encode(manifestStr);
      // pdf-lib may provide an attach API in some versions — try it if present
      const anyDoc: any = pdfDoc as any;
      if (typeof anyDoc.attach === 'function') {
        try {
          anyDoc.attach(manifestBytes, 'manifest.json', { mimeType: 'application/json' });
        } catch (e) {
          // ignore attach errors
        }
      }

      // draw sessionHash footer if present
      const sessionHash = options.manifest?.sessionHash;
      if (sessionHash) {
        try {
          const lastPage = pages[pages.length - 1];
          const sigText = `session: ${sessionHash}`;
          const fontSize = 8;
          const textWidth = (helv as any).widthOfTextAtSize
            ? (helv as any).widthOfTextAtSize(sigText, fontSize)
            : sigText.length * fontSize * 0.5;
          const x = Math.max(10, (lastPage.getWidth() - textWidth) / 2);
          const y = 22; // a bit above the pdfHash if present
          lastPage.drawText(sigText, {
            x,
            y,
            size: fontSize,
            font: helv,
            color: rgb(0.2, 0.2, 0.2),
          });
        } catch (e) {
          // ignore draw errors
        }
      }
    } catch (e) {
      // ignore manifest attach errors
    }
  }

  const out = await pdfDoc.save();
  return out;
}

export function valuesToFieldArray(values: Record<string, string | boolean | null>): FieldValue[] {
  return Object.keys(values).map((k) => ({
    fieldId: k,
    value: values[k] === null ? null : String(values[k]),
  }));
}
