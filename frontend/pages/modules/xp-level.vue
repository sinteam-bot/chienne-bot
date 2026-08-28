<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <!-- En-tête du module XP Level -->
      <div class="module-header" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 22px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
              <span>⭐</span> Système de Niveaux & XP
            </h2>
            <p class="module-desc" style="margin: 0; color: var(--text-muted); font-size: 13px;">
              Gain d'expérience par messages et présence vocale, leaderboard des membres et attribution automatique de rôles de paliers.
            </p>
          </div>
        </div>

        <!-- Sous-navigation des onglets du module -->
        <div class="module-tab-nav" style="margin-top: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; flex-wrap: wrap;">
          <NuxtLink
            to="/modules/xp-level/leaderboard"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/xp-level/leaderboard') }"
          >
            <span>🏆</span> Classement des Membres
          </NuxtLink>
          <NuxtLink
            to="/modules/xp-level/config"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/xp-level/config') }"
          >
            <span>⚙️</span> Configuration & Paliers
          </NuxtLink>
        </div>
      </div>

      <!-- Sous-page injectée -->
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

definePageMeta({
  title: 'Système XP & Level',
  icon: '⭐',
  description: 'Progression par niveaux, leaderboard et rôles de récompense',
  section: 'modules',
  order: 5
});

useSeoMeta({
  title: 'Système XP & Niveaux',
  description: 'Gain d\'expérience par messages et présence vocale, leaderboard et rôles de paliers',
  ogTitle: 'Système XP & Niveaux - Bot',
  ogDescription: 'Gain d\'expérience par messages et présence vocale, leaderboard et rôles de paliers'
});

const route = useRoute();

function isTabActive(path: string): boolean {
  if (path === '/modules/xp-level/leaderboard' && (route.path === '/modules/xp-level' || route.path === '/modules/xp-level/')) {
    return true;
  }
  return route.path.startsWith(path);
}
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
