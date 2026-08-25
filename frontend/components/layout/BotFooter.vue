<template>
  <footer class="user-footer">
    <div class="user-avatar-wrapper">
      <img :src="botProfile.avatarUrl" alt="Bot Avatar" class="user-avatar" loading="lazy" referrerpolicy="no-referrer" />
      <span :class="['status-indicator', botProfile.status]"></span>
    </div>
    <div class="user-info">
      <div class="user-tag-row">
        <span class="username">{{ botProfile.username }}</span>
        <span class="bot-badge">BOT</span>
      </div>
      <span class="custom-status">{{ botProfile.customStatus || 'En ligne' }}</span>
    </div>
    <div class="user-actions">
      <button class="icon-btn" title="Rafraîchir les données" @click="refreshAll">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
        </svg>
      </button>
      <button class="icon-btn" title="Authentification / Paramètres API" @click="openAuthModal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
        </svg>
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState.ts';
import { useAuth } from '~/composables/useAuth.ts';

const { botProfile, refreshAll } = useAppState();
const { openAuthModal } = useAuth();
</script>
