<template>
  <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
    <div class="spinner" style="width: 32px; height: 32px;"></div>
  </div>

  <div v-else-if="config" style="display: flex; flex-direction: column; gap: 20px;">
    <!-- OpenRouter & Résilience Polly -->
    <div class="config-card">
      <div class="card-subtitle">🤖 Configuration OpenRouter & Modèle Principal</div>
      <p class="config-desc">
        Sélectionnez le modèle LLM principal utilisé par le bot et configurez les tokens et la température.
      </p>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Clé API OpenRouter</label>
          <input
            v-model="config.openrouter.api_key"
            type="password"
            class="discord-input"
            placeholder="sk-or-v1-..."
          />
        </div>
        <div class="col-half">
          <label class="form-label">Modèle LLM Principal (OpenRouter)</label>
          <OpenRouterModelSelect v-model="config.openrouter.default_model" />
        </div>
      </div>

      <div class="form-row" style="margin-top: 14px;">
        <div class="col-half">
          <label class="form-label">Tokens Maximum (max_tokens)</label>
          <input
            v-model.number="config.openrouter.max_tokens"
            type="number"
            min="50"
            max="4096"
            class="discord-input"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Température (Créativité : 0.0 - 1.0)</label>
          <input
            v-model.number="config.openrouter.temperature"
            type="number"
            step="0.1"
            min="0"
            max="1"
            class="discord-input"
          />
        </div>
      </div>

      <div class="config-actions-bar">
        <button class="btn-primary" :disabled="isSaving" @click="saveSection('openrouter', config.openrouter)">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder OpenRouter' }}
        </button>
      </div>
    </div>

    <!-- Modèles de Secours & Politique de Réessai Style Polly -->
    <div class="config-card">
      <OpenRouterFallbackManager
        :fallback-models="config.openrouter.fallback_models || []"
        :retry-policy="config.openrouter.retry_policy || {}"
        @update:fallback-models="config.openrouter.fallback_models = $event"
        @update:retry-policy="config.openrouter.retry_policy = $event"
        @save="saveSection('openrouter', config.openrouter)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import OpenRouterModelSelect from '~/components/common/OpenRouterModelSelect.vue';
import OpenRouterFallbackManager from '~/components/common/OpenRouterFallbackManager.vue';

definePageMeta({
  title: 'OpenRouter & IA',
  icon: '🤖',
  description: 'Configuration du LLM OpenRouter et résilience IA',
  section: 'bot',
  hidden: true
});

useSeoMeta({
  title: 'OpenRouter & IA',
  description: 'Configuration du LLM OpenRouter et résilience IA',
  ogTitle: 'OpenRouter & IA - Bot',
  ogDescription: 'Configuration du LLM OpenRouter et résilience IA'
});

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const config = ref<any>(null);
const isLoading = ref(true);
const isSaving = ref(false);

onMounted(() => {
  loadConfig();
});

async function loadConfig() {
  isLoading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/config');
    if (res.success && res.data) {
      config.value = {
        openrouter: res.data.openrouter || {
          default_model: 'openai/gpt-oss-20b:free',
          max_tokens: 500,
          temperature: 0.7,
          fallback_models: [],
          retry_policy: {}
        }
      };
    }
  } catch (err: any) {
    showToast('Erreur chargement: ' + err.message, 'error');
  } finally {
    isLoading.value = false;
  }
}

async function saveSection(sectionName: string, sectionData: any) {
  isSaving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/config', {
      method: 'POST',
      body: {
        module: sectionName,
        config: sectionData
      }
    });
    if (res.success) {
      showToast('Configuration IA OpenRouter et politique Polly sauvegardées !', 'success');
    } else {
      showToast('Erreur de sauvegarde', 'error');
    }
  } catch (err: any) {
    showToast(`Erreur: ${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>
