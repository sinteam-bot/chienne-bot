<template>
  <div class="logs-page">
    <header class="logs-page__header">
      <div>
        <h1>📜 Logs &amp; Statistiques</h1>
        <p>Surveillance en temps réel des événements du serveur.</p>
      </div>
      <div class="logs-page__actions">
        <span class="ws-status" :class="{ 'is-connected': wsConnected }">
          <span class="ws-status__dot"></span>
          {{ wsConnected ? 'Live' : 'Hors ligne' }}
        </span>
        <select v-model="typeFilter" class="logs-page__filter" @change="load">
          <option value="">Tous types</option>
          <option v-for="t in types" :key="t.event_type" :value="t.event_type">
            {{ t.event_type }} ({{ t.count }})
          </option>
        </select>
        <button class="btn-refresh" :disabled="loading" @click="load">
          {{ loading ? '⏳' : '🔄' }} Rafraîchir
        </button>
      </div>
    </header>

    <div v-if="overview" class="logs-page__kpis">
      <div class="kpi">
        <div class="kpi__value">{{ overview.members }}</div>
        <div class="kpi__label">Membres</div>
      </div>
      <div class="kpi">
        <div class="kpi__value">{{ overview.messages_24h }}</div>
        <div class="kpi__label">Messages (24h)</div>
      </div>
      <div class="kpi">
        <div class="kpi__value">{{ overview.warnings_24h }}</div>
        <div class="kpi__label">Avertissements (24h)</div>
      </div>
      <div class="kpi">
        <div class="kpi__value">{{ overview.active_users_7d }}</div>
        <div class="kpi__label">Actifs (7j)</div>
      </div>
      <div class="kpi">
        <div class="kpi__value">{{ overview.tickets_open }}</div>
        <div class="kpi__label">Tickets ouverts</div>
      </div>
    </div>

    <div v-if="error" class="logs-page__error">❌ {{ error }}</div>

    <div v-if="loading && logs.length === 0" class="logs-page__loading">
      Chargement…
    </div>

    <div v-else-if="logs.length === 0" class="logs-page__empty">
      Aucun log pour ce filtre.
    </div>

    <div v-else class="logs-page__list">
      <div v-for="log in logs" :key="log.id" class="log-row" :class="eventClass(log.event_type)">
        <div class="log-row__icon">{{ eventIcon(log.event_type) }}</div>
        <div class="log-row__body">
          <div class="log-row__head">
            <span class="log-row__type">{{ log.event_type }}</span>
            <span class="log-row__time">{{ formatTime(log.created_at) }}</span>
          </div>
          <div class="log-row__summary">{{ log.summary || '(sans description)' }}</div>
          <div class="log-row__meta">
            <span v-if="log.target_id">👤 <code>{{ log.target_id.slice(0, 14) }}…</code></span>
            <span v-if="log.channel_id"># <code>{{ log.channel_id.slice(0, 14) }}…</code></span>
            <span v-if="log.actor_id">par <code>{{ log.actor_id.slice(0, 14) }}…</code></span>
          </div>
        </div>
      </div>
    </div>

    <footer v-if="total > 0" class="logs-page__pagination">
      <button :disabled="page <= 1 || loading" @click="prev">◀</button>
      <span>Page {{ page }} / {{ pages }} — {{ total }} entrée(s)</span>
      <button :disabled="page >= pages || loading" @click="next">▶</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useLogs, type LogEntry } from '~/composables/useLogs';
import { useAuth } from '~/composables/useAuth';

const logsApi = useLogs();
const { getApiKey } = useAuth();
const logs = ref<LogEntry[]>([]);
const types = ref<{ event_type: string; count: number }[]>([]);
const overview = ref<any>(null);
const total = ref(0);
const limit = 50;
const page = ref(1);
const typeFilter = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const wsConnected = ref(false);
let ws: WebSocket | null = null;

const pages = computed(() => Math.max(1, Math.ceil(total.value / limit)));

const ICONS = {
  message_delete: '🗑️', message_edit: '✏️', message_bulk_delete: '🗑️',
  member_join: '➕', member_leave: '➖', member_update: '🔄',
  member_ban_add: '🔨', member_ban_remove: '🔓',
  role_create: '➕', role_update: '✏️', role_delete: '➖',
  channel_create: '➕', channel_update: '✏️', channel_delete: '➖',
  voice_state_update: '🔊', guild_update: '⚙️',
  emoji_create: '😀', emoji_delete: '🗑️'
};

function eventIcon(t: string): string {
  return (ICONS as any)[t] || '📋';
}

