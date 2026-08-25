<template>
  <div class="view-panel">
    <!-- Onglets de sous-navigation Module -->
    <div class="captcha-subtabs" style="padding: 12px 24px 0 24px; background-color: var(--bg-secondary);">
      <button
        :class="['captcha-subtab-btn', { active: activeSubTab === 'stats' }]"
        @click="activeSubTab = 'stats'"
      >
        📊 Leaderboard & Classement
      </button>
      <button
        :class="['captcha-subtab-btn', { active: activeSubTab === 'config' }]"
        @click="activeSubTab = 'config'"
      >
        ⚙️ Configuration du Module
      </button>
    </div>

    <!-- SOUS-ONGLET 1 : STATS & LEADERBOARD -->
    <div v-if="activeSubTab === 'stats'" class="daily-scroller">
      <!-- Bannière Stats -->
      <div class="daily-stats-banner">
        <div class="daily-stat-card">
          <div class="daily-stat-icon">⭐</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Statut du Système XP</span>
            <span class="daily-stat-value" :style="{ color: config?.enabled ? 'var(--green)' : 'var(--text-muted)' }">
              {{ config?.enabled ? 'Activé' : 'Désactivé' }}
            </span>
            <span class="daily-stat-sub">Gain XP Messages & Vocal</span>
          </div>
        </div>

        <div class="daily-stat-card">
          <div class="daily-stat-icon">🏆</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Membres Classés</span>
            <span class="daily-stat-value">{{ rankedUsers.length }}</span>
            <span class="daily-stat-sub">Membres avec XP actif</span>
          </div>
        </div>
      </div>

      <!-- Tableau du Classement XP -->
      <div class="daily-history-header">
        <h3>Classement des Niveaux du Serveur</h3>
      </div>

      <div v-if="users.length === 0" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>

      <div v-else class="users-table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th>Rang</th>
              <th>Membre</th>
              <th>Niveau</th>
              <th>XP Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(u, idx) in rankedUsers" :key="u.id">
              <td>
                <strong :style="{ color: idx === 0 ? '#f1c40f' : idx === 1 ? '#bdc3c7' : idx === 2 ? '#e67e22' : 'var(--text-muted)' }">
                  {{ idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}` }}
                </strong>
              </td>
              <td>
                <div class="user-td-member">
                  <img :src="u.avatarUrl" :alt="u.username" class="user-td-avatar" loading="lazy" referrerpolicy="no-referrer" />
                  <div class="user-td-info">
                    <span class="user-td-name">{{ u.displayName || u.username }}</span>
                    <span class="user-td-sub">@{{ u.username }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="user-level-pill">
                  Niv. {{ u.level || 1 }}
                </span>
              </td>
              <td>
                <strong style="color: var(--header-primary); font-family: var(--font-code);">
                  {{ u.xp || 0 }} XP
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SOUS-ONGLET 2 : CONFIGURATION DU MODULE -->
    <div v-else-if="activeSubTab === 'config'" class="daily-scroller" style="max-width: 800px;">
      <div class="config-card">
        <div class="form-group-toggle">
          <div class="toggle-info">
            <span class="form-label">Activer le Système XP & Niveaux</span>
            <p class="form-help">Permet aux membres de gagner de l'expérience en discutant et en vocal.</p>
          </div>
          <label class="switch">
            <input v-model="config.enabled" type="checkbox" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="form-divider"></div>

        <div class="card-subtitle">XP par Message</div>
        <div class="form-row">
          <div class="col-third">
            <label class="form-label">XP Min</label>
            <input v-model.number="config.message_xp.min" type="number" class="discord-input" />
          </div>
          <div class="col-third">
            <label class="form-label">XP Max</label>
            <input v-model.number="config.message_xp.max" type="number" class="discord-input" />
          </div>
          <div class="col-third">
            <label class="form-label">Cooldown (secondes)</label>
            <input v-model.number="config.message_xp.cooldown" type="number" class="discord-input" />
          </div>
        </div>

        <div class="card-subtitle" style="margin-top: 10px;">Calcul des Niveaux</div>
        <div class="form-row">
          <div class="col-half">
            <label class="form-label">XP de Base (Niveau 1)</label>
            <input v-model.number="config.level.base_xp" type="number" class="discord-input" />
          </div>
          <div class="col-half">
            <label class="form-label">Multiplicateur par Niveau</label>
            <input v-model.number="config.level.multiplier" type="number" step="0.1" class="discord-input" />
          </div>
        </div>

        <div class="config-actions-bar">
          <button class="btn-primary" :disabled="isSaving" @click="saveModuleConfig">
            {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Configuration XP' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import { useAppState } from '~/composables/useAppState.ts';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();
const { users, fetchUsersAndRoles } = useAppState();

const activeSubTab = ref<'stats' | 'config'>('stats');
const config = ref<any>({
  enabled: false,
  message_xp: { min: 15, max: 25, cooldown: 10 },
  voice_xp: { per_minute: 2, check_interval: 5, min_duration: 1 },
  level: { base_xp: 100, multiplier: 1.5 }
});
const isSaving = ref(false);

onMounted(async () => {
  if (users.value.length === 0) fetchUsersAndRoles();
  loadModuleConfig();
});

async function loadModuleConfig() {
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/config');
    if (res.success && res.data?.xp) {
      config.value = res.data.xp;
      config.value.message_xp = config.value.message_xp || { min: 15, max: 25, cooldown: 10 };
      config.value.level = config.value.level || { base_xp: 100, multiplier: 1.5 };
    }
  } catch (err) {
    console.error('Erreur config xp:', err);
  }
}

async function saveModuleConfig() {
  isSaving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/config', {
      method: 'POST',
      body: JSON.stringify({
        module: 'xp',
        config: config.value
      })
    });
    if (res.success) {
      showToast('Configuration XP & Niveaux enregistrée dans config.yml !', 'success');
    }
  } catch (err: any) {
    showToast(`Erreur d'enregistrement: ${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}

const rankedUsers = computed(() => {
  return [...users.value].sort((a, b) => (b.xp || 0) - (a.xp || 0));
});
</script>
