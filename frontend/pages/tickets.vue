<template>
  <div class="tickets-page">
    <header class="tickets-page__header">
      <div>
        <h1>🎫 Tickets</h1>
        <p>Gestion des tickets de support.</p>
      </div>
      <div class="tickets-page__actions">
        <select v-model="statusFilter" class="tickets-page__filter" @change="load">
          <option value="">Tous statuts</option>
          <option value="open">Ouverts</option>
          <option value="claimed">Claim</option>
          <option value="closed">Fermés</option>
        </select>
        <button class="btn-refresh" :disabled="loading" @click="load">
          {{ loading ? '⏳' : '🔄' }} Rafraîchir
        </button>
      </div>
    </header>

    <div v-if="error" class="tickets-page__error">❌ {{ error }}</div>

    <div v-if="loading && tickets.length === 0" class="tickets-page__loading">
      Chargement des tickets…
    </div>

    <div v-else-if="tickets.length === 0" class="tickets-page__empty">
      Aucun ticket pour ce filtre.
    </div>

    <div v-else class="tickets-page__list">
      <div
        v-for="t in tickets"
        :key="t.id"
        class="ticket-row"
        :class="['status-' + t.status, { 'is-selected': selected?.id === t.id }]"
        @click="select(t)"
      >
        <div class="ticket-row__status">
          <span class="status-pill" :class="`status-pill-${t.status}`">{{ statusLabel(t.status) }}</span>
        </div>
        <div class="ticket-row__subject">
          <div class="ticket-row__title">{{ t.subject || '(sans sujet)' }}</div>
          <div class="ticket-row__meta">
            #{{ t.id.slice(0, 8) }} · {{ t.category }} · par <code>{{ t.user_id.slice(0, 10) }}…</code>
          </div>
        </div>
        <div class="ticket-row__claim">
          <span v-if="t.claimed_by">🙋 {{ t.claimed_by.slice(0, 10) }}…</span>
          <span v-else class="ticket-row__muted">non claim</span>
        </div>
        <div class="ticket-row__date">
          {{ formatDate(t.created_at) }}
        </div>
      </div>
    </div>

    <div v-if="selected" class="tickets-page__detail">
      <div class="tickets-page__detail-header">
        <h2>{{ selected.subject || '(sans sujet)' }}</h2>
        <span class="status-pill" :class="`status-pill-${selected.status}`">{{ statusLabel(selected.status) }}</span>
        <button v-if="selected.status !== 'closed'" class="btn-close" @click="doClose">🔒 Fermer</button>
      </div>
      <div class="tickets-page__detail-meta">
        <span>ID : <code>{{ selected.id }}</code></span>
        <span>Channel : <code>{{ selected.channel_id }}</code></span>
        <span>Ouvert par : <code>{{ selected.user_id }}</code></span>
        <span v-if="selected.claimed_by">Claim : <code>{{ selected.claimed_by }}</code></span>
      </div>
      <div class="tickets-page__messages">
        <h3>📜 Messages ({{ messages.length }})</h3>
        <div v-if="messages.length === 0" class="tickets-page__empty">Aucun message loggé.</div>
        <div
          v-for="m in messages.slice(-50)"
          :key="m.id"
          class="ticket-message"
          :class="{ 'is-staff': m.is_staff }"
        >
          <div class="ticket-message__head">
            <span class="ticket-message__author">{{ m.author_id }}</span>
            <span v-if="m.is_staff" class="ticket-message__badge">STAFF</span>
            <span class="ticket-message__time">{{ formatDate(m.created_at) }}</span>
          </div>
          <div class="ticket-message__content">{{ m.content || '(vide)' }}</div>
        </div>
      </div>
    </div>

    <footer v-if="total > 0" class="tickets-page__pagination">
      <button :disabled="page <= 1 || loading" @click="prev">◀</button>
      <span>Page {{ page }} / {{ pages }} — {{ total }} ticket(s)</span>
      <button :disabled="page >= pages || loading" @click="next">▶</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTickets, type Ticket, type TicketMessage } from '~/composables/useTickets';

definePageMeta({
  title: 'Tickets de Support',
  icon: '🎫',
  description: 'Gestion des tickets de support, transcripts et réglages du panel',
  section: 'bot',
  order: 10
});

useSeoMeta({
  title: 'Tickets de Support',
  description: 'Gestion des tickets de support, transcripts et réglages du panel',
  ogTitle: 'Tickets de Support - Chienne Bot',
  ogDescription: 'Gestion des tickets de support, transcripts et réglages du panel'
});

