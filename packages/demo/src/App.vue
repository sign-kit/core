<template>
  <div>
    <h1>pdf-sign-kit demo</h1>
    <FormBuilder :pdf="pdfUrl" v-model="template" />
    <pre style="white-space: pre-wrap">{{ JSON.stringify(template, null, 2) }}</pre>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { FormBuilder } from '../../pdf-sign-kit/src';

const pdfUrl = '/sample/sample.pdf'; //'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
const template = ref(null);
</script>
