<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <!-- En-tête du module Startup Notifier -->
      <div class="module-header" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 22px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
              <span>🚀</span> Notifications de Démarrage &amp; Versions
            </h2>
            <p class="module-desc" style="margin: 0; color: var(--text-muted); font-size: 13px;">
              Journalisation automatique sur Discord au démarrage du bot, détection des nouveaux déploiements et commits GitHub.
            </p>
          </div>
        </div>

        <!-- Sous-navigation des onglets du module -->
        <div class="module-tab-nav" style="margin-top: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; flex-wrap: wrap;">
          <NuxtLink
            to="/modules/startup-notifier/overview"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/startup-notifier/overview') }"
          >
            <span>📊</span> Vue d'ensemble
          </NuxtLink>
          <NuxtLink
            to="/modules/startup-notifier/config"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/startup-notifier/config') }"
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
  title: 'Startup Notifier',
  icon: '🚀',
  description: 'Notifications de démarrage et suivi des versions du bot',
  section: 'modules',
  order: 10
});

useSeoMeta({
  title: 'Startup Notifier - Dashboard',
  description: 'Notifications de démarrage et suivi des versions du bot',
  ogTitle: 'Startup Notifier - Dashboard',
  ogDescription: 'Notifications de démarrage et suivi des versions du bot'
});

const route = useRoute();

function isTabActive(path: string) {
  if (path === '/modules/startup-notifier/overview' && (route.path === '/modules/startup-notifier' || route.path === '/modules/startup-notifier/')) {
    return true;
  }
  return route.path === path;
}
</script>

<style scoped>
.view-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.module-view-scroller {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.module-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  background: transparent;
  transition: all var(--transition-fast);
}

.module-tab-btn:hover {
  color: var(--text-primary);
  background: var(--bg-modifier-hover);
}

.module-tab-btn.active {
  color: var(--header-primary);
  background: var(--bg-modifier-selected);
  font-weight: 600;
}
</style>
