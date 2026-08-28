<template>
  <div class="engagement-page">
    <header class="engagement-page__header">
      <div>
        <h1>🎉 Giveaways</h1>
        <p>Gestion, tirage au sort et historique des concours communautaires.</p>
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
      Aucun giveaway pour ce filtre. Lancez-en un avec la commande slash <code>/giveaway-start</code>.
    </div>

    <div v-else class="engagement-page__list">
      <div
        v-for="g in paginatedGiveaways"
        :key="g.id"
        class="engagement-row"
        :class="['status-' + g.status, { 'is-selected': selected?.id === g.id }]"
        @click="select(g)"
      >
        <div class="engagement-row__head">
          <div class="engagement-row__prize">🎁 {{ g.prize }}</div>
          <span class="status-pill" :class="`status-pill-${g.status}`">{{ statusLabel(g.status) }}</span>
        </div>

        <div class="engagement-row__meta">
          <span v-if="g.channelId" class="meta-item">
            Salon: <DiscordChannel :channel-id="g.channelId" />
          </span>
          <span v-if="g.hostId" class="meta-item">
            Par: <DiscordUser :user-id="g.hostId" />
          </span>
          <span class="meta-item">
            <span v-if="g.status === 'active'">
              Fin : <DiscordTime :value="g.endsAt" mode="relative" />
            </span>
            <span v-else>
              Terminé : <DiscordTime :value="g.endsAt" mode="both" />
            </span>
          </span>
          <span class="meta-item">
            👥 {{ g.winnersCount }} gagnant(s)
          </span>
        </div>

        <div v-if="g.status === 'ended' && g.winners && g.winners.length" class="engagement-row__winners">
          <span class="winners-label">🏆 Gagnants :</span>
          <div class="winners-list">
            <DiscordUser v-for="id in g.winners" :key="id" :user-id="id" :show-id="true" />
          </div>
        </div>

        <div v-if="selected?.id === g.id" class="engagement-row__actions">
          <button v-if="g.status === 'active'" class="btn-mini btn-danger" @click.stop="doEnd(g)">🔒 Terminer & Tirer au sort</button>
          <button v-if="g.status === 'active'" class="btn-mini btn-warn" @click.stop="doCancel(g)">❌ Annuler</button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="giveaways.length > pageSize" class="pagination-container">
      <DiscordPagination
        v-model="page"
        v-model:page-size="pageSize"
        :total-items="giveaways.length"
        :page-size-options="[5, 10, 25, 50]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEngagement, type Giveaway } from '~/composables/useEngagement';
import DiscordUser from '~/components/common/DiscordUser.vue';
import DiscordChannel from '~/components/common/DiscordChannel.vue';
import DiscordTime from '~/components/common/DiscordTime.vue';
import DiscordPagination from '~/components/common/DiscordPagination.vue';

definePageMeta({
  title: 'Giveaways & Concours',
  icon: '🎉',
  description: 'Gestion et tirage au sort des concours communautaires',
  section: 'modules',
  order: 7
});

useSeoMeta({
  title: 'Giveaways & Concours',
  description: 'Gestion et tirage au sort des concours communautaires',
  ogTitle: 'Giveaways & Concours - Bot',
  ogDescription: 'Gestion et tirage au sort des concours communautaires'
});

const engagement = useEngagement();
const giveaways = ref<Giveaway[]>([]);
const statusFilter = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const selected = ref<Giveaway | null>(null);

const page = ref(1);
const pageSize = ref(10);

const paginatedGiveaways = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return giveaways.value.slice(start, start + pageSize.value);
});

async function load() {
  loading.value = true;
  error.value = null;
  try {
    giveaways.value = await engagement.listGiveaways({ status: statusFilter.value || undefined });
    page.value = 1;
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

async function doEnd(g: Giveaway) {
  if (!confirm(`Terminer le giveaway "${g.prize}" et effectuer le tirage immédiatement ?`)) return;
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
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  color: #f2f3f5;
}
.engagement-page__header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.engagement-page__header h1 { margin: 0 0 4px; font-size: 28px; }
.engagement-page__header p { margin: 0; color: #b5bac1; font-size: 14px; }
.engagement-page__actions { display: flex; gap: 8px; align-items: center; }
.engagement-page__filter { background: #2b2d31; color: #f2f3f5; border: 1px solid #3f4147; padding: 8px 12px; border-radius: 6px; }
.btn-refresh { background: #4e5058; color: #f2f3f5; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
.btn-refresh:hover:not(:disabled) { background: #5865f2; }

.engagement-page__error,
.engagement-page__loading,
.engagement-page__empty {
  background: #2b2d31; border: 1px solid #3f4147; padding: 24px; border-radius: 8px;
  text-align: center; color: #b5bac1; margin-bottom: 16px;
}
.engagement-page__error { background: #ed4245; color: white; border-color: #ed4245; }
.engagement-page__empty code { font-family: 'JetBrains Mono', monospace; background: #1e1f22; padding: 2px 6px; border-radius: 4px; }

.engagement-page__list { display: flex; flex-direction: column; gap: 10px; }
.engagement-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-radius: 8px;
  padding: 14px 18px;
  cursor: pointer;
  transition: all 0.15s;
}
.engagement-row:hover { border-color: #5865f2; transform: translateX(3px); }
.engagement-row.is-selected { border-color: #fee75c; background: #35373c; }

.engagement-row__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.engagement-row__prize { font-weight: 600; font-size: 16px; color: #f2f3f5; }
.engagement-row__meta {
  color: #b5bac1;
  font-size: 13px;
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}
.meta-item { display: inline-flex; align-items: center; gap: 6px; }

.engagement-row__winners {
  background: #1e1f22;
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.winners-label { font-weight: 600; color: #57f287; font-size: 13px; }
.winners-list { display: flex; gap: 8px; flex-wrap: wrap; }

.engagement-row__actions { display: flex; gap: 10px; margin-top: 4px; padding-top: 8px; border-top: 1px solid #3f4147; }

.status-pill { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
.status-pill-active { background: #57f287; color: #1e1f22; }
.status-pill-ended { background: #80848e; color: #1e1f22; }
.status-pill-cancelled { background: #ed4245; color: white; }

.btn-mini { background: #4e5058; color: #f2f3f5; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; }
.btn-mini:hover { opacity: 0.85; }
.btn-danger { background: #ed4245; color: white; }
.btn-warn { background: #fee75c; color: #1e1f22; }

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
