<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div v-if="error" class="config-card" style="color: var(--red);">❌ {{ error }}</div>

    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between;">
        <span>📋 File d'attente (status: {{ statusFilter }}, {{ list.length }})</span>
        <div style="display: flex; gap: 6px;">
          <select v-model="statusFilter" class="discord-input" style="min-width: 120px;" @change="load">
            <option value="open">En attente</option>
            <option value="resolved">Résolus</option>
            <option value="dismissed">Rejetés</option>
          </select>
          <button class="module-btn" @click="load" :disabled="loading">{{ loading ? '⏳' : '🔄' }}</button>
        </div>
      </div>

      <div v-if="loading && list.length === 0" style="color: var(--text-muted); padding: 16px; text-align: center;">
        Chargement…
      </div>

      <div v-else-if="list.length === 0" style="color: var(--text-muted); padding: 16px; text-align: center;">
        Aucun report dans cette catégorie. 🌱
      </div>

      <div v-else>
        <div v-for="r in list" :key="r.id" class="report-row">
          <div class="report-row__icon">🚩</div>
          <div class="report-row__body">
            <div class="report-row__head">
              <code>{{ r.id.slice(0, 8) }}</code>
              <span class="status-pill" :class="`status-${r.status}`">{{ statusLabel(r.status) }}</span>
              <span class="report-row__cat" v-if="r.category && r.category !== 'other'">{{ r.category }}</span>
            </div>
            <div class="report-row__text">{{ r.reason || '(raison vide)' }}</div>
            <div class="report-row__meta">
              <span><strong>de</strong> <code>{{ r.reporterId.slice(0, 14) }}…</code></span>
              <span><strong>vers</strong> <code>{{ r.reportedId.slice(0, 14) }}…</code></span>
              <span v-if="r.messageId">
                <a :href="`https://discord.com/channels/${r.guildId}/${r.channelId || '@me'}/${r.messageId}`" target="_blank">
                  🔗 msg
                </a>
              </span>
              <span>{{ formatTime(r.createdAt) }}</span>
            </div>
            <div v-if="r.resolvedBy" class="report-row__resolved">
              résolu par <code>{{ r.resolvedBy.slice(0, 14) }}…</code> · {{ formatTime(r.resolvedAt) }}
            </div>
          </div>
          <div class="report-row__actions" v-if="r.status === 'open'">
            <button class="module-btn module-btn-sm" @click="resolveOne(r, 'warn')" style="background: rgba(254, 202, 87, 0.2); color: #feca57;">
              ⚠️ warn
            </button>
            <button class="module-btn module-btn-sm" @click="resolveOne(r, 'kick')" style="background: rgba(237, 66, 69, 0.2); color: #ed4245;">
              ⛔ kick
            </button>
            <button class="module-btn module-btn-sm" @click="dismissOne(r)" style="background: rgba(128, 132, 142, 0.2); color: #80848e;">
              🚯 rejeter
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useReports, type Report } from '~/composables/useReports';

const api = useReports();
const list = ref<Report[]>([]);
const statusFilter = ref<'open' | 'resolved' | 'dismissed'>('open');
const loading = ref(false);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const r = await api.list({ status: statusFilter.value, limit: 50 });
    list.value = r.data;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function resolveOne(r: Report, action: string) {
  if (!confirm(`Marquer ce report comme résolu (action : ${action}) ?`)) return;
  try {
    await api.resolve(r.id, 'staff:dashboard', action);
    await load();
  } catch (e: any) {
    error.value = e.message;
  }
}

async function dismissOne(r: Report) {
  if (!confirm('Rejeter ce signalement ?')) return;
  try {
    await api.dismiss(r.id, 'staff:dashboard');
    await load();
  } catch (e: any) {
    error.value = e.message;
  }
}

function statusLabel(s: string) {
  return { open: 'En attente', resolved: 'Résolu', dismissed: 'Rejeté' }[s] || s;
}

function formatTime(ts: number | null) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('fr-FR');
}

onMounted(load);
</script>

<style scoped>
.config-card {
  background: var(--background-modifier-hover);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
  color: var(--text-normal);
}

.report-row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 12px;
  align-items: start;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.report-row:last-child { border-bottom: none; }
.report-row__icon {
  font-size: 22px;
  text-align: center;
  width: 40px;
  height: 40px;
  line-height: 40px;
  background: rgba(237, 66, 69, 0.1);
  border-radius: 8px;
}
.report-row__head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}
.report-row__head code { font-family: 'JetBrains Mono', monospace; }
.report-row__cat {
  background: var(--background-secondary);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  text-transform: uppercase;
}
.report-row__text {
  font-size: 14px;
  margin: 4px 0;
  white-space: pre-wrap;
}
.report-row__meta {
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.report-row__meta code { font-family: 'JetBrains Mono', monospace; }
.report-row__meta a { color: var(--brand-experiment, #5865f2); text-decoration: none; }
.report-row__resolved {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
  font-style: italic;
}
.report-row__actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-pill {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}
.status-pill.status-open { background: rgba(254, 202, 87, 0.2); color: #feca57; }
.status-pill.status-resolved { background: rgba(87, 242, 135, 0.2); color: #57f287; }
.status-pill.status-dismissed { background: rgba(128, 132, 142, 0.2); color: #80848e; }

.module-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 6px;
  background: var(--background-modifier-hover);
  color: var(--text-normal);
  font-size: 13px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  font-family: inherit;
}
.module-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.module-btn-sm { padding: 4px 8px; font-size: 12px; }
</style>
