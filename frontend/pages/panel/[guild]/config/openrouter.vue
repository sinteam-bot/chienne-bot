<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <div class="config-card">
      <div class="card-subtitle">🧠 OpenRouter, Modèles IA &amp; Résilience Polly</div>
      <p class="config-desc">
        Configuration des clés API de génération d'intelligence artificielle et modèles alternatifs de secours.
      </p>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Clé API OpenRouter (Bearer Token)</label>
          <input
            v-model="config.api_key"
            type="password"
            class="discord-input"
            placeholder="sk-or-v1-..."
          />
        </div>
        <div class="col-half">
          <label class="form-label">Modèle IA Principal</label>
          <input
            v-model="config.primary_model"
            type="text"
            class="discord-input"
            placeholder="nvidia/nemotron-3.5-lightning:free"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Modèle IA de Secours (Fallback)</label>
          <input
            v-model="config.fallback_model"
            type="text"
            class="discord-input"
            placeholder="meta-llama/llama-3.3-70b-instruct:free"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Température de Génération</label>
          <input
            v-model.number="config.temperature"
            type="number"
            step="0.1"
            min="0"
            max="2"
            class="discord-input"
            placeholder="0.7"
          />
        </div>
      </div>

      <div class="config-actions-bar">
        <button class="btn-primary" :disabled="isSaving" @click="saveConfig">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder OpenRouter' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useConfigFeature } from '~/composables/useConfigFeature.ts';

definePageMeta({
  title: 'Configuration OpenRouter IA',
  hidden: true
});

useSeoMeta({
  title: 'Modèles IA & OpenRouter - Configuration',
  description: 'Configuration des modèles IA et tokens OpenRouter'
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';

const { config, isLoading, isSaving, load, save } = useConfigFeature('openrouter', {
  defaultConfig: {
    api_key: '',
    primary_model: 'nvidia/nemotron-3.5-lightning:free',
    fallback_model: 'meta-llama/llama-3.3-70b-instruct:free',
    temperature: 0.7
  }
});

async function saveConfig() {
  await save(config.value, guildId);
}

onMounted(() => {
  load(guildId);
});
</script>

<style scoped>
.config-page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-card {
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--radius-md, 8px);
  padding: 20px;
}

.card-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: var(--header-primary, #ffffff);
  margin-bottom: 4px;
}

.config-desc {
  font-size: 13px;
  color: var(--text-muted, #949ba4);
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.col-half {
  flex: 1;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-normal, #dbdee1);
}

.discord-input {
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-sm, 4px);
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-normal, #dbdee1);
  outline: none;
  transition: border-color var(--transition-fast);
}

.discord-input:focus {
  border-color: var(--blurple, #5865F2);
}

.config-actions-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}

.btn-primary {
  background: var(--blurple, #5865F2);
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-sm, 4px);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-primary:hover:not(:disabled) {
  background: var(--blurple-hover, #4752c4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.config-loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: var(--blurple, #5865F2);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
