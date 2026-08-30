<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <!-- En-tête du module Birthdays -->
      <div class="module-header" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 22px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
              <span>🎂</span> Anniversaires &amp; Célébrations
            </h2>
            <p class="module-desc" style="margin: 0; color: var(--text-muted); font-size: 13px;">
              Célébration automatique des anniversaires des membres, attribution de rôles temporaires le jour J et cadeaux XP.
            </p>
          </div>
        </div>

        <!-- Sous-navigation des onglets du module -->
        <div class="module-tab-nav" style="margin-top: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; flex-wrap: wrap;">
          <NuxtLink
            to="/modules/birthdays/overview"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/birthdays/overview') }"
          >
            <span>📅</span> Prochains Anniversaires
          </NuxtLink>
          <NuxtLink
            to="/modules/birthdays/config"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/birthdays/config') }"
          >
            <span>⚙️</span> Configuration
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
  title: 'Anniversaires',
  icon: '🎂',
  description: 'Célébration automatique des anniversaires, rôles temporaires et cadeaux XP',
  section: 'modules',
  order: 6
});

useSeoMeta({
  title: 'Anniversaires - Bot',
  description: 'Célébration automatique des anniversaires, rôles temporaires et cadeaux XP',
  ogTitle: 'Anniversaires - Bot',
  ogDescription: 'Célébration automatique des anniversaires, rôles temporaires et cadeaux XP'
});

const route = useRoute();

function isTabActive(path: string): boolean {
  if (path === '/modules/birthdays/overview' && (route.path === '/modules/birthdays' || route.path === '/modules/birthdays/')) {
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
}
</style>
