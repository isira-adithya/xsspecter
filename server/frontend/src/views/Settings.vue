<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="card col-span-12">
      <Toast />
      <ConfirmDialog group="positioned"></ConfirmDialog>
      <SettingsWidget />
    </div>
  </div>
</template>

<script setup>
import SettingsWidget from '@/components/settings/SettingsWidget.vue';
import { onMounted } from 'vue';

// Load settings on component mount
onMounted(() => {
});
</script>