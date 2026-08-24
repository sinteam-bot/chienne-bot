<template>
  <div class="view-panel">
    <!-- Barre d'outils des Utilisateurs -->
    <div class="users-toolbar-container">
      <div class="users-toolbar">
        <div class="search-input-wrapper" style="max-width: 280px;">
          <input
            v-model="searchQuery"
            type="text"
            class="discord-input"
            placeholder="Rechercher un membre..."
          />
        </div>

        <div class="filter-chips-group">
          <span class="filter-chips-label">Type :</span>
          <div class="filter-chips-list">
            <button
              :class="['filter-chip', { active: botFilter === 'all' }]"
              @click="botFilter = 'all'"
            >
              Tous
            </button>
            <button
              :class="['filter-chip', { active: botFilter === 'human' }]"
              @click="botFilter = 'human'"
            >
              👤 Humains
            </button>
            <button
              :class="['filter-chip', { active: botFilter === 'bot' }]"
              @click="botFilter = 'bot'"
            >
              🤖 Bots
            </button>
          </div>
        </div>

        <div class="view-mode-toggle" style="margin-left: auto;">
          <button
            :class="['view-mode-btn', { active: viewMode === 'table' }]"
            title="Vue Tableau"
            @click="viewMode = 'table'"
          >
            📋 Tableau
          </button>
          <button
            :class="['view-mode-btn', { active: viewMode === 'grid' }]"
            title="Vue Grille"
            @click="viewMode = 'grid'"
          >
            🎴 Grille
          </button>
        </div>

        <div class="user-count-badge">
          {{ filteredUsers.length }} membre(s)
        </div>
      </div>

      <!-- Filtre par rôles -->
      <div v-if="roles.length > 0" class="users-roles-chips-container">
        <span class="filter-chips-label">Rôle :</span>
        <div class="users-roles-chips-bar">
          <button
            :class="['role-chip', { active: selectedRole === 'ALL' }]"
            @click="selectedRole = 'ALL'"
          >
            Tous les rôles
          </button>
          <button
            v-for="role in visibleRoles"
            :key="role.id"
            :class="['role-chip', { active: selectedRole === role.id }]"
            @click="selectedRole = role.id"
          >
            <span
              class="role-dot"
              :style="{ backgroundColor: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#99aab5' }"
            ></span>
            {{ role.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Contenu : Tableau ou Grille -->
    <div class="users-content-scroller">
      <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>

      <div v-else-if="filteredUsers.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
        Aucun membre correspondant aux critères de recherche.
      </div>

      <!-- VUE GRILLE -->
      <div v-else-if="viewMode === 'grid'" class="users-grid">
        <div
          v-for="u in filteredUsers"
          :key="u.id"
          class="user-card"
          @click="$emit('inspect-user', u)"
        >
          <div class="user-card-banner"></div>
          <div class="user-card-body">
            <div class="user-card-avatar-wrapper">
              <img :src="u.avatarUrl" :alt="u.username" class="user-card-avatar" />
            </div>
            <div class="user-card-header-info">
              <div class="user-card-displayname">
                <span>{{ u.displayName || u.username }}</span>
                <span v-if="u.isBot" class="bot-badge">BOT</span>
              </div>
              <div class="user-card-tag">@{{ u.username }}</div>
            </div>

            <div v-if="u.roles && u.roles.length > 0" class="user-card-roles">
              <span
                v-for="r in u.roles.slice(0, 3)"
                :key="r.id"
                class="role-pill"
              >
                <span
                  class="role-dot"
                  :style="{ backgroundColor: r.color ? `#${r.color.toString(16).padStart(6, '0')}` : '#99aab5' }"
                ></span>
                {{ r.name }}
              </span>
              <span v-if="u.roles.length > 3" class="role-pill" style="opacity: 0.7;">
                +{{ u.roles.length - 3 }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- VUE TABLEAU -->
      <div v-else class="users-table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th>Membre</th>
              <th>Rôles</th>
              <th>Date d'Arrivée</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in filteredUsers"
              :key="u.id"
              @click="$emit('inspect-user', u)"
            >
              <td>
                <div class="user-td-member">
                  <img :src="u.avatarUrl" :alt="u.username" class="user-td-avatar" />
                  <div class="user-td-info">
                    <span class="user-td-name">
                      {{ u.displayName || u.username }}
                      <span v-if="u.isBot" class="bot-badge">BOT</span>
                    </span>
                    <span class="user-td-sub">@{{ u.username }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="user-td-roles">
                  <span
                    v-for="r in (u.roles || []).slice(0, 3)"
                    :key="r.id"
                    class="role-pill"
                  >
                    <span
                      class="role-dot"
                      :style="{ backgroundColor: r.color ? `#${r.color.toString(16).padStart(6, '0')}` : '#99aab5' }"
                    ></span>
                    {{ r.name }}
                  </span>
                  <span v-if="(u.roles || []).length > 3" class="role-pill" style="opacity: 0.7;">
                    +{{ u.roles.length - 3 }}
                  </span>
                </div>
              </td>
              <td style="font-size: 12px; color: var(--text-muted);">
                {{ formatDate(u.joinedAt) }}
              </td>
              <td>
                <button class="btn-user-inspect" @click.stop="$emit('inspect-user', u)">
                  Détails
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState';

defineEmits<{
  (e: 'inspect-user', user: any): void;
}>();

const { users, roles, fetchUsersAndRoles } = useAppState();

const viewMode = ref<'table' | 'grid'>('table');
const searchQuery = ref('');
const botFilter = ref<'all' | 'human' | 'bot'>('all');
const selectedRole = ref('ALL');
const isLoading = ref(false);

onMounted(async () => {
  if (users.value.length === 0) {
    isLoading.value = true;
    await fetchUsersAndRoles();
    isLoading.value = false;
  }
});

const visibleRoles = computed(() => {
  return roles.value.filter(r => r.name !== '@everyone').slice(0, 15);
});

const filteredUsers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  const bFilter = botFilter.value;
  const role = selectedRole.value;

  return users.value.filter(u => {
    // 1. Bot filter
    if (bFilter === 'human' && u.isBot) return false;
    if (bFilter === 'bot' && !u.isBot) return false;

    // 2. Role filter
    if (role !== 'ALL') {
      const hasRole = Array.isArray(u.roles) && u.roles.some((r: any) => r.id === role);
      if (!hasRole) return false;
    }

    // 3. Search query
    if (query) {
      const matchName = (u.username && u.username.toLowerCase().includes(query)) ||
                        (u.displayName && u.displayName.toLowerCase().includes(query)) ||
                        (u.id && u.id.includes(query));
      if (!matchName) return false;
    }

    return true;
  });
});

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
</script>
