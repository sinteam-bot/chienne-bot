<template>
  <TemplateEditorView />
</template>

<script setup lang="ts">
import TemplateEditorView from '~/components/views/TemplateEditorView.vue';

definePageMeta({
  title: 'Moteur de Templates',
  icon: '🎨',
  description: 'Moteur de templating Discord universel avec prévisualisation en direct (Embeds, Boucles, Conditions, Filtres)',
  section: 'bot',
  order: 7
});

useSeoMeta({
  title: 'Moteur de Templates Discord',
  description: 'Moteur de templating Discord universel avec prévisualisation en direct',
  ogTitle: 'Moteur de Templates Discord - Chienne Bot',
  ogDescription: 'Moteur de templating Discord universel avec prévisualisation en direct'
});
</script>
