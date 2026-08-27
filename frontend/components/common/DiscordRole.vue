<template>
  <span
    class="discord-role-wrapper"
    :class="[
      `variant-${variant}`,
      `size-${size}`,
      customClass,
      { 'is-clickable': clickable, 'has-color': !!resolvedColor }
    ]"
    :style="roleStyle"
    @click="handleClick"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- Mention Prefix (@) si variant === 'mention' -->
    <span v-if="variant === 'mention'" class="role-mention-at">@</span>

    <!-- Icône d'image du rôle -->
    <img
      v-if="showIcon && resolvedRole?.icon"
      :src="getProxiedImageUrl(resolvedRole.icon)"
      :alt="resolvedName"
      class="role-custom-icon"
      loading="lazy"
      referrerpolicy="no-referrer"
    />

    <!-- Emoji Unicode du rôle -->
    <span v-else-if="showIcon && resolvedRole?.unicodeEmoji" class="role-unicode-emoji">
      {{ resolvedRole.unicodeEmoji }}
    </span>

    <!-- Pastille de couleur (Dot) -->
    <span
      v-else-if="showDot && resolvedColor && resolvedColor !== '#000000'"
      class="role-color-circle"
      :style="{ backgroundColor: resolvedColor }"
    ></span>

    <!-- Nom du rôle -->
    <span class="role-name-text" :style="{ color: textColor }">
      {{ resolvedName }}
    </span>

    <!-- Compteur de membres pour ce rôle -->
    <span v-if="showMemberCount && memberCount !== undefined" class="role-count-badge">
      {{ memberCount }}
    </span>

    <!-- Popover Flottant au survol -->
    <Teleport to="body" v-if="showFloatingTooltip && (resolvedRole || resolvedId)">
      <div
        class="discord-role-floating-popover"
        :style="popoverStyle"
      >
        <div class="role-popover-header">
          <span
            class="role-color-preview-circle"
            :style="{ backgroundColor: resolvedColor || '#99aab5' }"
          ></span>
          <strong class="role-popover-title" :style="{ color: resolvedColor || '#ffffff' }">
            {{ resolvedName }}
          </strong>
        </div>

        <div class="role-popover-body">
          <div v-if="resolvedId" class="role-popover-row">
            <span class="row-label">ID Rôle :</span>
            <code>{{ resolvedId }}</code>
          </div>
          <div v-if="resolvedRole?.position !== undefined" class="role-popover-row">
            <span class="row-label">Position hiérarchique :</span>
            <span>#{{ resolvedRole.position }}</span>
          </div>
          <div v-if="resolvedRole?.hoist" class="role-popover-row">
            <span class="row-label">Affichage :</span>
            <span>Affiché séparément (Hoist)</span>
          </div>
          <div v-if="resolvedRole?.mentionable" class="role-popover-row">
            <span class="row-label">Mentionnable :</span>
            <span>Oui (@everyone / membres)</span>
          </div>
          <div v-if="memberCount !== undefined" class="role-popover-row">
            <span class="row-label">Membres avec ce rôle :</span>
            <strong>{{ memberCount }} membre{{ memberCount > 1 ? 's' : '' }}</strong>
          </div>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppState } from '~/composables/useAppState.ts';

const props = withDefaults(
  defineProps<{
    role?: any;
    roleId?: string;
    name?: string;
    color?: string;
    showDot?: boolean;
    showIcon?: boolean;
    showMemberCount?: boolean;
    variant?: 'pill' | 'badge' | 'mention' | 'text';
    size?: 'small' | 'normal' | 'large';
    clickable?: boolean;
    customClass?: string;
    fallback?: string;
  }>(),
  {
    showDot: true,
    showIcon: true,
    showMemberCount: false,
    variant: 'pill',
    size: 'normal',
    clickable: false,
    customClass: '',
    fallback: '@rôle'
  }
);

const emit = defineEmits<{
  (e: 'click', role: any): void;
}>();

const { roles, users, getProxiedImageUrl } = useAppState();

const resolvedRole = computed(() => {
  if (props.role && typeof props.role === 'object') {
    return props.role;
  }
  const id = props.roleId !== undefined && props.roleId !== null ? String(props.roleId) : '';
  if (id && Array.isArray(roles.value)) {
    const found = roles.value.find((r: any) => String(r.id) === id);
    if (found) return found;
  }
  if (props.name && Array.isArray(roles.value)) {
    const found = roles.value.find((r: any) => r.name?.toLowerCase() === props.name?.toLowerCase());
    if (found) return found;
  }
  return null;
});

