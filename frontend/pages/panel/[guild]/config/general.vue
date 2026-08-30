<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <!-- 1. Paramètres Discord Généraux -->
    <div class="config-card">
      <div class="card-subtitle">🤖 Identifiants &amp; Couleur Discord</div>
      <p class="config-desc">
        Configurez les identifiants principaux du bot Discord et la couleur par défaut des embeds.
      </p>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Client ID (Application ID)</label>
          <input
            v-model="config.client_id"
            type="text"
            class="discord-input"
            placeholder="Ex: 1337543177086959657"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Guild ID (Serveur Actuel)</label>
          <input
            v-model="config.guild_id"
            type="text"
            class="discord-input"
            placeholder="Ex: 1543570824542298122"
          />
        </div>
      </div>

      <div class="form-row" style="margin-top: 14px;">
        <div class="col-half">
          <label class="form-label">Couleur par défaut du Bot (Embeds)</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input
              v-model="config.default_color"
              type="color"
              style="width: 38px; height: 38px; border: none; border-radius: 4px; background: transparent; cursor: pointer;"
            />
            <input
              v-model="config.default_color"
              type="text"
              class="discord-input"
              style="flex: 1; font-family: monospace;"
              placeholder="#f2c7ce"
            />
          </div>
        </div>
        <div class="col-half">
          <label class="form-label">Préfixe de Commandes Textuelles</label>
          <input
            v-model="config.prefix"
            type="text"
            class="discord-input"
            placeholder="!"
          />
        </div>
      </div>

      <div class="config-actions-bar" style="margin-top: 20px;">
        <button class="btn-primary" :disabled="isSaving" @click="saveConfig">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Paramètres Discord' }}
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
  title: 'Configuration Général & Discord',
  hidden: true
});

useSeoMeta({
  title: 'Général & Discord - Configuration',
  description: 'Paramètres généraux du bot Discord'
});

const route = useRoute();
const { guild } = useAppState();
const rawGuild = route.params.guild as string;
const guildId = computed(() => {
  if (rawGuild && rawGuild !== ':guild()' && rawGuild !== ':guild' && rawGuild.trim() !== '') {
    return rawGuild;
  }
  if (guild.value?.id) return guild.value.id;
  return 'default';
});

const { config, isLoading, isSaving, load, save } = useConfigFeature('general', {
  defaultConfig: {
    client_id: '',
    guild_id: guildId.value,
    default_color: '#f2c7ce',
    prefix: '!'
  }
});

async function saveConfig() {
  await save(config.value, guildId.value);
}

onMounted(() => {
  load(guildId.value);
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