function eventClass(t: string): string {
  if (t.startsWith('message_')) return 'is-message';
  if (t.startsWith('member_')) return 'is-member';
  if (t.startsWith('role_')) return 'is-role';
  if (t.startsWith('channel_')) return 'is-channel';
  if (t.startsWith('voice_')) return 'is-voice';
  return 'is-other';
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = Date.now();
  const diff = (now - ts) / 1000;
  if (diff < 60) return `il y a ${Math.floor(diff)}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return d.toLocaleString('fr-FR');
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const data = await logsApi.list({
      event_type: typeFilter.value || undefined,
      page: page.value,
      limit
    });
    logs.value = data.logs;
    total.value = data.total;
  } catch (e: any) {
    error.value = e.message || 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}

async function loadOverview() {
  try {
    overview.value = await logsApi.getOverview();
  } catch {}
}

async function loadTypes() {
  try {
    types.value = await logsApi.getTypes();
  } catch {}
}

function prev() { if (page.value > 1) { page.value--; load(); } }
function next() { if (page.value < pages.value) { page.value++; load(); } }

function connectWs() {
  if (typeof window === 'undefined') return;
  const apiKey = getApiKey();
  if (!apiKey) return;
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const url = `${proto}://${window.location.host}/ws/logs?api_key=${encodeURIComponent(apiKey)}`;
  try {
    ws = new WebSocket(url);
    ws.onopen = () => { wsConnected.value = true; };
    ws.onclose = () => {
      wsConnected.value = false;
      setTimeout(connectWs, 5000);
    };
    ws.onerror = () => { wsConnected.value = false; };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'log' && msg.entry) {
          if (!typeFilter.value || msg.entry.event_type === typeFilter.value) {
            logs.value = [msg.entry, ...logs.value].slice(0, limit);
            total.value++;
          }
        }
      } catch {}
    };
  } catch (err) {
    console.error('WS connect failed:', err);
  }
}

onMounted(() => {
  load();
  loadOverview();
  loadTypes();
  connectWs();
});

onUnmounted(() => {
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
});
</script>

<style scoped>
.logs-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  color: #f2f3f5;
}

.logs-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.logs-page__header h1 { margin: 0; font-size: 28px; }
.logs-page__header p { margin: 4px 0 0; color: #b5bac1; font-size: 14px; }

.logs-page__actions { display: flex; gap: 8px; align-items: center; }

.logs-page__filter {
  background: #2b2d31;
  color: #f2f3f5;
  border: 1px solid #3f4147;
  padding: 8px 12px;
  border-radius: 6px;
}

.btn-refresh {
  background: #4e5058;
  color: #f2f3f5;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-refresh:hover:not(:disabled) { background: #5865f2; }

.ws-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #1e1f22;
  border: 1px solid #3f4147;
  border-radius: 12px;
  font-size: 12px;
  color: #80848e;
}

.ws-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #80848e;
}

.ws-status.is-connected { color: #57f287; border-color: #57f287; }
.ws-status.is-connected .ws-status__dot { background: #57f287; box-shadow: 0 0 6px #57f287; }

.logs-page__kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.kpi {
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.kpi__value {
  font-size: 28px;
  font-weight: 700;
  color: #fee75c;
}

.kpi__label {
  font-size: 12px;
  color: #80848e;
  margin-top: 4px;
  text-transform: uppercase;
}

.logs-page__error,
.logs-page__loading,
.logs-page__empty {
  background: #2b2d31;
  border: 1px solid #3f4147;
  padding: 24px;
  border-radius: 8px;
  text-align: center;
  color: #b5bac1;
  margin-bottom: 16px;
}

.logs-page__error { background: #ed4245; color: white; border-color: #ed4245; }

.logs-page__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.log-row {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 12px;
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-left: 3px solid #3f4147;
  border-radius: 6px;
  padding: 10px 14px;
  transition: border-color 0.15s;
}

.log-row:hover { border-color: #5865f2; }

.log-row.is-message { border-left-color: #5865f2; }
.log-row.is-member { border-left-color: #57f287; }
.log-row.is-role { border-left-color: #fee75c; }
.log-row.is-channel { border-left-color: #eb459e; }
.log-row.is-voice { border-left-color: #9b59b6; }
.log-row.is-other { border-left-color: #80848e; }

.log-row__icon { font-size: 20px; line-height: 1; }

.log-row__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.log-row__type {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #fee75c;
  background: #1e1f22;
  padding: 1px 8px;
  border-radius: 4px;
}

.log-row__time {
  font-size: 11px;
  color: #80848e;
}

.log-row__summary { color: #dcddde; font-size: 14px; }

.log-row__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 11px;
  color: #80848e;
  margin-top: 4px;
}

.log-row__meta code { font-family: 'JetBrains Mono', monospace; }

.logs-page__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.logs-page__pagination button {
  background: #4e5058;
  color: #f2f3f5;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.logs-page__pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
