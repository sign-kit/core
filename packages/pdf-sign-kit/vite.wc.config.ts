import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/web-components/register.ts'),
      name: 'PdfSignKitWC',
      fileName: () => 'pdf-sign-kit.wc.iife.js',
      formats: ['iife'],
    },
    rollupOptions: {
      // bundle dependencies for standalone web-component build
      external: [],
    },
  },
});
