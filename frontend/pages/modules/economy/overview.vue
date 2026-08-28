<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Bannière Stats -->
    <div class="module-stats-banner">
      <div class="module-stat-card">
        <div class="module-stat-icon">🪙</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Total en circulation</span>
          <span class="module-stat-value">{{ totalBalance.toLocaleString('fr-FR') }}</span>
          <span class="module-stat-sub">Distribué sur {{ totalUsers }} membres</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">🏆</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Plus riche</span>
          <span class="module-stat-value">{{ topBalance.toLocaleString('fr-FR') }}</span>
          <span class="module-stat-sub" v-if="topUserId">membre <code>{{ topUserId.slice(0, 14) }}…</code></span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">🛒</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Items en vente</span>
          <span class="module-stat-value">{{ shopCount }}</span>
          <span class="module-stat-sub">dans le shop</span>
        </div>
      </div>
    </div>

    <!-- Guide -->
    <div class="config-card">
      <div class="card-subtitle">📖 Fonctionnement</div>
      <p style="color: var(--text-muted); font-size: 13px; line-height: 1.6; margin: 8px 0 16px;">
        Le système économique permet aux membres de gagner, dépenser et échanger de la monnaie virtuelle.
        Configurez le <strong>daily reward</strong>, les <strong>items de boutique</strong> et les <strong>drops</strong>.
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; margin-bottom: 16px;">
        <button class="quick-action" @click="openDaily">
          <span class="quick-action__icon">📅</span>
          <span class="quick-action__label">/daily</span>
          <span class="quick-action__hint">Récompense quotidienne</span>
        </button>
        <button class="quick-action" @click="openShop">
          <span class="quick-action__icon">🛒</span>
          <span class="quick-action__label">/shop</span>
          <span class="quick-action__hint">Boutique d'items</span>
        </button>
        <button class="quick-action" @click="openPay">
          <span class="quick-action__icon">💸</span>
          <span class="quick-action__label">/pay</span>
          <span class="quick-action__hint">Envoyer de la monnaie</span>
        </button>
        <button class="quick-action" @click="openLeaderboard">
          <span class="quick-action__icon">🏆</span>
          <span class="quick-action__label">/leaderboard</span>
          <span class="quick-action__hint">Top 10 des plus riches</span>
        </button>
        <button class="quick-action" @click="openDrop">
          <span class="quick-action__icon">🎁</span>
          <span class="quick-action__label">/dropobjet</span>
          <span class="quick-action__hint">Lancer un drop</span>
        </button>
        <button class="quick-action" @click="openInv">
          <span class="quick-action__icon">🎒</span>
          <span class="quick-action__label">/inventaire</span>
          <span class="quick-action__hint">Voir les items</span>
        </button>
      </div>
    </div>

    <!-- Top 10 Leaderboard -->
    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between;">
        <span>🏆 Top 10 Soldes</span>
        <button class="module-btn" @click="load" :disabled="loading">{{ loading ? '⏳' : '🔄' }} Rafraîchir</button>
      </div>
      <div v-if="top10.length === 0" style="color: var(--text-muted); text-align: center; padding: 24px;">
        Aucun solde enregistré pour le moment.
      </div>
      <div v-else>
        <div v-for="(b, i) in top10" :key="b.userId" class="lb-row">
          <div class="lb-row__rank">
            <span v-if="i === 0">🥇</span>
            <span v-else-if="i === 1">🥈</span>
            <span v-else-if="i === 2">🥉</span>
            <span v-else>#{{ i + 1 }}</span>
          </div>
          <div class="lb-row__user">
            <code>{{ b.userId.slice(0, 18) }}…</code>
          </div>
          <div class="lb-row__amount">
            <strong>{{ b.balance.toLocaleString('fr-FR') }}</strong> 🪙
          </div>
          <div class="lb-row__bar">
            <div class="lb-row__fill" :style="{ width: topBalance > 0 ? (b.balance / topBalance * 100) + '%' : '0%' }" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="config-card" style="color: var(--red);">❌ {{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEconomy } from '~/composables/useEconomy';
import { useFeatures } from '~/composables/useFeatures';

const economy = useEconomy();
const features = useFeatures();
const config = ref<any>(null);
const leaderboard = ref<any[]>([]);
const shopCount = ref(0);
const loading = ref(false);
const error = ref<string | null>(null);

const totalBalance = computed(() => leaderboard.value.reduce((s, b) => s + (b.balance || 0), 0));
const totalUsers = computed(() => leaderboard.value.length);
const topBalance = computed(() => leaderboard.value[0]?.balance || 0);
const topUserId = computed(() => leaderboard.value[0]?.userId || null);
const top10 = computed(() => leaderboard.value.slice(0, 10));

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const [state, lb] = await Promise.all([
      features.get('economy'),
      economy.getLeaderboard(undefined, 50)
    ]);
    config.value = state?.state?.config || state?.config || null;
    leaderboard.value = lb || [];
    // Pour le compteur d'items, on fait un appel séparé au shop
    try {
      const shop = await economy.listShop();
      shopCount.value = shop.length;
    } catch {}
  } catch (e: any) {
    error.value = e.message || 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}

function openDaily() { window.open('https://discord.com/channels', '_blank'); }
function openShop() { navigateToInternal('/modules/economy/shop'); }
function openPay() { window.open('https://discord.com/channels', '_blank'); }
function openLeaderboard() { window.open('https://discord.com/channels', '_blank'); }
function openDrop() { window.open('https://discord.com/channels', '_blank'); }
function openInv() { window.open('https://discord.com/channels', '_blank'); }

function navigateToInternal(path: string) {
  if (typeof window !== 'undefined') {
    window.location.href = path;
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
.module-btn:hover:not(:disabled) { background: var(--brand-experiment, #5865f2); color: white; }

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px;
  background: var(--background-modifier-hover);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-normal);
  cursor: pointer;
  font-family: inherit;
  text-align: center;
  transition: transform 0.15s, background 0.15s;
}
.quick-action:hover {
  background: var(--brand-experiment, #5865f2);
  color: white;
  transform: translateY(-2px);
}
.quick-action__icon { font-size: 24px; }
.quick-action__label { font-weight: 600; font-size: 13px; }
.quick-action__hint { font-size: 11px; color: var(--text-muted); }

.lb-row {
  display: grid;
  grid-template-columns: 50px 1fr 100px 200px;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.lb-row:last-child { border-bottom: none; }
.lb-row__rank {
  font-size: 16px;
  text-align: center;
  font-weight: 600;
  color: var(--text-muted);
}
.lb-row__user code { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-muted); }
.lb-row__amount { text-align: right; font-size: 14px; }
.lb-row__bar {
  height: 8px;
  background: var(--background-secondary);
  border-radius: 4px;
  overflow: hidden;
}
.lb-row__fill {
  height: 100%;
  background: linear-gradient(90deg, #5865f2, #eb459e);
  border-radius: 4px;
  transition: width 0.3s;
}
</style>
