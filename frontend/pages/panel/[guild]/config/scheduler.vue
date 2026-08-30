<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <!-- Planificateur Scheduler & Crons -->
    <div class="config-card">
      <div class="card-subtitle">⏰ Planificateur de Tâches Automatisées (Scheduler / Crons)</div>
      <p class="config-desc">
        Gérez l'exécution automatique des crons (rappel de bump, pensée du jour, backups...) et leur fuseau horaire.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le Planificateur Global</label>
          <span class="config-hint">Active ou désactive l'ensemble des tâches automatisées du bot.</span>
        </div>
        <label class="switch">
          <input v-model="config.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="form-divider" style="margin: 16px 0; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06));"></div>

      <div>
        <label class="form-label">Fuseau Horaire (Timezone)</label>
        <input v-model="config.timezone" type="text" class="discord-input" placeholder="Europe/Paris" />
      </div>

      <div v-if="config.tasks" style="display: flex; flex-direction: column; gap: 10px; margin-top: 16px;">
        <div class="card-subtitle" style="font-size: 14px;">📅 Tâches et Expressions Cron</div>

        <div
          v-for="(task, key) in config.tasks"
          :key="key"
          style="background-color: var(--bg-tertiary, #1e1f22); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));"
        >
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <strong style="text-transform: capitalize; color: var(--header-primary, #ffffff);">{{ String(key).replace(/_/g, ' ') }}</strong>
            <label class="switch">
              <input v-model="task.enabled" type="checkbox" />
              <span class="slider"></span>
            </label>
          </div>
          <div style="margin-top: 10px;">
            <label class="form-label" style="font-size: 12px;">Expression Cron :</label>
            <input v-model="task.cron" type="text" class="discord-input" style="font-family: monospace;" />
          </div>
        </div>
      </div>

      <div class="config-actions-bar" style="margin-top: 20px;">
        <button class="btn-primary" :disabled="isSaving" @click="saveConfig">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Planificateur' }}
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
  title: 'Configuration Planificateur',
  hidden: true
});

useSeoMeta({
  title: 'Planificateur & Crons - Configuration',
  description: 'Gestion des tâches planifiées et programmations crons'
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';

const { config, isLoading, isSaving, load, save } = useConfigFeature('scheduler', {
  defaultConfig: {
    enabled: true,
    timezone: 'Europe/Paris',
    tasks: {
      daily_message: { enabled: true, cron: '00 08 * * *' },
      bump_reminder: { enabled: true, cron: '*/5 * * * *' },
      temp_voice_cleanup: { enabled: true, cron: '*/5 * * * *' },
      birthdays_announce: { enabled: true, cron: '00 09 * * *' }
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
