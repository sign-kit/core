import { Template, Field, FieldValue } from '../types';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

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
  options?: { pdfHash?: string; embedPdfHash?: boolean },
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
      const text = String(raw);
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

  const out = await pdfDoc.save();
  return out;
}

export function valuesToFieldArray(values: Record<string, string | boolean | null>): FieldValue[] {
  return Object.keys(values).map((k) => ({
    fieldId: k,
    value: values[k] === null ? null : String(values[k]),
  }));
}
