<template>
  <span
    class="discord-user-wrapper"
    :class="[
      `variant-${variant}`,
      customClass,
      {
        'is-clickable': clickable && !!resolvedUser,
        'has-role-color': !!resolvedNameColor
      }
    ]"
    :style="wrapperStyle"
    @click="handleClick"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- Avatar avec indicateur de statut -->
    <span v-if="showAvatar" class="user-avatar-container" :style="{ width: `${avatarSize}px`, height: `${avatarSize}px` }">
      <img
        :src="resolvedAvatar"
        :alt="resolvedUsername"
        class="user-avatar-img"
        loading="lazy"
        referrerpolicy="no-referrer"
        :style="{ width: `${avatarSize}px`, height: `${avatarSize}px` }"
      />
      <span
        v-if="showPresence && resolvedPresence"
        :class="['presence-indicator-dot', resolvedPresence]"
        :title="`Statut: ${resolvedPresence}`"
      ></span>
    </span>

    <!-- Bloc d'information texte -->
    <span class="user-text-block">
      <span class="user-name-line">
        <!-- Pseudo coloré selon le rôle le plus élevé -->
        <span
          class="user-display-name"
          :style="{ color: resolvedNameColor }"
        >
          {{ resolvedDisplayName }}
        </span>

        <!-- Badge BOT -->
        <span v-if="resolvedIsBot" class="discord-bot-tag" title="Application / Bot Discord">
          <svg v-if="resolvedIsVerifiedBot" class="bot-verified-check" width="10" height="10" viewBox="0 0 16 15">
            <path fill="currentColor" d="m7.436 2.008 1.13-1.13a1.5 1.5 0 0 1 2.122 0l1.13 1.13a1.5 1.5 0 0 0 1.06.44h1.6a1.5 1.5 0 0 1 1.5 1.5v1.6a1.5 1.5 0 0 0 .44 1.06l1.13 1.13a1.5 1.5 0 0 1 0 2.122l-1.13 1.13a1.5 1.5 0 0 0-.44 1.06v1.6a1.5 1.5 0 0 1-1.5 1.5h-1.6a1.5 1.5 0 0 0-1.06.44l-1.13 1.13a1.5 1.5 0 0 1-2.122 0l-1.13-1.13a1.5 1.5 0 0 0-1.06-.44h-1.6a1.5 1.5 0 0 1-1.5-1.5v-1.6a1.5 1.5 0 0 0-.44-1.06l-1.13-1.13a1.5 1.5 0 0 1 0-2.122l1.13-1.13a1.5 1.5 0 0 0 .44-1.06v-1.6a1.5 1.5 0 0 1 1.5-1.5h1.6a1.5 1.5 0 0 0 1.06-.44ZM6.5 10.5l6-6-1.4-1.4-4.6 4.6-2.1-2.1-1.4 1.4 3.5 3.5Z" />
          </svg>
          BOT
        </span>

        <!-- Tag @username ou #discriminator -->
        <span v-if="showTag && resolvedTag" class="user-handle-tag">
          {{ resolvedTag }}
        </span>
      </span>

      <!-- ID du membre -->
      <span v-if="showId && resolvedId" class="user-id-sub">
        ID: {{ resolvedId }}
      </span>

      <!-- Rôle le plus élevé (Badge compact) -->
      <span v-if="showHighestRole && resolvedHighestRole" class="user-highest-role-pill" :style="{ color: resolvedHighestRole.color || 'var(--text-muted)' }">
        {{ resolvedHighestRole.name }}
      </span>
    </span>

    <!-- Popover / Infobulle Discord au survol -->
    <Teleport to="body" v-if="showFloatingTooltip && resolvedUser">
      <div
        class="discord-user-floating-popover"
        :style="popoverStyle"
      >
        <div class="user-popover-banner" :style="{ background: userBannerStyle }"></div>
        <div class="user-popover-body">
          <div class="user-popover-avatar-row">
            <img
              :src="resolvedAvatar"
              :alt="resolvedUsername"
              class="user-popover-avatar"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
            <span v-if="resolvedPresence" :class="['user-popover-presence', resolvedPresence]"></span>
          </div>

          <div class="user-popover-info">
            <div class="user-popover-name-row">
              <strong class="user-popover-name" :style="{ color: resolvedNameColor }">
                {{ resolvedDisplayName }}
              </strong>
              <span v-if="resolvedIsBot" class="discord-bot-tag">BOT</span>
            </div>
            <span class="user-popover-tag">@{{ resolvedUsername }}</span>
            <span v-if="resolvedId" class="user-popover-id">ID: {{ resolvedId }}</span>
          </div>

          <!-- Rôles majeurs -->
          <div v-if="userRoles.length > 0" class="user-popover-roles">
            <span class="roles-title">Rôles</span>
            <div class="roles-list">
              <span
                v-for="r in userRoles.slice(0, 3)"
                :key="r.id"
                class="role-badge-mini"
                :style="{
                  borderColor: r.color ? `${r.color}55` : 'rgba(255, 255, 255, 0.1)',
                  backgroundColor: r.color ? `${r.color}18` : 'rgba(255, 255, 255, 0.05)',
                  color: r.color || 'var(--text-muted)'
                }"
              >
                <span class="role-dot-mini" :style="{ backgroundColor: r.color || '#99aab5' }"></span>
                {{ r.name }}
              </span>
              <span v-if="userRoles.length > 3" class="role-badge-mini more">
                +{{ userRoles.length - 3 }}
              </span>
            </div>
          </div>

          <!-- Dates clés -->
          <div class="user-popover-footer-dates">
            <div v-if="resolvedJoinedAt" class="date-item">
              <span class="date-label">Rejoint le</span>
              <span class="date-val"><DiscordTime :value="resolvedJoinedAt" mode="date" :enable-tooltip="false" /></span>
            </div>
            <div v-if="resolvedCreatedAt" class="date-item">
              <span class="date-label">Compte créé</span>
              <span class="date-val"><DiscordTime :value="resolvedCreatedAt" mode="date" :enable-tooltip="false" /></span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { useAppState } from '~/composables/useAppState.ts';
