<template>
  <footer class="user-footer">
    <!-- 1. Utilisateur Connecté -->
    <template v-if="currentUser">
      <div class="user-avatar-wrapper">
        <img
          :src="getProxiedImageUrl(currentUser.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png')"
          alt="Avatar"
          class="user-avatar"
          loading="lazy"
          referrerpolicy="no-referrer"
        />
        <span class="status-indicator online"></span>
      </div>
      <div class="user-info">
        <div class="user-tag-row">
          <span class="username" :title="currentUser.username">{{ currentUser.username }}</span>
          <span :class="['role-badge', currentUser.role]">
            {{ currentUser.role.toUpperCase() }}
          </span>
        </div>
        <div class="footer-status-row">
          <span class="custom-status">Connecté via Discord</span>
        </div>
      </div>
      <div class="user-actions">
        <button class="icon-btn" title="Se déconnecter" @click="logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
        </button>
      </div>
    </template>

    <!-- 2. Non Connecté (Mode Bot Profile / Login) -->
    <template v-else>
      <div class="user-avatar-wrapper">
        <img :src="getProxiedImageUrl(botProfile.avatarUrl)" alt="Bot Avatar" class="user-avatar" loading="lazy" referrerpolicy="no-referrer" />
        <span :class="['status-indicator', botProfile.status]"></span>
      </div>
      <div class="user-info">
        <div class="user-tag-row">
          <span class="username">{{ botProfile.username }}</span>
          <span class="bot-badge">BOT</span>
        </div>
        <div class="footer-status-row">
          <span class="custom-status">{{ botProfile.customStatus || 'En ligne' }}</span>
          <span v-if="botProfile.ping !== undefined" class="ping-pill" :title="`Latence Gateway WebSocket: ${botProfile.ping}ms`">
            📶 {{ botProfile.ping }}ms
          </span>
        </div>
      </div>
      <div class="user-actions">
        <button class="icon-btn" title="Rafraîchir les données" @click="refreshAll">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
        <button class="icon-btn" title="Se connecter" @click="openAuthModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </button>
      </div>
    </template>
  </footer>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState';
import { useAuth } from '~/composables/useAuth';
import { getProxiedImageUrl } from '~/composables/useDiscordImageProxy';

const { botProfile, refreshAll } = useAppState();
const { currentUser, openAuthModal, logout } = useAuth();
</script>

<style scoped>
.footer-status-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ping-pill {
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  background: rgba(87, 242, 135, 0.12);
  color: #57f287;
  padding: 1px 4px;
  border-radius: 3px;
  border: 1px solid rgba(87, 242, 135, 0.25);
}

.role-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-badge.admin {
  background: rgba(237, 66, 69, 0.2);
  color: #ed4245;
  border: 1px solid rgba(237, 66, 69, 0.4);
}

.role-badge.mod {
  background: rgba(87, 242, 135, 0.2);
  color: #57f287;
  border: 1px solid rgba(87, 242, 135, 0.4);
}

.role-badge.viewer {
  background: rgba(148, 155, 164, 0.2);
  color: #949ba4;
  border: 1px solid rgba(148, 155, 164, 0.4);
}
</style>
