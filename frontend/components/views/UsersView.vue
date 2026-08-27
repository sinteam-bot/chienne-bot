<template>
  <div class="users-view-container">
    <!-- SUB-SIDEBAR GAUCHE (Filtres, Types, Rôles Multi-sélection) -->
    <aside class="users-subsidebar">
      <!-- En-tête SubSidebar -->
      <div class="users-subsidebar-header">
        <div class="users-subsidebar-title">
          <span>👥</span>
          <span>Filtres & Rôles</span>
        </div>
        <span class="users-counter-pill" :title="`${filteredUsers.length} affichés sur ${users.length} membres`">
          {{ filteredUsers.length }}/{{ users.length }}
        </span>
      </div>

      <div class="users-subsidebar-scroller">
        <!-- Recherche de membre -->
        <div class="subsidebar-section">
          <div class="subsidebar-section-title">Recherche</div>
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              class="discord-input search-input"
              placeholder="Pseudo, tag, ID..."
            />
            <button
              v-if="searchQuery"
              class="search-clear-btn"
              title="Effacer la recherche"
              @click="searchQuery = ''"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Type de Membre -->
        <div class="subsidebar-section">
          <div class="subsidebar-section-title">Type de compte</div>
          <div class="type-filter-buttons">
            <button
              :class="['type-filter-btn', { active: botFilter === 'all' }]"
              @click="botFilter = 'all'"
            >
              <span>Tous</span>
              <span class="type-count-badge">{{ users.length }}</span>
            </button>
            <button
              :class="['type-filter-btn', { active: botFilter === 'human' }]"
              @click="botFilter = 'human'"
            >
              <span>👤 Humains</span>
              <span class="type-count-badge">{{ humansCount }}</span>
            </button>
            <button
              :class="['type-filter-btn', { active: botFilter === 'bot' }]"
              @click="botFilter = 'bot'"
            >
              <span>🤖 Bots</span>
              <span class="type-count-badge">{{ botsCount }}</span>
            </button>
          </div>
        </div>

        <!-- Tri des membres -->
        <div class="subsidebar-section">
          <div class="subsidebar-section-title">Trier par</div>
          <select v-model="sortBy" class="discord-select">
            <option value="joined-desc">📅 Arrivée (Plus récents)</option>
            <option value="joined-asc">📅 Arrivée (Plus anciens)</option>
            <option value="name-asc">🔤 Nom (A → Z)</option>
            <option value="name-desc">🔤 Nom (Z → A)</option>
            <option value="role-desc">👑 Rôle le plus élevé</option>
            <option value="xp-desc">⭐ Expérience / XP</option>
          </select>
        </div>

        <!-- Sélection Multiple de Rôles -->
        <div class="subsidebar-section roles-section">
          <div class="subsidebar-section-header">
            <div class="subsidebar-section-title" style="margin: 0;">
              Rôles ({{ sortedRoles.length }})
            </div>
            <div class="roles-quick-actions">
              <button
                v-if="selectedRoleIds.size > 0"
                class="roles-action-link"
                title="Désélectionner tous les rôles"
                @click="clearRoleSelection"
              >
                Réinitialiser
              </button>
              <button
                v-else
                class="roles-action-link"
                title="Sélectionner tous les rôles"
                @click="selectAllRoles"
              >
                Tout cocher
              </button>
            </div>
          </div>

          <!-- Recherche de rôle si beaucoup de rôles -->
          <div v-if="sortedRoles.length > 8" class="role-search-wrapper">
            <input
              v-model="roleSearchQuery"
              type="text"
              class="discord-input role-search-input"
              placeholder="Filtrer les rôles..."
            />
          </div>

          <!-- Liste des rôles avec checkbox, icône, couleur et compteur -->
          <div class="roles-checklist">
            <label
              v-for="role in visibleSortedRoles"
              :key="role.id"
              :class="['role-check-item', { selected: selectedRoleIds.has(role.id) }]"
              @click.prevent="toggleRole(role.id)"
            >
              <div class="custom-checkbox" :class="{ checked: selectedRoleIds.has(role.id) }">
                <span v-if="selectedRoleIds.has(role.id)" class="checkbox-tick">✓</span>
              </div>

              <!-- Icône ou Emoji du Rôle -->
              <img
                v-if="role.icon"
                :src="role.icon"
                :alt="role.name"
                class="role-icon-img"
                loading="lazy"
                referrerpolicy="no-referrer"
              />
              <span v-else-if="role.unicodeEmoji" class="role-unicode-emoji">
                {{ role.unicodeEmoji }}
              </span>
              <span
                v-else
                class="role-color-dot"
                :style="{ backgroundColor: role.color || '#99aab5' }"
              ></span>

              <!-- Nom du Rôle avec sa couleur Discord -->
              <span
                class="role-item-name"
                :style="{ color: role.color && role.color !== '#99aab5' ? role.color : 'var(--text-normal)' }"
                :title="role.name"
              >
                {{ role.name }}
              </span>

              <!-- Compteur de membres pour ce rôle -->
              <span class="role-member-count">
                {{ getRoleMemberCount(role.id, role.memberCount) }}
              </span>
            </label>

            <div v-if="visibleSortedRoles.length === 0" style="padding: 10px; font-size: 12px; color: var(--text-muted); text-align: center;">
              Aucun rôle correspondant.
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- ZONE PRINCIPALE (Header toolbar, Grille / Tableau des membres) -->
    <main class="users-main-pane">
      <!-- Barre d'outils supérieure -->
      <header class="users-top-bar">
        <!-- Badges des filtres actifs -->
        <div class="active-filters-chips">
          <span v-if="searchQuery" class="active-filter-badge">
            🔍 "{{ searchQuery }}"
            <button class="remove-filter-btn" @click="searchQuery = ''">✕</button>
          </span>

          <span v-if="botFilter !== 'all'" class="active-filter-badge">
            {{ botFilter === 'human' ? '👤 Humains uniquement' : '🤖 Bots uniquement' }}
            <button class="remove-filter-btn" @click="botFilter = 'all'">✕</button>
          </span>

          <span v-if="selectedRoleIds.size > 0" class="active-filter-badge role-filter-badge">
            🏷️ {{ selectedRoleIds.size }} rôle{{ selectedRoleIds.size > 1 ? 's' : '' }} sélectionné{{ selectedRoleIds.size > 1 ? 's' : '' }}
            <button class="remove-filter-btn" @click="clearRoleSelection">✕</button>
          </span>

          <button
            v-if="hasActiveFilters"
            class="reset-all-filters-btn"
            @click="resetAllFilters"
          >
            Tout effacer
          </button>
        </div>

        <div class="top-bar-right-controls">
          <!-- Toggle Vue Grille / Tableau -->
          <div class="view-mode-toggle">
            <button
              :class="['view-mode-btn', { active: viewMode === 'grid' }]"
              title="Vue Grille de Profils"
              @click="viewMode = 'grid'"
            >
              🎴 Grille
            </button>
            <button
              :class="['view-mode-btn', { active: viewMode === 'table' }]"
              title="Vue Tableau Détaillé"
              @click="viewMode = 'table'"
            >
              📋 Tableau
            </button>
          </div>

          <!-- Bouton Rafraîchir -->
          <button
            class="action-btn"
            :disabled="isLoading"
            title="Rafraîchir la liste des membres"
            @click="refreshUsers"
          >
            <span v-if="isLoading" class="spinner" style="width: 14px; height: 14px; margin-right: 4px;"></span>
            <span v-else>🔄</span>
          </button>
        </div>
      </header>

      <!-- Zone de Défilement des Membres -->
      <div class="users-content-scroller">
        <div v-if="isLoading && users.length === 0" class="loading-state">
          <div class="spinner" style="width: 36px; height: 36px;"></div>
          <span style="color: var(--text-muted); font-size: 14px; margin-top: 12px;">Chargement des membres Discord...</span>
        </div>

        <div v-else-if="filteredUsers.length === 0" class="empty-state">
          <div style="font-size: 40px; margin-bottom: 12px;">🕵️‍♂️</div>
          <h3 style="color: var(--header-primary); margin-bottom: 6px;">Aucun membre trouvé</h3>
          <p style="color: var(--text-muted); font-size: 13px; max-width: 400px; margin: 0 auto 16px auto;">
            Aucun membre ne correspond à vos filtres actuels (recherche, types ou rôles sélectionnés).
          </p>
          <button class="action-btn" @click="resetAllFilters">
            Réinitialiser les filtres
          </button>
        </div>

        <!-- ================================================================= -->
        <!-- 🎴 VUE GRILLE : CARTES DE PROFIL DISCORD                          -->
        <!-- ================================================================= -->
        <div v-else-if="viewMode === 'grid'" class="users-grid">
          <div
            v-for="u in filteredUsers"
            :key="u.id"
            class="discord-user-card"
            @click="$emit('inspect-user', u)"
          >
            <!-- Bannière colorée selon le rôle le plus élevé -->
            <div
              class="discord-card-banner"
              :style="{
                background: getMemberBannerStyle(u)
              }"
            ></div>

            <!-- Corps de la carte -->
            <div class="discord-card-body">
              <!-- Wrapper Avatar + Statut -->
              <div class="discord-card-avatar-wrapper">
                <img
                  :src="u.avatarUrl || u.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'"
                  :alt="u.username"
                  class="discord-card-avatar"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                />
                <span
                  v-if="u.presence"
                  :class="['presence-indicator', u.presence]"
                  :title="`Statut: ${u.presence}`"
                ></span>
              </div>

              <!-- En-tête info : PSEUDO COLORÉ + Tag -->
              <div class="discord-card-header-info">
                <div class="discord-card-displayname-row">
                  <span
                    class="discord-card-pseudo"
                    :style="{ color: getMemberNameColor(u) }"
                    :title="u.displayName || u.username"
                  >
                    {{ u.displayName || u.username }}
                  </span>
                  <span v-if="u.isBot" class="bot-badge">BOT</span>
                </div>

                <div class="discord-card-tag">
                  @{{ u.username }}
                  <span v-if="u.discriminator && u.discriminator !== '0'" style="opacity: 0.6;">#{{ u.discriminator }}</span>
                </div>
              </div>

              <!-- Rôle le plus élevé (Badge Spécial) -->
              <div v-if="u.highestRole && u.highestRole.name !== '@everyone'" class="highest-role-badge">
                <img
                  v-if="u.highestRole.icon"
                  :src="u.highestRole.icon"
                  :alt="u.highestRole.name"
                  class="role-badge-icon"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                />
                <span v-else-if="u.highestRole.unicodeEmoji" class="role-badge-emoji">
                  {{ u.highestRole.unicodeEmoji }}
                </span>
                <span
                  v-else
                  class="role-badge-dot"
                  :style="{ backgroundColor: u.highestRole.color || '#99aab5' }"
                ></span>
                <span class="role-badge-name" :style="{ color: u.highestRole.color || 'var(--text-normal)' }">
                  {{ u.highestRole.name }}
                </span>
              </div>

              <!-- Liste des rôles (triés par ordre hiérarchique décroissant) -->
              <div v-if="getOrderedMemberRoles(u).length > 0" class="discord-card-roles-list">
                <span
                  v-for="r in getOrderedMemberRoles(u).slice(0, 4)"
                  :key="r.id"
                  class="discord-role-pill"
                  :style="{
                    borderColor: r.color ? `${r.color}55` : 'rgba(255, 255, 255, 0.08)',
                    backgroundColor: r.color ? `${r.color}15` : 'var(--bg-tertiary)'
                  }"
                  :title="`Rôle: ${r.name}`"
                >
                  <img
                    v-if="r.icon"
                    :src="r.icon"
                    :alt="r.name"
                    class="role-pill-icon"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                  />
                  <span v-else-if="r.unicodeEmoji" class="role-pill-emoji">{{ r.unicodeEmoji }}</span>
                  <span
                    v-else
                    class="role-pill-dot"
                    :style="{ backgroundColor: r.color || '#99aab5' }"
                  ></span>
                  <span class="role-pill-label" :style="{ color: r.color || 'var(--text-muted)' }">
                    {{ r.name }}
                  </span>
                </span>

                <span
                  v-if="getOrderedMemberRoles(u).length > 4"
                  class="discord-role-pill more-roles-pill"
                  :title="`+${getOrderedMemberRoles(u).length - 4} autres rôles`"
                >
                  +{{ getOrderedMemberRoles(u).length - 4 }}
                </span>
              </div>

              <!-- Pied de carte : Date d'arrivée -->
              <div class="discord-card-footer">
                <span>Arrivé le {{ formatDate(u.joinedAt) }}</span>
                <span v-if="u.level" class="member-level-badge">Niv. {{ u.level }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- 📋 VUE TABLEAU : LISTE TABULAIRE COMPLÈTE                         -->
        <!-- ================================================================= -->
        <div v-else class="users-table-wrapper module-table-wrapper">
          <table class="users-table module-table">
            <thead>
              <tr>
                <th style="width: 32%;">Membre</th>
                <th style="width: 22%;">Rôle Principal</th>
                <th style="width: 28%;">Tous les Rôles</th>
                <th style="width: 18%;">Date d'Arrivée</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="u in filteredUsers"
                :key="u.id"
                class="user-table-row"
                @click="$emit('inspect-user', u)"
              >
                <!-- Colonne Membre (Avatar + Pseudo Coloré + Tag) -->
                <td>
                  <div class="user-td-member">
                    <div class="user-td-avatar-wrapper">
                      <img
                        :src="u.avatarUrl || u.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'"
                        :alt="u.username"
                        class="user-td-avatar"
                        loading="lazy"
                        referrerpolicy="no-referrer"
                      />
                      <span
                        v-if="u.presence"
                        :class="['presence-dot-mini', u.presence]"
                      ></span>
                    </div>
                    <div class="user-td-info">
                      <div class="user-td-name-row">
                        <span
                          class="user-td-displayname"
                          :style="{ color: getMemberNameColor(u) }"
                        >
                          {{ u.displayName || u.username }}
                        </span>
                        <span v-if="u.isBot" class="bot-badge">BOT</span>
                      </div>
                      <span class="user-td-tag">@{{ u.username }}</span>
                    </div>
                  </div>
                </td>

                <!-- Colonne Rôle Principal -->
                <td>
                  <div v-if="u.highestRole && u.highestRole.name !== '@everyone'" class="table-highest-role">
                    <img
                      v-if="u.highestRole.icon"
                      :src="u.highestRole.icon"
                      :alt="u.highestRole.name"
                      class="role-badge-icon"
                      loading="lazy"
                      referrerpolicy="no-referrer"
                    />
                    <span v-else-if="u.highestRole.unicodeEmoji" class="role-badge-emoji">
                      {{ u.highestRole.unicodeEmoji }}
                    </span>
                    <span
                      v-else
                      class="role-badge-dot"
                      :style="{ backgroundColor: u.highestRole.color || '#99aab5' }"
                    ></span>
                    <span class="role-badge-name" :style="{ color: u.highestRole.color || 'var(--text-normal)' }">
                      {{ u.highestRole.name }}
                    </span>
                  </div>
                  <span v-else style="color: var(--text-muted); font-size: 12px;">—</span>
                </td>

                <!-- Colonne Rôles Hiérarchisés -->
                <td>
                  <div class="user-td-roles">
                    <span
                      v-for="r in getOrderedMemberRoles(u).slice(0, 3)"
                      :key="r.id"
                      class="discord-role-pill"
                      :style="{
                        borderColor: r.color ? `${r.color}55` : 'rgba(255, 255, 255, 0.08)',
                        backgroundColor: r.color ? `${r.color}15` : 'var(--bg-tertiary)'
                      }"
                    >
                      <img
                        v-if="r.icon"
                        :src="r.icon"
                        :alt="r.name"
                        class="role-pill-icon"
                        loading="lazy"
                        referrerpolicy="no-referrer"
                      />
                      <span v-else-if="r.unicodeEmoji" class="role-pill-emoji">{{ r.unicodeEmoji }}</span>
                      <span
                        v-else
                        class="role-pill-dot"
                        :style="{ backgroundColor: r.color || '#99aab5' }"
                      ></span>
                      <span class="role-pill-label" :style="{ color: r.color || 'var(--text-muted)' }">
                        {{ r.name }}
                      </span>
                    </span>

                    <span
                      v-if="getOrderedMemberRoles(u).length > 3"
                      class="discord-role-pill more-roles-pill"
                      :title="`+${getOrderedMemberRoles(u).length - 3} rôles`"
                    >
                      +{{ getOrderedMemberRoles(u).length - 3 }}
                    </span>
                  </div>
                </td>

                <!-- Colonne Date d'Arrivée -->
                <td>
                  <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 13px; color: var(--text-normal);">{{ formatDate(u.joinedAt) }}</span>
                    <span style="font-size: 11px; color: var(--text-muted);">{{ getDaysAgo(u.joinedAt) }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAppState } from '~/composables/useAppState.ts';

