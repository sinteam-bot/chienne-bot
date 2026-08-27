<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <!-- En-tête du module Bump Reminder -->
      <div class="module-header" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 22px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
              <span>⏰</span> Rappels de Bump Disboard
            </h2>
            <p class="module-desc" style="margin: 0; color: var(--text-muted); font-size: 13px;">
              Détection automatique du bot Disboard, minuterie 2h temps réel, notifications personnalisées et classement des bumpers.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <span v-if="bumpStatus.enabled" class="module-status-pill verified">
              🟢 Module Actif
            </span>
            <span v-else class="module-status-pill failed">
              🔴 Désactivé
            </span>
          </div>
        </div>

        <!-- Sous-navigation des onglets du module -->
        <div class="module-tab-nav" style="margin-top: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; flex-wrap: wrap;">
          <NuxtLink
            to="/modules/bump-reminder/countdown"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/bump-reminder/countdown') }"
          >
            <span>⏳</span> Décompte & État
          </NuxtLink>
          <NuxtLink
            to="/modules/bump-reminder/history"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/bump-reminder/history') }"
          >
            <span>📜</span> Historique
          </NuxtLink>
          <NuxtLink
            to="/modules/bump-reminder/leaderboard"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/bump-reminder/leaderboard') }"
          >
            <span>🏆</span> Classement Bumpers
          </NuxtLink>
          <NuxtLink
            to="/modules/bump-reminder/config"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/bump-reminder/config') }"
          >
            <span>⚙️</span> Configuration
          </NuxtLink>
        </div>
      </div>

      <!-- Sous-page injectée -->
      <NuxtPage :bump-status="bumpStatus" @refresh="loadBumpStatus" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from 'vue';
import { useRoute } from 'vue-router';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';

definePageMeta({
  title: 'Rappels de Bump',
  icon: '⏰',
  description: 'Détection automatique de Disboard, minuterie 2h et rappels',
  section: 'modules',
  order: 2
});

useSeoMeta({
  title: 'Rappels de Bump Disboard',
  description: 'Détection automatique du bot Disboard, minuterie 2h et rappels configurables',
  ogTitle: 'Rappels de Bump Disboard - Chienne Bot',
  ogDescription: 'Détection automatique du bot Disboard, minuterie 2h et rappels configurables'
});

const route = useRoute();
const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const bumpStatus = ref<any>({
  enabled: true,
  hasBump: false,
  isReady: false,
  remainingSeconds: 0,
  targetTimestamp: 0,
  lastBump: null,
  history: []
});

const remainingSeconds = ref(0);
let timerInterval: any = null;

function isTabActive(path: string): boolean {
  if (path === '/modules/bump-reminder/countdown' && (route.path === '/modules/bump-reminder' || route.path === '/modules/bump-reminder/')) {
    return true;
  }
  return route.path.startsWith(path);
}

async function loadBumpStatus() {
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/bump');
    if (res.success && res.data) {
      bumpStatus.value = res.data;
      remainingSeconds.value = res.data.remainingSeconds || 0;
    }
  } catch (err: any) {
    showToast('Erreur chargement bump: ' + err.message, 'error');
  }
}

provide('bumpStatus', bumpStatus);
provide('loadBumpStatus', loadBumpStatus);

onMounted(() => {
  loadBumpStatus();
  timerInterval = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
      if (remainingSeconds.value === 0) {
        bumpStatus.value.isReady = true;
      }
    }
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

useHead({
  title: 'Rappels de Bump Disboard - Chienne Bot'
});
</script>

<style scoped>
.module-tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-tertiary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 6px;
  color: var(--text-muted, #949ba4);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.module-tab-btn:hover {
  background: var(--bg-modifier-hover, rgba(255, 255, 255, 0.05));
  color: var(--header-primary, #ffffff);
}

.module-tab-btn.active {
  background: var(--brand-experiment, #5865f2);
  border-color: var(--brand-experiment, #5865f2);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(88, 101, 242, 0.35);
}
</style>
