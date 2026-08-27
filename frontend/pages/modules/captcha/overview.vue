<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Bannière Stats -->
    <div class="module-stats-banner">
      <div class="module-stat-card">
        <div class="module-stat-icon">🔒</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Total Captchas</span>
          <span class="module-stat-value">{{ logs.length }}</span>
          <span class="module-stat-sub">Vérifications générées</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">✅</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Taux de Succès</span>
          <span class="module-stat-value" style="color: var(--green, #57f287);">{{ successRate }}%</span>
          <span class="module-stat-sub">{{ verifiedCount }} validé(s)</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">❌</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Échecs & Expirés</span>
          <span class="module-stat-value" style="color: var(--red, #ed4245);">{{ failedCount }}</span>
          <span class="module-stat-sub">Tentatives bloquées</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">⏳</div>
        <div class="module-stat-info">
          <span class="module-stat-label">En Attente</span>
          <span class="module-stat-value" style="color: var(--yellow, #fee75c);">{{ pendingCount }}</span>
          <span class="module-stat-sub">Vérifications en cours</span>
        </div>
      </div>
    </div>

    <!-- Dernières vérifications récentes -->
    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between;">
        <span>⚡ Dernières vérifications récentes</span>
        <NuxtLink to="/modules/captcha/logs" class="module-btn" style="font-size: 12px; padding: 4px 10px; text-decoration: none;">
          Voir tout le journal ({{ logs.length }}) →
        </NuxtLink>
      </div>

      <div v-if="isLoading" style="display: flex; justify-content: center; padding: 30px;">
        <div class="spinner" style="width: 28px; height: 28px;"></div>
      </div>

      <div v-else-if="logs.length === 0" style="color: var(--text-muted); text-align: center; padding: 30px;">
        Aucune tentative de captcha enregistrée pour l'instant.
      </div>

      <div v-else class="module-table-wrapper">
        <table class="module-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Question & Réponse</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in recentLogs" :key="item.id || item._id">
              <td>
                <strong style="color: var(--header-primary);">{{ item.username || item.userTag || 'Membre' }}</strong>
                <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-code);">ID: {{ item.userId || item.user_id }}</div>
              </td>
              <td>
                <span style="font-family: var(--font-code); color: var(--header-primary);">{{ item.question }}</span>
                <span v-if="item.expectedAnswer" style="font-size: 11px; color: var(--text-muted); margin-left: 6px;">
                  (= <strong>{{ item.expectedAnswer }}</strong>)
                </span>
              </td>
              <td>
                <span v-if="item.verified" class="module-status-pill verified">
                  ✅ Validé
                </span>
                <span v-else-if="item.status === 'failed'" class="module-status-pill failed">
                  ❌ Échoué
                </span>
                <span v-else class="module-status-pill pending">
                  ⏳ En attente
                </span>
              </td>
              <td style="font-size: 12px; color: var(--text-normal);">
                {{ formatDate(item.createdAt || item.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';

const { apiFetch } = useDiscordApi();

const logs = ref<any[]>([]);
const isLoading = ref(true);

const verifiedCount = computed(() => logs.value.filter(l => l.verified).length);
const failedCount = computed(() => logs.value.filter(l => l.status === 'failed' || (!l.verified && l.attempts >= 3)).length);
const pendingCount = computed(() => logs.value.filter(l => !l.verified && l.status !== 'failed' && (l.attempts || 0) < 3).length);

const successRate = computed(() => {
  if (logs.value.length === 0) return 100;
  return Math.round((verifiedCount.value / logs.value.length) * 100);
});

const recentLogs = computed(() => {
  return logs.value.slice(0, 5);
});

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

async function loadLogs() {
  isLoading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data: any[] }>('/api/security-question/logs');
    if (res.success && Array.isArray(res.data)) {
      logs.value = res.data;
    }
  } catch (err) {
    console.error('Erreur chargement logs captcha:', err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadLogs();
});
</script>