defineEmits<{
  (e: 'inspect-user', user: any): void;
}>();

const { users, roles, fetchUsersAndRoles } = useAppState();

const viewMode = ref<'grid' | 'table'>('grid');
const searchQuery = ref('');
const roleSearchQuery = ref('');
const botFilter = ref<'all' | 'human' | 'bot'>('all');
const sortBy = ref<'joined-desc' | 'joined-asc' | 'name-asc' | 'name-desc' | 'role-desc' | 'xp-desc'>('joined-desc');
const selectedRoleIds = ref<Set<string>>(new Set());
const isLoading = ref(false);

onMounted(async () => {
  if (users.value.length === 0 || roles.value.length === 0) {
    isLoading.value = true;
    await fetchUsersAndRoles();
    isLoading.value = false;
  }
});

async function refreshUsers() {
  isLoading.value = true;
  await fetchUsersAndRoles();
  isLoading.value = false;
}

// 1. Rôles ordonnés selon la hiérarchie Discord (position DESC)
const sortedRoles = computed(() => {
  if (!Array.isArray(roles.value)) return [];
  return [...roles.value]
    .filter(r => r.name !== '@everyone')
    .sort((a, b) => (b.position || 0) - (a.position || 0));
});

// 2. Rôles filtrés par la mini barre de recherche
const visibleSortedRoles = computed(() => {
  if (!roleSearchQuery.value.trim()) return sortedRoles.value;
  const q = roleSearchQuery.value.toLowerCase().trim();
  return sortedRoles.value.filter(r => r.name.toLowerCase().includes(q));
});