import DiscordTime from '~/components/common/DiscordTime.vue';

const props = withDefaults(
  defineProps<{
    user?: any;
    userId?: string | number;
    username?: string;
    avatarUrl?: string;
    avatarSize?: number;
    showAvatar?: boolean;
    showTag?: boolean;
    showId?: boolean;
    showPresence?: boolean;
    showHighestRole?: boolean;
    clickable?: boolean;
    variant?: 'inline' | 'pill' | 'badge' | 'compact' | 'card';
    customClass?: string;
    fallback?: string;
  }>(),
  {
    avatarSize: 24,
    showAvatar: true,
    showTag: false,
    showId: false,
    showPresence: false,
    showHighestRole: false,
    clickable: true,
    variant: 'inline',
    customClass: '',
    fallback: 'Inconnu'
  }
);

const { users, roles, getUserAvatar, getProxiedImageUrl } = useAppState();
const inspectUser = inject<(userOrId: any) => void>('inspectUser', () => {});

// Résolution de l'objet utilisateur
const resolvedUser = computed(() => {
  if (props.user && typeof props.user === 'object') {
    return props.user;
  }
  const idStr = props.userId !== undefined && props.userId !== null ? String(props.userId) : '';
  if (idStr) {
    const found = users.value.find((u: any) => String(u.id || u.userId || u.user_id) === idStr);
    if (found) return found;
  }
  if (props.username) {
    const found = users.value.find((u: any) => (u.username || '').toLowerCase() === props.username?.toLowerCase());
    if (found) return found;
  }
  return null;
});

const resolvedId = computed(() => {
  return resolvedUser.value?.id || resolvedUser.value?.userId || resolvedUser.value?.user_id || (props.userId ? String(props.userId) : '');
});

const resolvedUsername = computed(() => {
  return resolvedUser.value?.username || resolvedUser.value?.userTag || props.username || props.fallback;
});

const resolvedDisplayName = computed(() => {
  return resolvedUser.value?.displayName || resolvedUser.value?.globalName || resolvedUser.value?.nickname || resolvedUsername.value;
});

