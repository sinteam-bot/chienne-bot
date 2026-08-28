<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <div class="module-header" style="margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
            <span>📌</span> Engagement Avancé
          </h2>
          <p class="module-desc" style="margin: 0; color: var(--text-muted); font-size: 13px;">
            Rappels DM, déclencheurs de mots (auto-réponses) et commandes personnalisées.
          </p>
        </div>

        <div class="module-tab-nav" style="margin-top: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; flex-wrap: wrap;">
          <NuxtLink to="/modules/engagement-advanced/overview" class="module-tab-btn" :class="{ active: isTabActive('/modules/engagement-advanced/overview') }">
            <span>📊</span> Vue d'ensemble
          </NuxtLink>
          <NuxtLink to="/modules/engagement-advanced/reminders" class="module-tab-btn" :class="{ active: isTabActive('/modules/engagement-advanced/reminders') }">
            <span>⏰</span> Rappels
          </NuxtLink>
          <NuxtLink to="/modules/engagement-advanced/triggers" class="module-tab-btn" :class="{ active: isTabActive('/modules/engagement-advanced/triggers') }">
            <span>🎯</span> Triggers
          </NuxtLink>
          <NuxtLink to="/modules/engagement-advanced/commands" class="module-tab-btn" :class="{ active: isTabActive('/modules/engagement-advanced/commands') }">
            <span>⌨️</span> Commandes
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
  title: 'Engagement Avancé',
  icon: '📌',
  description: 'Rappels DM, déclencheurs de mots et commandes personnalisées',
  section: 'modules',
  order: 14
});

useSeoMeta({
  title: 'Engagement Avancé - Chienne Bot',
  description: 'Rappels, déclencheurs et commandes personnalisées pour animer votre Discord',
  ogTitle: 'Engagement Avancé - Chienne Bot',
  ogDescription: 'Système de rappels, déclencheurs de mots et commandes personnalisées.'
});

const route = useRoute();
function isTabActive(path: string): boolean {
  if (path === '/modules/engagement-advanced/overview' && (route.path === '/modules/engagement-advanced' || route.path === '/modules/engagement-advanced/')) return true;
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