// 3. Compteurs de types
const humansCount = computed(() => {
  return Array.isArray(users.value) ? users.value.filter(u => !u.isBot).length : 0;
});

const botsCount = computed(() => {
  return Array.isArray(users.value) ? users.value.filter(u => u.isBot).length : 0;
});

// 4. Gestion de la sélection multiple de rôles
function toggleRole(roleId: string) {
  const newSet = new Set(selectedRoleIds.value);
  if (newSet.has(roleId)) {
    newSet.delete(roleId);
  } else {
    newSet.add(roleId);
  }
  selectedRoleIds.value = newSet;
}

function selectAllRoles() {
  selectedRoleIds.value = new Set(sortedRoles.value.map(r => r.id));
}

function clearRoleSelection() {
  selectedRoleIds.value = new Set();
}

function resetAllFilters() {
  searchQuery.value = '';
  roleSearchQuery.value = '';
  botFilter.value = 'all';
  clearRoleSelection();
  sortBy.value = 'joined-desc';
}

const hasActiveFilters = computed(() => {
  return !!searchQuery.value || botFilter.value !== 'all' || selectedRoleIds.value.size > 0;
});

// Compte de membres par rôle
function getRoleMemberCount(roleId: string, directCount?: number): number {
  if (typeof directCount === 'number' && directCount > 0) return directCount;
  if (!Array.isArray(users.value)) return 0;
  return users.value.filter(u => Array.isArray(u.roles) && u.roles.some((r: any) => r.id === roleId)).length;
}

