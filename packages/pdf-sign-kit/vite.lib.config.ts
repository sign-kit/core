import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    // Do not wipe dist/ before building — other build steps (build:wc,
    // build:types, build:copy-styles) contribute to the same directory.
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
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
