import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'pdf-form-builder' || tag === 'pdf-form-signer',
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@sign-kit/styles': fileURLToPath(new URL('../pdf-sign-kit/src/styles', import.meta.url)),
    },
  },
});
