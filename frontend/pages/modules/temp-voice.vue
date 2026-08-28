<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <div class="module-header" style="margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
            <span>🔊</span> Salons vocaux temporaires
          </h2>
          <p class="module-desc" style="margin: 0; color: var(--text-muted); font-size: 13px;">
            Join-to-Create : créez automatiquement un salon vocal privé quand un membre rejoint un salon "trigger". Le salon est supprimé quand il devient vide.
          </p>
        </div>

        <div class="module-tab-nav" style="margin-top: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; flex-wrap: wrap;">
          <NuxtLink to="/modules/temp-voice/overview" class="module-tab-btn" :class="{ active: isTabActive('/modules/temp-voice/overview') }">
            <span>📊</span> Vue d'ensemble
          </NuxtLink>
          <NuxtLink to="/modules/temp-voice/config" class="module-tab-btn" :class="{ active: isTabActive('/modules/temp-voice/config') }">
            <span>⚙️</span> Configuration
          </NuxtLink>
          <NuxtLink to="/modules/temp-voice/active" class="module-tab-btn" :class="{ active: isTabActive('/modules/temp-voice/active') }">
            <span>🔊</span> Salons actifs
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
  title: 'Salons vocaux temporaires',
  icon: '🔊',
  description: 'Salons Join-to-Create (création auto à l\'entrée du membre)',
  section: 'modules',
  order: 16
});

useSeoMeta({
  title: 'Salons vocaux temporaires - Chienne Bot',
  description: 'Salons vocaux éphémères créés automatiquement quand un membre rejoint un Join-to-Trigger',
  ogTitle: 'Salons vocaux temporaires - Chienne Bot',
  ogDescription: 'Système Join-to-Create pour les serveurs Discord'
});

const route = useRoute();
function isTabActive(path: string): boolean {
  if (path === '/modules/temp-voice/overview' && (route.path === '/modules/temp-voice' || route.path === '/modules/temp-voice/')) return true;
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
