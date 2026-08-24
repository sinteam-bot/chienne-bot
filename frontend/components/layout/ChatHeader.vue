<template>
  <header class="chat-header">
    <div class="channel-title-wrapper">
      <span class="channel-icon-header">
        <template v-if="activeChannel?.id === 'virtual-logs'">📜</template>
        <template v-else-if="activeChannel?.id === 'virtual-config'">⚙️</template>
        <template v-else-if="activeChannel?.id === 'virtual-users'">👥</template>
        <template v-else-if="activeChannel?.id === 'virtual-daily-messages'">🌅</template>
        <template v-else-if="activeChannel?.id === 'virtual-captcha-logs'">🔒</template>
        <template v-else>#</template>
      </span>
      <h2 class="channel-name-header">{{ activeChannel?.name || 'Général' }}</h2>
    </div>

    <div v-if="activeChannel?.topic" class="header-divider"></div>
    <div v-if="activeChannel?.topic" class="channel-topic">{{ activeChannel.topic }}</div>

    <div class="header-tools">
      <div v-if="activeChannel?.id === 'virtual-logs'" class="live-status-pill">
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

const { activeChannel } = useAppState();
</script>
