<script setup>
import { FormBuilder, Signer } from '@signkit/core';
import '@signkit/core/styles.css';
import { ref } from 'vue';
const template = ref({
  id: 'demo-tmpl',
  version: '1.0.0',
  pages: [
    {
      width: 612,
      height: 792,
    },
  ],
  fields: [
    {
      id: 'field_wxeli25',
      type: 'current_date',
      page: 0,
      x: 0.39950980392156865,
      y: 0.5243844696969697,
      width: 0.15849673202614378,
      height: 0.03787878787878788,
      required: false,
      label: 'current_date',
      defaultValue: null,
      meta: {},
      createdAt: '2026-04-23T20:58:25.983Z',
    },
    {
      id: 'field_0960ex5',
      type: 'signature',
      page: 0,
      x: 0.5972222222222222,
      y: 0.5275410353535354,
      width: 0.33088235294117646,
      height: 0.03598484848484849,
      required: false,
      label: 'signature',
      defaultValue: null,
      meta: {},
      createdAt: '2026-04-23T20:58:28.717Z',
    },
  ],
  pdfUrl: '/sample/sample.pdf',
  createdAt: '2026-04-23T20:58:22.474Z',
  updatedAt: '2026-04-23T20:58:32.649Z',
});
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 20px">
    <FormBuilder pdf="/sample.pdf" v-model="template" />
    <Signer pdfSrc="/sample.pdf" :template="template" />
  </div>
</template>