const resolvedAvatar = computed(() => {
  if (props.avatarUrl) return getProxiedImageUrl(props.avatarUrl);
  if (resolvedUser.value?.avatarUrl || resolvedUser.value?.avatar) {
    return getProxiedImageUrl(resolvedUser.value.avatarUrl || resolvedUser.value.avatar);
  }
  return getUserAvatar(resolvedId.value);
});

const resolvedIsBot = computed(() => {
  return !!(resolvedUser.value?.isBot || resolvedUser.value?.bot);
});

const resolvedIsVerifiedBot = computed(() => {
  return !!(resolvedUser.value?.verified || resolvedUser.value?.isVerifiedBot);
});

const resolvedPresence = computed(() => {
  return resolvedUser.value?.presence || resolvedUser.value?.status || '';
});

const resolvedJoinedAt = computed(() => {
  return resolvedUser.value?.joinedAt || resolvedUser.value?.joined_at || resolvedUser.value?.joinedTimestamp;
});

const resolvedCreatedAt = computed(() => {
  return resolvedUser.value?.createdAt || resolvedUser.value?.created_at || resolvedUser.value?.createdTimestamp;
});

// Calcul du rôle le plus élevé et de la couleur
const resolvedHighestRole = computed(() => {
  if (resolvedUser.value?.highestRole) return resolvedUser.value.highestRole;
  const userRolesList = resolvedUser.value?.roles;
  if (Array.isArray(userRolesList) && userRolesList.length > 0 && Array.isArray(roles.value)) {
    const matched = roles.value.filter(r => userRolesList.some((ur: any) => (ur.id || ur) === r.id));
    if (matched.length > 0) {
      return matched.sort((a, b) => (b.position || 0) - (a.position || 0))[0];
    }
  }
  return null;
});

const resolvedNameColor = computed(() => {
  const role = resolvedHighestRole.value;
  if (role && role.color && role.color !== '#000000' && role.color !== '#99aab5') {
    return role.color;
  }
  return 'var(--header-primary, #ffffff)';
});

const resolvedTag = computed(() => {
  if (resolvedUser.value?.discriminator && resolvedUser.value.discriminator !== '0') {
    return `#${resolvedUser.value.discriminator}`;
  }
  return `@${resolvedUsername.value}`;
});

const userRoles = computed(() => {
  const list = resolvedUser.value?.roles;
  if (!Array.isArray(list)) return [];
  if (Array.isArray(roles.value) && roles.value.length > 0) {
    return roles.value.filter(r => list.some((ur: any) => (ur.id || ur) === r.id) && r.name !== '@everyone');
  }
  return list.filter((r: any) => r.name !== '@everyone');
});

const userBannerStyle = computed(() => {
  if (resolvedUser.value?.bannerUrl) {
    return `url(${resolvedUser.value.bannerUrl}) center/cover no-repeat`;
  }
  const color = resolvedNameColor.value;
  if (color && color !== 'var(--header-primary, #ffffff)') {
    return `linear-gradient(135deg, ${color}88, ${color}33, #1e1f22)`;
  }
  return 'linear-gradient(135deg, #5865F2, #3b428a, #1e1f22)';
});

const wrapperStyle = computed(() => ({}));

function handleClick(evt: MouseEvent) {
  if (props.clickable && (resolvedUser.value || resolvedId.value)) {
    evt.stopPropagation();
    inspectUser(resolvedUser.value || resolvedId.value);
  }
}

// Tooltip popover au survol
const showFloatingTooltip = ref(false);
const popoverTop = ref(0);
const popoverLeft = ref(0);
let hoverTimeout: any = null;

function onMouseEnter(evt: MouseEvent) {
  if (!resolvedUser.value) return;

  const target = evt.currentTarget as HTMLElement;
  if (!target) return;

  const rect = target.getBoundingClientRect();
  popoverTop.value = rect.top + window.scrollY - 10;
  popoverLeft.value = rect.left + window.scrollX + rect.width / 2;

  hoverTimeout = setTimeout(() => {
    showFloatingTooltip.value = true;
  }, 120);
}

function onMouseLeave() {
  clearTimeout(hoverTimeout);
  showFloatingTooltip.value = false;
}

const popoverStyle = computed(() => ({
  top: `${popoverTop.value}px`,
  left: `${popoverLeft.value}px`,
  transform: 'translate(-50%, -100%)'
}));
</script>

