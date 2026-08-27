<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Bannière Stats -->
    <div class="module-stats-banner">
      <div class="module-stat-card">
        <div class="module-stat-icon">⭐</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Statut du Système XP</span>
          <span class="module-stat-value" :style="{ color: config?.enabled ? 'var(--green)' : 'var(--text-muted)' }">
            {{ config?.enabled ? 'Activé' : 'Désactivé' }}
          </span>
          <span class="module-stat-sub">Gain XP Messages & Vocal</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">🏆</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Membres Classés</span>
          <span class="module-stat-value">{{ rankedUsers.length }}</span>
          <span class="module-stat-sub">Membres avec XP actif</span>
        </div>
      </div>
    </div>

    <!-- Tableau du Classement XP -->
    <div class="config-card">
      <div class="card-subtitle" style="margin-bottom: 14px;">
        <span>🏆 Classement des Niveaux du Serveur</span>
      </div>

      <div v-if="users.length === 0" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>

      <div v-else-if="rankedUsers.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
        Aucun membre classé pour l'instant.
      </div>

      <div v-else class="module-table-wrapper">
        <table class="module-table">
          <thead>
            <tr>
              <th style="width: 80px; text-align: center;">Rang</th>
              <th>Membre</th>
              <th style="width: 120px; text-align: center;">Niveau</th>
              <th style="width: 140px; text-align: right;">XP Total</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(u, idx) in rankedUsers"
              :key="u.id"
              style="cursor: pointer;"
              @click="inspectUser(u)"
            >
              <td style="text-align: center;">
                <strong :style="{ color: idx === 0 ? '#f1c40f' : idx === 1 ? '#bdc3c7' : idx === 2 ? '#e67e22' : 'var(--text-muted)' }">
                  {{ idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}` }}
                </strong>
              </td>
              <td>
                <div class="user-td-member" style="display: flex; align-items: center; gap: 10px;">
                  <img
                    :src="getProxiedImageUrl(u.avatarUrl)"
                    :alt="u.username"
                    class="user-td-avatar"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                    style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;"
                  />
                  <div class="user-td-info">
                    <span class="user-td-name" style="font-weight: 600; color: var(--header-primary);">{{ u.displayName || u.username }}</span>
                    <span class="user-td-sub" style="font-size: 11px; color: var(--text-muted); display: block;">@{{ u.username }}</span>
                  </div>
                </div>
              </td>
              <td style="text-align: center;">
                <span class="module-status-pill verified" style="font-size: 12px; font-weight: 700;">
                  Niv. {{ u.level || 1 }}
                </span>
              </td>
              <td style="text-align: right;">
                <span style="font-weight: 600; color: var(--green, #57f287);">
                  {{ (u.xp || 0).toLocaleString('fr-FR') }} XP
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import { useAppState } from '~/composables/useAppState.ts';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';

const { users, getProxiedImageUrl } = useAppState();
const { apiFetch } = useDiscordApi();

const inspectUser = inject<(user: any) => void>('inspectUser', () => {});

const config = ref<any>({
  enabled: true
});

const rankedUsers = computed(() => {
  return [...users.value]
    .filter(u => !u.isBot && ((u.xp && u.xp > 0) || (u.level && u.level > 1)))
    .sort((a, b) => (b.xp || 0) - (a.xp || 0));
});

async function loadConfig() {
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/config');
    if (res.success && res.data?.xp_level) {
      config.value = {
        ...config.value,
        ...res.data.xp_level
      };
    }
  } catch (err) {
    console.error('Erreur chargement config xp:', err);
  }
}

onMounted(() => {
  loadConfig();
});
</script>
