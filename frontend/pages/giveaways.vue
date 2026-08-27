<template>
  <div class="engagement-page">
    <header class="engagement-page__header">
      <div>
        <h1>🎉 Giveaways</h1>
        <p>Concours actifs et historique.</p>
      </div>
      <div class="engagement-page__actions">
        <select v-model="statusFilter" class="engagement-page__filter" @change="load">
          <option value="">Tous statuts</option>
          <option value="active">Actifs</option>
          <option value="ended">Terminés</option>
          <option value="cancelled">Annulés</option>
        </select>
        <button class="btn-refresh" :disabled="loading" @click="load">
          {{ loading ? '⏳' : '🔄' }} Rafraîchir
        </button>
      </div>
    </header>

    <div v-if="error" class="engagement-page__error">❌ {{ error }}</div>
    <div v-if="loading && giveaways.length === 0" class="engagement-page__loading">Chargement…</div>
    <div v-else-if="giveaways.length === 0" class="engagement-page__empty">
      Aucun giveaway pour ce filtre. Crée-en un avec <code>/giveaway-start</code>.
    </div>

    <div v-else class="engagement-page__list">
      <div
        v-for="g in giveaways"
        :key="g.id"
        class="engagement-row"
        :class="['status-' + g.status, { 'is-selected': selected?.id === g.id }]"
        @click="select(g)"
      >
        <div class="engagement-row__prize">{{ g.prize }}</div>
        <div class="engagement-row__meta">
          <span class="status-pill" :class="`status-pill-${g.status}`">{{ statusLabel(g.status) }}</span>
          <span v-if="g.status === 'active'">Finit <t :datetime="new Date(g.endsAt).toISOString()">--</t></span>
          <span v-else>Terminé</span>
          · {{ g.winnersCount }} gagnant(s)
        </div>
        <div v-if="g.status === 'ended' && g.winners.length" class="engagement-row__winners">
          🏆 {{ g.winners.map(id => shortId(id)).join(', ') }}
        </div>
        <div v-if="selected?.id === g.id" class="engagement-row__actions">
          <button v-if="g.status === 'active'" class="btn-mini btn-danger" @click.stop="doEnd(g)">🔒 Terminer</button>
          <button v-if="g.status === 'active'" class="btn-mini btn-warn" @click.stop="doCancel(g)">❌ Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEngagement, type Giveaway } from '~/composables/useEngagement';

definePageMeta({
  title: 'Giveaways & Concours',
  icon: '🎉',
  description: 'Gestion et tirage au sort des concours communautaires',
  section: 'bot',
  order: 12
});

useSeoMeta({
  title: 'Giveaways & Concours',
  description: 'Gestion et tirage au sort des concours communautaires',
  ogTitle: 'Giveaways & Concours - Chienne Bot',
  ogDescription: 'Gestion et tirage au sort des concours communautaires'
});

const engagement = useEngagement();
const giveaways = ref<Giveaway[]>([]);
const statusFilter = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const selected = ref<Giveaway | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    giveaways.value = await engagement.listGiveaways({ status: statusFilter.value || undefined });
  } catch (e: any) {
    error.value = e.message || 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}

function select(g: Giveaway) {
  selected.value = selected.value?.id === g.id ? null : g;
}

function statusLabel(s: string) {
  return { active: 'Actif', ended: 'Terminé', cancelled: 'Annulé' }[s] || s;
}

function shortId(id: string) {
  return `<@${id}>`;
}

async function doEnd(g: Giveaway) {
  if (!confirm(`Terminer le giveaway "${g.prize}" maintenant ?`)) return;
  try {
    const updated = await engagement.endGiveaway(g.id);
    const idx = giveaways.value.findIndex(x => x.id === g.id);
    if (idx >= 0) giveaways.value[idx] = updated;
    selected.value = null;
  } catch (e: any) {
    error.value = e.message;
  }
}

async function doCancel(g: Giveaway) {
  if (!confirm(`Annuler le giveaway "${g.prize}" ?`)) return;
  try {
    const updated = await engagement.cancelGiveaway(g.id);
    const idx = giveaways.value.findIndex(x => x.id === g.id);
    if (idx >= 0) giveaways.value[idx] = updated;
    selected.value = null;
  } catch (e: any) {
    error.value = e.message;
  }
}

onMounted(load);
</script>

<style scoped>
.engagement-page {
  max-width: 1024px;
  margin: 0 auto;
  padding: 24px;
  color: #f2f3f5;
}
.engagement-page__header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.engagement-page__header h1 { margin: 0 0 4px; font-size: 28px; }
.engagement-page__header p { margin: 0; color: #b5bac1; font-size: 14px; }
.engagement-page__actions { display: flex; gap: 8px; align-items: center; }
.engagement-page__filter { background: #2b2d31; color: #f2f3f5; border: 1px solid #3f4147; padding: 8px 12px; border-radius: 6px; }
.btn-refresh { background: #4e5058; color: #f2f3f5; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.btn-refresh:hover:not(:disabled) { background: #5865f2; }

.engagement-page__error,
.engagement-page__loading,
.engagement-page__empty {
  background: #2b2d31; border: 1px solid #3f4147; padding: 24px; border-radius: 8px;
  text-align: center; color: #b5bac1; margin-bottom: 16px;
}
.engagement-page__error { background: #ed4245; color: white; border-color: #ed4245; }
.engagement-page__empty code { font-family: 'JetBrains Mono', monospace; background: #1e1f22; padding: 2px 6px; border-radius: 4px; }

.engagement-page__list { display: flex; flex-direction: column; gap: 8px; }
.engagement-row {
  display: grid; grid-template-columns: 1fr auto; gap: 8px 16px;
  background: #2b2d31; border: 1px solid #3f4147; border-radius: 8px;
  padding: 12px 16px; cursor: pointer; transition: border-color 0.15s;
}
.engagement-row:hover { border-color: #5865f2; }
.engagement-row.is-selected { border-color: #fee75c; background: #3a3a3a; }
.engagement-row__prize { font-weight: 600; font-size: 15px; }
.engagement-row__meta { color: #b5bac1; font-size: 12px; display: flex; gap: 8px; align-items: center; grid-column: 1 / -1; }
.engagement-row__winners { grid-column: 1 / -1; color: #57f287; font-size: 13px; font-family: 'JetBrains Mono', monospace; }
.engagement-row__actions { grid-column: 1 / -1; display: flex; gap: 8px; margin-top: 8px; }

.status-pill { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
.status-pill-active { background: #57f287; color: #1e1f22; }
.status-pill-ended { background: #80848e; color: #1e1f22; }
.status-pill-cancelled { background: #ed4245; color: white; }

.btn-mini { background: #4e5058; color: #f2f3f5; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; }
.btn-mini:hover { opacity: 0.8; }
.btn-danger { background: #ed4245; color: white; }
.btn-warn { background: #fee75c; color: #1e1f22; }
</style>
