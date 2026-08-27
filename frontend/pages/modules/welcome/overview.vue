<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Bannière Stats -->
    <div class="module-stats-banner">
      <div class="module-stat-card">
        <div class="module-stat-icon">👋</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Statut du Module</span>
          <span class="module-stat-value" :style="{ color: config?.enabled ? 'var(--green)' : 'var(--red)' }">
            {{ config?.enabled ? 'Activé' : 'Désactivé' }}
          </span>
          <span class="module-stat-sub">Message d'accueil automatique</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">📢</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Salon d'Accueil</span>
          <span class="module-stat-value">#{{ welcomeChannelName }}</span>
          <span class="module-stat-sub">ID: {{ config?.welcome_channel_id || 'Salon Système' }}</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">🏷️</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Salon Présentation</span>
          <span class="module-stat-value">#{{ presentationChannelName }}</span>
          <span class="module-stat-sub">ID: {{ config?.presentation_channel_id || 'Non défini' }}</span>
        </div>
      </div>
    </div>

    <!-- Récapitulatif de l'embed -->
    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between;">
        <span>👁️ Message Actuel</span>
        <NuxtLink to="/modules/welcome/preview" class="module-btn" style="font-size: 12px; padding: 4px 10px; text-decoration: none;">
          Voir la prévisualisation complète →
        </NuxtLink>
      </div>

      <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; margin-top: 8px;">
        <h4 style="margin: 0 0 6px 0; color: var(--header-primary);">{{ config?.embed?.title || 'Bienvenue !' }}</h4>
        <p style="margin: 0; color: var(--text-normal); font-size: 14px; line-height: 1.5; white-space: pre-wrap;">
          {{ config?.embed?.description || 'Bienvenue sur le serveur Discord !' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAppState } from '~/composables/useAppState.ts';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';

const { discordChannels } = useAppState();
const { apiFetch } = useDiscordApi();

const config = ref<any>({
  enabled: true,
  welcome_channel_id: null,
  presentation_channel_id: null,
  embed: {
    title: 'Bienvenue sur le serveur !',
    description: 'Bienvenue {username} sur **{server}** !',
    color: '#5865F2'
  }
});

const welcomeChannelName = computed(() => {
  if (!config.value?.welcome_channel_id) return 'salon-système (par défaut)';
  const ch = discordChannels.value.find(c => c.id === config.value.welcome_channel_id);
  return ch ? ch.name : config.value.welcome_channel_id;
});

const presentationChannelName = computed(() => {
  if (!config.value?.presentation_channel_id) return 'aucun';
  const ch = discordChannels.value.find(c => c.id === config.value.presentation_channel_id);
  return ch ? ch.name : config.value.presentation_channel_id;
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
