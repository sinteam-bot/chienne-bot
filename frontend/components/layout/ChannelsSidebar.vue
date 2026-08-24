<template>
  <aside class="channels-sidebar" aria-label="Salons">
    <!-- En-tête du serveur -->
    <header class="server-header" @click="navigateTo('info')">
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

    <!-- Liste des sections et menus scrollable -->
    <div class="channels-scroller">
      <!-- 1. SECTIONS PRINCIPALES (Chienne Bot, Modules, Games) -->
      <div
        v-for="section in sections"
        :key="section.id"
        :class="['channel-category', { 'virtual-category': true, collapsed: section.collapsed }]"
      >
        <div class="category-header" @click="section.collapsed = !section.collapsed">
          <span class="category-arrow">▾</span>
          <span>{{ section.icon }} {{ section.title }}</span>
          <span v-if="section.badge" class="category-badge">{{ section.badge }}</span>
        </div>

        <div class="category-channels">
          <div
            v-for="item in section.items"
            :key="item.id"
            :class="['channel-item', 'virtual-channel', { active: activeView === item.id }]"
            @click="navigateTo(item.id)"
          >
            <span class="channel-icon">{{ item.icon }}</span>
            <span class="channel-name">{{ item.name }}</span>
          </div>
        </div>
      </div>

      <!-- 2. SECTION SALONS DISCORD RÉELS (Si l'utilisateur est dans Archives) -->
      <div v-if="activeView === 'archives' && discordChannels.length > 0" class="channel-category">
        <div class="category-header">
          <span>📁 Salons Textuels</span>
        </div>
        <div class="category-channels">
          <div
            v-for="ch in discordChannels"
            :key="ch.id"
            :class="['channel-item', { active: activeDiscordChannel?.id === ch.id }]"
            @click="navigateTo('archives', ch)"
          >
            <span class="channel-icon">#</span>
            <span class="channel-name">{{ ch.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Profil du Bot en bas -->
    <BotFooter />
  </aside>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState';
import BotFooter from './BotFooter.vue';

const { guild, sections, activeView, activeDiscordChannel, discordChannels, navigateTo } = useAppState();
</script>
