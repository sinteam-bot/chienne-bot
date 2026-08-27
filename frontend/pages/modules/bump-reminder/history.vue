<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>📜</span>
          <span>Historique des Bumps Enregistrés</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button
            v-if="hasTestRecords"
            class="module-btn"
            style="background: rgba(237, 66, 69, 0.15); color: var(--red); border: 1px solid rgba(237, 66, 69, 0.3); font-size: 12px; padding: 5px 12px; cursor: pointer;"
            title="Supprimer définitivement les bumps générés lors des tests unitaires"
            :disabled="cleaningTests"
            @click="handleCleanupTests"
          >
            🗑️ Nettoyer les tests BDD ({{ testCount }})
          </button>
          <button
            class="module-btn"
            style="font-size: 12px; padding: 5px 10px; cursor: pointer;"
            title="Rafraîchir l'historique"
            @click="loadBumpStatus"
          >
            🔄
          </button>
        </div>
      </div>

      <!-- Barre de filtres unifiée -->
      <div class="module-toolbar" style="margin-bottom: 14px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between;">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="🔍 Filtrer par membre, ID, salon..."
          class="discord-input"
          style="min-width: 240px; flex: 1; max-width: 360px;"
        />
        <div class="module-filter-group" style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
          <button
            class="module-filter-btn"
            :class="{ active: statusFilter === 'all' }"
            @click="statusFilter = 'all'"
          >
            Tous ({{ (bumpStatus.history || []).length }})
          </button>
          <button
            class="module-filter-btn"
            :class="{ active: statusFilter === 'sent' }"
            @click="statusFilter = 'sent'"
          >
            🟢 Envoyés ({{ sentCount }})
          </button>
          <button
            class="module-filter-btn"
            :class="{ active: statusFilter === 'pending' }"
            @click="statusFilter = 'pending'"
          >
            ⏳ En attente ({{ pendingCount }})
          </button>
          <button
            class="module-filter-btn"
            :class="{ active: hideTests }"
            style="margin-left: 4px;"
            @click="hideTests = !hideTests"
            title="Masquer ou afficher les entrées issues des tests unitaires"
          >
            🧪 {{ hideTests ? 'Tests masqués' : 'Afficher les tests' }}
          </button>
        </div>
      </div>

      <div v-if="filteredHistory.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
        {{ (bumpStatus.history || []).length === 0 ? 'Aucun bump enregistré pour l\'instant dans la base de données.' : 'Aucun bump ne correspond aux filtres sélectionnés.' }}
      </div>

      <div v-else class="module-table-wrapper">
        <table class="module-table">
          <thead>
            <tr>
              <th style="width: 8%;">ID</th>
              <th style="width: 28%;">Membre (Bumper)</th>
              <th style="width: 22%;">Salon</th>
              <th style="width: 20%;">Date du Bump</th>
              <th style="width: 14%;">Statut Rappel</th>
              <th style="width: 8%; text-align: center;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedHistory" :key="item.id">
              <td style="font-family: var(--font-code); color: var(--text-muted);">#{{ item.id }}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <DiscordUser
                    :user-id="item.bumper_id"
                    :username="item.bumper_username || item.username"
                    :show-id="true"
                    :avatar-size="28"
                  />
                  <span v-if="isTestRow(item)" class="badge-variable" style="background: rgba(240, 71, 71, 0.15); color: var(--red); border-color: rgba(240, 71, 71, 0.3); font-size: 10px; padding: 1px 5px;">TEST</span>
                </div>
              </td>
              <td>
                <DiscordChannel :channel-id="item.channel_id" />
              </td>
              <td style="font-size: 13px; color: var(--text-normal);">
                <DiscordTime :value="item.bumped_at || item.bumpedAt" mode="both" />
              </td>
              <td>
                <span v-if="item.reminder_sent === 1 || item.reminderSent === 1" class="module-status-pill verified">
                  🟢 Rappel Envoyé
                </span>
                <span v-else class="module-status-pill pending">
                  ⏳ En Attente
                </span>
              </td>
              <td style="text-align: center;">
                <button
                  class="action-btn-icon"
                  title="Supprimer cette entrée"
                  style="background: transparent; border: none; cursor: pointer; opacity: 0.7; font-size: 14px;"
                  @click="handleDeleteSingleBump(item.id)"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Discord -->
      <DiscordPagination
        v-model="currentPage"
        v-model:page-size="pageSize"
        :total-items="filteredHistory.length"
        :page-size-options="[10, 15, 25, 50, 100]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject, type Ref } from 'vue';
