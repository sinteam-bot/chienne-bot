<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <!-- Bannière de Statut des Événements -->
      <div class="module-stats-banner">
        <div class="module-stat-card">
          <div class="module-stat-icon">📡</div>
          <div class="module-stat-info">
            <span class="module-stat-label">Événements Archivés</span>
            <span class="module-stat-value">{{ totalCount }}</span>
            <span class="module-stat-sub">Base de données PostgreSQL</span>
          </div>
        </div>

        <div class="module-stat-card">
          <div class="module-stat-icon">⚡</div>
          <div class="module-stat-info">
            <span class="module-stat-label">Suivi en Direct</span>
            <span class="module-stat-value" style="color: var(--green);">50+ Événements</span>
            <span class="module-stat-sub">Gateway Discord.js v14</span>
          </div>
        </div>

        <div class="module-stat-card">
          <div class="module-stat-icon">🔄</div>
          <div class="module-stat-info">
            <span class="module-stat-label">Auto-Actualisation</span>
            <span class="module-stat-value" style="color: #85c1e9;">Toutes les 5s</span>
            <span class="module-stat-sub">Synchronisation temps réel</span>
          </div>
        </div>
      </div>

      <!-- Barre d'outils et filtres par catégorie -->
      <div class="module-toolbar">
        <div class="module-filter-chips">
          <button
            v-for="f in filterCategories"
            :key="f.id"
            :class="['filter-chip', { active: selectedCategory === f.id }]"
            @click="selectedCategory = f.id; page = 0; loadEvents()"
          >
            {{ f.label }}
          </button>
        </div>

        <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0; margin-left: auto;">
          <div class="search-input-wrapper" style="width: 260px;">
            <input
              v-model="searchQuery"
              type="text"
              class="discord-input"
              placeholder="Rechercher un événement..."
              @input="debounceSearch"
            />
          </div>

          <button class="action-btn" :disabled="isLoading" @click="loadEvents">
            🔄 Rafraîchir
          </button>
        </div>
      </div>

      <!-- Tableau des événements Discord -->
      <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>

      <div v-else-if="events.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
        Aucun événement Discord enregistré pour le moment.
      </div>

      <div v-else class="module-table-wrapper">
        <table class="module-table">
          <thead>
            <tr>
              <th style="width: 200px;">Type d'Événement</th>
              <th>Résumé de l'Événement</th>
              <th style="width: 180px;">Auteur / Cible</th>
              <th style="width: 170px;">Date & Heure</th>
              <th style="width: 90px; text-align: center;">Payload</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ev in events" :key="ev.id">
              <td>
                <span :class="['module-status-pill', getEventBadgeClass(ev.event_name)]" style="font-family: var(--font-code);">
                  {{ ev.event_name }}
                </span>
              </td>
              <td>
                <span style="font-weight: 500; color: var(--header-primary);">
                  {{ ev.summary }}
                </span>
              </td>
              <td>
                <div v-if="ev.target_id || ev.username">
                  <DiscordUser
                    v-if="isUserEvent(ev)"
                    :user-id="ev.target_id"
                    :username="ev.username"
                    :show-id="true"
                    :avatar-size="24"
                  />
                  <DiscordChannel
                    v-else-if="isChannelEvent(ev)"
                    :channel-id="ev.target_id"
                    :name="ev.username"
                  />
                  <DiscordRole
                    v-else-if="isRoleEvent(ev)"
                    :role-id="ev.target_id"
                    :name="ev.username"
                  />
                  <div v-else style="display: flex; flex-direction: column;">
                    <span v-if="ev.username" style="color: var(--text-normal); font-weight: 600;">{{ ev.username }}</span>
                    <span v-if="ev.target_id" style="font-size: 11px; color: var(--text-muted); font-family: var(--font-code);">
                      ID: {{ ev.target_id }}
                    </span>
                  </div>
                </div>
                <span v-else style="color: var(--text-muted); font-size: 12px;">—</span>
              </td>
              <td style="font-size: 12px; color: var(--text-normal); white-space: nowrap;">
                <DiscordTime :value="ev.created_at" mode="both" />
              </td>
              <td style="text-align: center;">
                <button
                  v-if="ev.data"
                  class="action-btn"
                  style="padding: 4px 10px; font-size: 11px; font-weight: 600;"
                  @click="inspectPayload = ev"
                >
                  🔍 JSON
                </button>
                <span v-else style="color: var(--text-muted); font-size: 11px;">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Discord -->
      <DiscordPagination
        v-model="currentPage"
        v-model:page-size="pageSize"
        :total-items="totalCount"
        :page-size-options="[15, 25, 50, 100]"
        @change="onPaginationChange"
      />
    </div>

    <!-- Modale d'inspection du JSON de l'événement -->
    <div v-if="inspectPayload" class="modal-backdrop" @click="inspectPayload = null">
      <div class="user-modal-card" style="max-width: 650px;" @click.stop>
        <div class="user-modal-header" style="background-color: var(--bg-tertiary); padding: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="module-status-pill" :class="getEventBadgeClass(inspectPayload.event_name)">
              {{ inspectPayload.event_name }}
            </span>
            <h3 style="font-size: 16px; font-weight: 600; color: var(--header-primary);">Payload de l'Événement</h3>
          </div>
          <button class="modal-close-btn" @click="inspectPayload = null">✕</button>
        </div>

        <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px; max-height: 70vh; overflow-y: auto;">
          <div>
            <strong style="color: var(--header-primary);">Résumé :</strong>
            <p style="color: var(--text-normal); margin-top: 4px;">{{ inspectPayload.summary }}</p>
          </div>

          <div>
            <strong style="color: var(--header-primary);">Données Brutes (JSON) :</strong>
            <pre class="generation-step-content" style="max-height: 350px; overflow-y: auto; margin-top: 6px;">{{ JSON.stringify(inspectPayload.data, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import DiscordTime from '~/components/common/DiscordTime.vue';
import DiscordPagination from '~/components/common/DiscordPagination.vue';
import DiscordUser from '~/components/common/DiscordUser.vue';
import DiscordChannel from '~/components/common/DiscordChannel.vue';
import DiscordRole from '~/components/common/DiscordRole.vue';

const { apiFetch } = useDiscordApi();

function isUserEvent(ev: any) {
  const name = ev.event_name || '';
  return name.includes('MEMBER') || name.includes('USER') || name.includes('PRESENCE') || name.includes('VOICE') || name.includes('MESSAGE') || name.includes('BUMP');
}

function isChannelEvent(ev: any) {
  const name = ev.event_name || '';
  return name.includes('CHANNEL') || name.includes('THREAD');
}

function isRoleEvent(ev: any) {
  const name = ev.event_name || '';
  return name.includes('ROLE');
}

const events = ref<any[]>([]);
const totalCount = ref(0);
const selectedCategory = ref('ALL');
const searchQuery = ref('');
const isLoading = ref(true);
const currentPage = ref(1);
const pageSize = ref(25);
const inspectPayload = ref<any>(null);

let pollTimer: any = null;
let searchTimeout: any = null;

const filterCategories = [
  { id: 'ALL', label: 'Tous' },
  { id: 'channel', label: '📁 Salons' },
  { id: 'role', label: '🛡️ Rôles' },
  { id: 'message', label: '💬 Messages' },
  { id: 'guildMember', label: '👥 Membres' },
  { id: 'mod', label: '🚨 Modération / Bans' },
  { id: 'emoji', label: '✨ Emojis & Stickers' },
  { id: 'thread', label: '🧵 Threads' }
];

onMounted(() => {
  loadEvents();
  pollTimer = setInterval(loadEventsSilent, 8000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadEvents();
  }, 300);
}

function onPaginationChange() {
  loadEvents();
}

async function loadEvents() {
  isLoading.value = true;
  await fetchEventsData();
  isLoading.value = false;
}

async function loadEventsSilent() {
  await fetchEventsData();
}

async function fetchEventsData() {
  try {
    let categoryParam = '';
    if (selectedCategory.value !== 'ALL') {
      categoryParam = `&category=${encodeURIComponent(selectedCategory.value)}`;
    }

    const searchParam = searchQuery.value ? `&search=${encodeURIComponent(searchQuery.value)}` : '';
    const offset = (currentPage.value - 1) * pageSize.value;
    const res = await apiFetch<{ success: boolean; data?: { total: number; events: any[] } }>(
      `/api/events/archive?limit=${pageSize.value}&offset=${offset}${categoryParam}${searchParam}`
    );

    if (res.success && res.data) {
      events.value = res.data.events || [];
      totalCount.value = res.data.total || 0;
    }
  } catch (err) {
    console.error('Erreur chargement events archive:', err);
  }
}

function getEventBadgeClass(name: string): string {
  if (!name) return 'pending';
  if (name.includes('Delete') || name.includes('Remove') || name.includes('Ban')) return 'failed';
  if (name.includes('Create') || name.includes('Add')) return 'verified';
  return 'pending';
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
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
</script>
