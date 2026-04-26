import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  // Compile SFC styles for custom-elements so component-scoped CSS is inlined
  // into each shadow root at runtime.
  plugins: [vue({ customElement: true })],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
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
