<template>
  <div class="view-panel">
    <!-- Onglets de sous-navigation Module -->
    <div class="captcha-subtabs" style="padding: 12px 24px 0 24px; background-color: var(--bg-secondary);">
      <button
        :class="['captcha-subtab-btn', { active: activeSubTab === 'stats' }]"
        @click="activeSubTab = 'stats'"
      >
        📊 Statistiques & Historique
      </button>
      <button
        :class="['captcha-subtab-btn', { active: activeSubTab === 'config' }]"
        @click="activeSubTab = 'config'"
      >
        ⚙️ Configuration du Module
      </button>
    </div>

    <!-- SOUS-ONGLET 1 : STATS & HISTORIQUE -->
    <div v-if="activeSubTab === 'stats'" class="daily-scroller">
      <!-- Bannière Stats -->
      <div class="daily-stats-banner">
        <div class="daily-stat-card">
          <div class="daily-stat-icon">🌅</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Statut du Module</span>
            <span class="daily-stat-value" :style="{ color: config?.enabled ? 'var(--green)' : 'var(--red)' }">
              {{ config?.enabled ? 'Activé' : 'Désactivé' }}
            </span>
            <span class="daily-stat-sub">Pré-rendu 21:00 / Publication 09:00</span>
          </div>
        </div>

        <div class="daily-stat-card">
          <div class="daily-stat-icon">🤖</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Modèle IA Utilisé</span>
            <span class="daily-stat-value">{{ envInfo.openaiModel || 'gpt-4o-mini' }}</span>
            <span class="daily-stat-sub">OpenAI / OpenRouter</span>
          </div>
        </div>

        <div class="daily-stat-card">
          <div class="daily-stat-icon">📢</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Salon Cible</span>
            <span class="daily-stat-value">#{{ targetChannelName }}</span>
            <span class="daily-stat-sub">ID: {{ config?.channel_id || 'Non défini' }}</span>
          </div>
        </div>
      </div>

      <!-- Barre d'outils -->
      <div class="daily-toolbar">
        <button class="btn-primary" :disabled="isGenerating" @click="generateDailyMessage">
          <span v-if="isGenerating">⚡ Génération en cours...</span>
          <span v-else>✨ Générer un message de test</span>
        </button>

        <button class="action-btn" @click="loadDailyData">
          🔄 Rafraîchir
        </button>
      </div>

      <!-- Message en attente de publication -->
      <div v-if="pendingMessage" class="daily-pending-container">
        <div class="daily-pending-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge-pending">EN ATTENTE DE PUBLICATION</span>
            <span class="daily-pending-time">Prévu pour : {{ pendingMessage.scheduledTime || '09:00' }}</span>
          </div>

          <button class="btn-primary" style="background-color: var(--green);" :disabled="isPublishing" @click="publishPending">
            {{ isPublishing ? 'Publication...' : '🚀 Publier Immédiatement' }}
          </button>
        </div>

        <div class="daily-message-preview-box">
          {{ pendingMessage.content }}
        </div>
      </div>

      <!-- Historique des Messages -->
      <div class="daily-history-header">
        <h3>Historique des Messages Quotidiens</h3>
        <span class="daily-history-badge">{{ history.length }} message(s)</span>
      </div>

      <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>

      <div v-else-if="history.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
        Aucun historique enregistré pour le moment.
      </div>

      <div v-else class="daily-cards-list">
        <div v-for="item in history" :key="item.id || item.date" class="daily-history-card">
          <div class="daily-history-card-header">
            <div class="daily-card-date">
              <span>📅 {{ formatDate(item.date || item.createdAt) }}</span>
            </div>

            <div class="daily-card-meta">
              <span v-if="item.model" class="daily-badge-model">{{ item.model }}</span>
              <span v-if="item.tokens" class="daily-badge-tokens">{{ item.tokens }} tokens</span>
              <span v-if="item.isPublished" class="live-status-pill" style="font-size: 10px;">
                ✅ Publié
              </span>
            </div>
          </div>

          <div class="daily-message-preview-box">
            {{ item.content || item.message }}
          </div>
        </div>
      </div>
    </div>

    <!-- SOUS-ONGLET 2 : CONFIGURATION DU MODULE -->
    <div v-else-if="activeSubTab === 'config'" class="daily-scroller" style="max-width: 800px;">
      <div class="config-card">
        <div class="form-group-toggle">
          <div class="toggle-info">
            <span class="form-label">Activer le module Daily Message</span>
            <p class="form-help">Active la génération de la pensée du jour et sa publication automatique.</p>
          </div>
          <label class="switch">
            <input v-model="config.enabled" type="checkbox" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="form-divider"></div>

        <div>
          <label class="form-label">ID du Salon de Publication</label>
          <input v-model="config.channel_id" type="text" class="discord-input" placeholder="ID salon Discord" />
        </div>

        <div>
          <label class="form-label">ID du Rôle à Mentionner (optionnel)</label>
          <input v-model="config.role_mention_id" type="text" class="discord-input" placeholder="ID rôle mentionné" />
        </div>

        <div class="config-actions-bar">
          <button class="btn-primary" :disabled="isSaving" @click="saveModuleConfig">
            {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Configuration Daily Message' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiscordApi } from '~/composables/useDiscordApi';
import { useToast } from '~/composables/useToast';
import { useAppState } from '~/composables/useAppState';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();
const { discordChannels } = useAppState();

const activeSubTab = ref<'stats' | 'config'>('stats');
const config = ref<any>({ enabled: true, channel_id: '', role_mention_id: '' });
const history = ref<any[]>([]);
const pendingMessage = ref<any>(null);
const envInfo = ref<any>({});
const isLoading = ref(true);
const isGenerating = ref(false);
const isPublishing = ref(false);
const isSaving = ref(false);

const targetChannelName = computed(() => {
  const channelId = config.value?.channel_id || envInfo.value?.dailyMessageChannelId;
  if (!channelId) return 'général';
  const found = discordChannels.value.find(c => c.id === channelId);
  return found ? found.name : channelId;
});

onMounted(async () => {
  await Promise.all([
    loadDailyData(),
    loadModuleConfig()
  ]);
});

async function loadDailyData() {
  isLoading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data?: any }>('/api/daily-messages');
    if (res.success && res.data) {
      history.value = res.data.history || [];
      pendingMessage.value = res.data.pending || null;
      envInfo.value = res.data.env || {};
    }
  } catch (err: any) {
    console.error('Erreur chargement daily data:', err);
  } finally {
    isLoading.value = false;
  }
}

