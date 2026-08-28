<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <div class="module-header" style="margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
            <span>🚩</span> Signalements
          </h2>
          <p class="module-desc" style="margin: 0; color: var(--text-muted); font-size: 13px;">
            File d'attente des signalements de la communauté. Résolvez ou rejetez les abus.
          </p>
        </div>

        <div class="module-tab-nav" style="margin-top: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; flex-wrap: wrap;">
          <NuxtLink to="/modules/reports/overview" class="module-tab-btn" :class="{ active: isTabActive('/modules/reports/overview') }">
            <span>📊</span> Vue d'ensemble
          </NuxtLink>
          <NuxtLink to="/modules/reports/list" class="module-tab-btn" :class="{ active: isTabActive('/modules/reports/list') }">
            <span>📋</span> File d'attente
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
  title: 'Signalements',
  icon: '🚩',
  description: 'Système de signalements de la communauté (bouton + context menu)',
  section: 'modules',
  order: 15
});

useSeoMeta({
  title: 'Signalements - Chienne Bot',
  description: 'Système de signalements de la communauté',
  ogTitle: 'Signalements - Chienne Bot',
  ogDescription: 'Les membres peuvent signaler des messages ou des utilisateurs. Le staff gère la file d\'attente.'
});

const route = useRoute();
function isTabActive(path: string): boolean {
  if (path === '/modules/reports/overview' && (route.path === '/modules/reports' || route.path === '/modules/reports/')) return true;
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
