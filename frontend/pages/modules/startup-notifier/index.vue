<template>
  <div></div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Startup Notifier',
  hidden: true
});

await navigateTo('/modules/startup-notifier/overview', { replace: true });
</script>