import { useAppState } from '~/composables/useAppState.ts';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import DiscordTime from '~/components/common/DiscordTime.vue';
import DiscordPagination from '~/components/common/DiscordPagination.vue';
import DiscordUser from '~/components/common/DiscordUser.vue';
import DiscordChannel from '~/components/common/DiscordChannel.vue';

const { discordChannels } = useAppState();
const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const bumpStatus = inject<Ref<any>>('bumpStatus', ref({}));
const loadBumpStatus = inject<() => Promise<void>>('loadBumpStatus', async () => {});

const searchQuery = ref('');
const statusFilter = ref<'all' | 'sent' | 'pending'>('all');
const hideTests = ref(true);
const cleaningTests = ref(false);

function isTestRow(item: any) {
  const u = (item.bumper_username || item.username || '').toLowerCase();
  const id = (item.bumper_id || item.userId || '').toLowerCase();
  const ch = (item.channel_id || item.channelId || '').toLowerCase();
  const g = (item.guild_id || item.guildId || '').toLowerCase();
  return (
    u === 'superbumper' ||
    u === 'bumperman' ||
    u === 'testuser' ||
    id.startsWith('user_bumper') ||
    ch === 'test_channel_bump' ||
    g === 'test_guild_bump'
  );
}

const testCount = computed(() => {
  return (bumpStatus.value.history || []).filter(isTestRow).length;
});

const hasTestRecords = computed(() => testCount.value > 0);

const sentCount = computed(() => {
  return (bumpStatus.value.history || []).filter((item: any) => item.reminder_sent === 1 || item.reminderSent === 1).length;
});

const pendingCount = computed(() => {
  return (bumpStatus.value.history || []).filter((item: any) => item.reminder_sent !== 1 && item.reminderSent !== 1).length;
});

const filteredHistory = computed(() => {
  let list = bumpStatus.value.history || [];

  if (hideTests.value) {
    list = list.filter((item: any) => !isTestRow(item));
  }

  if (statusFilter.value === 'sent') {
    list = list.filter((item: any) => item.reminder_sent === 1 || item.reminderSent === 1);
  } else if (statusFilter.value === 'pending') {
    list = list.filter((item: any) => item.reminder_sent !== 1 && item.reminderSent !== 1);
  }

  const query = searchQuery.value.trim().toLowerCase();
  if (query) {
    list = list.filter((item: any) => {
      const username = (item.bumper_username || item.username || '').toLowerCase();
      const userId = (item.bumper_id || item.userId || '').toLowerCase();
      const chName = resolveChannelName(item.channel_id || item.channelId).toLowerCase();
      const id = String(item.id);
      return username.includes(query) || userId.includes(query) || chName.includes(query) || id.includes(query);
    });
  }

  return list;
});

const currentPage = ref(1);
const pageSize = ref(15);

const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredHistory.value.slice(start, start + pageSize.value);
});

watch([searchQuery, statusFilter, hideTests], () => {
  currentPage.value = 1;
});

function resolveChannelName(channelId: string) {
  if (!channelId) return 'inconnu';
  const found = discordChannels.value.find(c => c.id === channelId);
  return found ? found.name : channelId;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

async function handleCleanupTests() {
  if (!confirm('Êtes-vous sûr de vouloir nettoyer toutes les entrées de tests (SuperBumper, mocks...) de la base de données ?')) {
    return;
  }
  cleaningTests.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/bump/cleanup-tests', {
      method: 'POST'
    });
    if (res.success) {
      showToast(res.message || 'Données de test nettoyées avec succès !', 'success');
      await loadBumpStatus();
    } else {
      showToast('Erreur lors du nettoyage', 'error');
    }
  } catch (err: any) {
    showToast('Erreur: ' + err.message, 'error');
  } finally {
    cleaningTests.value = false;
  }
}

async function handleDeleteSingleBump(id: number) {
  if (!confirm(`Supprimer l'entrée de bump #${id} ?`)) return;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/bump/delete-log', {
      method: 'POST',
      body: { id }
    });
    if (res.success) {
      showToast(res.message || `Bump #${id} supprimé`, 'success');
      await loadBumpStatus();
    } else {
      showToast('Erreur lors de la suppression', 'error');
    }
  } catch (err: any) {
    showToast('Erreur: ' + err.message, 'error');
  }
}
</script>
