import { ref, watch, onUnmounted, shallowRef } from 'vue';
import type { Ref } from 'vue';

export function usePdfjs(source: Ref<File | ArrayBuffer | string | null | undefined>) {
  const pdfDoc = shallowRef<any | null>(null);
  const numPages = ref(0);
  const pageSizes = ref<Array<{ width: number; height: number }>>([]);
  const loading = ref(false);
  let loadingTask: any = null;
  const renderTasks = new Map<number, any>();
  const canvasRenderTasks = new WeakMap<HTMLCanvasElement, any>();
  const canvasLocks = new WeakMap<HTMLCanvasElement, Promise<any>>();

  async function load() {
    const src = source.value;
    if (!src) {
      pdfDoc.value = null;
      numPages.value = 0;
      pageSizes.value = [];
      return;
    }

    loading.value = true;
    try {
      const pdfModule = await import('pdfjs-dist/legacy/build/pdf');
      // pdfjs-dist may export a default; normalize to the runtime object
      const pdfjs: any =
        pdfModule && (pdfModule as any).default ? (pdfModule as any).default : pdfModule;

      // Ensure a workerSrc is set; don't read `workerSrc` (its getter throws if unset).
      // Assign the worker path directly. Prefer hosting the worker locally (demo/public),
      // but fall back to an unpkg CDN build for quick demos.
      try {
        const cdnWorker = 'https://unpkg.com/pdfjs-dist@5.6.205/legacy/build/pdf.worker.min.mjs';
        try {
          pdfjs.GlobalWorkerOptions.workerSrc = cdnWorker;
        } catch (e) {
          // If the export shape is different, try a safe assignment to the export object.
          try {
            (pdfjs as any).GlobalWorkerOptions = (pdfjs as any).GlobalWorkerOptions || {};
            (pdfjs as any).GlobalWorkerOptions.workerSrc = cdnWorker;
          } catch (e2) {
            // ignore any failures setting the worker; getDocument will throw with a clear message.
          }
        }
      } catch (err) {
        // swallow to avoid breaking the caller; getDocument will surface the error if workerSrc is required.
      }

      const params: any = {};
      if (typeof src === 'string') params.url = src;
      else if (src instanceof ArrayBuffer) {
        // pdfjs may transfer an ArrayBuffer to its worker which detaches it on the
        // main thread. Pass a copy to pdfjs so the original buffer remains usable
        // for other consumers (e.g. signing). ArrayBuffer.slice creates a new
        // detached-safe copy.
        params.data = src.slice ? src.slice(0) : src;
      } else if (src instanceof File) params.data = await src.arrayBuffer();
      else params.data = src;

      loadingTask = pdfjs.getDocument(params);
      pdfDoc.value = await loadingTask.promise;
      numPages.value = pdfDoc.value.numPages;

      const sizes: Array<{ width: number; height: number }> = [];
      for (let i = 1; i <= numPages.value; i++) {
        const page = await pdfDoc.value.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        sizes.push({ width: viewport.width, height: viewport.height });
      }
      pageSizes.value = sizes;
    } finally {
      loading.value = false;
    }
  }

  async function renderPage(pageNumber: number, canvas: HTMLCanvasElement, scale = 1) {
    if (!pdfDoc.value) return;

    // Serialize renders per canvas to avoid starting multiple concurrent render() ops
    const prevLock = canvasLocks.get(canvas);

    const runRender = async () => {
      if (!pdfDoc.value) return;
      const page = await pdfDoc.value.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const renderTask = page.render({ canvasContext: ctx, viewport });
      renderTasks.set(pageNumber, renderTask);
      try {
        await renderTask.promise;
      } finally {
        if (renderTasks.get(pageNumber) === renderTask) renderTasks.delete(pageNumber);
      }
      return { width: viewport.width, height: viewport.height };
    };

    const lock = prevLock ? prevLock.catch(() => {}).then(runRender) : runRender();
    // store the lock so subsequent calls queue behind it
    canvasLocks.set(canvas, Promise.resolve(lock));
    try {
      const res = await lock;
      return res;
    } finally {
      // cleanup lock if unchanged
      if (canvasLocks.get(canvas) === lock) canvasLocks.delete(canvas);
    }
  }

  watch(source, load, { immediate: true });

  onUnmounted(() => {
    pdfDoc.value = null;
    if (loadingTask && loadingTask.destroy) loadingTask.destroy();
    // cancel any pending render tasks
    for (const rt of renderTasks.values()) {
      try {
        if (rt && typeof rt.cancel === 'function') rt.cancel();
      } catch (e) {
        // ignore
      }
      if (rt && rt.promise && typeof rt.promise.catch === 'function') rt.promise.catch(() => {});
    }
    renderTasks.clear();
  });

  return { pdfDoc, numPages, pageSizes, loading, renderPage };
}
