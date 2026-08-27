<template>
  <CommandsView />
</template>

<script setup lang="ts">
import CommandsView from '~/components/views/bot/CommandsView.vue';

definePageMeta({
  title: 'Commandes',
  icon: '⚡',
  description: 'Liste des commandes Discord et permissions d\'accès',
  section: 'bot',
  order: 4
});

useSeoMeta({
  title: 'Commandes',
  description: 'Liste des commandes Discord et permissions d\'accès',
  ogTitle: 'Commandes Discord - Chienne Bot',
  ogDescription: 'Liste des commandes Discord et permissions d\'accès'
});
</script>
