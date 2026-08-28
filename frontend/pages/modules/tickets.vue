<template>
  <div class="tickets-page">
    <header class="tickets-page__header">
      <div>
        <h1>🎫 Tickets</h1>
        <p>Gestion des tickets de support, transcripts et suivi des membres.</p>
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
            <span class="ticket-id">#{{ t.id.slice(0, 8) }}</span>
            <span class="ticket-cat">{{ t.category }}</span>
            <span class="ticket-user">
              par <DiscordUser :user-id="t.user_id" :show-id="true" />
            </span>
          </div>
        </div>
        <div class="ticket-row__claim">
          <span v-if="t.claimed_by" class="ticket-claim-user">
            🙋 <DiscordUser :user-id="t.claimed_by" :show-id="false" />
          </span>
          <span v-else class="ticket-row__muted">Non claim</span>
        </div>
        <div class="ticket-row__date">
          <DiscordTime :value="t.created_at" mode="relative" />
        </div>
      </div>
    </div>

    <!-- Détail du ticket sélectionné -->
    <div v-if="selected" class="tickets-page__detail">
      <div class="tickets-page__detail-header">
        <h2>{{ selected.subject || '(sans sujet)' }}</h2>
        <span class="status-pill" :class="`status-pill-${selected.status}`">{{ statusLabel(selected.status) }}</span>
        <div class="detail-actions">
          <button class="btn-export" title="Exporter en HTML interactif" @click="exportHtml">📥 Export HTML</button>
          <button class="btn-export" title="Exporter en JSON" @click="exportJson">📄 Export JSON</button>
          <button v-if="selected.status !== 'closed'" class="btn-close" @click="doClose">🔒 Fermer</button>
        </div>
      </div>

      <div class="tickets-page__detail-meta">
        <div class="meta-item">
          <span class="label">ID :</span>
          <code>{{ selected.id }}</code>
        </div>
        <div class="meta-item">
          <span class="label">Salon :</span>
          <DiscordChannel v-if="selected.channel_id" :channel-id="selected.channel_id" />
          <code v-else>Non renseigné</code>
        </div>
        <div class="meta-item">
          <span class="label">Ouvert par :</span>
          <DiscordUser :user-id="selected.user_id" :show-id="true" />
        </div>
        <div v-if="selected.claimed_by" class="meta-item">
          <span class="label">Claim par :</span>
          <DiscordUser :user-id="selected.claimed_by" :show-id="true" />
        </div>
        <div class="meta-item">
          <span class="label">Créé :</span>
          <DiscordTime :value="selected.created_at" mode="both" />
        </div>
      </div>

      <div class="tickets-page__messages">
        <h3>📜 Échanges et Messages ({{ messages.length }})</h3>
        <div v-if="messages.length === 0" class="tickets-page__empty">Aucun message enregistré pour ce ticket.</div>
        <div
          v-for="m in messages.slice(-100)"
          :key="m.id"
          class="ticket-message"
          :class="{ 'is-staff': m.is_staff }"
        >
          <div class="ticket-message__head">
            <DiscordUser :user-id="m.author_id" />
            <span v-if="m.is_staff" class="ticket-message__badge">STAFF</span>
            <DiscordTime :value="m.created_at" mode="relative" class="ticket-message__time" />
          </div>
          <div class="ticket-message__content">{{ m.content || '(vide)' }}</div>
        </div>
      </div>
    </div>

    <!-- Pagination DiscordPagination -->
    <div v-if="total > 0" class="tickets-page__pagination-container">
      <DiscordPagination
        v-model="page"
        v-model:page-size="limit"
        :total-items="total"
        :page-size-options="[10, 25, 50, 100]"
        @update:model-value="load"
        @update:page-size="load"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTickets, type Ticket, type TicketMessage } from '~/composables/useTickets';
