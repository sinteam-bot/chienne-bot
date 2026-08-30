<template>
  <div></div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

definePageMeta({
  title: 'Configuration',
  hidden: true
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';
await navigateTo(`/panel/${guildId}/config/general`, { replace: true });
</script>
