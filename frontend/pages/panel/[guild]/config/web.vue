<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <div class="config-card">
      <div class="card-subtitle">🛡️ Configuration API &amp; Dashboard Web</div>
      <p class="config-desc">
        Sécurisation des routes d'administration, port d'écoute et authentification.
      </p>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Port du Serveur Web</label>
          <input
            v-model.number="config.port"
            type="number"
            class="discord-input"
            placeholder="3001"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Clé API Secrète (x-api-key)</label>
          <input
            v-model="config.api_key"
            type="password"
            class="discord-input"
            placeholder="Clé secrète pour les requêtes API"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Secret JWT (Authentification)</label>
          <input
            v-model="config.jwt_secret"
            type="password"
            class="discord-input"
            placeholder="Secret pour signer les tokens JWT"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Origines Autorisées CORS</label>
          <input
            v-model="config.cors_origin"
            type="text"
            class="discord-input"
            placeholder="*"
          />
        </div>
      </div>

      <div class="config-actions-bar">
        <button class="btn-primary" :disabled="isSaving" @click="saveConfig">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Paramètres Web' }}
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
  title: 'Configuration Web & API',
  hidden: true
});

useSeoMeta({
  title: 'Sécurité API & Web - Configuration',
  description: 'Configuration du serveur API et de l\'authentification'
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';

const { config, isLoading, isSaving, load, save } = useConfigFeature('web', {
  defaultConfig: {
    port: 3001,
    api_key: '',
    jwt_secret: '',
    cors_origin: '*'
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
