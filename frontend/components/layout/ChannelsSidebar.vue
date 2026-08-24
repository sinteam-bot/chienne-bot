<template>
  <aside class="channels-sidebar" aria-label="Salons">
    <!-- En-tête du serveur -->
    <header class="server-header">
      <div class="server-name-wrapper">
        <span class="server-badge">⭐</span>
        <h1 class="server-name">{{ guild?.name || 'Chienne Bot' }}</h1>
      </div>
      <div class="server-dropdown-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
        </svg>
      </div>
    </header>

    <!-- Liste des catégories & salons scrollable -->
    <div class="channels-scroller">
      <!-- Loading Skeleton si vide -->
      <div v-if="categories.length === 0" class="channel-loading-skeleton">
        <div class="skeleton-category"></div>
        <div class="skeleton-channel"></div>
        <div class="skeleton-channel"></div>
        <div class="skeleton-channel"></div>
      </div>

      <!-- Catégories -->
      <div
        v-for="cat in categories"
        :key="cat.id"
        :class="['channel-category', { 'virtual-category': cat.isVirtual, collapsed: cat.collapsed }]"
      >
        <div class="category-header" @click="toggleCategory(cat)">
          <span class="category-arrow">▾</span>
          <span>{{ cat.name }}</span>
          <span v-if="cat.isVirtual" class="category-badge">BOT</span>
        </div>

        <div class="category-channels">
          <div
            v-for="ch in cat.channels"
            :key="ch.id"
            :class="['channel-item', { active: activeChannel?.id === ch.id, 'virtual-channel': ch.isVirtual }]"
            @click="selectChannel(ch)"
          >
            <span class="channel-icon">
              <template v-if="ch.id === 'virtual-logs'">📜</template>
              <template v-else-if="ch.id === 'virtual-config'">⚙️</template>
              <template v-else-if="ch.id === 'virtual-users'">👥</template>
              <template v-else-if="ch.id === 'virtual-daily-messages'">🌅</template>
              <template v-else-if="ch.id === 'virtual-captcha-logs'">🔒</template>
              <template v-else>#</template>
            </span>
            <span class="channel-name">{{ ch.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Profil du Bot -->
    <BotFooter />
  </aside>
</template>

<script setup lang="ts">
import { useAppState, type ChannelCategory, type ChannelItem } from '~/composables/useAppState';
import BotFooter from './BotFooter.vue';

const { guild, categories, activeChannel, selectChannel } = useAppState();

function toggleCategory(cat: ChannelCategory) {
  cat.collapsed = !cat.collapsed;
}
</script>
