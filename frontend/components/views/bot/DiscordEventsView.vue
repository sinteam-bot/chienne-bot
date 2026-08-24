<template>
  <div class="view-panel">
    <div class="daily-scroller">
      <!-- Bannière de Statut des Événements -->
      <div class="daily-stats-banner">
        <div class="daily-stat-card">
          <div class="daily-stat-icon">📡</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Total Événements Archivés</span>
            <span class="daily-stat-value">{{ totalCount }}</span>
            <span class="daily-stat-sub">Enregistrés en SQLite</span>
          </div>
        </div>

        <div class="daily-stat-card">
          <div class="daily-stat-icon">⚡</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Suivi en Direct</span>
            <span class="daily-stat-value" style="color: var(--green);">50+ Événements</span>
            <span class="daily-stat-sub">Gateway Discord.js v14</span>
          </div>
        </div>

        <div class="daily-stat-card">
          <div class="daily-stat-icon">🔄</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Auto-Actualisation</span>
            <span class="daily-stat-value" style="color: #85c1e9;">Toutes les 5s</span>
            <span class="daily-stat-sub">Synchronisation continue</span>
          </div>
        </div>
      </div>

      <!-- Barre d'outils et filtres par catégorie -->
      <div class="captcha-toolbar" style="flex-wrap: wrap; gap: 8px;">
        <div class="captcha-filter-chips" style="flex-wrap: wrap;">
          <button
            v-for="f in filterCategories"
            :key="f.id"
            :class="['filter-chip', { active: selectedCategory === f.id }]"
            @click="selectedCategory = f.id; page = 0; loadEvents()"
          >
            {{ f.label }}
          </button>
        </div>

        <div class="search-input-wrapper" style="max-width: 240px; margin-left: auto;">
          <input
            v-model="searchQuery"
            type="text"
            class="discord-input"
            placeholder="Rechercher un événement..."
            @input="debounceSearch"
          />
        </div>

        <button class="action-btn" @click="loadEvents">
          🔄 Rafraîchir
        </button>
      </div>

      <!-- Tableau des événements Discord -->
      <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>

      <div v-else-if="events.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
        Aucun événement Discord enregistré pour le moment.
      </div>

      <div v-else class="captcha-table-wrapper">
        <table class="captcha-table">
          <thead>
            <tr>
              <th>Type d'Événement</th>
              <th>Résumé de l'Événement</th>
              <th>Auteur / Cible</th>
              <th>Date & Heure</th>
              <th>Payload</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ev in events" :key="ev.id">
              <td>
                <span :class="['captcha-status-pill', getEventBadgeClass(ev.event_name)]" style="font-family: var(--font-code);">
                  {{ ev.event_name }}
                </span>
              </td>
              <td>
                <span style="font-weight: 500; color: var(--header-primary);">
                  {{ ev.summary }}
                </span>
              </td>
              <td>
                <div style="display: flex; flex-direction: column;">
                  <span v-if="ev.username" style="color: var(--text-normal);">@{{ ev.username }}</span>
                  <span v-if="ev.target_id" style="font-size: 11px; color: var(--text-muted); font-family: var(--font-code);">
                    ID: {{ ev.target_id }}
                  </span>
                </div>
              </td>
              <td style="font-size: 12px; color: var(--text-muted); white-space: nowrap;">
                {{ formatDateTime(ev.created_at) }}
              </td>
              <td>
                <button
                  v-if="ev.data"
                  class="btn-user-inspect"
                  style="padding: 3px 8px; font-size: 11px;"
                  @click="inspectPayload = ev"
                >
                  JSON
                </button>
                <span v-else style="color: var(--text-muted); font-size: 11px;">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modale d'inspection du JSON de l'événement -->
    <div v-if="inspectPayload" class="modal-backdrop" @click="inspectPayload = null">
      <div class="user-modal-card" style="max-width: 650px;" @click.stop>
        <div class="user-modal-header" style="background-color: var(--bg-tertiary); padding: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="captcha-status-pill" :class="getEventBadgeClass(inspectPayload.event_name)">
              {{ inspectPayload.event_name }}
            </span>
            <h3 style="font-size: 16px; font-weight: 600; color: var(--header-primary);">Payload de l'Événement</h3>
          </div>
          <button class="modal-close-btn" @click="inspectPayload = null">✕</button>
        </div>

        <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px; max-height: 70vh; overflow-y: auto;">
          <div>
            <strong>Résumé :</strong>
            <p style="color: var(--text-normal); margin-top: 4px;">{{ inspectPayload.summary }}</p>
          </div>

          <div>
            <strong>Données Brutes (JSON) :</strong>
            <pre class="generation-step-content" style="max-height: 350px; overflow-y: auto; margin-top: 6px;">{{ JSON.stringify(inspectPayload.data, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiscordApi } from '~/composables/useDiscordApi';

const { apiFetch } = useDiscordApi();

const events = ref<any[]>([]);
const totalCount = ref(0);
const selectedCategory = ref('ALL');
const searchQuery = ref('');
const isLoading = ref(true);
const page = ref(0);
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
  pollTimer = setInterval(loadEventsSilent, 5000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadEvents();
  }, 300);
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
    let eventNameParam = '';
    if (selectedCategory.value !== 'ALL') {
      if (selectedCategory.value === 'channel') eventNameParam = '&eventName=channelCreate';
      else if (selectedCategory.value === 'role') eventNameParam = '&eventName=roleCreate';
      else if (selectedCategory.value === 'message') eventNameParam = '&eventName=messageDelete';
      else if (selectedCategory.value === 'guildMember') eventNameParam = '&eventName=guildMemberRemove';
    }

    const searchParam = searchQuery.value ? `&search=${encodeURIComponent(searchQuery.value)}` : '';
    const res = await apiFetch<{ success: boolean; data?: { total: number; events: any[] } }>(
      `/api/events/archive?limit=100&offset=${page.value * 100}${eventNameParam}${searchParam}`
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
