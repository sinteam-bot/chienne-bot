<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Prévisualisation Directe de l'Embed de Bienvenue -->
    <div class="config-card">
      <div class="card-subtitle" style="margin-bottom: 14px;">
        <span>👁️ Aperçu en Temps Réel du Message de Bienvenue</span>
      </div>

      <div style="width: 100%; max-width: 560px; margin: 0 auto; padding: 10px 0;">
        <DiscordEmbed :embed="previewEmbed" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAppState } from '~/composables/useAppState.ts';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import DiscordEmbed from '~/components/common/DiscordEmbed.vue';

definePageMeta({
  title: 'Prévisualisation Discord',
  icon: '👁️',
  description: 'Prévisualisation dynamique de l\'embed de bienvenue',
  section: 'modules',
  hidden: true
});

useSeoMeta({
  title: 'Prévisualisation Discord - Bienvenue',
  description: 'Prévisualisation dynamique de l\'embed de bienvenue',
  ogTitle: 'Prévisualisation Discord - Bienvenue',
  ogDescription: 'Prévisualisation dynamique de l\'embed de bienvenue'
});

const { guild } = useAppState();
const { apiFetch } = useDiscordApi();

const config = ref<any>({
  embed: {
    title: 'Bienvenue sur le serveur !',
    description: 'Bienvenue {username} sur **{server}** !\n\nN\'hésite pas à te présenter dans le salon dédié.',
    color: '#5865F2'
  }
});

const previewEmbed = computed(() => {
  const title = (config.value?.embed?.title || 'Bienvenue !')
    .replace(/{username}/g, 'NouveauMembre')
    .replace(/{server}/g, guild.value?.name || 'Obsydian');

  const description = (config.value?.embed?.description || 'Bienvenue {username} sur {server} !')
    .replace(/{username}/g, '@NouveauMembre')
    .replace(/{server}/g, guild.value?.name || 'Obsydian')
    .replace(/{presentation}/g, '#présentation');

  return {
    title,
    description,
    color: config.value?.embed?.color || '#5865F2',
    timestamp: new Date().toISOString(),
    author: {
      name: guild.value?.name || 'Obsydian',
      icon_url: guild.value?.iconUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'
    }
  };
});

async function loadConfig() {
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/config');
    if (res.success && res.data?.welcome) {
      config.value = {
        ...config.value,
        ...res.data.welcome
      };
    }
  } catch (err) {
    console.error('Erreur chargement config welcome:', err);
  }
}

onMounted(() => {
  loadConfig();
});
</script>
