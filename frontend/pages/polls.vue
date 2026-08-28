<template>
  <div class="polls-page">
    <header class="polls-page__header">
      <div>
        <h1>🗳️ Sondages & Votes</h1>
        <p>Gestion, dépouillement en temps réel et historique des sondages du serveur.</p>
      </div>
      <div class="polls-page__actions">
        <select v-model="statusFilter" class="polls-page__filter" @change="load">
          <option value="">Tous statuts</option>
          <option value="active">Actifs</option>
          <option value="ended">Terminés</option>
        </select>
        <button class="btn-refresh" :disabled="loading" @click="load">
          {{ loading ? '⏳' : '🔄' }} Rafraîchir
        </button>
      </div>
    </header>

    <div v-if="error" class="polls-page__error">❌ {{ error }}</div>
    <div v-if="loading && polls.length === 0" class="polls-page__loading">Chargement…</div>
    <div v-else-if="polls.length === 0" class="polls-page__empty">
      Aucun sondage pour ce filtre. Lancez-en un avec la commande slash <code>/poll-create</code>.
    </div>

    <div v-else class="polls-page__list">
      <div
        v-for="p in paginatedPolls"
        :key="p.id"
        class="poll-row"
        :class="['status-' + p.status, { 'is-selected': selected?.id === p.id }]"
        @click="select(p)"
      >
        <div class="poll-row__head">
          <div class="poll-row__question">❓ {{ p.question }}</div>
          <span class="status-pill" :class="`status-pill-${p.status}`">{{ statusLabel(p.status) }}</span>
        </div>

        <div class="poll-row__meta">
          <span v-if="p.channelId" class="meta-item">
            Salon : <DiscordChannel :channel-id="p.channelId" />
          </span>
          <span v-if="p.createdBy" class="meta-item">
            Créé par : <DiscordUser :user-id="p.createdBy" />
          </span>
          <span class="meta-item badge-opt">
            {{ p.options.length }} options
          </span>
          <span v-if="p.multiChoice" class="meta-item badge-multi">
            Choix multiple
          </span>
          <span class="meta-item">
            <span v-if="p.status === 'active' && p.endsAt">
              Fin : <DiscordTime :value="p.endsAt" mode="relative" />
            </span>
            <span v-else-if="p.endsAt">
              Terminé : <DiscordTime :value="p.endsAt" mode="both" />
            </span>
          </span>
        </div>

        <div v-if="p.tally" class="poll-row__tally">
          <div v-for="opt in p.tally.perOption" :key="opt.index" class="tally-bar">
            <div class="tally-bar__label">
              <span><strong>{{ opt.index + 1 }}.</strong> {{ opt.label }}</span>
              <span class="tally-bar__count">{{ opt.count }} vote(s) ({{ totalFor(p, opt) }}%)</span>
            </div>
            <div class="tally-bar__track">
              <div class="tally-bar__fill" :style="{ width: totalFor(p, opt) + '%' }" />
            </div>
          </div>
          <div class="poll-row__total">Participation totale : {{ p.tally.total }} vote(s)</div>
        </div>

        <div v-if="selected?.id === p.id && p.status === 'active'" class="poll-row__actions">
          <button class="btn-mini btn-danger" @click.stop="doEnd(p)">🔒 Clôturer le sondage</button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="polls.length > pageSize" class="pagination-container">
      <DiscordPagination
        v-model="page"
        v-model:page-size="pageSize"
        :total-items="polls.length"
        :page-size-options="[5, 10, 25, 50]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEngagement, type Poll } from '~/composables/useEngagement';
import DiscordUser from '~/components/common/DiscordUser.vue';
import DiscordChannel from '~/components/common/DiscordChannel.vue';
import DiscordTime from '~/components/common/DiscordTime.vue';
import DiscordPagination from '~/components/common/DiscordPagination.vue';

definePageMeta({
  title: 'Sondages & Votes',
  icon: '🗳️',
  description: 'Création et résultats des votes et sondages du serveur',
  section: 'bot',
  order: 13
});

useSeoMeta({
  title: 'Sondages & Votes',
  description: 'Création et résultats des votes et sondages du serveur',
  ogTitle: 'Sondages & Votes - Chienne Bot',
  ogDescription: 'Création et résultats des votes et sondages du serveur'
});

const engagement = useEngagement();
const polls = ref<Poll[]>([]);
const statusFilter = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const selected = ref<Poll | null>(null);

