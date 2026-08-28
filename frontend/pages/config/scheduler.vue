<template>
  <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
    <div class="spinner" style="width: 32px; height: 32px;"></div>
  </div>

  <div v-else-if="config" style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Planificateur Scheduler & Crons -->
    <div class="config-card">
      <div class="card-subtitle">⏰ Planificateur de Tâches Automatisées (Scheduler / Crons)</div>
      <p class="config-desc">
        Gérez l'exécution automatique des crons (rappel de bump, pensée du jour, backups...) et leur fuseau horaire.
      </p>

      <div class="form-group-toggle">
        <div class="toggle-info">
          <span class="form-label">Activer le Planificateur Global</span>
          <p class="form-help">Active ou désactive l'ensemble des tâches automatisées du bot.</p>
        </div>
        <label class="switch">
          <input v-model="config.scheduler.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="form-divider"></div>

      <div>
        <label class="form-label">Fuseau Horaire (Timezone)</label>
        <input v-model="config.scheduler.timezone" type="text" class="discord-input" placeholder="Europe/Paris" />
      </div>

      <div v-if="config.scheduler.tasks" style="display: flex; flex-direction: column; gap: 10px; margin-top: 16px;">
        <div class="card-subtitle" style="font-size: 13px;">📅 Tâches et Expressions Cron</div>

        <div
          v-for="(task, key) in config.scheduler.tasks"
          :key="key"
          style="background-color: var(--bg-tertiary); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);"
        >
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <strong style="text-transform: capitalize; color: var(--header-primary);">{{ String(key).replace(/_/g, ' ') }}</strong>
            <label class="switch">
              <input v-model="task.enabled" type="checkbox" />
              <span class="slider"></span>
            </label>
          </div>
          <div style="margin-top: 10px;">
            <label class="form-label" style="font-size: 12px;">Expression Cron :</label>
            <input v-model="task.cron" type="text" class="discord-input" style="font-family: var(--font-code);" />
          </div>
        </div>
      </div>

      <div class="config-actions-bar">
        <button class="btn-primary" :disabled="isSaving" @click="saveSection('scheduler', config.scheduler)">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Planificateur' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';

definePageMeta({
  title: 'Planificateur & Crons',
  icon: '⏰',
  description: 'Gestion des tâches planifiées et programmations crons',
  section: 'bot',
  hidden: true
});

useSeoMeta({
  title: 'Planificateur & Crons',
  description: 'Gestion des tâches planifiées et programmations crons',
  ogTitle: 'Planificateur & Crons - Bot',
  ogDescription: 'Gestion des tâches planifiées et programmations crons'
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
        scheduler: res.data.scheduler || { tasks: {} }
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
      showToast('Planificateur sauvegardé dans config.yml !', 'success');
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
