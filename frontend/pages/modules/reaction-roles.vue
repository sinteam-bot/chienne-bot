<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <!-- En-tête du module Reaction Roles -->
      <div class="module-header" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 22px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
              <span>🎭</span> Rôles à Réaction
            </h2>
            <p class="module-desc" style="margin: 0; color: var(--text-muted); font-size: 13px;">
              Configurez des rôles automatiquement attribués lorsqu'un membre réagit à un message. Idéal pour les salons de rôles, sondages, et bien plus.
            </p>
          </div>
        </div>

        <!-- Sous-navigation des onglets -->
        <div class="module-tab-nav" style="margin-top: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; flex-wrap: wrap;">
          <NuxtLink
            to="/modules/reaction-roles/overview"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/reaction-roles/overview') }"
          >
            <span>📊</span> Vue d'ensemble
          </NuxtLink>
          <NuxtLink
            to="/modules/reaction-roles/roles"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/reaction-roles/roles') }"
          >
            <span>🎭</span> Rôles configurés
          </NuxtLink>
          <NuxtLink
            to="/modules/reaction-roles/config"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/reaction-roles/config') }"
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
  title: 'Rôles à Réaction',
  icon: '🎭',
  description: 'Attribution automatique de rôles via réactions sur un message',
  section: 'modules',
  order: 9
});

useSeoMeta({
  title: 'Rôles à Réaction - Chienne Bot',
  description: 'Configurez des rôles automatiquement attribués via réactions Discord',
  ogTitle: 'Rôles à Réaction - Chienne Bot',
  ogDescription: 'Attribution automatique de rôles via réactions sur un message'
});

const route = useRoute();

function isTabActive(path: string): boolean {
  if (path === '/modules/reaction-roles/overview' && (route.path === '/modules/reaction-roles' || route.path === '/modules/reaction-roles/')) {
    return true;
  }
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

.module-tab-btn:hover {
  background: var(--background-modifier-hover);
  color: var(--text-normal);
}

.module-tab-btn.active {
  background: var(--brand-experiment, #5865f2);
  color: white;
  font-weight: 600;
}
</style>