import DiscordUser from '~/components/common/DiscordUser.vue';
import DiscordChannel from '~/components/common/DiscordChannel.vue';
import DiscordTime from '~/components/common/DiscordTime.vue';
import DiscordPagination from '~/components/common/DiscordPagination.vue';
import { generateHtmlTranscript, downloadFile } from '~/utils/transcriptExporter';

definePageMeta({
  title: 'Tickets de Support',
  icon: '🎫',
  description: 'Gestion des tickets de support, transcripts et réglages du panel',
  section: 'modules',
  order: 9
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
const limit = ref(25);
const page = ref(1);
const statusFilter = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const selected = ref<Ticket | null>(null);
const messages = ref<TicketMessage[]>([]);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const data = await ticketsApi.list({
      status: statusFilter.value || undefined,
      page: page.value,
      limit: limit.value
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

function exportHtml() {
  if (!selected.value) return;
  const html = generateHtmlTranscript({
    title: `Ticket #${selected.value.id.slice(0, 8)} - ${selected.value.subject || 'Support'}`,
    category: selected.value.category,
    exportedAt: new Date()
  }, messages.value);

  downloadFile(html, `transcript-ticket-${selected.value.id.slice(0, 8)}.html`, 'text/html');
}

function exportJson() {
  if (!selected.value) return;
  const data = {
    ticket: selected.value,
    exportedAt: new Date().toISOString(),
    messages: messages.value
  };

  downloadFile(JSON.stringify(data, null, 2), `transcript-ticket-${selected.value.id.slice(0, 8)}.json`, 'application/json');
}

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
  transition: background 0.15s;
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
  grid-template-columns: 90px 1fr 180px 150px;
  gap: 16px;
  align-items: center;
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s, background 0.15s;
}

.ticket-row:hover { border-color: #5865f2; transform: translateX(4px); }
.ticket-row.is-selected { border-color: #fee75c; background: #35373c; }

.ticket-row__title { font-weight: 600; font-size: 15px; margin-bottom: 4px; }
.ticket-row__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #80848e;
  font-size: 12px;
  flex-wrap: wrap;
}
.ticket-id { font-family: 'JetBrains Mono', monospace; color: #b5bac1; }
.ticket-cat { background: #1e1f22; padding: 2px 6px; border-radius: 4px; color: #dbdee1; }
.ticket-user { display: inline-flex; align-items: center; gap: 4px; }

.ticket-row__claim {
  text-align: left;
  font-size: 12px;
  color: #b5bac1;
  display: flex;
  align-items: center;
  gap: 4px;
}

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
  text-align: center;
}

.status-pill-open { background: #57f287; color: #1e1f22; }
.status-pill-claimed { background: #fee75c; color: #1e1f22; }
.status-pill-closed { background: #80848e; color: #1e1f22; }

.tickets-page__detail {
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.tickets-page__detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.tickets-page__detail-header h2 { margin: 0; flex: 1; font-size: 20px; }

.detail-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-export {
  background: #35373c;
  color: #f2f3f5;
  border: 1px solid #4e5058;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s;
}

.btn-export:hover {
  background: #5865f2;
  border-color: #5865f2;
}

.btn-close {
  background: #ed4245;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: background 0.15s;
}

.btn-close:hover { background: #c03537; }

.tickets-page__detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  color: #b5bac1;
  font-size: 13px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #1e1f22;
  border-radius: 6px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-item .label {
  color: #80848e;
  font-size: 12px;
}

.tickets-page__messages h3 { margin: 0 0 12px; font-size: 16px; color: #f2f3f5; }

.ticket-message {
  background: #1e1f22;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 8px;
  border-left: 3px solid transparent;
}

.ticket-message.is-staff { border-left-color: #5865f2; background: #23252a; }

.ticket-message__head {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 12px;
  color: #80848e;
  margin-bottom: 6px;
}

.ticket-message__badge {
  background: #5865f2;
  color: white;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.ticket-message__time { margin-left: auto; color: #80848e; font-size: 11px; }

.ticket-message__content {
  color: #dcddde;
  font-size: 14px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.tickets-page__pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
