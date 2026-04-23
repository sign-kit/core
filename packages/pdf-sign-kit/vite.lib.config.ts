import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/components/index.ts'),
      name: 'PdfSignKit',
      fileName: (format) => `pdf-sign-kit.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue', 'pdf-lib', 'pdfjs-dist'],
      output: {
        globals: { vue: 'Vue' },
      },
    },
  },
});
