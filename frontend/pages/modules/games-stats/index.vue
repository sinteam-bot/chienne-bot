<template>
  <div></div>
</template>

<script setup lang="ts">
import { navigateTo } from '#imports';

definePageMeta({
  hidden: true
});

await navigateTo('/modules/games-stats/overview', { replace: true });
</script>
