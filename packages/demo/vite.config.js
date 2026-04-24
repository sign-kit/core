import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@sign-kit/styles': 'C:/oss-pdf-signer/packages/pdf-sign-kit/src/styles'
    }
  },
});

