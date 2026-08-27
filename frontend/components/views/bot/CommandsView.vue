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
        <div>
          <h3>Commandes Enregistrées ({{ filteredCommands.length }})</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
            Commandes automatiques issues des modules et commandes legacy synchronisées sur Discord.
          </p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="🔍 Filtrer par nom ou module..."
            class="config-input"
            style="width: 220px; font-size: 12px; padding: 6px 10px;"
          />
          <button class="action-btn" :disabled="isSyncing" @click="syncCommandsWithDiscord">
            <span v-if="isSyncing">⏳ Sync...</span>
            <span v-else>🚀 Sync Discord</span>
          </button>
          <button class="action-btn" @click="loadCommands">
            🔄 Rafraîchir
          </button>
        </div>
      </div>

      <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>

      <div v-else class="module-table-wrapper">
        <table class="module-table">
          <thead>
            <tr>
              <th>Commande</th>
              <th>Module / Origine</th>
              <th>Description</th>
              <th>Type</th>
              <th>Accès / Restriction</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cmd in filteredCommands" :key="cmd.name">
              <td>
                <span style="font-family: var(--font-code); font-weight: 700; color: #85c1e9; font-size: 14px;">
                  /{{ cmd.name }}
                </span>
              </td>
              <td>
                <span class="live-status-pill" style="font-size: 11px; background-color: rgba(52, 152, 219, 0.15); color: #85c1e9;">
                  📦 {{ cmd.module || 'Système' }}
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
const isSyncing = ref(false);
const searchQuery = ref('');

const filteredCommands = computed(() => {
  if (!searchQuery.value.trim()) return commands.value;
  const q = searchQuery.value.toLowerCase().trim();
  return commands.value.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.module?.toLowerCase().includes(q) ||
    c.description?.toLowerCase().includes(q)
  );
});

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

async function syncCommandsWithDiscord() {
  isSyncing.value = true;
  try {
    const res = await apiFetch<{ success: boolean; count?: number; error?: string }>('/api/commands/sync', {
      method: 'POST'
    });
    if (res.success) {
      showToast(`✨ ${res.count || 0} Slash Command(s) synchronisées avec succès sur Discord !`, 'success');
      await loadCommands();
    } else {
      showToast(`Erreur synchronisation : ${res.error || 'Erreur inconnue'}`, 'error');
    }
  } catch (err: any) {
    showToast(`Erreur lors de la synchronisation : ${err.message}`, 'error');
  } finally {
    isSyncing.value = false;
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