const ticketsApi = useTickets();
const tickets = ref<Ticket[]>([]);
const total = ref(0);
const limit = 25;
const page = ref(1);
const statusFilter = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const selected = ref<Ticket | null>(null);
const messages = ref<TicketMessage[]>([]);

const pages = computed(() => Math.max(1, Math.ceil(total.value / limit)));

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const data = await ticketsApi.list({
      status: statusFilter.value || undefined,
      page: page.value,
      limit
    });
    tickets.value = data.tickets;
    total.value = data.total;
  } catch (e: any) {
    error.value = e.message || 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}

async function select(t: Ticket) {
  selected.value = t;
  try {
    const data = await ticketsApi.get(t.id);
    messages.value = data.messages || [];
  } catch (e: any) {
    messages.value = [];
    error.value = `Erreur chargement messages: ${e.message}`;
  }
}

async function doClose() {
  if (!selected.value) return;
  if (!confirm(`Fermer le ticket #${selected.value.id.slice(0, 8)} ?`)) return;
  try {
    const updated = await ticketsApi.close(selected.value.id, null);
    selected.value = updated;
    await load();
  } catch (e: any) {
    error.value = e.message;
  }
}

function statusLabel(s: string) {
  return { open: 'Ouvert', claimed: 'Claim', closed: 'Fermé' }[s] || s;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('fr-FR');
}

function prev() { if (page.value > 1) { page.value--; load(); } }
function next() { if (page.value < pages.value) { page.value++; load(); } }

onMounted(load);
</script>

<style scoped>
.tickets-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  color: #f2f3f5;
}

.tickets-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.tickets-page__header h1 { margin: 0; font-size: 28px; }
.tickets-page__header p { margin: 4px 0 0; color: #b5bac1; font-size: 14px; }

.tickets-page__actions { display: flex; gap: 8px; align-items: center; }

.tickets-page__filter {
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

.tickets-page__error,
.tickets-page__loading,
.tickets-page__empty {
  background: #2b2d31;
  border: 1px solid #3f4147;
  padding: 24px;
  border-radius: 8px;
  text-align: center;
  color: #b5bac1;
  margin-bottom: 16px;
}

.tickets-page__error { background: #ed4245; color: white; border-color: #ed4245; }

.tickets-page__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.ticket-row {
  display: grid;
  grid-template-columns: 100px 1fr 180px 160px;
  gap: 12px;
  align-items: center;
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}

.ticket-row:hover { border-color: #5865f2; transform: translateX(4px); }
.ticket-row.is-selected { border-color: #fee75c; background: #3a3a3a; }

.ticket-row__title { font-weight: 600; font-size: 15px; }
.ticket-row__meta { color: #80848e; font-size: 12px; }
.ticket-row__meta code { font-family: 'JetBrains Mono', monospace; }

.ticket-row__claim,
.ticket-row__date {
  text-align: right;
  font-size: 12px;
  color: #b5bac1;
}

.ticket-row__muted { color: #80848e; font-style: italic; }

.status-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-pill-open { background: #57f287; color: #1e1f22; }
.status-pill-claimed { background: #fee75c; color: #1e1f22; }
.status-pill-closed { background: #80848e; color: #1e1f22; }

.tickets-page__detail {
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

.tickets-page__detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.tickets-page__detail-header h2 { margin: 0; flex: 1; font-size: 20px; }

.tickets-page__detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #b5bac1;
  font-size: 13px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #3f4147;
}

.tickets-page__detail-meta code { font-family: 'JetBrains Mono', monospace; }

.tickets-page__messages h3 { margin: 0 0 12px; font-size: 16px; }

.ticket-message {
  background: #1e1f22;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 6px;
}

.ticket-message.is-staff { border-left: 3px solid #5865f2; }

.ticket-message__head {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #80848e;
  margin-bottom: 4px;
}

.ticket-message__author { color: #fee75c; font-family: 'JetBrains Mono', monospace; }

.ticket-message__badge {
  background: #5865f2;
  color: white;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.ticket-message__time { margin-left: auto; }

.ticket-message__content {
  color: #dcddde;
  font-size: 14px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.btn-close {
  background: #ed4245;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.tickets-page__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.tickets-page__pagination button {
  background: #4e5058;
  color: #f2f3f5;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.tickets-page__pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
