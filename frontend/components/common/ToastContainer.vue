<template>
  <div class="toast-container" aria-live="polite">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="['toast-notification', toast.type]"
    >
      <span v-if="toast.type === 'success'">✅</span>
      <span v-else-if="toast.type === 'error'">❌</span>
      <span v-else>ℹ️</span>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast';

const { toasts } = useToast();
</script>
