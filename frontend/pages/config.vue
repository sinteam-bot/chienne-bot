<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <!-- En-tête de la configuration technique -->
      <div class="config-header" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 22px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
              <span>⚙️</span> Configuration Système & Infrastructure
            </h2>
            <p class="config-desc" style="margin: 0;">
              Paramètres généraux du bot, planificateur de tâches crons, sécurité API/Web et résilience des modèles IA dans <code>config.yml</code>.
            </p>
          </div>
        </div>

        <!-- Barre de sous-navigation d'onglets (Sous-pages Nuxt) -->
        <div class="module-tab-nav" style="margin-top: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; flex-wrap: wrap;">
          <NuxtLink
            to="/config/general"
            class="module-tab-btn"
            :class="{ active: isTabActive('/config/general') }"
          >
            <span>🤖</span> Général & Discord
          </NuxtLink>
          <NuxtLink
            to="/config/scheduler"
            class="module-tab-btn"
            :class="{ active: isTabActive('/config/scheduler') }"
          >
            <span>⏰</span> Planificateur / Crons
          </NuxtLink>
          <NuxtLink
            to="/config/web"
            class="module-tab-btn"
            :class="{ active: isTabActive('/config/web') }"
          >
            <span>🛡️</span> Sécurité API & Web
          </NuxtLink>
          <NuxtLink
            to="/config/openrouter"
            class="module-tab-btn"
            :class="{ active: isTabActive('/config/openrouter') }"
          >
            <span>🤖</span> OpenRouter & Résilience Polly
          </NuxtLink>
        </div>
      </div>

      <!-- Contenu de la sous-page active -->
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

definePageMeta({
  title: 'Configuration Système',
  icon: '⚙️',
  description: 'Configuration générale du bot (Tokens, Auth Web, Scheduler, OpenRouter)',
  section: 'bot',
  order: 9
});

useSeoMeta({
  title: 'Configuration Système',
  description: 'Configuration générale du bot (Tokens, Auth Web, Scheduler, OpenRouter)',
  ogTitle: 'Configuration Système - Bot',
  ogDescription: 'Configuration générale du bot (Tokens, Auth Web, Scheduler, OpenRouter)'
});

const route = useRoute();

function isTabActive(path: string): boolean {
  if (path === '/config/general' && (route.path === '/config' || route.path === '/config/')) {
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
