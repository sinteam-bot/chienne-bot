<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <!-- En-tête et activation globale -->
      <div class="config-card">
        <div class="form-group-toggle">
          <div class="toggle-info">
            <span class="form-label" style="font-size: 16px;">⚡ Activation Globale des Commandes Discord</span>
            <p class="form-help">Si désactivé, le bot refusera l'exécution de toutes les commandes pour les membres non-administrateurs.</p>
          </div>
          <label class="switch">
            <input v-model="commandsConfig.enabled" type="checkbox" @change="saveCommandsConfig" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- Liste des Commandes -->
      <div class="module-history-header">
        <h3>Commandes Enregistrées ({{ commands.length }})</h3>
        <button class="action-btn" @click="loadCommands">
          🔄 Rafraîchir
        </button>
      </div>

      <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>

      <div v-else class="module-table-wrapper">
        <table class="module-table">
          <thead>
            <tr>
              <th>Commande</th>
              <th>Description</th>
              <th>Type</th>
              <th>Accès / Restriction</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cmd in commands" :key="cmd.name">
              <td>
                <span style="font-family: var(--font-code); font-weight: 700; color: #85c1e9; font-size: 14px;">
                  /{{ cmd.name }}
                </span>
              </td>
              <td>
                <span style="color: var(--text-normal); font-size: 13px;">
                  {{ cmd.description }}
                </span>
              </td>
              <td>
                <span class="live-status-pill" style="font-size: 10px; background-color: rgba(88, 101, 242, 0.15); color: #c9cdfb;">
                  {{ cmd.type }}
                </span>
              </td>
              <td>
                <span v-if="cmd.adminOnly" class="module-status-pill failed">
                  🛡️ Admin Uniquement
                </span>
                <span v-else-if="cmd.allowedChannels && cmd.allowedChannels.length > 0" class="module-status-pill pending">
                  Salon Restreint ({{ cmd.allowedChannels.length }})
                </span>
                <span v-else class="module-status-pill verified">
                  ✅ Tous les membres
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const commands = ref<any[]>([]);
const commandsConfig = ref<any>({ enabled: true, permissions: {} });
const isLoading = ref(true);

onMounted(() => {
  loadCommands();
});

async function loadCommands() {
  isLoading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/commands');
    if (res.success && res.data) {
      commands.value = res.data.commands || [];
      commandsConfig.value = res.data.config || { enabled: true, permissions: {} };
    }
  } catch (err: any) {
    console.error('Erreur chargement commandes:', err);
  } finally {
    isLoading.value = false;
  }
}

async function saveCommandsConfig() {
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/config', {
      method: 'POST',
      body: JSON.stringify({
        module: 'commands',
        config: commandsConfig.value
      })
    });
    if (res.success) {
      showToast('Permissions des commandes enregistrées !', 'success');
    }
  } catch (err: any) {
    showToast(`Erreur d'enregistrement: ${err.message}`, 'error');
  }
}
</script>