<style scoped>
.discord-user-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  vertical-align: middle;
  font-size: 13px;
  line-height: 1.2;
}

.discord-user-wrapper.is-clickable {
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.discord-user-wrapper.is-clickable:hover .user-display-name {
  text-decoration: underline;
}

.user-avatar-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar-img {
  border-radius: 50%;
  object-fit: cover;
  background-color: var(--bg-tertiary, #1e1f22);
}

.presence-indicator-dot {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid var(--bg-secondary, #2b2d31);
}

.presence-indicator-dot.online { background-color: #23a55a; }
.presence-indicator-dot.idle { background-color: #f0b232; }
.presence-indicator-dot.dnd { background-color: #f23f43; }
.presence-indicator-dot.offline { background-color: #80848e; }

.user-text-block {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
}

.user-name-line {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.user-display-name {
  font-weight: 600;
  color: var(--header-primary, #ffffff);
}

.discord-bot-tag {
  background-color: var(--brand-experiment, #5865f2);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  line-height: 1.1;
  text-transform: uppercase;
}

.bot-verified-check {
  color: #ffffff;
}

.user-handle-tag {
  font-size: 11px;
  color: var(--text-muted, #949ba4);
}

.user-id-sub {
  font-size: 11px;
  color: var(--text-muted, #949ba4);
  font-family: var(--font-code, monospace);
}

.user-highest-role-pill {
  font-size: 11px;
  font-weight: 500;
}

/* Variantes */
.discord-user-wrapper.variant-pill {
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  padding: 3px 8px;
  border-radius: 16px;
}

.discord-user-wrapper.variant-badge {
  background: rgba(88, 101, 242, 0.12);
  border: 1px solid rgba(88, 101, 242, 0.25);
  padding: 2px 6px;
  border-radius: 4px;
}
</style>

<!-- Style Global pour le Tooltip Card de l'Utilisateur -->
<style>
.discord-user-floating-popover {
  position: absolute;
  z-index: 10000;
  pointer-events: none;
  background: #111214;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
  min-width: 260px;
  max-width: 320px;
  animation: popoverFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.discord-user-floating-popover .user-popover-banner {
  height: 60px;
  width: 100%;
}

.discord-user-floating-popover .user-popover-body {
  padding: 0 14px 14px 14px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.discord-user-floating-popover .user-popover-avatar-row {
  margin-top: -28px;
  margin-bottom: 2px;
  position: relative;
  display: inline-block;
  width: 56px;
  height: 56px;
}

.discord-user-floating-popover .user-popover-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 4px solid #111214;
  object-fit: cover;
  background: #2b2d31;
}

.discord-user-floating-popover .user-popover-presence {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid #111214;
}

.discord-user-floating-popover .user-popover-presence.online { background-color: #23a55a; }
.discord-user-floating-popover .user-popover-presence.idle { background-color: #f0b232; }
.discord-user-floating-popover .user-popover-presence.dnd { background-color: #f23f43; }
.discord-user-floating-popover .user-popover-presence.offline { background-color: #80848e; }

.discord-user-floating-popover .user-popover-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.discord-user-floating-popover .user-popover-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.discord-user-floating-popover .user-popover-name {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
}

.discord-user-floating-popover .user-popover-tag {
  font-size: 12px;
  color: #949ba4;
}

.discord-user-floating-popover .user-popover-id {
  font-size: 10px;
  color: #80848e;
  font-family: Consolas, Monaco, monospace;
}

.discord-user-floating-popover .user-popover-roles {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.discord-user-floating-popover .roles-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #b5bac1;
  letter-spacing: 0.5px;
}

.discord-user-floating-popover .roles-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.discord-user-floating-popover .role-badge-mini {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.discord-user-floating-popover .role-dot-mini {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.discord-user-floating-popover .role-badge-mini.more {
  background: rgba(255, 255, 255, 0.06);
  color: #949ba4;
}

.discord-user-floating-popover .user-popover-footer-dates {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.discord-user-floating-popover .date-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.discord-user-floating-popover .date-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: #949ba4;
  letter-spacing: 0.5px;
}

.discord-user-floating-popover .date-val {
  font-size: 11px;
  font-weight: 600;
  color: #dbdee1;
}
</style>
