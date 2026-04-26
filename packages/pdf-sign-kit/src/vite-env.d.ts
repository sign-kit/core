/// <reference types="vite/client" />

declare module '*.css?inline' {
  const cssText: string;
  export default cssText;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare module 'pdfjs-dist/legacy/build/pdf' {
  export * from 'pdfjs-dist';
}
