<template>
  <div v-if="user" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <div
          class="modal-banner"
          :style="{ background: user.bannerUrl ? `url(${user.bannerUrl}) center/cover` : 'linear-gradient(135deg, #5865F2, #8e44ad)' }"
        ></div>
        <div class="modal-avatar-wrapper">
          <img :src="user.avatarUrl" :alt="user.username" class="modal-avatar" loading="lazy" referrerpolicy="no-referrer" />
          <span :class="['modal-status-dot', user.status || 'offline']"></span>
        </div>
        <button class="modal-close-btn" title="Fermer" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div class="modal-user-names">
          <h3>{{ user.displayName || user.username }}</h3>
          <span class="modal-user-tag">@{{ user.username }}</span>
          <span class="modal-user-id">ID: {{ user.id }}</span>
        </div>

        <!-- Section Rôles -->
        <div v-if="user.roles && user.roles.length > 0" class="modal-section">
          <h4>Rôles ({{ user.roles.length }})</h4>
          <div class="modal-roles-list">
            <span
              v-for="role in user.roles"
              :key="role.id"
              class="role-pill"
              :style="{ borderColor: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : 'rgba(255,255,255,0.1)' }"
            >
              <span
                class="role-dot"
                :style="{ backgroundColor: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#99aab5' }"
              ></span>
              {{ role.name }}
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  user: any;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
</script>
