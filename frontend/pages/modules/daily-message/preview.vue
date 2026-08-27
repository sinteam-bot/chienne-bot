<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Bannière Stats -->
    <div class="module-stats-banner">
      <div class="module-stat-card">
        <div class="module-stat-icon">🌅</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Statut de diffusion</span>
          <span class="module-stat-value" :style="{ color: dailyData.config?.enabled !== false ? 'var(--green)' : 'var(--red)' }">
            {{ dailyData.config?.enabled !== false ? 'Activé' : 'Désactivé' }}
          </span>
          <span class="module-stat-sub">Pré-rendu 21h00 / Envoi 09h00</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">🤖</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Modèle IA Utilisé</span>
          <span class="module-stat-value" style="font-size: 13px; font-family: var(--font-code); word-break: break-all;">
            {{ currentModel }}
          </span>
          <span class="module-stat-sub">OpenRouter API</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">📢</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Salon Cible</span>
          <span class="module-stat-value">#{{ targetChannelName }}</span>
          <span class="module-stat-sub">ID: {{ dailyData.config?.channel_id || 'Salon par défaut' }}</span>
        </div>
      </div>
    </div>

    <!-- Barre d'actions -->
    <div class="module-toolbar" style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
      <button class="btn-primary" :disabled="isGenerating || isActionRunning" @click="generateDailyMessage">
        <span v-if="isGenerating">⚡ Génération par IA en cours...</span>
        <span v-else>✨ Générer un nouveau brouillon IA</span>
      </button>

      <button class="action-btn" :disabled="isActionRunning" @click="loadDailyData">
        🔄 Rafraîchir
      </button>
    </div>

    <!-- Bloc du Brouillon en Attente / Validé -->
    <div v-if="pendingMessage" class="config-card" style="border-left: 4px solid var(--brand-experiment, #5865f2);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span v-if="pendingMessage.isAccepted" class="module-status-pill verified">
            ✅ VALIDÉ POUR DIFFUSION (09:00)
          </span>
          <span v-else class="module-status-pill pending">
            ⏳ BROUILLON EN ATTENTE DE VALIDATION
          </span>
          <span v-if="pendingMessage.model" style="font-family: var(--font-code); font-size: 11px; color: var(--text-muted);">
            {{ pendingMessage.model }}
          </span>
        </div>

        <!-- Actions sur le brouillon -->
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <button
            v-if="!pendingMessage.isAccepted"
            class="btn-primary"
            style="background-color: var(--green, #57f287); padding: 6px 14px; font-size: 13px;"
            :disabled="isActionRunning"
            @click="acceptPending"
          >
            ✅ Valider le message
          </button>

          <button
            class="action-btn"
            style="padding: 6px 12px; font-size: 13px;"
            :disabled="isActionRunning"
            @click="regeneratePending"
          >
            🔄 Régénérer (IA)
          </button>

          <button
            class="action-btn"
            style="color: var(--red); border-color: rgba(237, 66, 69, 0.4); padding: 6px 12px; font-size: 13px;"
            :disabled="isActionRunning"
            @click="rejectPending"
          >
            ❌ Supprimer brouillon
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

      <div style="padding: 16px; background-color: var(--bg-tertiary); border-radius: 8px; font-size: 15px; line-height: 1.6; color: var(--header-primary); white-space: pre-wrap;">
        {{ pendingMessage.content || pendingMessage.text }}
      </div>

      <div v-if="pendingMessage.creativePrompt || pendingMessage.finalPrompt" style="font-size: 12px; color: var(--text-muted); background: rgba(0,0,0,0.15); padding: 12px; border-radius: 6px; margin-top: 12px;">
        <div v-if="pendingMessage.creativePrompt"><strong>Prompt créatif :</strong> {{ pendingMessage.creativePrompt }}</div>
        <div v-if="pendingMessage.finalInstruction" style="margin-top: 4px;"><strong>Consigne :</strong> {{ pendingMessage.finalInstruction }}</div>
      </div>
    </div>

    <div v-else class="config-card" style="text-align: center; padding: 40px; color: var(--text-muted);">
      <p style="font-size: 14px; margin-bottom: 12px;">Aucun brouillon en attente actuellement.</p>
      <button class="btn-primary" :disabled="isGenerating || isActionRunning" @click="generateDailyMessage">
        ✨ Générer un brouillon maintenant
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAppState } from '~/composables/useAppState.ts';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';

