<template>
  <div></div>
</template>

<script setup lang="ts">
import { navigateTo } from '#imports';

definePageMeta({
  hidden: true
});

await navigateTo('/modules/birthdays/overview', { replace: true });
</script>
