<template>
  <div class="leaderboard-page">
    <header class="leaderboard-page__header">
      <div>
        <h1>🏆 Classement XP</h1>
        <p>Top des membres les plus actifs du serveur.</p>
      </div>
      <div class="leaderboard-page__actions">
        <button class="btn-refresh" :disabled="loading" @click="load">
          {{ loading ? '⏳ Chargement…' : '🔄 Rafraîchir' }}
        </button>
      </div>
    </header>

    <div v-if="error" class="leaderboard-page__error">❌ {{ error }}</div>

    <div v-if="loading && entries.length === 0" class="leaderboard-page__loading">
      Chargement du classement…
    </div>

    <div v-else-if="entries.length === 0" class="leaderboard-page__empty">
      Aucun membre dans le classement pour le moment.
    </div>

    <div v-else class="leaderboard-page__list">
      <div
        v-for="(entry, i) in entries"
        :key="entry.userId"
        class="leaderboard-row"
        :class="rowClass(i)"
      >
        <div class="leaderboard-row__rank">
          <span v-if="i === 0">🥇</span>
          <span v-else-if="i === 1">🥈</span>
          <span v-else-if="i === 2">🥉</span>
          <span v-else>#{{ offset + i + 1 }}</span>
        </div>
        <div class="leaderboard-row__user">
          <div class="leaderboard-row__name">{{ entry.username }}</div>
          <div class="leaderboard-row__id">{{ entry.userId }}</div>
        </div>
        <div class="leaderboard-row__level">Niv. <strong>{{ entry.level }}</strong></div>
        <div class="leaderboard-row__xp">{{ entry.totalXp.toLocaleString('fr-FR') }} XP</div>
        <div class="leaderboard-row__stats">
          💬 {{ entry.messagesCount || 0 }} · 🎤 {{ entry.voiceMinutes || 0 }}min
        </div>
      </div>
    </div>

    <footer v-if="entries.length > 0" class="leaderboard-page__pagination">
      <button :disabled="page <= 1 || loading" @click="prev">◀ Précédent</button>
      <span class="leaderboard-page__page-info">Page {{ page }} / {{ pages }} — {{ total }} membre(s)</span>
      <button :disabled="page >= pages || loading" @click="next">Suivant ▶</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useXp, type LeaderboardEntry } from '~/composables/useXp';

const xp = useXp();
const entries = ref<LeaderboardEntry[]>([]);
const total = ref(0);
const limit = 25;
const offset = ref(0);
const loading = ref(false);
const error = ref<string | null>(null);

const page = computed(() => Math.floor(offset.value / limit) + 1);
const pages = computed(() => Math.max(1, Math.ceil(total.value / limit)));

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const data = await xp.getLeaderboard(limit, offset.value);
    entries.value = data.entries;
    total.value = data.total;
  } catch (e: any) {
    error.value = e.message || 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}

function prev() {
  if (offset.value >= limit) offset.value -= limit;
  load();
}

function next() {
  if (offset.value + limit < total.value) offset.value += limit;
  load();
}

function rowClass(i: number) {
  if (i === 0) return 'is-gold';
  if (i === 1) return 'is-silver';
  if (i === 2) return 'is-bronze';
  return '';
}

onMounted(load);
</script>

<style scoped>
.leaderboard-page {
  max-width: 1024px;
  margin: 0 auto;
  padding: 24px;
  color: #f2f3f5;
}

.leaderboard-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.leaderboard-page__header h1 {
  margin: 0 0 4px;
  font-size: 28px;
}

.leaderboard-page__header p {
  margin: 0;
  color: #b5bac1;
  font-size: 14px;
}

.btn-refresh {
  background: #4e5058;
  color: #f2f3f5;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-refresh:hover:not(:disabled) {
  background: #5865f2;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.leaderboard-page__error,
.leaderboard-page__loading,
.leaderboard-page__empty {
  background: #2b2d31;
  border: 1px solid #3f4147;
  padding: 24px;
  border-radius: 8px;
  text-align: center;
  color: #b5bac1;
}

.leaderboard-page__error {
  background: #ed4245;
  color: white;
  border-color: #ed4245;
}

.leaderboard-page__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.leaderboard-row {
  display: grid;
  grid-template-columns: 60px 1fr 80px 120px 160px;
  gap: 12px;
  align-items: center;
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-radius: 8px;
  padding: 12px 16px;
  transition: transform 0.15s, border-color 0.15s;
}

.leaderboard-row:hover {
  border-color: #5865f2;
  transform: translateX(4px);
}

.leaderboard-row.is-gold {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.15), #2b2d31);
  border-color: rgba(255, 215, 0, 0.5);
}

.leaderboard-row.is-silver {
  background: linear-gradient(90deg, rgba(192, 192, 192, 0.15), #2b2d31);
  border-color: rgba(192, 192, 192, 0.5);
}

.leaderboard-row.is-bronze {
  background: linear-gradient(90deg, rgba(205, 127, 50, 0.15), #2b2d31);
  border-color: rgba(205, 127, 50, 0.5);
}

.leaderboard-row__rank {
  font-size: 22px;
  text-align: center;
}

.leaderboard-row__name {
  font-weight: 600;
  font-size: 15px;
}

.leaderboard-row__id {
  color: #80848e;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
}

.leaderboard-row__level,
.leaderboard-row__xp {
  text-align: right;
  font-size: 14px;
}

.leaderboard-row__level strong {
  color: #fee75c;
}

.leaderboard-row__stats {
  color: #80848e;
  font-size: 12px;
  text-align: right;
}

.leaderboard-page__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.leaderboard-page__pagination button {
  background: #4e5058;
  color: #f2f3f5;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.leaderboard-page__pagination button:hover:not(:disabled) {
  background: #5865f2;
}

.leaderboard-page__pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.leaderboard-page__page-info {
  color: #b5bac1;
  font-size: 13px;
}
</style>
