<template>
  <RoadToInfiniteGameView />
</template>

<script setup lang="ts">
import RoadToInfiniteGameView from '~/components/views/games/RoadToInfiniteGameView.vue';

definePageMeta({
  title: 'Road to Infinite',
  icon: '🔢',
  description: 'Jeu du Compteur : Classement des compteurs et configuration',
  section: 'games',
  order: 1
});

useSeoMeta({
  title: 'Road to Infinite',
  description: 'Jeu du Compteur : Classement des compteurs et configuration',
  ogTitle: 'Road to Infinite - Chienne Bot',
  ogDescription: 'Jeu du Compteur : Classement des compteurs et configuration'
});
</script>
