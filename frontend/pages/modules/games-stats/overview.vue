<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div v-if="error" class="config-card" style="color: var(--red);">❌ {{ error }}</div>

    <!-- KPI Banner -->
    <div class="module-stats-banner">
      <div class="module-stat-card">
        <div class="module-stat-icon">🔢</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Compteur</span>
          <span class="module-stat-value" :style="{ color: stats?.counter?.state?.current_number >= 0 ? 'var(--green)' : 'var(--text-muted)' }">
            {{ stats?.counter?.state?.current_number ?? '—' }}
          </span>
          <span class="module-stat-sub">
            {{ stats?.counter?.configured ? `Salon: <code>${stats.counter.channelId}</code>` : 'Non configuré' }}
          </span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">⏳</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Countdown</span>
          <span class="module-stat-value">{{ stats?.countdown?.state?.current_number ?? '—' }}</span>
          <span class="module-stat-sub">
            {{ stats?.countdown?.configured ? `Salon: <code>${stats.countdown.channelId}</code>` : 'Non configuré' }}
          </span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">📊</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Erreurs (Counter)</span>
          <span class="module-stat-value" :style="{ color: (stats?.counter?.state?.error_count || 0) > 0 ? 'var(--red)' : 'var(--green)' }">
            {{ stats?.counter?.state?.error_count ?? 0 }}
          </span>
          <span class="module-stat-sub">max_errors configurable</span>
        </div>
      </div>
    </div>

    <!-- Compteur -->
    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between;">
        <span>🔢 Compteur (Road to Infinite)</span>
        <button class="module-btn" @click="load" :disabled="loading">{{ loading ? '⏳' : '🔄' }} Rafraîchir</button>
      </div>
      <div v-if="!stats?.counter?.configured" style="color: var(--text-muted); padding: 16px; text-align: center;">
        Compteur non configuré. Définissez <code>counter.channel_id</code> dans config.yml.
      </div>
      <div v-else>
        <div class="game-stats-grid">
          <div class="gs-card">
            <div class="gs-card__label">Numéro actuel</div>
            <div class="gs-card__value">{{ stats?.counter?.state?.current_number ?? '—' }}</div>
          </div>
          <div class="gs-card">
            <div class="gs-card__label"> Erreurs</div>
            <div class="gs-card__value">{{ stats?.counter?.state?.error_count ?? 0 }}</div>
          </div>
          <div class="gs-card">
            <div class="gs-card__label"> Top joueurs</div>
            <div class="gs-card__value">{{ stats?.counter?.topPlayers?.length || 0 }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Countdown -->
    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between;">
        <span>⏳ Countdown (900 → 0)</span>
      </div>
      <div v-if="!stats?.countdown?.configured" style="color: var(--text-muted); padding: 16px; text-align: center;">
        Countdown non configuré. Définissez <code>countdown.channel_id</code> dans config.yml.
      </div>
      <div v-else>
        <div class="game-stats-grid">
          <div class="gs-card">
            <div class="gs-card__label"> Numéro actuel</div>
            <div class="gs-card__value">{{ stats?.countdown?.state?.current_number ?? '—' }}</div>
          </div>
          <div class="gs-card">
            <div class="gs-card__label"> Piège actif</div>
            <div class="gs-card__value">{{ stats?.countdown?.state?.is_trap_active ? '🪤 Oui' : 'Non' }}</div>
          </div>
          <div class="gs-card">
            <div class="gs-card__label"> Top joueurs</div>
            <div class="gs-card__value">{{ stats?.countdown?.topPlayers?.length || 0 }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGamesStats, type GameStats } from '~/composables/useGamesStats';

const gs = useGamesStats();
const stats = ref<GameStats | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    stats.value = await gs.getStats();
  } catch (e: any) {
    error.value = e.message || 'Erreur inconnue';
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

.game-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.gs-card {
  background: var(--background-modifier-hover);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 14px;
  text-align: center;
}
.gs-card__label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.gs-card__value { font-size: 24px; font-weight: 700; color: var(--header-primary); }
</style>
