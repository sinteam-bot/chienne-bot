<template>
  <DiscordEventsView />
</template>

<script setup lang="ts">
import DiscordEventsView from '~/components/views/bot/DiscordEventsView.vue';

definePageMeta({
  title: 'Événements Discord',
  icon: '📡',
  description: 'Journal et archivage en direct de tous les événements Discord (v14)',
  section: 'bot',
  order: 3
});

useSeoMeta({
  title: 'Événements Discord',
  description: 'Journal et archivage en direct de tous les événements Discord (v14)',
  ogTitle: 'Événements Discord - Bot',
  ogDescription: 'Journal et archivage en direct de tous les événements Discord (v14)'
});
</script>