definePageMeta({
  title: 'Aperçu & Brouillon',
  icon: '👁️',
  description: 'Aperçu et génération manuelle du brouillon de la pensée du jour',
  section: 'modules',
  hidden: true
});

useSeoMeta({
  title: 'Aperçu & Brouillon - Pensée du Jour',
  description: 'Aperçu et génération manuelle du brouillon de la pensée du jour',
  ogTitle: 'Aperçu & Brouillon - Pensée du Jour',
  ogDescription: 'Aperçu et génération manuelle du brouillon de la pensée du jour'
});

const { discordChannels } = useAppState();
const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const dailyData = ref<any>({});
const pendingMessage = ref<any>(null);
const isGenerating = ref(false);
const isActionRunning = ref(false);

const currentModel = computed(() => {
  return dailyData.value.stats?.configuredModel || dailyData.value.env?.configuredModel || 'nvidia/nemotron-3-ultra-550b-a55b:free';
});

const targetChannelName = computed(() => {
  const chId = dailyData.value.config?.channel_id || dailyData.value.stats?.configuredChannelId;
  if (!chId) return 'salon-par-défaut';
  const found = discordChannels.value.find(c => c.id === chId);
  return found ? found.name : chId;
});

async function loadDailyData() {
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/daily-messages');
    if (res.success && res.data) {
      dailyData.value = res.data;
      pendingMessage.value = res.data.pending || res.data.pendingPublish || null;
    }
  } catch (err: any) {
    showToast('Erreur chargement pensée du jour: ' + err.message, 'error');
  }
}

async function generateDailyMessage() {
  isGenerating.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data?: any; error?: string }>('/api/daily-messages/generate', {
      method: 'POST'
    });
    if (res.success) {
      showToast('Nouveau brouillon généré avec succès par IA !', 'success');
      await loadDailyData();
    } else {
      showToast('Erreur lors de la génération: ' + res.error, 'error');
    }
  } catch (err: any) {
    showToast('Erreur IA: ' + err.message, 'error');
  } finally {
    isGenerating.value = false;
  }
}

async function acceptPending() {
  isActionRunning.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/daily-messages/accept', {
      method: 'POST'
    });
    if (res.success) {
      showToast('Brouillon validé pour la publication de 09h00 !', 'success');
      await loadDailyData();
    }
  } catch (err: any) {
    showToast('Erreur: ' + err.message, 'error');
  } finally {
    isActionRunning.value = false;
  }
}

async function regeneratePending() {
  isActionRunning.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/daily-messages/regenerate', {
      method: 'POST'
    });
    if (res.success) {
      showToast('Brouillon régénéré avec succès !', 'success');
      await loadDailyData();
    }
  } catch (err: any) {
    showToast('Erreur: ' + err.message, 'error');
  } finally {
    isActionRunning.value = false;
  }
}

async function rejectPending() {
  if (!confirm('Supprimer ce brouillon ?')) return;
  isActionRunning.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/daily-messages/reject', {
      method: 'POST'
    });
    if (res.success) {
      showToast('Brouillon supprimé', 'info');
      await loadDailyData();
    }
  } catch (err: any) {
    showToast('Erreur: ' + err.message, 'error');
  } finally {
    isActionRunning.value = false;
  }
}

async function publishPending() {
  if (!confirm('Publier immédiatement ce message dans le salon Discord ?')) return;
  isActionRunning.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/daily-messages/publish-now', {
      method: 'POST'
    });
    if (res.success) {
      showToast('🚀 Message publié avec succès sur Discord !', 'success');
      await loadDailyData();
    }
  } catch (err: any) {
    showToast('Erreur publication: ' + err.message, 'error');
  } finally {
    isActionRunning.value = false;
  }
}

onMounted(() => {
  loadDailyData();
});
</script>