const page = ref(1);
const pageSize = ref(10);

const paginatedPolls = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return polls.value.slice(start, start + pageSize.value);
});

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const list = await engagement.listPolls({ status: statusFilter.value || undefined });
    polls.value = await Promise.all(
      list.map(async (p) => {
        const detail = await engagement.getPoll(p.id);
        return detail;
      })
    );
    page.value = 1;
  } catch (e: any) {
    error.value = e.message || 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}

function select(p: Poll) {
  selected.value = selected.value?.id === p.id ? null : p;
}

function statusLabel(s: string) {
  return { active: 'Actif', ended: 'Terminé' }[s] || s;
}

function totalFor(p: Poll, opt: { count: number }) {
  if (!p.tally || p.tally.total === 0) return 0;
  return Math.round((opt.count / p.tally.total) * 100);
}

async function doEnd(p: Poll) {
  if (!confirm(`Terminer le sondage "${p.question}" ?`)) return;
  try {
    const updated = await engagement.endPoll(p.id);
    const idx = polls.value.findIndex(x => x.id === p.id);
    if (idx >= 0) polls.value[idx] = { ...polls.value[idx], ...updated, tally: p.tally };
    selected.value = null;
  } catch (e: any) {
    error.value = e.message;
  }
}

onMounted(load);
</script>

<style scoped>
.polls-page { max-width: 1100px; margin: 0 auto; padding: 24px; color: #f2f3f5; }
.polls-page__header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.polls-page__header h1 { margin: 0 0 4px; font-size: 28px; }
.polls-page__header p { margin: 0; color: #b5bac1; font-size: 14px; }
.polls-page__actions { display: flex; gap: 8px; align-items: center; }
.polls-page__filter { background: #2b2d31; color: #f2f3f5; border: 1px solid #3f4147; padding: 8px 12px; border-radius: 6px; }
.btn-refresh { background: #4e5058; color: #f2f3f5; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
.btn-refresh:hover:not(:disabled) { background: #5865f2; }

.polls-page__error,
.polls-page__loading,
.polls-page__empty { background: #2b2d31; border: 1px solid #3f4147; padding: 24px; border-radius: 8px; text-align: center; color: #b5bac1; margin-bottom: 16px; }
.polls-page__error { background: #ed4245; color: white; border-color: #ed4245; }
.polls-page__empty code { font-family: 'JetBrains Mono', monospace; background: #1e1f22; padding: 2px 6px; border-radius: 4px; }

.polls-page__list { display: flex; flex-direction: column; gap: 14px; }
.poll-row { background: #2b2d31; border: 1px solid #3f4147; border-radius: 8px; padding: 16px 20px; cursor: pointer; transition: all 0.15s; }
.poll-row:hover { border-color: #5865f2; transform: translateX(3px); }
.poll-row.is-selected { border-color: #fee75c; background: #35373c; }

.poll-row__head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px; }
.poll-row__question { font-weight: 600; font-size: 16px; color: #f2f3f5; }
.poll-row__meta {
  color: #b5bac1;
  font-size: 13px;
  margin-bottom: 14px;
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}
.meta-item { display: inline-flex; align-items: center; gap: 6px; }
.badge-opt { background: #1e1f22; padding: 2px 8px; border-radius: 4px; color: #dbdee1; }
.badge-multi { background: #5865f2; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; }

.poll-row__tally { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; background: #1e1f22; padding: 14px; border-radius: 6px; }
.tally-bar__label { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #dbdee1; }
.tally-bar__count { color: #b5bac1; font-weight: 500; }
.tally-bar__track { background: #2b2d31; border-radius: 4px; height: 10px; overflow: hidden; }
.tally-bar__fill { background: linear-gradient(90deg, #5865f2, #eb459e); height: 100%; border-radius: 4px; transition: width 0.3s ease; }
.poll-row__total { margin-top: 8px; font-size: 12px; color: #80848e; text-align: right; }

.poll-row__actions { margin-top: 12px; display: flex; gap: 10px; padding-top: 10px; border-top: 1px solid #3f4147; }

.status-pill { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
.status-pill-active { background: #57f287; color: #1e1f22; }
.status-pill-ended { background: #80848e; color: #1e1f22; }

.btn-mini { background: #4e5058; color: #f2f3f5; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; }
.btn-danger { background: #ed4245; color: white; }

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
