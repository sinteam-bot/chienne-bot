<template>
  <CountdownGameView />
</template>

<script setup lang="ts">
import CountdownGameView from '~/components/views/games/CountdownGameView.vue';

definePageMeta({
  title: 'Countdown (900 -> 0)',
  icon: '⏳',
  description: 'Compte à rebours, statistiques des pièges et réglages',
  section: 'games',
  order: 2
});

useSeoMeta({
  title: 'Countdown (900 -> 0)',
  description: 'Compte à rebours, statistiques des pièges et réglages',
  ogTitle: 'Countdown (900 -> 0) - Bot',
  ogDescription: 'Compte à rebours, statistiques des pièges et réglages'
});
</script>