// 5. Récupération des rôles d'un membre ordonnés par hiérarchie
function getOrderedMemberRoles(user: any): any[] {
  if (!Array.isArray(user.roles)) return [];
  return [...user.roles]
    .filter(r => r.name !== '@everyone')
    .sort((a, b) => (b.position || 0) - (a.position || 0));
}

// 6. Détermination de la couleur du pseudo (couleur du rôle le plus haut)
function getMemberNameColor(user: any): string {
  if (user.displayColor && user.displayColor !== '#99aab5') {
    return user.displayColor;
  }
  if (user.highestRole?.color && user.highestRole.color !== '#99aab5') {
    return user.highestRole.color;
  }
  const ordered = getOrderedMemberRoles(user);
  for (const r of ordered) {
    if (r.color && r.color !== '#99aab5') {
      return r.color;
    }
  }
  return 'var(--header-primary)';
}

// 7. Style de bannière dynamique de la carte
function getMemberBannerStyle(user: any): string {
  if (user.bannerUrl) {
    return `url(${user.bannerUrl}) center/cover no-repeat`;
  }
  const color = getMemberNameColor(user);
  if (color !== 'var(--header-primary)') {
    return `linear-gradient(135deg, ${color}88, ${color}33, #1e1f22)`;
  }
  return 'linear-gradient(135deg, #5865F2, #3b428a, #1e1f22)';
}

