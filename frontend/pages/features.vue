<template>
  <div></div>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState.ts';

definePageMeta({
  title: 'Features & Modules',
  hidden: true
});

const { guild } = useAppState();
const targetGuildId = guild.value?.id || 'default';
await navigateTo(`/panel/${targetGuildId}/info`, { replace: true });
</script>
