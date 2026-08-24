<template>
  <div class="view-panel">
    <!-- Onglets de sous-navigation Module -->
    <div class="captcha-subtabs" style="padding: 12px 24px 0 24px; background-color: var(--bg-secondary);">
      <button
        :class="['captcha-subtab-btn', { active: activeSubTab === 'stats' }]"
        @click="activeSubTab = 'stats'"
      >
        📊 Statistiques & Vérifications
      </button>
      <button
        :class="['captcha-subtab-btn', { active: activeSubTab === 'config' }]"
        @click="activeSubTab = 'config'"
      >
        ⚙️ Configuration du Module
      </button>
    </div>

    <!-- SOUS-ONGLET 1 : STATS & LOGS -->
    <div v-if="activeSubTab === 'stats'" class="captcha-view-scroller">
      <!-- Bannière Stats -->
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

      <!-- Barre d'outils -->
      <div class="captcha-toolbar">
        <div class="captcha-filter-chips">
          <button :class="['filter-chip', { active: statusFilter === 'all' }]" @click="statusFilter = 'all'">
            Tous ({{ logs.length }})
          </button>
          <button :class="['filter-chip', { active: statusFilter === 'verified' }]" @click="statusFilter = 'verified'">
            ✅ Validés ({{ verifiedCount }})
          </button>
          <button :class="['filter-chip', { active: statusFilter === 'failed' }]" @click="statusFilter = 'failed'">
            ❌ Échoués / Expirés
          </button>
        </div>

        <div class="search-input-wrapper" style="max-width: 240px; margin-left: auto;">
          <input v-model="searchQuery" type="text" class="discord-input" placeholder="Filtrer par utilisateur..." />
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
        Aucun enregistrement trouvé.
      </div>

      <div v-else class="captcha-table-wrapper">
        <table class="captcha-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Question Arithmétique</th>
              <th>Tentatives</th>
              <th>Statut</th>
              <th>Date</th>
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

    <!-- SOUS-ONGLET 2 : CONFIGURATION DU MODULE -->
    <div v-else-if="activeSubTab === 'config'" class="captcha-view-scroller" style="max-width: 800px;">
      <div class="config-card">
        <div class="form-group-toggle">
          <div class="toggle-info">
            <span class="form-label">Activer le Captcha Mathématique</span>
            <p class="form-help">Crée automatiquement un salon temporaire à l'arrivée d'un nouveau membre.</p>
          </div>
          <label class="switch">
            <input v-model="config.enabled" type="checkbox" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="form-divider"></div>

        <div class="form-row">
          <div class="col-half">
            <label class="form-label">ID du Rôle Vérifié</label>
            <input v-model="config.verified_role_id" type="text" class="discord-input" placeholder="ID rôle" />
          </div>
          <div class="col-half">
            <label class="form-label">Nom du Salon Temporaire</label>
            <input v-model="config.captcha_channel_name" type="text" class="discord-input" />
          </div>
        </div>

        <div class="form-row">
          <div class="col-half">
            <label class="form-label">Temps limite (minutes)</label>
            <input v-model.number="config.captcha_timeout" type="number" class="discord-input" />
          </div>
          <div class="col-half">
            <label class="form-label">Nombre Max de Tentatives</label>
            <input v-model.number="config.max_attempts" type="number" class="discord-input" />
          </div>
        </div>

        <div class="config-actions-bar">
          <button class="btn-primary" :disabled="isSaving" @click="saveModuleConfig">
            {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Configuration Captcha' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const activeSubTab = ref<'stats' | 'config'>('stats');
const logs = ref<any[]>([]);
const config = ref<any>({ enabled: true, verified_role_id: '', captcha_channel_name: '', captcha_timeout: 10, max_attempts: 3 });
const statusFilter = ref('all');
const searchQuery = ref('');
const isLoading = ref(true);
const isSaving = ref(false);

onMounted(async () => {
  await Promise.all([
    loadCaptchaLogs(),
    loadModuleConfig()
  ]);
});

async function loadCaptchaLogs() {
  isLoading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data?: any[] }>('/api/captcha-logs');
    if (res.success && Array.isArray(res.data)) {
      logs.value = res.data;
    }
  } catch (err) {
    console.error('Erreur logs captcha:', err);
  } finally {
    isLoading.value = false;
  }
}

async function loadModuleConfig() {
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/config');
    if (res.success && res.data?.captcha) {
      config.value = res.data.captcha;
    }
  } catch (err) {
    console.error('Erreur config captcha:', err);
  }
}

async function saveModuleConfig() {
  isSaving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/config', {
      method: 'POST',
      body: JSON.stringify({
        module: 'captcha',
        config: config.value
      })
    });
    if (res.success) {
      showToast('Configuration Captcha enregistrée dans config.yml !', 'success');
    }
  } catch (err: any) {
    showToast(`Erreur de sauvegarde: ${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}

const verifiedCount = computed(() => logs.value.filter(l => l.status === 'verified' || l.status === 'success').length);
const failedCount = computed(() => logs.value.filter(l => l.status === 'failed' || l.status === 'expired').length);
const successRate = computed(() => {
  if (logs.value.length === 0) return 100;
  return Math.round((verifiedCount.value / logs.value.length) * 100);
});

const filteredLogs = computed(() => {
  const sf = statusFilter.value;
  const q = searchQuery.value.toLowerCase().trim();

  return logs.value.filter(item => {
    if (sf === 'verified' && item.status !== 'verified' && item.status !== 'success') return false;
    if (sf === 'failed' && item.status !== 'failed' && item.status !== 'expired') return false;

    if (q) {
      const match = (item.username && item.username.toLowerCase().includes(q)) ||
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
