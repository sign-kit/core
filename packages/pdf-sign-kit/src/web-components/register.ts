import { defineCustomElement } from 'vue';
import FormBuilder from '../components/FormBuilder/FormBuilder.vue';
import Signer from '../components/Signer/Signer.vue';
import { attachJsonProps } from './ce-helpers';

const BuilderCE = defineCustomElement(FormBuilder as any);
class PdfFormBuilderElement extends BuilderCE {
  connectedCallback() {
    super.connectedCallback?.();
    attachJsonProps(this, [
      { attr: 'data-template', prop: 'template' },
      { attr: 'data-pdf', prop: 'pdf' },
    ]);
  }
}

if (!customElements.get('pdf-form-builder')) {
  customElements.define('pdf-form-builder', PdfFormBuilderElement);
}

const SignerCE = defineCustomElement(Signer as any);
class PdfFormSignerElement extends SignerCE {
  connectedCallback() {
    super.connectedCallback?.();
    attachJsonProps(this, [
      { attr: 'data-template', prop: 'template' },
      { attr: 'data-values', prop: 'values' },
    ]);
  }
}

if (!customElements.get('pdf-form-signer')) {
  customElements.define('pdf-form-signer', PdfFormSignerElement);
}

export function registerPdfSignKitElements() {
  if (!customElements.get('pdf-form-builder'))
    customElements.define('pdf-form-builder', PdfFormBuilderElement);
  if (!customElements.get('pdf-form-signer'))
    customElements.define('pdf-form-signer', PdfFormSignerElement);
}
