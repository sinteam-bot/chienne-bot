<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <!-- Protection Web & API -->
    <div class="config-card">
      <div class="card-subtitle">🛡️ Protection Web &amp; Authentification API</div>
      <p class="config-desc">
        Sécurisez le dashboard web et les routes API du bot avec authentification par clé secrète.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer l'Authentification API</label>
          <span class="config-hint">Rejette les requêtes non autorisées sans clé valide dans le header <code>x-api-key</code>.</span>
        </div>
        <label class="switch">
          <input
            v-if="config.auth"
            v-model="config.auth.enabled"
            type="checkbox"
          />
          <input
            v-else
            type="checkbox"
            @change="e => { if (!config.auth) config.auth = {}; config.auth.enabled = (e.target as HTMLInputElement).checked; }"
          />
          <span class="slider"></span>
        </label>
      </div>

      <div class="form-divider" style="margin: 16px 0; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06));"></div>

      <div>
        <label class="form-label">Clé Secrète / Mot de Passe API (x-api-key)</label>
        <input
          v-if="config.auth"
          v-model="config.auth.api_key"
          type="password"
          class="discord-input"
          placeholder="Clé API secrète..."
        />
        <input
          v-else
          type="password"
          class="discord-input"
          placeholder="Clé API secrète..."
          @input="e => { if (!config.auth) config.auth = {}; config.auth.api_key = (e.target as HTMLInputElement).value; }"
        />
      </div>

      <div class="config-item" style="margin-top: 14px;">
        <div class="config-label-group">
          <label class="config-label">Protéger également les pages HTML statiques</label>
          <span class="config-hint">Affiche une page 401 pour tout visiteur non authentifié sans session active.</span>
        </div>
        <label class="switch">
          <input
            v-if="config.auth"
            v-model="config.auth.protect_static"
            type="checkbox"
          />
          <input
            v-else
            type="checkbox"
            @change="e => { if (!config.auth) config.auth = {}; config.auth.protect_static = (e.target as HTMLInputElement).checked; }"
          />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Serveur & Réseau -->
    <div class="config-card">
      <div class="card-subtitle">🌐 Serveur &amp; Réseau API</div>
      <p class="config-desc">
        Port d'écoute du serveur express et contrôle d'accès d'origine croisée (CORS).
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
          <label class="form-label">Origines Autorisées CORS</label>
          <input
            v-model="config.cors_origin"
            type="text"
            class="discord-input"
            placeholder="*"
          />
        </div>
      </div>

      <div class="config-actions-bar" style="margin-top: 20px;">
        <button class="btn-primary" :disabled="isSaving" @click="saveConfig">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Sécurité Web' }}
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
  description: 'Gestion de l\'authentification web et sécurité API'
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';

const { config, isLoading, isSaving, load, save } = useConfigFeature('web', {
  defaultConfig: {
    port: 3001,
    cors_origin: '*',
    auth: {
      enabled: false,
      api_key: '',
      protect_static: false
    }
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

.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.04));
  gap: 16px;
}

.config-item:last-child {
  border-bottom: none;
}

.config-label-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.config-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-normal, #dbdee1);
}

.config-hint {
  font-size: 12px;
  color: var(--text-muted, #949ba4);
}

.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
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
  margin-bottom: 6px;
  display: block;
}

.discord-input {
  width: 100%;
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

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-tertiary, #4e5058);
  transition: .3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--status-positive, #57f287);
}

input:checked + .slider:before {
  transform: translateX(20px);
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
