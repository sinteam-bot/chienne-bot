<template>
  <div class="view-panel">
    <div class="daily-scroller">
      <!-- Bannière de Statut Principal -->
      <div class="daily-stats-banner">
        <div class="daily-stat-card">
          <div class="daily-stat-icon">🤖</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">État du Bot</span>
            <span class="daily-stat-value" style="color: var(--green);">En Ligne & Opérationnel</span>
            <span class="daily-stat-sub">Ping Discord: {{ stats.ping || 18 }} ms</span>
          </div>
        </div>

        <div class="daily-stat-card">
          <div class="daily-stat-icon">👥</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Membres du Serveur</span>
            <span class="daily-stat-value">{{ guild?.memberCount || users.length || 0 }}</span>
            <span class="daily-stat-sub">{{ roles.length }} rôles configurés</span>
          </div>
        </div>

        <div class="daily-stat-card">
          <div class="daily-stat-icon">💬</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Salons Discord</span>
            <span class="daily-stat-value">{{ discordChannels.length }}</span>
            <span class="daily-stat-sub">Salons textuels & vocaux</span>
          </div>
        </div>

        <div class="daily-stat-card">
          <div class="daily-stat-icon">⏱️</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Uptime Serveur</span>
            <span class="daily-stat-value">{{ stats.uptimeFormatted || 'En ligne' }}</span>
            <span class="daily-stat-sub">Node.js {{ stats.nodeVersion || 'v20+' }}</span>
          </div>
        </div>
      </div>

      <!-- Grille d'informations détaillées -->
      <div class="info-grid">
        <!-- Carte Serveur Discord -->
        <div class="config-card">
          <div class="card-subtitle" style="display: flex; align-items: center; gap: 8px;">
            <span>⭐</span>
            <span>Serveur Discord</span>
          </div>

          <div style="display: flex; align-items: center; gap: 16px;">
            <img
              :src="guild?.iconUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'"
              alt="Guild Icon"
              style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover;"
            />
            <div style="display: flex; flex-direction: column;">
              <h3 style="font-size: 18px; font-weight: 700; color: var(--header-primary);">{{ guild?.name || 'Chienne Bot Serveur' }}</h3>
              <span style="font-size: 12px; color: var(--text-muted); font-family: var(--font-code);">ID: {{ guild?.id || 'Inconnu' }}</span>
              <span v-if="guild?.ownerTag" style="font-size: 12px; color: var(--text-muted);">Propriétaire : <strong>{{ guild.ownerTag }}</strong></span>
            </div>
          </div>
        </div>

        <!-- Carte Profil du Bot -->
        <div class="config-card">
          <div class="card-subtitle" style="display: flex; align-items: center; gap: 8px;">
            <span>🐕</span>
            <span>Identité du Bot</span>
          </div>

          <div style="display: flex; align-items: center; gap: 16px;">
            <img
              :src="botProfile.avatarUrl"
              alt="Bot Avatar"
              style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover;"
            />
            <div style="display: flex; flex-direction: column;">
              <h3 style="font-size: 18px; font-weight: 700; color: var(--header-primary);">
                {{ botProfile.username }}
                <span class="bot-badge">BOT</span>
              </h3>
              <span style="font-size: 12px; color: var(--text-muted); font-family: var(--font-code);">Tag: {{ botProfile.tag }}</span>
              <span style="font-size: 12px; color: var(--green);">● Statut: {{ botProfile.customStatus || 'En ligne' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Raccourcis Rapides -->
      <div class="config-card">
        <div class="card-subtitle">Accès Rapide aux Fonctionnalités</div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          <button class="action-btn" @click="navigateTo('logs')">
            📜 Consulter les logs en direct
          </button>
          <button class="action-btn" @click="navigateTo('users')">
            👥 Gérer les membres & rôles
          </button>
          <button class="action-btn" @click="navigateTo('module-daily-message')">
            🌅 Voir la pensée du jour IA
          </button>
          <button class="action-btn" @click="navigateTo('general-config')">
            ⚙️ Modifier la configuration
          </button>
          <button class="action-btn" @click="refreshAll">
            🔄 Rafraîchir toutes les données
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState';

const { guild, botProfile, users, roles, discordChannels, stats, navigateTo, refreshAll } = useAppState();
</script>