const resolvedId = computed(() => {
  return resolvedRole.value?.id || props.roleId || '';
});

const resolvedName = computed(() => {
  return resolvedRole.value?.name || props.name || props.fallback;
});

const resolvedColor = computed(() => {
  if (props.color) return props.color;
  const c = resolvedRole.value?.color;
  if (c && c !== '#000000' && c !== '0' && c !== 0) {
    if (typeof c === 'number') {
      return '#' + c.toString(16).padStart(6, '0');
    }
    return String(c);
  }
  return null;
});

const memberCount = computed(() => {
  if (resolvedRole.value?.memberCount !== undefined) {
    return resolvedRole.value.memberCount;
  }
  if (!resolvedId.value || !Array.isArray(users.value)) return undefined;
  return users.value.filter((u: any) => {
    const userRoles = Array.isArray(u.roles) ? u.roles : [];
    return userRoles.some((r: any) => String(r.id || r) === resolvedId.value);
  }).length;
});

const roleStyle = computed(() => {
  const color = resolvedColor.value;

  if (props.variant === 'pill') {
    return {
      backgroundColor: color ? `${color}18` : 'var(--bg-tertiary, #1e1f22)',
      borderColor: color ? `${color}55` : 'rgba(255, 255, 255, 0.08)'
    };
  }

  if (props.variant === 'mention') {
    return {
      backgroundColor: color ? `${color}18` : 'rgba(88, 101, 242, 0.15)',
      color: color || 'var(--brand-experiment, #5865f2)'
    };
  }

  return {};
});

const textColor = computed(() => {
  const color = resolvedColor.value;
  if (props.variant === 'text') {
    return color || 'var(--text-normal, #dbdee1)';
  }
  if (props.variant === 'pill') {
    return color || 'var(--text-muted, #949ba4)';
  }
  return undefined;
});

function handleClick(evt: MouseEvent) {
  if (props.clickable) {
    evt.stopPropagation();
    emit('click', resolvedRole.value || { id: resolvedId.value, name: resolvedName.value });
  }
}

// Tooltip popover
const showFloatingTooltip = ref(false);
const popoverTop = ref(0);
const popoverLeft = ref(0);
let hoverTimeout: any = null;

function onMouseEnter(evt: MouseEvent) {
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
.discord-role-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  vertical-align: middle;
  transition: all 0.15s ease;
  user-select: none;
}

.discord-role-wrapper.is-clickable {
  cursor: pointer;
}

.discord-role-wrapper.is-clickable:hover {
  filter: brightness(1.15);
  transform: translateY(-1px);
}

/* Variant Pill */
.discord-role-wrapper.variant-pill {
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
}

/* Variant Mention (@Role) */
.discord-role-wrapper.variant-mention {
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 600;
  font-size: 12px;
  background-color: rgba(88, 101, 242, 0.15);
  color: var(--brand-experiment, #5865f2);
}

.role-mention-at {
  opacity: 0.8;
  font-weight: 700;
}

/* Variant Badge */
.discord-role-wrapper.variant-badge {
  padding: 2px 6px;
  border-radius: 3px;
  background-color: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  font-size: 11px;
}

/* Sizes */
.discord-role-wrapper.size-small {
  padding: 1px 5px;
  font-size: 11px;
  gap: 3px;
}

.discord-role-wrapper.size-large {
  padding: 5px 10px;
  font-size: 13px;
  gap: 6px;
}

.role-custom-icon {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  object-fit: contain;
}

.role-unicode-emoji {
  font-size: 12px;
}

.role-color-circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.role-name-text {
  font-weight: 500;
}

.role-count-badge {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted, #949ba4);
  background: rgba(0, 0, 0, 0.2);
  padding: 1px 5px;
  border-radius: 10px;
}
</style>

<!-- Style Global pour le Tooltip Popover du Rôle -->
<style>
.discord-role-floating-popover {
  position: absolute;
  z-index: 10000;
  pointer-events: none;
  background: #111214;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
  min-width: 220px;
  max-width: 320px;
  animation: popoverFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.discord-role-floating-popover .role-popover-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.discord-role-floating-popover .role-color-preview-circle {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.discord-role-floating-popover .role-popover-title {
  font-size: 13px;
  font-weight: 700;
}

.discord-role-floating-popover .role-popover-body {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: #dbdee1;
}

.discord-role-floating-popover .role-popover-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.discord-role-floating-popover .row-label {
  color: #949ba4;
}

.discord-role-floating-popover code {
  font-family: Consolas, Monaco, monospace;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.3);
  padding: 1px 4px;
  border-radius: 3px;
  color: #c9cdfb;
}
</style>
