<template>
  <header class="chat-header">
    <div class="channel-title-wrapper">
      <span class="channel-icon-header">{{ currentViewTitle.icon }}</span>
      <h2 class="channel-name-header">{{ currentViewTitle.name }}</h2>
    </div>

    <div v-if="currentViewTitle.topic" class="header-divider"></div>
    <div v-if="currentViewTitle.topic" class="channel-topic">{{ currentViewTitle.topic }}</div>

    <div class="header-tools">
      <!-- Bouton Quick Switcher / Recherche Globale -->
      <button class="quick-switcher-btn" title="Recherche globale (Ctrl+K)" @click="openQuickSwitcher">
        <span class="qs-icon">🔍</span>
        <span class="qs-label">Rechercher...</span>
        <kbd class="qs-kbd">Ctrl K</kbd>
      </button>

      <div v-if="activeView === 'logs'" class="live-status-pill">
        <span class="live-dot pulse"></span>
        <span>SSE EN DIRECT</span>
      </div>
      <div v-else class="live-status-pill" style="background-color: rgba(88, 101, 242, 0.15); color: #c9cdfb; border-color: rgba(88, 101, 242, 0.3);">
        <span class="live-dot" style="background-color: var(--brand);"></span>
        <span>BOT CONNECTÉ</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState';
import { useQuickSwitcher } from '~/composables/useQuickSwitcher';

const { activeView, currentViewTitle } = useAppState();
const { open: openQuickSwitcher } = useQuickSwitcher();
</script>

<style scoped>
.quick-switcher-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1e1f22;
  border: 1px solid #3f4147;
  color: #80848e;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s ease;
}

.quick-switcher-btn:hover {
  background: #2b2d31;
  border-color: #5865f2;
  color: #dbdee1;
}

.qs-icon {
  font-size: 14px;
}

.qs-label {
  font-size: 13px;
}

.qs-kbd {
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 10px;
  color: #b5bac1;
  font-family: 'JetBrains Mono', monospace;
}
</style>
