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
      </nav>
    </header>

    <main class="demo-main">
      <aside class="demo-sidebar" @dragover.prevent @drop.prevent="handleDrop">
        <div class="cardify">
          <h4>PDF Source</h4>
          <input v-model="pdfUrl" placeholder="Enter PDF URL or load sample" />
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
import { ref, provide } from 'vue';

const pdfUrl = ref('/sample/sample.pdf');
const eventLog = ref<string[]>([]);
const manifest = ref<any | null>(null);
const currentTemplate = ref<any | null>(null);

function loadSample() {
  pdfUrl.value = '/sample/sample.pdf';
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
  // create an object URL for the preview
  const url = URL.createObjectURL(file);
  pdfUrl.value = url;
}
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
  padding-bottom: 16px;
  padding-left: 16px;
  padding-right: 16px;
  background: white;
}
.nav a {
  margin-left: 12px;
  color: var(--color-action-secondary, #4381c1);
  font-weight: 600;
  text-decoration: none;
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
