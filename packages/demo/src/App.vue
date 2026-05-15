<template>
  <div class="demo-root">
    <header class="demo-header">
      <div class="logo-group">
        <img src="/logo-horizontal-dev.png" style="height: 50px; width: auto; display: block" />
        <h1>Demo</h1>
      </div>
      <nav class="nav">
        <router-link to="/builder">Builder</router-link>
        <router-link to="/signer">Signer</router-link>
        <router-link to="/integrity">Integrity</router-link>
        <router-link to="/webcomponent">Web Components</router-link>
        <span class="nav-divider" aria-hidden="true"></span>
        <a href="https://docs.signkit.dev/" target="_blank" rel="noopener" class="nav-external">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          Docs
        </a>
        <a
          href="https://github.com/sign-kit/core"
          target="_blank"
          rel="noopener"
          class="nav-external"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"
            />
          </svg>
          GitHub
        </a>
      </nav>
    </header>

    <main class="demo-main">
      <aside class="demo-sidebar" @dragover.prevent @drop.prevent="handleDrop">
        <div class="cardify">
          <h4>PDF Source</h4>
          <input v-model="pdfUrl" placeholder="Enter PDF URL or load sample" />
          <div style="margin-top: 8px">
            <input type="file" accept="application/pdf" @change="handleFileInput" />
          </div>
          <div style="margin-top: 12px">
            <button @click="loadSample">Load sample.pdf</button>
          </div>
          <div style="margin-top: 8px; font-size: 12px; color: var(--color-text-muted)">
            Or drag & drop a PDF onto this panel
          </div>
        </div>
        <div class="cardify" style="margin-top: 10px">
          <h4>Component props</h4>

          <div id="left-panel-option"></div>
        </div>
      </aside>

      <section class="demo-content">
        <router-view />
      </section>

      <aside class="demo-inspect">
        <h4>Events & Manifest</h4>
        <div class="log">
          <pre v-if="eventLog.length">{{ eventLog.join('\n') }}</pre>
          <div v-else class="muted">No events yet</div>
        </div>
        <h4 style="margin-top: 12px">Manifest</h4>
        <div class="manifest">
          <pre v-if="manifest">{{ JSON.stringify(manifest, null, 2) }}</pre>
          <div v-else class="muted">No manifest</div>
        </div>
      </aside>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref, provide, onBeforeUnmount } from 'vue';

const pdfUrl = ref('/sample/sample.pdf');
const eventLog = ref<string[]>([]);
const manifest = ref<any | null>(null);
const currentTemplate = ref<any | null>(null);
const localObjectUrl = ref<string | null>(null);

function loadSample() {
  releaseLocalObjectUrl();
  pdfUrl.value = '/sample/sample.pdf';
}

function releaseLocalObjectUrl() {
  if (!localObjectUrl.value) return;
  try {
    URL.revokeObjectURL(localObjectUrl.value);
  } catch (e) {
    // ignore cleanup errors
  }
  localObjectUrl.value = null;
}

function setPdfFromFile(file: File) {
  releaseLocalObjectUrl();
  const url = URL.createObjectURL(file);
  localObjectUrl.value = url;
  pdfUrl.value = url;
}

// provide global demo values so pages can use them
provide('pdfUrl', pdfUrl);
provide('eventLog', eventLog);
provide('manifest', manifest);
provide('currentTemplate', currentTemplate);

async function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  if (file.type !== 'application/pdf') {
    alert('Please drop a PDF file');
    return;
  }
  setPdfFromFile(file);
}

function handleFileInput(e: Event) {
  const input = e.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) return;
  if (file.type !== 'application/pdf') {
    alert('Please select a PDF file');
    input.value = '';
    return;
  }
  setPdfFromFile(file);
  input.value = '';
}

onBeforeUnmount(() => {
  releaseLocalObjectUrl();
});
</script>

<style scoped>
@import './styles.css';
.demo-root {
  margin: 18px auto;
  background: var(--color-bg-app, #fafafa);
  border-radius: 10px;
  box-shadow: var(--shadow-md, 0 6px 18px rgba(0, 0, 0, 0.06));
}
.demo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: -24px;
  padding-bottom: 12px;
  padding-left: 16px;
  padding-right: 16px;
  background: white;
  border-bottom: 1px solid var(--color-border-default, rgba(0, 0, 0, 0.08));
}
.nav {
  display: flex;
  align-items: center;
  gap: 4px;
}
.nav a {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 6px;
  color: var(--color-text-secondary, rgba(41, 47, 54, 0.72));
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
  transition:
    background 0.15s,
    color 0.15s;
  white-space: nowrap;
}
.nav a:hover {
  background: var(--color-bg-app, #f8f7f9);
  color: var(--color-text-primary, #292f36);
}
.nav a.router-link-active {
  background: color-mix(in srgb, var(--color-action-secondary, #4381c1) 12%, transparent);
  color: var(--color-action-secondary, #4381c1);
  font-weight: 600;
}
.nav-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border-default, rgba(0, 0, 0, 0.12));
  margin: 0 6px;
  flex-shrink: 0;
}
.nav-external {
  color: var(--color-text-muted, rgba(41, 47, 54, 0.56)) !important;
  font-weight: 400 !important;
}
.nav-external:hover {
  color: var(--color-text-primary, #292f36) !important;
}
.logo-group {
  display: flex;
  gap: 10px;
  align-items: center;
}
.demo-main {
  display: grid;
  grid-template-columns: 260px 1fr 320px;
  gap: 16px;
  padding: 16px;
}
.demo-sidebar,
.demo-inspect {
  background: var(--color-bg-surface, #fff);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border-default, rgba(0, 0, 0, 0.06));
}
.demo-content {
  min-height: 640px;
}
.log,
.manifest {
  max-height: 320px;
  overflow: auto;
  font-family: monospace;
  font-size: 13px;
}
.muted {
  color: var(--color-text-muted, rgba(0, 0, 0, 0.56));
}
</style>
