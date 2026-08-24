<template>
  <div class="view-panel">
    <div class="captcha-view-scroller">
      <!-- Bannière de Statistiques -->
      <div class="captcha-stats-banner">
        <div class="captcha-stat-card">
          <div class="captcha-stat-icon">🔒</div>
          <div class="captcha-stat-info">
            <span class="captcha-stat-label">Total Captchas</span>
            <span class="captcha-stat-value">{{ logs.length }}</span>
            <span class="captcha-stat-sub">Vérifications générées</span>
          </div>
        </div>

        <div class="captcha-stat-card">
          <div class="captcha-stat-icon">✅</div>
          <div class="captcha-stat-info">
            <span class="captcha-stat-label">Taux de Succès</span>
            <span class="captcha-stat-value" style="color: var(--green);">{{ successRate }}%</span>
            <span class="captcha-stat-sub">{{ verifiedCount }} validé(s)</span>
          </div>
        </div>

        <div class="captcha-stat-card">
          <div class="captcha-stat-icon">❌</div>
          <div class="captcha-stat-info">
            <span class="captcha-stat-label">Échecs & Expirés</span>
            <span class="captcha-stat-value" style="color: var(--red);">{{ failedCount }}</span>
            <span class="captcha-stat-sub">Tentatives bloquées</span>
          </div>
        </div>
      </div>

      <!-- Barre d'outils et filtres -->
      <div class="captcha-toolbar">
        <div class="captcha-filter-chips">
          <button
            :class="['filter-chip', { active: statusFilter === 'all' }]"
            @click="statusFilter = 'all'"
          >
            Tous les statuts ({{ logs.length }})
          </button>
          <button
            :class="['filter-chip', { active: statusFilter === 'verified' }]"
            @click="statusFilter = 'verified'"
          >
            ✅ Validés ({{ verifiedCount }})
          </button>
          <button
            :class="['filter-chip', { active: statusFilter === 'pending' }]"
            @click="statusFilter = 'pending'"
          >
            ⏳ En attente
          </button>
          <button
            :class="['filter-chip', { active: statusFilter === 'failed' }]"
            @click="statusFilter = 'failed'"
          >
            ❌ Échoués
          </button>
          <button
            :class="['filter-chip', { active: statusFilter === 'expired' }]"
            @click="statusFilter = 'expired'"
          >
            ⏰ Expirés
          </button>
        </div>

        <div class="search-input-wrapper" style="max-width: 240px; margin-left: auto;">
          <input
            v-model="searchQuery"
            type="text"
            class="discord-input"
            placeholder="Filtrer par utilisateur..."
          />
        </div>

        <button class="action-btn" @click="loadCaptchaLogs">
          🔄 Rafraîchir
        </button>
      </div>

      <!-- Tableau des logs de Captcha -->
      <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>

      <div v-else-if="filteredLogs.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
        Aucun log de captcha correspondant aux critères.
      </div>

      <div v-else class="captcha-table-wrapper">
        <table class="captcha-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Question Mathématique</th>
              <th>Tentatives</th>
              <th>Statut</th>
              <th>Date / Heure</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredLogs" :key="item.id || item._id">
              <td>
                <div style="display: flex; flex-direction: column;">
                  <strong style="color: var(--header-primary);">{{ item.username || item.userTag || 'Membre' }}</strong>
                  <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-code);">ID: {{ item.userId || item.user_id }}</span>
                </div>
              </td>
              <td>
                <span style="font-family: var(--font-code); font-weight: 600; color: #85c1e9;">
                  {{ item.question || item.expression || 'N/A' }}
                </span>
              </td>
              <td>
                <span :class="['captcha-attempts-pill', { danger: (item.attempts || 0) >= 3 }]">
                  {{ item.attempts || 0 }} / {{ item.maxAttempts || 3 }}
                </span>
              </td>
              <td>
                <span :class="['captcha-status-pill', getStatusClass(item.status)]">
                  {{ getStatusLabel(item.status) }}
                </span>
              </td>
              <td style="font-size: 12px; color: var(--text-muted);">
                {{ formatDateTime(item.createdAt || item.timestamp) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const logs = ref<any[]>([]);
const statusFilter = ref('all');
const searchQuery = ref('');
const isLoading = ref(true);

onMounted(() => {
  loadCaptchaLogs();
});

async function loadCaptchaLogs() {
  isLoading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data?: any[] }>('/api/captcha-logs');
    if (res.success && Array.isArray(res.data)) {
      logs.value = res.data;
    }
  } catch (err: any) {
    console.warn('Erreur chargement captcha logs:', err);
  } finally {
    isLoading.value = false;
  }
}

const verifiedCount = computed(() => {
  return logs.value.filter(l => l.status === 'verified' || l.status === 'success').length;
});

const failedCount = computed(() => {
  return logs.value.filter(l => l.status === 'failed' || l.status === 'expired').length;
});

const successRate = computed(() => {
  if (logs.value.length === 0) return 100;
  return Math.round((verifiedCount.value / logs.value.length) * 100);
});

const filteredLogs = computed(() => {
  const sf = statusFilter.value;
  const q = searchQuery.value.toLowerCase().trim();

  return logs.value.filter(item => {
    if (sf !== 'all') {
      const st = (item.status || '').toLowerCase();
      if (sf === 'verified' && st !== 'verified' && st !== 'success') return false;
      if (sf === 'pending' && st !== 'pending') return false;
      if (sf === 'failed' && st !== 'failed') return false;
      if (sf === 'expired' && st !== 'expired') return false;
    }

    if (q) {
      const match = (item.username && item.username.toLowerCase().includes(q)) ||
                    (item.userTag && item.userTag.toLowerCase().includes(q)) ||
                    (item.userId && item.userId.includes(q));
      if (!match) return false;
    }

    return true;
  });
});

function getStatusClass(status: string): string {
  const st = (status || '').toLowerCase();
  if (st === 'verified' || st === 'success') return 'verified';
  if (st === 'failed') return 'failed';
  if (st === 'expired') return 'expired';
  return 'pending';
}

function getStatusLabel(status: string): string {
  const st = (status || '').toLowerCase();
  if (st === 'verified' || st === 'success') return '✅ Vérifié';
  if (st === 'failed') return '❌ Échoué';
  if (st === 'expired') return '⏰ Expiré';
  return '⏳ En attente';
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
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
</script>
