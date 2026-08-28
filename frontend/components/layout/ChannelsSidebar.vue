<template>
  <aside class="channels-sidebar" aria-label="Menu Principal">
    <!-- En-tête du serveur -->
    <header class="server-header" @click="goTo('/info')">
      <div class="server-name-wrapper">
        <span class="server-badge">⭐</span>
        <h1 class="server-name">{{ guild?.name || 'Bot' }}</h1>
      </div>
      <div class="server-dropdown-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
        </svg>
      </div>
    </header>

    <!-- Liste des sections et menus scrollable générée dynamiquement depuis le router -->
    <div class="channels-scroller">
      <div
        v-for="section in dynamicSections"
        :key="section.id"
        :class="['channel-category', { 'virtual-category': true, collapsed: collapsedSections[section.id] }]"
      >
        <div class="category-header" @click="toggleSection(section.id)">
          <span class="category-arrow">▾</span>
          <span>{{ section.icon }} {{ section.title }}</span>
          <span v-if="section.badge" class="category-badge">{{ section.badge }}</span>
        </div>

        <div class="category-channels">
          <div
            v-for="item in section.items"
            :key="item.id"
            :class="['channel-item', 'virtual-channel', { active: isItemActive(item) }]"
            @click="goTo(item.routePath || ('/' + item.id))"
          >
            <span class="channel-icon">{{ item.icon }}</span>
            <span class="channel-name">{{ item.name }}</span>
            <span v-if="item.badge" class="category-badge" style="margin-left: auto;">{{ item.badge }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Profil du Bot en bas -->
    <BotFooter />
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppState, type ChannelItem } from '~/composables/useAppState.ts';
import { useDynamicNavigation } from '~/composables/useDynamicNavigation.ts';
import BotFooter from './BotFooter.vue';

const route = useRoute();
const router = useRouter();
const { guild } = useAppState();
const { dynamicSections } = useDynamicNavigation();

const collapsedSections = ref<Record<string, boolean>>({});

function toggleSection(secId: string) {
  collapsedSections.value[secId] = !collapsedSections.value[secId];
}

function isItemActive(item: ChannelItem): boolean {
  const currentPath = route.path;
  if (!item.routePath) return false;

  if (item.routePath === '/info' && (currentPath === '/' || currentPath === '/info')) {
    return true;
  }
  if (item.routePath === '/archives' && currentPath.startsWith('/archives')) {
    return true;
  }
  if (item.routePath.startsWith('/config') && currentPath.startsWith('/config')) {
    return true;
  }
  if (item.routePath.startsWith('/modules/') && currentPath.startsWith(item.routePath)) {
    return true;
  }
  if (item.routePath.startsWith('/games/') && currentPath.startsWith(item.routePath)) {
    return true;
  }
  return currentPath === item.routePath;
}

function goTo(path: string) {
  router.push(path);
}
</script>
