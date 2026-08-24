<template>
  <div class="view-panel">
    <div class="daily-scroller" style="max-width: 900px;">
      <div class="config-header">
        <h3>⚙️ Configuration Générale du Bot</h3>
        <p class="config-desc">Gérez les paramètres d'infrastructure, de sécurité Web/API et le planificateur de tâches dans <code>config.yml</code>.</p>
      </div>

      <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>

      <div v-else-if="config" style="display: flex; flex-direction: column; gap: 20px;">
        <!-- 1. Paramètres Discord Généraux -->
        <div class="config-card">
          <div class="card-subtitle">🤖 Identifiants & Couleur Discord</div>

          <div class="form-row">
            <div class="col-half">
              <label class="form-label">Client ID (Application ID)</label>
              <input v-model="config.discord.client_id" type="text" class="discord-input" />
            </div>
            <div class="col-half">
              <label class="form-label">Guild ID (Serveur Principal)</label>
              <input v-model="config.discord.guild_id" type="text" class="discord-input" />
            </div>
          </div>

          <div class="form-row">
            <div class="col-half">
              <label class="form-label">Couleur par défaut du Bot</label>
              <div class="color-picker-row">
                <input v-model="config.discord.default_color" type="color" />
                <input v-model="config.discord.default_color" type="text" class="discord-input" />
              </div>
            </div>
          </div>

          <div class="config-actions-bar">
            <button class="btn-primary" :disabled="isSaving" @click="saveSection('discord', config.discord)">
              {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Paramètres Discord' }}
            </button>
          </div>
        </div>

        <!-- 2. Protection Web & API -->
        <div class="config-card">
          <div class="card-subtitle">🛡️ Protection Web & Authentification API</div>

          <div class="form-group-toggle">
            <div class="toggle-info">
              <span class="form-label">Activer l'Authentification API</span>
              <p class="form-help">Rejette les requêtes non autorisées sans clé secrète dans le header <code>x-api-key</code>.</p>
            </div>
            <label class="switch">
              <input v-model="config.web.auth.enabled" type="checkbox" />
              <span class="slider"></span>
            </label>
          </div>

          <div class="form-divider"></div>

          <div>
            <label class="form-label">Clé Secrète / Mot de Passe API</label>
            <input v-model="config.web.auth.api_key" type="text" class="discord-input" />
          </div>

          <div class="form-group-toggle">
            <div class="toggle-info">
              <span class="form-label">Protéger également les pages HTML statiques</span>
              <p class="form-help">Affiche une page 401 pour tout visiteur non authentifié.</p>
            </div>
            <label class="switch">
              <input v-model="config.web.auth.protect_static" type="checkbox" />
              <span class="slider"></span>
            </label>
          </div>

          <div class="config-actions-bar">
            <button class="btn-primary" :disabled="isSaving" @click="saveSection('web', config.web)">
              {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Sécurité Web' }}
            </button>
          </div>
        </div>

        <!-- 3. Planificateur Scheduler & Crons -->
        <div class="config-card">
          <div class="card-subtitle">⏰ Planificateur de Tâches (Scheduler / Crons)</div>

          <div class="form-group-toggle">
            <div class="toggle-info">
              <span class="form-label">Activer le Planificateur</span>
              <p class="form-help">Active ou désactive l'ensemble des tâches cron planifiées du bot.</p>
            </div>
            <label class="switch">
              <input v-model="config.scheduler.enabled" type="checkbox" />
              <span class="slider"></span>
            </label>
          </div>

          <div class="form-divider"></div>

          <div>
            <label class="form-label">Fuseau Horaire</label>
            <input v-model="config.scheduler.timezone" type="text" class="discord-input" />
          </div>

          <div v-if="config.scheduler.tasks" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
            <div class="card-subtitle" style="font-size: 12px;">Expressions Crons des Tâches</div>

            <div v-for="(task, key) in config.scheduler.tasks" :key="key" style="background-color: var(--bg-tertiary); padding: 12px; border-radius: 6px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <strong style="text-transform: capitalize;">{{ String(key).replace('_', ' ') }}</strong>
                <label class="switch">
                  <input v-model="task.enabled" type="checkbox" />
                  <span class="slider"></span>
                </label>
              </div>
              <div style="margin-top: 8px;">
                <label class="form-label" style="font-size: 11px;">Cron Expression :</label>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiscordApi } from '~/composables/useDiscordApi';
import { useToast } from '~/composables/useToast';

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
        discord: res.data.discord || {},
        web: res.data.web || { auth: {} },
        scheduler: res.data.scheduler || { tasks: {} }
      };
      config.value.web.auth = config.value.web.auth || {};
    }
  } catch (err: any) {
    console.error('Erreur chargement configuration générale:', err);
  } finally {
    isLoading.value = false;
  }
}

async function saveSection(sectionName: string, sectionData: any) {
  isSaving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/config', {
      method: 'POST',
      body: JSON.stringify({
        module: sectionName,
        config: sectionData
      })
    });
    if (res.success) {
      showToast(`Section ${sectionName} sauvegardée dans config.yml !`, 'success');
    }
  } catch (err: any) {
    showToast(`Erreur de sauvegarde: ${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>
