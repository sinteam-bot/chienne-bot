<template>
  <div class="polls-page">
    <header class="polls-page__header">
      <div>
        <h1>📊 Sondages</h1>
        <p>Sondages actifs et résultats.</p>
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
      Aucun sondage. Crée-en un avec <code>/poll-create</code>.
    </div>

    <div v-else class="polls-page__list">
      <div
        v-for="p in polls"
        :key="p.id"
        class="poll-row"
        :class="['status-' + p.status, { 'is-selected': selected?.id === p.id }]"
        @click="select(p)"
      >
        <div class="poll-row__head">
          <span class="poll-row__question">{{ p.question }}</span>
          <span class="status-pill" :class="`status-pill-${p.status}`">{{ statusLabel(p.status) }}</span>
        </div>
        <div class="poll-row__meta">
          {{ p.options.length }} options{{ p.multiChoice ? ' · multi' : '' }}{{ p.endsAt ? ` · finit <t :datetime="${new Date(p.endsAt).toISOString()}">--</t>` : '' }}
        </div>
        <div v-if="p.tally" class="poll-row__tally">
          <div v-for="opt in p.tally.perOption" :key="opt.index" class="tally-bar">
            <div class="tally-bar__label">
              <strong>{{ opt.index + 1 }}.</strong> {{ opt.label }}
              <span class="tally-bar__count">{{ opt.count }} ({{ totalFor(p, opt) }}%)</span>
            </div>
            <div class="tally-bar__track">
              <div class="tally-bar__fill" :style="{ width: totalFor(p, opt) + '%' }" />
            </div>
          </div>
          <div class="poll-row__total">Total : {{ p.tally.total }} vote(s)</div>
        </div>
        <div v-if="selected?.id === p.id && p.status === 'active'" class="poll-row__actions">
          <button class="btn-mini btn-danger" @click.stop="doEnd(p)">🔒 Terminer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEngagement, type Poll } from '~/composables/useEngagement';

const engagement = useEngagement();
const polls = ref<Poll[]>([]);
const statusFilter = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const selected = ref<Poll | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const list = await engagement.listPolls({ status: statusFilter.value || undefined });
    // Charge aussi le tally pour chaque poll
    polls.value = await Promise.all(
      list.map(async (p) => {
        const detail = await engagement.getPoll(p.id);
        return detail;
      })
    );
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
.polls-page { max-width: 1024px; margin: 0 auto; padding: 24px; color: #f2f3f5; }
.polls-page__header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.polls-page__header h1 { margin: 0 0 4px; font-size: 28px; }
.polls-page__header p { margin: 0; color: #b5bac1; font-size: 14px; }
.polls-page__actions { display: flex; gap: 8px; align-items: center; }
.polls-page__filter { background: #2b2d31; color: #f2f3f5; border: 1px solid #3f4147; padding: 8px 12px; border-radius: 6px; }
.btn-refresh { background: #4e5058; color: #f2f3f5; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.btn-refresh:hover:not(:disabled) { background: #5865f2; }

.polls-page__error,
.polls-page__loading,
.polls-page__empty { background: #2b2d31; border: 1px solid #3f4147; padding: 24px; border-radius: 8px; text-align: center; color: #b5bac1; margin-bottom: 16px; }
.polls-page__error { background: #ed4245; color: white; border-color: #ed4245; }
.polls-page__empty code { font-family: 'JetBrains Mono', monospace; background: #1e1f22; padding: 2px 6px; border-radius: 4px; }

.polls-page__list { display: flex; flex-direction: column; gap: 12px; }
.poll-row { background: #2b2d31; border: 1px solid #3f4147; border-radius: 8px; padding: 14px 18px; cursor: pointer; transition: border-color 0.15s; }
.poll-row:hover { border-color: #5865f2; }
.poll-row.is-selected { border-color: #fee75c; background: #3a3a3a; }

.poll-row__head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 6px; }
.poll-row__question { font-weight: 600; font-size: 15px; }
.poll-row__meta { color: #80848e; font-size: 12px; margin-bottom: 12px; }

.poll-row__tally { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.tally-bar__label { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
.tally-bar__count { color: #b5bac1; }
.tally-bar__track { background: #1e1f22; border-radius: 4px; height: 8px; overflow: hidden; }
.tally-bar__fill { background: linear-gradient(90deg, #5865f2, #eb459e); height: 100%; border-radius: 4px; transition: width 0.3s; }
.poll-row__total { margin-top: 6px; font-size: 12px; color: #80848e; text-align: right; }

.poll-row__actions { margin-top: 10px; display: flex; gap: 8px; }

.status-pill { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
.status-pill-active { background: #57f287; color: #1e1f22; }
.status-pill-ended { background: #80848e; color: #1e1f22; }

.btn-mini { background: #4e5058; color: #f2f3f5; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; }
.btn-danger { background: #ed4245; color: white; }
</style>
