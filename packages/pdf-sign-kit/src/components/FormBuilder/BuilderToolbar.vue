<template>
  <div class="toolbar-left">
    <button class="sk-button sk-button--neutral" @click="$emit('zoom-out')">Zoom -</button>
    <button class="sk-button sk-button--neutral" @click="$emit('zoom-in')">Zoom +</button>
    <button class="sk-button sk-button--primary" @click="$emit('export')">Export</button>
  </div>
</template>

<script setup lang="ts">
// lightweight toolbar for the builder; emits zoom/export actions
</script>

<style scoped>
.toolbar-left {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
