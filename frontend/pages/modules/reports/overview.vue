<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div v-if="error" class="config-card" style="color: var(--red);">❌ {{ error }}</div>

    <!-- KPI banner -->
    <div class="module-stats-banner">
      <div class="module-stat-card">
        <div class="module-stat-icon">📬</div>
        <div class="module-stat-info">
          <span class="module-stat-label">En attente</span>
          <span class="module-stat-value" :style="{ color: stats.open > 0 ? 'var(--red)' : 'var(--green)' }">
            {{ stats.open }}
          </span>
          <span class="module-stat-sub">reports à traiter</span>
        </div>
      </div>
      <div class="module-stat-card">
        <div class="module-stat-icon">✅</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Résolus</span>
          <span class="module-stat-value" style="color: var(--green);">{{ stats.resolved }}</span>
          <span class="module-stat-sub">actions prises</span>
        </div>
      </div>
      <div class="module-stat-card">
        <div class="module-stat-icon">🚯</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Rejetés</span>
          <span class="module-stat-value">{{ stats.dismissed }}</span>
          <span class="module-stat-sub">faux signalements</span>
        </div>
      </div>
      <div class="module-stat-card">
        <div class="module-stat-icon">📊</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Total</span>
          <span class="module-stat-value">{{ stats.total }}</span>
          <span class="module-stat-sub">depuis le début</span>
        </div>
      </div>
    </div>

    <div class="config-card">
      <div class="card-subtitle">💡 Comment ça marche</div>
      <ul style="margin: 8px 0 0 20px; color: var(--text-muted); font-size: 13px; line-height: 1.7;">
        <li>Les membres peuvent signaler un message ou un utilisateur via le <strong>menu contextuel</strong> (clic droit → Apps → Report user).</li>
        <li>Un <strong>modal</strong> s'ouvre pour saisir la raison + la catégorie.</li>
        <li>Le report arrive dans la <strong>file d'attente</strong> ci-dessous.</li>
        <li>Le staff utilise <code>/reports-list</code> et <code>/reports-resolve</code> / <code>/reports-dismiss</code> pour traiter.</li>
        <li><strong>Anti-spam</strong> : 1 report par user cible toutes les 5 minutes, max 5 ouverts par cible.</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useReports, type ReportStats } from '~/composables/useReports';

const api = useReports();
const stats = ref<ReportStats>({ open: 0, resolved: 0, dismissed: 0, total: 0 });
const error = ref<string | null>(null);

async function load() {
  try {
    const res = await api.stats();
    if (res) {
      stats.value = res;
    }
  } catch (e: any) {
    error.value = e.message;
  }
}

onMounted(load);
</script>

<style scoped>
.config-card {
  background: var(--background-modifier-hover);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
  color: var(--text-normal);
}
.config-card ul { margin: 8px 0 0 20px; }
</style>
