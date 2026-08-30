<template>
  <div class="config-panel-layout">
    <!-- Sous-Sidebar de configuration avec catégories (comme /archives) -->
    <ConfigSubSidebar
      :guild-id="currentGuildId"
      :active-feature="activeFeatureName"
      @select-feature="onFeatureSelect"
    />

    <!-- Zone principale de contenu de la configuration active -->
    <section class="config-main-area">
      <div class="config-main-scroller">
        <NuxtPage />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppState } from '~/composables/useAppState.ts';
import ConfigSubSidebar from '~/components/layout/ConfigSubSidebar.vue';

definePageMeta({
  title: 'Configuration Serveur',
  icon: '⚙️',
  description: 'Panneau de configuration globale et modulaire par serveur Discord',
  section: 'bot',
  order: 9
});

useSeoMeta({
  title: 'Configuration Serveur - Dashboard',
  description: 'Panneau de configuration globale et modulaire par serveur Discord',
  ogTitle: 'Configuration Serveur - Dashboard',
  ogDescription: 'Panneau de configuration globale et modulaire par serveur Discord'
});

const route = useRoute();
const router = useRouter();
const { guild } = useAppState();

const currentGuildId = computed(() => {
  const fromParam = route.params.guild as string;
  if (fromParam && fromParam.trim() !== '' && fromParam !== ':guild()' && fromParam !== ':guild') {
    return fromParam;
  }
  if (guild.value?.id) return guild.value.id;
  return 'default';
});

const activeFeatureName = computed(() => {
  const f = route.params.feature as string;
  if (f && f !== ':feature' && f !== ':feature()') return f;
  const pathParts = route.path.split('/');
  const lastPart = pathParts[pathParts.length - 1];
  if (lastPart && lastPart !== 'config' && !lastPart.startsWith(':')) return lastPart;
  return 'general';
});

watchEffect(() => {
  const raw = route.params.guild as string;
  if (raw === ':guild()' || raw === ':guild') {
    router.replace(`/panel/${currentGuildId.value}/config/${activeFeatureName.value}`);
  }
});

function onFeatureSelect(featureId: string) {
  router.push(`/panel/${currentGuildId.value}/config/${featureId}`);
}
</script>

<style scoped>
.config-panel-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--bg-primary, #313338);
}

.config-main-area {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-primary, #313338);
}

.config-main-scroller {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
</style>
