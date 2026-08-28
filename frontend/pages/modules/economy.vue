<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <!-- En-tête du module Économie -->
      <div class="module-header" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 22px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
              <span>💰</span> Économie & Inventaire
            </h2>
            <p class="module-desc" style="margin: 0; color: var(--text-muted); font-size: 13px;">
              Monnaie virtuelle, boutique d'items, drops et échanges entre membres. Moteur économique du serveur.
            </p>
          </div>
        </div>

        <!-- Sous-navigation des onglets -->
        <div class="module-tab-nav" style="margin-top: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; flex-wrap: wrap;">
          <NuxtLink
            to="/modules/economy/overview"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/economy/overview') }"
          >
            <span>📊</span> Vue d'ensemble
          </NuxtLink>
          <NuxtLink
            to="/modules/economy/shop"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/economy/shop') }"
          >
            <span>🛒</span> Boutique
          </NuxtLink>
          <NuxtLink
            to="/modules/economy/config"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/economy/config') }"
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
  title: 'Économie & Inventaire',
  icon: '💰',
  description: 'Monnaie virtuelle, boutique d\'items, drops et échanges entre membres',
  section: 'modules',
  order: 10
});

useSeoMeta({
  title: 'Économie & Inventaire - Chienne Bot',
  description: 'Système économique complet : monnaie, boutique, drops, échanges entre membres',
  ogTitle: 'Économie & Inventaire - Chienne Bot',
  ogDescription: 'Monnaie virtuelle, boutique d\'items, drops et échanges entre membres'
});

const route = useRoute();

function isTabActive(path: string): boolean {
  if (path === '/modules/economy/overview' && (route.path === '/modules/economy' || route.path === '/modules/economy/')) {
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
