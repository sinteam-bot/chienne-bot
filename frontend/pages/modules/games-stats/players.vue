<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div v-if="error" class="config-card" style="color: var(--red);">❌ {{ error }}</div>

    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between;">
        <span>🏆 Top joueurs (Counter + Countdown combinés)</span>
        <button class="module-btn" @click="load" :disabled="loading">{{ loading ? '⏳' : '🔄' }} Rafraîchir</button>
      </div>

      <div v-if="loading && topPlayers.length === 0" style="color: var(--text-muted); padding: 24px; text-align: center;">
        Chargement…
      </div>

      <div v-else-if="topPlayers.length === 0" style="color: var(--text-muted); padding: 24px; text-align: center;">
        Aucun score enregistré pour le moment.
      </div>

      <div v-else>
        <div v-for="(p, i) in topPlayers" :key="p.key" class="player-row">
          <div class="player-row__rank">
            <span v-if="i === 0">🥇</span>
            <span v-else-if="i === 1">🥈</span>
            <span v-else-if="i === 2">🥉</span>
            <span v-else>#{{ i + 1 }}</span>
          </div>
          <div class="player-row__game">
            <span class="game-badge" :class="`game-${p.game}`">{{ p.game === 'counter' ? '🔢 Counter' : '⏳ Countdown' }}</span>
          </div>
          <div class="player-row__user">
            <code>{{ (p.user_id || '').slice(0, 18) }}…</code>
          </div>
          <div class="player-row__score">
            <strong>{{ p.score }}</strong> pts
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useGamesStats, type GamePlayer } from '~/composables/useGamesStats';

const gs = useGamesStats();
const loading = ref(false);
const error = ref<string | null>(null);
const counterPlayers = ref<GamePlayer[]>([]);
const countdownPlayers = ref<GamePlayer[]>([]);

const topPlayers = computed(() => {
  const all = [
    ...counterPlayers.value.map(p => ({ ...p, game: 'counter', key: `c-${p.user_id}` })),
    ...countdownPlayers.value.map(p => ({ ...p, game: 'countdown', key: `d-${p.user_id}` }))
  ];
  return all.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 20);
});

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const data = await gs.getStats();
    counterPlayers.value = data?.counter?.topPlayers || [];
    countdownPlayers.value = data?.countdown?.topPlayers || [];
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.module-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--background-modifier-hover);
  color: var(--text-normal);
  font-size: 12px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  font-family: inherit;
}
.module-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.player-row {
  display: grid;
  grid-template-columns: 50px 100px 1fr 100px;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.player-row:last-child { border-bottom: none; }
.player-row__rank { font-size: 18px; text-align: center; font-weight: 600; }
.player-row__user code { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-muted); }
.player-row__score { text-align: right; font-size: 14px; }
.game-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}
.game-counter { background: rgba(88, 101, 242, 0.2); color: #5865f2; }
.game-countdown { background: rgba(155, 89, 182, 0.2); color: #9b59b6; }
</style>
