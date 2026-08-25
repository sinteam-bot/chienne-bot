<template>
  <div v-if="user" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <div
          class="modal-banner"
          :style="{ background: bannerStyle }"
        ></div>
        <div class="modal-avatar-wrapper">
          <img
            :src="user.avatarUrl || user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'"
            :alt="user.username"
            class="modal-avatar"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
          <span :class="['modal-status-dot', user.presence || user.status || 'offline']"></span>
        </div>
        <button class="modal-close-btn" title="Fermer" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div class="modal-user-names">
          <h3 :style="{ color: nameColor }">
            {{ user.displayName || user.username }}
            <span v-if="user.isBot" class="bot-badge" style="vertical-align: middle; margin-left: 6px;">BOT</span>
          </h3>
          <span class="modal-user-tag">@{{ user.username }}</span>
          <span class="modal-user-id">ID: {{ user.id }}</span>
        </div>

        <!-- Section Rôles -->
        <div v-if="orderedRoles.length > 0" class="modal-section">
          <h4>Rôles ({{ orderedRoles.length }})</h4>
          <div class="modal-roles-list">
            <span
              v-for="role in orderedRoles"
              :key="role.id"
              class="role-pill"
              :style="{
                borderColor: role.color ? `${role.color}55` : 'rgba(255,255,255,0.1)',
                backgroundColor: role.color ? `${role.color}15` : 'var(--bg-tertiary)'
              }"
            >
              <img
                v-if="role.icon"
                :src="role.icon"
                :alt="role.name"
                class="role-pill-icon"
                loading="lazy"
                referrerpolicy="no-referrer"
              />
              <span v-else-if="role.unicodeEmoji" class="role-pill-emoji">{{ role.unicodeEmoji }}</span>
              <span
                v-else
                class="role-dot"
                :style="{ backgroundColor: role.color || '#99aab5' }"
              ></span>
              <span :style="{ color: role.color || 'var(--text-normal)' }">
                {{ role.name }}
              </span>
            </span>
          </div>
        </div>

        <!-- Section Statistiques & Dates -->
        <div class="modal-section">
          <h4>Informations sur le Membre</h4>
          <div class="modal-dates-list">
            <div v-if="user.joinedAt" class="date-row">
              Rejoint le : <strong>{{ formatDate(user.joinedAt) }}</strong>
            </div>
            <div v-if="user.createdAt" class="date-row">
              Compte créé le : <strong>{{ formatDate(user.createdAt) }}</strong>
            </div>
            <div v-if="user.isBot !== undefined" class="date-row">
              Type : <strong>{{ user.isBot ? 'Robot / Application Discord' : 'Utilisateur Humain' }}</strong>
            </div>
            <div v-if="user.level || user.xp" class="date-row">
              Progression XP : <strong>Niveau {{ user.level || 1 }} ({{ user.xp || 0 }} XP)</strong>
            </div>
            <div v-if="user.messagesCount" class="date-row">
              Messages envoyés : <strong>{{ user.messagesCount }}</strong>
            </div>
            <div v-if="user.voiceMinutes" class="date-row">
              Temps en vocal : <strong>{{ Math.floor(user.voiceMinutes / 60) }}h {{ user.voiceMinutes % 60 }}min</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  user: any;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const orderedRoles = computed(() => {
  if (!props.user || !Array.isArray(props.user.roles)) return [];
  return [...props.user.roles]
    .filter(r => r.name !== '@everyone')
    .sort((a, b) => (b.position || 0) - (a.position || 0));
});

const nameColor = computed(() => {
  if (!props.user) return 'var(--header-primary)';
  if (props.user.displayColor && props.user.displayColor !== '#99aab5') {
    return props.user.displayColor;
  }
  if (props.user.highestRole?.color && props.user.highestRole.color !== '#99aab5') {
    return props.user.highestRole.color;
  }
  for (const r of orderedRoles.value) {
    if (r.color && r.color !== '#99aab5') {
      return r.color;
    }
  }
  return 'var(--header-primary)';
});

const bannerStyle = computed(() => {
  if (props.user?.bannerUrl) {
    return `url(${props.user.bannerUrl}) center/cover no-repeat`;
  }
  const col = nameColor.value;
  if (col && col !== 'var(--header-primary)') {
    return `linear-gradient(135deg, ${col}aa, ${col}44, #1e1f22)`;
  }
  return 'linear-gradient(135deg, #5865F2, #8e44ad)';
});

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}
</script>

<style scoped>
.role-pill-icon {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  object-fit: cover;
}

.role-pill-emoji {
  font-size: 13px;
  line-height: 1;
}
</style>