// 8. Filtrage et Tri combinés des membres
const filteredUsers = computed(() => {
  if (!Array.isArray(users.value)) return [];

  const query = searchQuery.value.toLowerCase().trim();
  const bFilter = botFilter.value;
  const roleSet = selectedRoleIds.value;

  // Filtrage
  let list = users.value.filter(u => {
    // A. Filtre type de compte
    if (bFilter === 'human' && u.isBot) return false;
    if (bFilter === 'bot' && !u.isBot) return false;

    // B. Filtre rôles multi-sélection (l'utilisateur doit posséder AU MOINS un des rôles cochés si une sélection est active)
    if (roleSet.size > 0) {
      const userRoles = Array.isArray(u.roles) ? u.roles : [];
      const hasAnySelectedRole = userRoles.some((r: any) => roleSet.has(r.id));
      if (!hasAnySelectedRole) return false;
    }

    // C. Filtre recherche textuelle
    if (query) {
      const nameMatch = (u.username && u.username.toLowerCase().includes(query)) ||
                        (u.displayName && u.displayName.toLowerCase().includes(query)) ||
                        (u.globalName && u.globalName.toLowerCase().includes(query)) ||
                        (u.id && u.id.includes(query));
      if (!nameMatch) return false;
    }

    return true;
  });

  // Tri
  list.sort((a, b) => {
    switch (sortBy.value) {
      case 'name-asc':
        return (a.displayName || a.username || '').localeCompare(b.displayName || b.username || '');
      case 'name-desc':
        return (b.displayName || b.username || '').localeCompare(a.displayName || a.username || '');
      case 'role-desc': {
        const posA = a.highestRole?.position || 0;
        const posB = b.highestRole?.position || 0;
        return posB - posA;
      }
      case 'xp-desc':
        return (b.xp || 0) - (a.xp || 0);
      case 'joined-asc': {
        const timeA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
        const timeB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
        return timeA - timeB;
      }
      case 'joined-desc':
      default: {
        const timeA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
        const timeB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
        return timeB - timeA;
      }
    }
  });

  return list;
});

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
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

