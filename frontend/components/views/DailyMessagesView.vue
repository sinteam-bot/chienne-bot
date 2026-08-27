<template>
  <div class="view-panel">
    <div class="daily-scroller">
      <!-- Bannière de Statistiques -->
      <div class="daily-stats-banner">
        <div class="daily-stat-card">
          <div class="daily-stat-icon">🌅</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Statut du Module</span>
            <span class="daily-stat-value" style="color: var(--green);">Actif</span>
            <span class="daily-stat-sub">Pré-rendu 21:00 / Publie 09:00</span>
          </div>
        </div>

        <div class="daily-stat-card">
          <div class="daily-stat-icon">🤖</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Modèle IA Utilisé</span>
            <span class="daily-stat-value">{{ envInfo.openrouterModel || 'Inconnu' }}</span>
            <span class="daily-stat-sub">OpenRouter</span>
          </div>
        </div>

        <div class="daily-stat-card">
          <div class="daily-stat-icon">📢</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Salon Cible</span>
            <span class="daily-stat-value">#{{ targetChannelName }}</span>
            <span class="daily-stat-sub">ID: {{ envInfo.dailyMessageChannelId || 'Non configuré' }}</span>
          </div>
        </div>
      </div>

      <!-- Barre d'outils -->
      <div class="daily-toolbar">
        <button
          class="btn-primary"
          :disabled="isGenerating"
          @click="generateDailyMessage"
        >
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

          <button
            class="btn-primary"
            style="background-color: var(--green);"
            :disabled="isPublishing"
            @click="publishPending"
          >
            {{ isPublishing ? 'Publication...' : '🚀 Publier Immédiatement' }}
          </button>
        </div>

        <div class="daily-message-preview-box">
          {{ pendingMessage.content }}
        </div>
      </div>

      <!-- En-tête Historique -->
      <div class="daily-history-header">
        <h3>Historique des Messages Quotidiens</h3>
        <span class="daily-history-badge">{{ history.length }} message(s)</span>
      </div>

      <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>

      <div v-else-if="history.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
        Aucun historique de pensée du jour enregistré pour le moment.
      </div>

      <!-- Liste de l'historique -->
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

          <!-- Métadonnées & Accordéon IA si présent -->
          <div v-if="item.generationMetadata" class="daily-generation-details">
            <button
              class="daily-details-toggle"
              @click="item._showDetails = !item._showDetails"
            >
              <span>🔬 Détails de génération IA & Prompts</span>
              <span>{{ item._showDetails ? '▲ Masquer' : '▼ Afficher' }}</span>
            </button>
            <div v-if="item._showDetails" class="daily-details-body">
              <div class="generation-step">
                <div class="generation-step-title">Prompt Utilisé</div>
                <pre class="generation-step-content">{{ item.generationMetadata.prompt || 'N/A' }}</pre>
              </div>
              <div v-if="item.generationMetadata.rawResponse" class="generation-step">
                <div class="generation-step-title">Réponse Brute</div>
                <pre class="generation-step-content">{{ item.generationMetadata.rawResponse }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import { useAppState } from '~/composables/useAppState.ts';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();
const { discordChannels } = useAppState();

const history = ref<any[]>([]);
const pendingMessage = ref<any>(null);
const envInfo = ref<any>({});
const isLoading = ref(true);
const isGenerating = ref(false);
const isPublishing = ref(false);

const targetChannelName = computed(() => {
  const channelId = envInfo.value?.dailyMessageChannelId;
  if (!channelId) return 'général';
  const found = discordChannels.value.find(c => c.id === channelId);
  return found ? found.name : channelId;
});

onMounted(() => {
  loadDailyData();
});

async function loadDailyData() {
  isLoading.value = true;
  try {
    const res = await apiFetch<{
      success: boolean;
      data?: {
        history: any[];
        pending: any;
        env: any;
      }
    }>('/api/daily-messages');

    if (res.success && res.data) {
      history.value = (res.data.history || []).map(item => ({ ...item, _showDetails: false }));
      pendingMessage.value = res.data.pending || null;
      envInfo.value = res.data.env || {};
    }
  } catch (err: any) {
    console.error('Erreur chargement daily messages:', err);
    showToast('Erreur chargement pensées du jour', 'error');
  } finally {
    isLoading.value = false;
  }
}

async function generateDailyMessage() {
  isGenerating.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string; data?: any }>('/api/daily-messages/generate-test', {
      method: 'POST'
    });
    if (res.success) {
      showToast('Nouveau message généré avec succès !', 'success');
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
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/daily-messages/publish-now', {
      method: 'POST'
    });
    if (res.success) {
      showToast('Message publié avec succès sur Discord !', 'success');
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
