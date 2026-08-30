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
              v-for="(u, idx) in paginatedUsers"
              :key="u.id"
            >
              <td style="text-align: center;">
                <strong :style="{ color: ((currentPage - 1) * pageSize + idx) === 0 ? '#f1c40f' : ((currentPage - 1) * pageSize + idx) === 1 ? '#bdc3c7' : ((currentPage - 1) * pageSize + idx) === 2 ? '#e67e22' : 'var(--text-muted)' }">
                  {{ ((currentPage - 1) * pageSize + idx) === 0 ? '🥇 #1' : ((currentPage - 1) * pageSize + idx) === 1 ? '🥈 #2' : ((currentPage - 1) * pageSize + idx) === 2 ? '🥉 #3' : `#${(currentPage - 1) * pageSize + idx + 1}` }}
                </strong>
              </td>
              <td>
                <DiscordUser
                  :user="u"
                  :show-id="true"
                  :avatar-size="32"
                />
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

      <!-- Pagination Discord -->
      <DiscordPagination
        v-model="currentPage"
        v-model:page-size="pageSize"
        :total-items="rankedUsers.length"
        :page-size-options="[10, 15, 25, 50, 100]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import { useAppState } from '~/composables/useAppState.ts';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import DiscordPagination from '~/components/common/DiscordPagination.vue';
import DiscordUser from '~/components/common/DiscordUser.vue';

import { useConfigFeature } from '~/composables/useConfigFeature.ts';

definePageMeta({
  title: 'Classement XP',
  icon: '🏆',
  description: 'Classement des membres par points d\'expérience et niveau',
  section: 'modules',
  hidden: true
});

useSeoMeta({
  title: 'Classement des Membres - Système XP',
  description: 'Classement des membres par points d\'expérience et niveau',
  ogTitle: 'Classement des Membres - Système XP',
  ogDescription: 'Classement des membres par points d\'expérience et niveau'
});

const { users } = useAppState();
const inspectUser = inject<(user: any) => void>('inspectUser', () => {});

const { config, load: loadConfig } = useConfigFeature('xp', {
  defaultConfig: {
    enabled: true
  }
});

const currentPage = ref(1);
const pageSize = ref(15);

const rankedUsers = computed(() => {
  return [...users.value]
    .filter(u => !u.isBot && ((u.xp && u.xp > 0) || (u.level && u.level > 1)))
    .sort((a, b) => (b.xp || 0) - (a.xp || 0));
});

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return rankedUsers.value.slice(start, start + pageSize.value);
});

onMounted(() => {
  loadConfig();
});
</script>
