<template>
  <div class="view-panel">
    <!-- Onglets de sous-navigation Module -->
    <div class="module-subtabs">
      <button
        :class="['module-subtab-btn', { active: activeSubTab === 'stats' }]"
        @click="activeSubTab = 'stats'"
      >
        📊 Statistiques & Brouillons
      </button>
      <button
        :class="['module-subtab-btn', { active: activeSubTab === 'config' }]"
        @click="activeSubTab = 'config'"
      >
        ⚙️ Configuration du Module
      </button>
    </div>


    <!-- SOUS-ONGLET 1 : STATS & BROUILLONS & HISTORIQUE -->
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
            <span class="daily-stat-sub">Pré-rendu 21:00 / Diffusion 09:00</span>
          </div>
        </div>

        <div class="daily-stat-card">
          <div class="daily-stat-icon">🤖</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Modèle IA Utilisé</span>
            <span class="daily-stat-value" style="font-size: 13px; font-family: monospace; word-break: break-all;">
              {{ currentModel }}
            </span>
            <span class="daily-stat-sub">OpenRouter / LLM</span>
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
      <div class="daily-toolbar" style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 20px;">
        <button class="btn-primary" :disabled="isGenerating || isActionRunning" @click="generateDailyMessage">
          <span v-if="isGenerating">⚡ Génération en cours...</span>
          <span v-else>✨ Générer un nouveau brouillon</span>
        </button>

        <button class="action-btn" :disabled="isActionRunning" @click="loadDailyData">
          🔄 Rafraîchir
        </button>
      </div>

      <!-- Bloc du Brouillon en Attente / Validé -->
      <div v-if="pendingMessage" class="daily-pending-container" style="margin-bottom: 28px; border: 1px solid var(--border-color); border-radius: 8px; padding: 18px; background-color: var(--bg-secondary);">
        <div class="daily-pending-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span v-if="pendingMessage.isAccepted" class="badge-pending" style="background-color: var(--green); color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">
              ✅ VALIDÉ POUR DIFFUSION (09:00)
            </span>
            <span v-else class="badge-pending" style="background-color: #f39c12; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">
              ⏳ BROUILLON EN ATTENTE DE VALIDATION
            </span>
            <span v-if="pendingMessage.model" class="daily-badge-model" style="font-family: monospace; font-size: 11px;">
              {{ pendingMessage.model }}
            </span>
          </div>

          <!-- Actions sur le brouillon -->
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button
              v-if="!pendingMessage.isAccepted"
              class="btn-primary"
              style="background-color: var(--green); padding: 6px 14px; font-size: 13px;"
              :disabled="isActionRunning"
              @click="acceptPending"
            >
              ✅ Accepter le message
            </button>

            <button
              class="action-btn"
              style="padding: 6px 12px; font-size: 13px;"
              :disabled="isActionRunning"
              @click="regeneratePending"
            >
              🔄 Refuser & Régénérer
            </button>

            <button
              class="action-btn"
              style="color: var(--red); border-color: rgba(231, 76, 60, 0.4); padding: 6px 12px; font-size: 13px;"
              :disabled="isActionRunning"
              @click="rejectPending"
            >
              ❌ Refuser / Annuler
            </button>

            <button
              class="btn-primary"
              style="background-color: #3498db; padding: 6px 14px; font-size: 13px;"
              :disabled="isActionRunning"
              @click="publishPending"
            >
              🚀 Publier Immédiatement
            </button>
          </div>
        </div>

        <div class="daily-message-preview-box" style="padding: 16px; background-color: var(--bg-tertiary); border-radius: 6px; border-left: 4px solid var(--accent); font-size: 15px; line-height: 1.6; margin-bottom: 10px;">
          {{ pendingMessage.content || pendingMessage.text }}
        </div>

        <!-- Détails du prompt généré si disponible -->
        <div v-if="pendingMessage.creativePrompt || pendingMessage.finalPrompt" style="font-size: 12px; color: var(--text-muted); background: rgba(0,0,0,0.15); padding: 10px; border-radius: 4px; margin-top: 8px;">
          <div v-if="pendingMessage.creativePrompt"><strong>Prompt créatif :</strong> {{ pendingMessage.creativePrompt }}</div>
          <div v-if="pendingMessage.finalInstruction" style="margin-top: 4px;"><strong>Consigne :</strong> {{ pendingMessage.finalInstruction }}</div>
        </div>
      </div>

      <!-- Historique des Messages -->
      <div class="daily-history-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0;">Historique des Messages Générés & Publiés</h3>
        <span class="daily-history-badge">{{ history.length }} message(s)</span>
      </div>

      <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>

      <div v-else-if="history.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
        Aucun historique enregistré pour le moment.
      </div>

      <div v-else class="daily-cards-list">
        <div v-for="item in history" :key="item.id || item.msgId" class="daily-history-card">
          <div class="daily-history-card-header">
            <div class="daily-card-date">
              <span>📅 {{ formatDate(item.createdAt || item.date) }}</span>
            </div>

            <div class="daily-card-meta">
              <span v-if="item.model" class="daily-badge-model">{{ item.model }}</span>
              <span v-if="item.tokens" class="daily-badge-tokens">{{ item.tokens?.total || item.tokens }} tokens</span>
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
          <label class="form-label">Salon de Publication du Message du Jour</label>
          <DiscordChannelSelect
            v-model="config.channel_id"
            placeholder="Sélectionner le salon de publication..."
            :filter-text-only="true"
          />
        </div>

        <div>
          <label class="form-label">Salon de Prévisualisation (Modération 21h)</label>
          <DiscordChannelSelect
            v-model="config.preview_channel_id"
            placeholder="Sélectionner le salon de pré-rendu..."
            :allow-null="true"
            null-label="— Aucun (ou salon de logs système) —"
            :filter-text-only="true"
          />
        </div>

        <div>
          <label class="form-label">Couleur de l'Embed</label>
          <input v-model="config.color" type="text" class="discord-input" placeholder="#F2C7CE" />
        </div>

        <div class="form-divider"></div>

        <h4 style="margin: 0 0 12px 0; color: var(--text-normal);">Configuration IA (LLM / OpenRouter)</h4>

        <div>
          <label class="form-label">Modèle IA</label>
          <input
            v-model="aiConfigModel"
            type="text"
            class="discord-input"
            placeholder="ex: nvidia/nemotron-3-ultra-550b-a55b:free, openai/gpt-4o-mini"
          />
          <p class="form-help">Modèle appelé sur OpenRouter pour la génération créative et le message final.</p>
        </div>

        <div class="config-actions-bar" style="margin-top: 24px;">
          <button class="btn-primary" :disabled="isSaving" @click="saveModuleConfig">
            {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Configuration Daily Message' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import { useAppState } from '~/composables/useAppState.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();
const { discordChannels } = useAppState();

const activeSubTab = ref<'stats' | 'config'>('stats');
const config = ref<any>({
  enabled: true,
  channel_id: '',
  preview_channel_id: '',
  color: '#F2C7CE',
  ai_config: {
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free'
  }
});

const history = ref<any[]>([]);
const pendingMessage = ref<any>(null);
const envInfo = ref<any>({});
const isLoading = ref(true);
const isGenerating = ref(false);
const isActionRunning = ref(false);
const isSaving = ref(false);

const currentModel = computed(() => {
  return config.value?.ai_config?.model || envInfo.value?.configuredModel || envInfo.value?.openaiModel || 'nvidia/nemotron-3-ultra-550b-a55b:free';
});

const aiConfigModel = computed({
  get() {
    return config.value?.ai_config?.model || '';
  },
  set(val: string) {
    if (!config.value.ai_config) config.value.ai_config = {};
    config.value.ai_config.model = val;
  }
});

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
      pendingMessage.value = res.data.pending || res.data.pendingPublish || null;
      envInfo.value = res.data.env || res.data.stats || {};
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
      config.value = {
        ...config.value,
        ...res.data.daily_message
      };
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
      await loadDailyData();
    }
  } catch (err: any) {
    showToast(`Erreur d'enregistrement: ${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}

async function generateDailyMessage() {
  isGenerating.value = true;
  isActionRunning.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data?: any; message?: string }>('/api/daily-messages/generate-test', { method: 'POST' });
    if (res.success) {
      showToast(res.message || 'Nouveau brouillon généré avec succès !', 'success');
      if (res.data) {
        pendingMessage.value = {
          ...res.data,
          content: res.data.text || res.data.content,
          isAccepted: false
        };
      }
      await loadDailyData();
    }
  } catch (err: any) {
    showToast(`Erreur de génération: ${err.message}`, 'error');
  } finally {
    isGenerating.value = false;
    isActionRunning.value = false;
  }
}

async function acceptPending() {
  isActionRunning.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/daily-messages/accept', {
      method: 'POST',
      body: JSON.stringify({ draft: pendingMessage.value })
    });
    if (res.success) {
      showToast(res.message || 'Brouillon validé pour diffusion à 09:00 !', 'success');
      if (pendingMessage.value) {
        pendingMessage.value.isAccepted = true;
      }
      await loadDailyData();
    }
  } catch (err: any) {
    showToast(`Erreur de validation: ${err.message}`, 'error');
  } finally {
    isActionRunning.value = false;
  }
}

async function rejectPending() {
  isActionRunning.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/daily-messages/reject', { method: 'POST' });
    if (res.success) {
      showToast(res.message || 'Brouillon refusé et supprimé.', 'info');
      pendingMessage.value = null;
      await loadDailyData();
    }
  } catch (err: any) {
    showToast(`Erreur de refus: ${err.message}`, 'error');
  } finally {
    isActionRunning.value = false;
  }
}

async function regeneratePending() {
  isActionRunning.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data?: any; message?: string }>('/api/daily-messages/regenerate', { method: 'POST' });
    if (res.success) {
      showToast(res.message || 'Nouveau brouillon régénéré avec succès !', 'success');
      if (res.data) {
        pendingMessage.value = {
          ...res.data,
          content: res.data.text || res.data.content,
          isAccepted: false
        };
      }
      await loadDailyData();
    }
  } catch (err: any) {
    showToast(`Erreur de régénération: ${err.message}`, 'error');
  } finally {
    isActionRunning.value = false;
  }
}

async function publishPending() {
  isActionRunning.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/daily-messages/publish-now', {
      method: 'POST',
      body: JSON.stringify({
        text: pendingMessage.value?.content || pendingMessage.value?.text
      })
    });
    if (res.success) {
      showToast(res.message || 'Message publié immédiatement sur Discord !', 'success');
      pendingMessage.value = null;
      await loadDailyData();
    }
  } catch (err: any) {
    showToast(`Erreur de publication: ${err.message}`, 'error');
  } finally {
    isActionRunning.value = false;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}
</script>
