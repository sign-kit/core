<template>
  <div v-if="integrity && mode === 'integrity'" class="integrity-banner">
    Integrity: <strong>{{ integrity.ok ? 'OK' : 'MISMATCH' }}</strong>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ integrity: any; mode?: string }>();
</script>

<style scoped>
.integrity-banner {
  background: var(--sk-color-bg-surface-subtle);
  padding: 6px;
  margin-bottom: 8px;
  border: 1px solid var(--sk-color-border-default);
}
</style>
