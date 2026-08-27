<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <!-- En-tête du module Welcome -->
      <div class="module-header" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 22px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
              <span>👋</span> Message de Bienvenue & Accueil
            </h2>
            <p class="module-desc" style="margin: 0; color: var(--text-muted); font-size: 13px;">
              Accueil personnalisé des nouveaux membres, envoi d'embed Discord dynamique et redirection vers le salon de présentation.
            </p>
          </div>
        </div>

        <!-- Sous-navigation des onglets du module -->
        <div class="module-tab-nav" style="margin-top: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; flex-wrap: wrap;">
          <NuxtLink
            to="/modules/welcome/overview"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/welcome/overview') }"
          >
            <span>📊</span> Statistiques & Salons
          </NuxtLink>
          <NuxtLink
            to="/modules/welcome/preview"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/welcome/preview') }"
          >
            <span>👁️</span> Prévisualisation Discord
          </NuxtLink>
          <NuxtLink
            to="/modules/welcome/config"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/welcome/config') }"
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

const route = useRoute();

function isTabActive(path: string): boolean {
  if (path === '/modules/welcome/overview' && (route.path === '/modules/welcome' || route.path === '/modules/welcome/')) {
    return true;
  }
  return route.path.startsWith(path);
}

useHead({
  title: 'Message de Bienvenue - Chienne Bot'
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