async function loadModuleConfig() {
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/config');
    if (res.success && res.data?.daily_message) {
      config.value = res.data.daily_message;
    }
  } catch (err) {
    console.error('Erreur chargement config daily:', err);
  }
}

async function saveModuleConfig() {
  isSaving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/config', {
      method: 'POST',
      body: JSON.stringify({
        module: 'daily_message',
        config: config.value
      })
    });
    if (res.success) {
      showToast('Configuration Daily Message enregistrée dans config.yml !', 'success');
    }
  } catch (err: any) {
    showToast(`Erreur d'enregistrement: ${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}

async function generateDailyMessage() {
  isGenerating.value = true;
  try {
    const res = await apiFetch<{ success: boolean }>('/api/daily-messages/generate-test', { method: 'POST' });
    if (res.success) {
      showToast('Nouveau message généré !', 'success');
      await loadDailyData();
    }
  } catch (err: any) {
    showToast(`Erreur de génération: ${err.message}`, 'error');
  } finally {
    isGenerating.value = false;
  }
}

async function publishPending() {
  isPublishing.value = true;
  try {
    const res = await apiFetch<{ success: boolean }>('/api/daily-messages/publish-now', { method: 'POST' });
    if (res.success) {
      showToast('Message publié sur Discord !', 'success');
      pendingMessage.value = null;
      await loadDailyData();
    }
  } catch (err: any) {
    showToast(`Erreur de publication: ${err.message}`, 'error');
  } finally {
    isPublishing.value = false;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
</script>
