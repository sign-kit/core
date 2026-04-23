import FormBuilder from './FormBuilder/FormBuilder.vue';
import Signer from './Signer/Signer.vue';

export { FormBuilder, Signer };

export default {
  install(app: any) {
    app.component('PdfFormBuilder', FormBuilder);
    app.component('PdfFormSigner', Signer);
  },
};
