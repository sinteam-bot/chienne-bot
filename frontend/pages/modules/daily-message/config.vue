<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Paramètres Principaux -->
    <div class="config-card">
      <div class="card-subtitle">⚙️ Paramètres du Module Pensée du Jour</div>
      <p class="config-desc">
        Configurez le salon de diffusion, le salon de prévisualisation et le prompt créatif envoyé au modèle LLM.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le module Daily Message</label>
          <span class="config-hint">Active la génération quotidienne par IA et sa diffusion automatique.</span>
        </div>
        <label class="switch">
          <input v-model="config.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="form-row" style="margin-top: 14px;">
        <div class="col-half">
          <label class="form-label">Salon de Diffusion Finale (09h00)</label>
          <DiscordChannelSelect
            v-model="config.channel_id"
            placeholder="Sélectionner le salon de diffusion..."
            :filter-text-only="true"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Salon de Pré-rendu / Brouillon (21h00)</label>
          <DiscordChannelSelect
            v-model="config.preview_channel_id"
            :allow-null="true"
            null-label="— Aucun salon (sauvegarde interne seule) —"
            placeholder="Sélectionner le salon..."
            :filter-text-only="true"
          />
        </div>
      </div>

      <div class="form-row" style="margin-top: 14px;">
        <div class="col-half">
          <label class="form-label">Modèle IA Spécifique pour la Pensée du Jour</label>
          <OpenRouterModelSelect v-model="config.ai_config.model" />
        </div>
      </div>

      <div style="margin-top: 14px;">
        <label class="form-label">Prompt Système / Directives de Création IA</label>
        <textarea
          v-model="config.prompt"
          class="discord-textarea"
          rows="4"
          placeholder="Rédige une pensée bienveillante, motivante et philosophique pour la communauté..."
        ></textarea>
      </div>

      <div class="config-actions-bar" style="margin-top: 16px;">
        <button class="btn-primary" :disabled="isSaving" @click="saveModuleConfig">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Paramètres Daily Message' }}
        </button>
      </div>
    </div>

    <!-- Modèles de Secours & Politique de Réessai Style Polly -->
    <div class="config-card">
      <OpenRouterFallbackManager
        :fallback-models="config.openrouter?.fallback_models || []"
        :retry-policy="config.openrouter?.retry_policy || {}"
        @update:fallback-models="onUpdateFallbackModels"
        @update:retry-policy="onUpdateRetryPolicy"
        @save="saveModuleConfig"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';
import OpenRouterModelSelect from '~/components/common/OpenRouterModelSelect.vue';
import OpenRouterFallbackManager from '~/components/common/OpenRouterFallbackManager.vue';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const isSaving = ref(false);

const config = ref<any>({
  enabled: true,
  channel_id: '',
  preview_channel_id: '',
  prompt: '',
  ai_config: {
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free'
  },
  openrouter: {
    fallback_models: [],
    retry_policy: {}
  }
});

function onUpdateFallbackModels(models: string[]) {
  config.value.openrouter = config.value.openrouter || {};
  config.value.openrouter.fallback_models = models;
}

function onUpdateRetryPolicy(policy: any) {
  config.value.openrouter = config.value.openrouter || {};
  config.value.openrouter.retry_policy = policy;
}

async function loadConfig() {
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/config');
    if (res.success && res.data) {
      if (res.data.daily_message) {
        config.value = {
          ...config.value,
          ...res.data.daily_message,
          ai_config: {
            ...config.value.ai_config,
            ...(res.data.daily_message.ai_config || {})
          }
        };
      }
      if (res.data.openrouter) {
        config.value.openrouter = res.data.openrouter;
      }
    }
  } catch (err) {
    console.error('Erreur chargement config daily message:', err);
  }
}

async function saveModuleConfig() {
  isSaving.value = true;
  try {
    const resDaily = await apiFetch<{ success: boolean; message?: string }>('/api/config', {
      method: 'POST',
      body: {
        module: 'daily_message',
        config: config.value
      }
    });

    if (config.value.openrouter) {
      await apiFetch<{ success: boolean }>('/api/config', {
        method: 'POST',
        body: {
          module: 'openrouter',
          config: config.value.openrouter
        }
      });
    }

    if (resDaily.success) {
      showToast('Configuration Daily Message sauvegardée !', 'success');
    } else {
      showToast('Erreur de sauvegarde', 'error');
    }
  } catch (err: any) {
    showToast('Erreur: ' + err.message, 'error');
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  loadConfig();
});
</script>
