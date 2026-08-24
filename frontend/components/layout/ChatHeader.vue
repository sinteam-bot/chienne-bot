<template>
  <header class="chat-header">
    <div class="channel-title-wrapper">
      <span class="channel-icon-header">{{ currentViewTitle.icon }}</span>
      <h2 class="channel-name-header">{{ currentViewTitle.name }}</h2>
    </div>

    <div v-if="currentViewTitle.topic" class="header-divider"></div>
    <div v-if="currentViewTitle.topic" class="channel-topic">{{ currentViewTitle.topic }}</div>

    <div class="header-tools">
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
import { useAppState } from '~/composables/useAppState.ts';

const { activeView, currentViewTitle } = useAppState();
</script>
