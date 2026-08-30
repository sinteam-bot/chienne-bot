<template>
  <div></div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useAppState } from '~/composables/useAppState.ts';

definePageMeta({
  title: 'Configuration',
  hidden: true
});

const route = useRoute();
const { guild } = useAppState();

const rawGuild = route.params.guild as string;
const targetGuildId = (rawGuild && rawGuild !== ':guild()' && rawGuild !== ':guild' && rawGuild.trim() !== '')
  ? rawGuild
  : (guild.value?.id || 'default');

await navigateTo(`/panel/${targetGuildId}/config/general`, { replace: true });
</script>
