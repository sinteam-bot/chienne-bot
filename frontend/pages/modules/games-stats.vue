<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <div class="module-header" style="margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
            <span>🎮</span> Statistiques de Jeux
          </h2>
          <p class="module-desc" style="margin: 0; color: var(--text-muted); font-size: 13px;">
            Vue d'ensemble des jeux (Compteur, Countdown) et de leurs top joueurs.
          </p>
        </div>

        <div class="module-tab-nav" style="margin-top: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; flex-wrap: wrap;">
          <NuxtLink
            to="/modules/games-stats/overview"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/games-stats/overview') }"
          >
            <span>📊</span> Vue d'ensemble
          </NuxtLink>
          <NuxtLink
            to="/modules/games-stats/players"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/games-stats/players') }"
          >
            <span>🏆</span> Top joueurs
          </NuxtLink>
        </div>
      </div>

      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

definePageMeta({
  title: 'Statistiques de Jeux',
  icon: '🎮',
  description: 'Compteur et Countdown — états en temps réel et top joueurs',
  section: 'modules',
  order: 12
});

useSeoMeta({
  title: 'Statistiques de Jeux - Chienne Bot',
  description: 'Statistiques des jeux Compteur et Countdown',
  ogTitle: 'Statistiques de Jeux - Chienne Bot',
  ogDescription: 'Vue d\'ensemble des jeux Compteur et Countdown avec top joueurs.'
});

const route = useRoute();
function isTabActive(path: string): boolean {
  if (path === '/modules/games-stats/overview' && (route.path === '/modules/games-stats' || route.path === '/modules/games-stats/')) return true;
  return route.path.startsWith(path);
}
</script>

<style scoped>
.module-tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.module-tab-btn:hover { background: var(--background-modifier-hover); color: var(--text-normal); }
.module-tab-btn.active { background: var(--brand-experiment, #5865f2); color: white; font-weight: 600; }
</style>
