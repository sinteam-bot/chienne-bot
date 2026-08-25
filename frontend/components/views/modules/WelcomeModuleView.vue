<template>
  <div class="view-panel">
    <!-- Onglets de sous-navigation Module -->
    <div class="captcha-subtabs" style="padding: 12px 24px 0 24px; background-color: var(--bg-secondary);">
      <button
        :class="['captcha-subtab-btn', { active: activeSubTab === 'preview' }]"
        @click="activeSubTab = 'preview'"
      >
        📊 Aperçu & Statistiques
      </button>
      <button
        :class="['captcha-subtab-btn', { active: activeSubTab === 'config' }]"
        @click="activeSubTab = 'config'"
      >
        ⚙️ Configuration du Module
      </button>
    </div>

    <!-- SOUS-ONGLET 1 : APERÇU LIVE & STATS -->
    <div v-if="activeSubTab === 'preview'" class="daily-scroller">
      <!-- Bannière Stats -->
      <div class="daily-stats-banner">
        <div class="daily-stat-card">
          <div class="daily-stat-icon">👋</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Statut du Module</span>
            <span class="daily-stat-value" :style="{ color: config?.enabled ? 'var(--green)' : 'var(--red)' }">
              {{ config?.enabled ? 'Activé' : 'Désactivé' }}
            </span>
            <span class="daily-stat-sub">Message d'accueil automatique</span>
          </div>
        </div>

        <div class="daily-stat-card">
          <div class="daily-stat-icon">📢</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Salon d'Accueil</span>
            <span class="daily-stat-value">#{{ welcomeChannelName }}</span>
            <span class="daily-stat-sub">ID: {{ config?.welcome_channel_id || 'Salon Système' }}</span>
          </div>
        </div>

        <div class="daily-stat-card">
          <div class="daily-stat-icon">🏷️</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Salon Présentation</span>
            <span class="daily-stat-value">#{{ presentationChannelName }}</span>
            <span class="daily-stat-sub">ID: {{ config?.presentation_channel_id || 'Non défini' }}</span>
          </div>
        </div>
      </div>

      <!-- Prévisualisation Directe de l'Embed de Bienvenue -->
      <div class="daily-history-header">
        <h3>Aperçu en Temps Réel du Message de Bienvenue</h3>
      </div>

      <div class="config-card" style="align-items: flex-start;">
        <DiscordEmbed :embed="previewEmbed" />
      </div>
    </div>

    <!-- SOUS-ONGLET 2 : CONFIGURATION DU MODULE -->
    <div v-else-if="activeSubTab === 'config'" class="daily-scroller" style="max-width: 800px;">
      <div class="config-card">
        <div class="form-group-toggle">
          <div class="toggle-info">
            <span class="form-label">Activer le module Bienvenue</span>
            <p class="form-help">Envoie un embed d'accueil lorsqu'un membre arrive sur le serveur.</p>
          </div>
          <label class="switch">
            <input v-model="config.enabled" type="checkbox" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="form-divider"></div>

        <div class="form-row">
          <div class="col-half">
            <label class="form-label">Salon de Bienvenue (Message Public)</label>
            <DiscordChannelSelect
              v-model="config.welcome_channel_id"
              :allow-null="true"
              null-label="— Salon Système Discord par défaut —"
              placeholder="Sélectionner le salon de bienvenue..."
              :filter-text-only="true"
            />
          </div>
          <div class="col-half">
            <label class="form-label">Salon de Présentation (Mentionné dans l'accueil)</label>
            <DiscordChannelSelect
              v-model="config.presentation_channel_id"
              :allow-null="true"
              null-label="— Aucun salon de présentation —"
              placeholder="Sélectionner le salon de présentation..."
              :filter-text-only="true"
            />
          </div>
        </div>

        <div>
          <label class="form-label">Titre de l'Embed</label>
          <input v-model="config.embed.title" type="text" class="discord-input" />
        </div>

        <div>
          <label class="form-label">Description (placeholders: {username}, {server})</label>
          <textarea v-model="config.embed.description" class="discord-textarea" rows="3"></textarea>
        </div>

        <div class="form-row">
          <div class="col-half">
            <label class="form-label">Couleur de l'Embed</label>
            <div class="color-picker-row">
              <input v-model="config.embed.color" type="color" />
              <input v-model="config.embed.color" type="text" class="discord-input" />
            </div>
          </div>
        </div>

        <div class="config-actions-bar">
          <button class="btn-primary" :disabled="isSaving" @click="saveModuleConfig">
            {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Configuration Bienvenue' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import { useAppState } from '~/composables/useAppState.ts';
import DiscordEmbed from '~/components/common/DiscordEmbed.vue';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();
const { discordChannels, guild } = useAppState();

const activeSubTab = ref<'preview' | 'config'>('preview');
const config = ref<any>({
  enabled: true,
  welcome_channel_id: '',
  presentation_channel_id: '',
  embed: {
    title: 'Bienvenue sur le serveur !',
    description: 'Salut {username} ! Bienvenue sur **{server}** !',
    color: '#f2c7ce'
  }
});
const isSaving = ref(false);

onMounted(() => {
  loadModuleConfig();
});

async function loadModuleConfig() {
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/config');
    if (res.success && res.data?.welcome) {
      config.value = res.data.welcome;
      config.value.embed = config.value.embed || {};
    }
  } catch (err) {
    console.error('Erreur config welcome:', err);
  }
}

async function saveModuleConfig() {
  isSaving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/config', {
      method: 'POST',
      body: JSON.stringify({
        module: 'welcome',
        config: config.value
      })
    });
    if (res.success) {
      showToast('Configuration Bienvenue enregistrée dans config.yml !', 'success');
    }
  } catch (err: any) {
    showToast(`Erreur d'enregistrement: ${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}

const welcomeChannelName = computed(() => {
  const chId = config.value?.welcome_channel_id;
  if (!chId) return 'Salon Système';
  const found = discordChannels.value.find(c => c.id === chId);
  return found ? found.name : chId;
});

const presentationChannelName = computed(() => {
  const chId = config.value?.presentation_channel_id;
  if (!chId) return 'Non défini';
  const found = discordChannels.value.find(c => c.id === chId);
  return found ? found.name : chId;
});

const previewEmbed = computed(() => {
  const desc = (config.value?.embed?.description || 'Bienvenue !')
    .replace('{username}', 'NouveauMembre#1234')
    .replace('{server}', guild.value?.name || 'Chienne Bot');

  return {
    title: config.value?.embed?.title || 'Bienvenue !',
    description: desc,
    color: config.value?.embed?.color || '#f2c7ce',
    footer: { text: `Membre #${(guild.value?.memberCount || 100) + 1}` },
    timestamp: new Date().toISOString()
  };
});
</script>
