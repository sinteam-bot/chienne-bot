<template>
  <aside class="discord-sub-sidebar" aria-label="Salons Discord">
    <!-- En-tête des salons -->
    <header class="sub-sidebar-header">
      <div class="sub-sidebar-title-wrapper">
        <span class="sub-sidebar-icon">📁</span>
        <h2 class="sub-sidebar-title">Salons du Serveur</h2>
      </div>
      <button class="sub-sidebar-refresh-btn" title="Rafraîchir les salons" @click="fetchChannels">
        🔄
      </button>
    </header>

    <!-- Liste scrollable des catégories et salons -->
    <div class="sub-sidebar-scroller">
      <!-- Indicateur de chargement si vide -->
      <div v-if="channelCategories.length === 0 && discordChannels.length === 0" class="sub-sidebar-empty">
        <span>Aucun salon Discord disponible</span>
      </div>

      <!-- Affichage par catégories -->
      <div
        v-for="category in channelCategories"
        :key="category.id"
        :class="['sub-sidebar-category', { collapsed: category.collapsed }]"
      >
        <div class="sub-category-header" @click="category.collapsed = !category.collapsed">
          <span class="sub-category-arrow">{{ category.collapsed ? '▸' : '▾' }}</span>
          <span class="sub-category-name">{{ category.name }}</span>
          <span class="sub-category-count">{{ category.channels.length }}</span>
        </div>

        <div v-show="!category.collapsed" class="sub-category-channels">
          <div
            v-for="ch in category.channels"
            :key="ch.id"
            :class="['sub-channel-item', { active: activeDiscordChannel?.id === ch.id }]"
            @click="selectChannel(ch)"
          >
            <span class="sub-channel-icon">
              {{ getChannelIcon(ch.type) }}
            </span>
            <span class="sub-channel-name" :title="ch.name">
              {{ ch.name }}
            </span>
            <span v-if="ch.isNsfw" class="sub-channel-badge nsfw" title="Salon NSFW">
              18+
            </span>
          </div>
        </div>
      </div>

      <!-- Fallback si salons non catégorisés sans catégorie parente -->
      <div v-if="channelCategories.length === 0 && discordChannels.length > 0" class="sub-sidebar-category">
        <div class="sub-category-header">
          <span>SALONS TEXTUELS</span>
        </div>
        <div class="sub-category-channels">
          <div
            v-for="ch in discordChannels"
            :key="ch.id"
            :class="['sub-channel-item', { active: activeDiscordChannel?.id === ch.id }]"
            @click="selectChannel(ch)"
          >
            <span class="sub-channel-icon">{{ getChannelIcon(ch.type) }}</span>
            <span class="sub-channel-name">{{ ch.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useAppState, type ChannelItem } from '~/composables/useAppState.ts';

const { channelCategories, discordChannels, activeDiscordChannel, setActiveDiscordChannel, fetchChannels } = useAppState();

const emit = defineEmits<{
  (e: 'select-channel', channel: ChannelItem): void;
}>();

function selectChannel(ch: ChannelItem) {
  setActiveDiscordChannel(ch);
  emit('select-channel', ch);
}

function getChannelIcon(type?: string | number): string {
  if (type === 'voice' || type === 2) return '🔊';
  if (type === 'announcement' || type === 5) return '📢';
  return '#';
}
</script>

<style scoped>
.discord-sub-sidebar {
  width: 240px;
  height: 100%;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  user-select: none;
}

.sub-sidebar-header {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  background-color: var(--bg-secondary);
}

.sub-sidebar-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.sub-sidebar-icon {
  font-size: 16px;
}

.sub-sidebar-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--header-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.sub-sidebar-refresh-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  opacity: 0.7;
  transition: opacity 0.2s, transform 0.2s;
  padding: 4px;
  border-radius: 4px;
}

.sub-sidebar-refresh-btn:hover {
  opacity: 1;
  transform: rotate(45deg);
  background-color: var(--bg-modifier-hover);
}

.sub-sidebar-scroller {
  flex: 1;
  overflow-y: auto;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sub-sidebar-empty {
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
  padding: 24px 8px;
}

.sub-category-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.15s;
}

.sub-category-header:hover {
  color: var(--header-primary);
}

.sub-category-arrow {
  font-size: 10px;
  color: var(--text-muted);
  width: 12px;
  text-align: center;
}

.sub-category-name {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  text-transform: uppercase;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub-category-count {
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-primary);
  padding: 2px 6px;
  border-radius: 10px;
}

.sub-category-channels {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
}

.sub-channel-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--channels-default, #949ba4);
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.15s, color 0.15s;
}

.sub-channel-item:hover {
  background-color: var(--bg-modifier-hover, rgba(78, 80, 88, 0.16));
  color: var(--interactive-hover, #dbdee1);
}

.sub-channel-item.active {
  background-color: var(--bg-modifier-selected, rgba(78, 80, 88, 0.3));
  color: #ffffff;
  font-weight: 600;
}

.sub-channel-icon {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-muted);
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.sub-channel-item.active .sub-channel-icon {
  color: #ffffff;
}

.sub-channel-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub-channel-badge.nsfw {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 4px;
  background-color: var(--red, #f23f43);
  color: #ffffff;
  border-radius: 3px;
}
</style>
