<template>
  <InfoView />
</template>

<script setup lang="ts">
import InfoView from '~/components/views/bot/InfoView.vue';

definePageMeta({
  title: 'Informations',
  icon: '📊',
  description: 'Statistiques globales, performances et état du bot',
  section: 'bot',
  order: 1
});

useSeoMeta({
  title: 'Informations',
  description: 'Statistiques globales, performances et état du bot',
  ogTitle: 'Informations - Bot',
  ogDescription: 'Statistiques globales, performances et état du bot'
});
</script>