function getDaysAgo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 30) return `Il y a ${days} j`;
    if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
    return `Il y a ${(days / 365).toFixed(1)} an(s)`;
  } catch {
    return '';
  }
}
</script>

<style scoped>
.users-view-container {
  display: flex;
  width: 100%;
  height: calc(100vh - 48px);
  overflow: hidden;
  background-color: var(--bg-primary);
}

/* ========================================================================= */
/* 📂 SUB-SIDEBAR GAUCHE (FILTRES, TYPES & RÔLES MULTIPLES)                 */
/* ========================================================================= */
.users-subsidebar {
  width: 280px;
  min-width: 280px;
  max-width: 280px;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  height: 100%;
  user-select: none;
}

.users-subsidebar-header {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  background-color: var(--bg-secondary-alt);
}

.users-subsidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--header-primary);
}

.users-counter-pill {
  background-color: var(--bg-tertiary);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-code);
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
}

.users-subsidebar-scroller {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.subsidebar-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subsidebar-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.subsidebar-section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.roles-action-link {
  background: none;
  border: none;
  color: var(--brand-experiment, #5865f2);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.15s ease;
}

.roles-action-link:hover {
  text-decoration: underline;
  opacity: 0.85;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  font-size: 13px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding-left: 32px;
  padding-right: 28px;
  height: 34px;
  font-size: 13px;
}

.search-clear-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 50%;
}

.search-clear-btn:hover {
  color: var(--header-primary);
  background-color: var(--bg-modifier-hover);
}

/* Boutons de type */
.type-filter-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.type-filter-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px solid transparent;
  background-color: var(--bg-secondary-alt);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.type-filter-btn:hover {
  background-color: var(--bg-modifier-hover);
  color: var(--text-normal);
}

.type-filter-btn.active {
  background-color: rgba(88, 101, 242, 0.15);
  border-color: var(--brand-experiment, #5865f2);
  color: #ffffff;
}

.type-count-badge {
  font-size: 11px;
  font-family: var(--font-code);
  background-color: var(--bg-tertiary);
  padding: 1px 6px;
  border-radius: 10px;
  color: var(--text-muted);
}

.type-filter-btn.active .type-count-badge {
  background-color: var(--brand-experiment, #5865f2);
  color: #ffffff;
}

/* Sélecteur de Tri */
.discord-select {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  color: var(--text-normal);
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.discord-select:focus {
  border-color: var(--brand-experiment, #5865f2);
}

/* Checklist des Rôles */
.roles-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.role-search-wrapper {
  margin-bottom: 6px;
}

.role-search-input {
  height: 28px;
  font-size: 12px;
  padding: 4px 8px;
}

.roles-checklist {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 340px;
  overflow-y: auto;
  padding-right: 2px;
}

.role-check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.role-check-item:hover {
  background-color: var(--bg-modifier-hover);
}

.role-check-item.selected {
  background-color: rgba(255, 255, 255, 0.05);
}

.custom-checkbox {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid var(--border-strong, #4e5058);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: var(--bg-tertiary);
  transition: all 0.15s ease;
}

.custom-checkbox.checked {
  background-color: var(--brand-experiment, #5865f2);
  border-color: var(--brand-experiment, #5865f2);
}

.checkbox-tick {
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
}

.role-icon-img {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.role-unicode-emoji {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}

.role-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.role-item-name {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.role-member-count {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-code);
}

/* ========================================================================= */
/* 📱 ZONE PRINCIPALE (MAIN PANE)                                           */
/* ========================================================================= */
.users-main-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.users-top-bar {
  padding: 10px 18px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 48px;
}

.active-filters-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.active-filter-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  color: var(--text-normal);
  font-size: 12px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
}

.role-filter-badge {
  background-color: rgba(88, 101, 242, 0.15);
  border-color: var(--brand-experiment, #5865f2);
  color: #c9cdfb;
}

.remove-filter-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 11px;
  cursor: pointer;
  padding: 0;
}

.remove-filter-btn:hover {
  color: var(--red, #ed4245);
}

.reset-all-filters-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  text-decoration: underline;
  cursor: pointer;
  padding: 2px 4px;
}

.reset-all-filters-btn:hover {
  color: var(--header-primary);
}

.top-bar-right-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.users-content-scroller {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

/* ========================================================================= */
/* 🎴 CARTES DE PROFIL DISCORD (VUE GRILLE)                                 */
/* ========================================================================= */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.discord-user-card {
  background-color: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.discord-user-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong, #5865f2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.discord-card-banner {
  height: 60px;
  width: 100%;
}

.discord-card-body {
  padding: 0 14px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
}

.discord-card-avatar-wrapper {
  position: absolute;
  top: -30px;
  left: 14px;
}

.discord-card-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 4px solid var(--bg-secondary);
  object-fit: cover;
  background-color: var(--bg-tertiary);
}

.presence-indicator {
  position: absolute;
  bottom: 4px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid var(--bg-secondary);
}

.presence-indicator.online { background-color: var(--green, #3ba55d); }
.presence-indicator.idle { background-color: var(--yellow, #faa81a); }
.presence-indicator.dnd { background-color: var(--red, #ed4245); }
.presence-indicator.offline { background-color: #747f8d; }

.discord-card-header-info {
  margin-top: 32px;
}

.discord-card-displayname-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.discord-card-pseudo {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.discord-card-tag {
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-code);
}

/* Badge Rôle Principal */
.highest-role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  background-color: var(--bg-secondary-alt);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  width: fit-content;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.role-badge-icon {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  object-fit: cover;
}

.role-badge-emoji {
  font-size: 12px;
}

.role-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.role-badge-name {
  font-weight: 700;
}

/* Liste des badges de rôles */
.discord-card-roles-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.discord-role-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid;
  font-size: 11px;
  font-weight: 600;
  max-width: 100%;
}

.role-pill-icon {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  object-fit: cover;
}

.role-pill-emoji {
  font-size: 11px;
}

.role-pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.role-pill-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-roles-pill {
  border-color: rgba(255, 255, 255, 0.1);
  background-color: var(--bg-tertiary);
  color: var(--text-muted);
  font-size: 10px;
}

.discord-card-footer {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
}

.member-level-badge {
  background-color: rgba(88, 101, 242, 0.2);
  color: #c9cdfb;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 700;
}

/* ========================================================================= */
/* 📋 VUE TABLEAU (DATA TABLE)                                              */
/* ========================================================================= */
.user-table-row {
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.user-table-row:hover {
  background-color: var(--bg-modifier-hover);
}

.user-td-member {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-td-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.user-td-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  background-color: var(--bg-tertiary);
}

.presence-dot-mini {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--bg-secondary);
}

.presence-dot-mini.online { background-color: var(--green, #3ba55d); }
.presence-dot-mini.idle { background-color: var(--yellow, #faa81a); }
.presence-dot-mini.dnd { background-color: var(--red, #ed4245); }
.presence-dot-mini.offline { background-color: #747f8d; }

.user-td-info {
  display: flex;
  flex-direction: column;
}

.user-td-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-td-displayname {
  font-size: 14px;
  font-weight: 700;
}

.user-td-tag {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-code);
}

.table-highest-role {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.user-td-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 320px;
}
</style>
