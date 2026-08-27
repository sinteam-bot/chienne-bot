<template>
  <span
    class="discord-channel-wrapper"
    :class="[
      `variant-${variant}`,
      customClass,
      { 'is-clickable': clickable && !!resolvedChannel }
    ]"
    @click="handleClick"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- Icône du Salon -->
    <span v-if="showIcon" class="channel-icon-symbol">
      {{ channelIcon }}
    </span>

    <!-- Nom de la catégorie si showCategory -->
    <span v-if="showCategory && parentCategoryName" class="channel-category-prefix">
      {{ parentCategoryName }} /
    </span>

    <!-- Nom du salon -->
    <span class="channel-name-text">
      {{ resolvedName }}
    </span>

    <!-- Sujet du salon inline si showTopic -->
    <span v-if="showTopic && resolvedTopic" class="channel-topic-inline">
      — {{ resolvedTopic }}
    </span>

    <!-- Popover Flottant au survol -->
    <Teleport to="body" v-if="showFloatingTooltip && (resolvedChannel || resolvedId)">
      <div
        class="discord-channel-floating-popover"
        :style="popoverStyle"
      >
        <div class="channel-popover-header">
          <span class="channel-popover-icon">{{ channelIcon }}</span>
          <div class="channel-popover-title-block">
            <strong class="channel-popover-title">#{{ resolvedName }}</strong>
            <span v-if="parentCategoryName" class="channel-popover-category">
              📁 Catégorie : {{ parentCategoryName }}
            </span>
          </div>
        </div>

        <div class="channel-popover-body">
          <div v-if="resolvedTopic" class="channel-popover-topic">
            <span class="topic-label">Sujet du salon :</span>
            <p class="topic-text">{{ resolvedTopic }}</p>
          </div>

          <div class="channel-popover-meta">
            <div v-if="resolvedId" class="meta-row">
              <span class="meta-label">ID Salon :</span>
              <code>{{ resolvedId }}</code>
            </div>
            <div class="meta-row">
              <span class="meta-label">Type :</span>
              <span class="meta-val">{{ channelTypeLabel }}</span>
            </div>
            <div v-if="resolvedIsNsfw" class="meta-row">
              <span class="meta-label">Accès :</span>
              <span class="badge-nsfw">🔞 Salon NSFW (+18)</span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAppState } from '~/composables/useAppState.ts';

const props = withDefaults(
  defineProps<{
    channel?: any;
    channelId?: string;
    name?: string;
    type?: string | number;
    showIcon?: boolean;
    showCategory?: boolean;
    showTopic?: boolean;
    clickable?: boolean;
    variant?: 'mention' | 'pill' | 'badge' | 'link' | 'text';
    customClass?: string;
    fallback?: string;
  }>(),
  {
    showIcon: true,
    showCategory: false,
    showTopic: false,
    clickable: true,
    variant: 'mention',
    customClass: '',
    fallback: 'salon-inconnu'
  }
);

const emit = defineEmits<{
  (e: 'click', channel: any): void;
}>();

const router = useRouter();
const { discordChannels, channelCategories, setActiveDiscordChannel } = useAppState();

const resolvedChannel = computed(() => {
  if (props.channel && typeof props.channel === 'object') {
    return props.channel;
  }
  const id = props.channelId !== undefined && props.channelId !== null ? String(props.channelId) : '';
  if (id && Array.isArray(discordChannels.value)) {
    const found = discordChannels.value.find((c: any) => String(c.id) === id);
    if (found) return found;
  }
  if (props.name && Array.isArray(discordChannels.value)) {
    const cleanName = props.name.replace(/^#/, '').toLowerCase();
    const found = discordChannels.value.find((c: any) => c.name?.toLowerCase() === cleanName);
    if (found) return found;
  }
  return null;
});

const resolvedId = computed(() => {
  return resolvedChannel.value?.id || props.channelId || '';
});

const resolvedName = computed(() => {
  const raw = resolvedChannel.value?.name || props.name || props.fallback;
  return raw.replace(/^#/, '');
});

const resolvedTopic = computed(() => {
  return resolvedChannel.value?.topic || '';
});

const resolvedIsNsfw = computed(() => {
  return !!resolvedChannel.value?.isNsfw;
});

const parentCategoryName = computed(() => {
  const parentId = resolvedChannel.value?.parentId;
  if (!parentId || !Array.isArray(channelCategories.value)) return '';
  const found = channelCategories.value.find((cat: any) => String(cat.id) === String(parentId));
  return found ? found.name : '';
});

const channelIcon = computed(() => {
  const t = resolvedChannel.value?.type ?? props.type;
  if (t === 2 || t === 'voice') return '🔊';
  if (t === 4 || t === 'category') return '📁';
  if (t === 5 || t === 'announcement' || t === 'news') return '📢';
  if (t === 10 || t === 11 || t === 12 || t === 'thread') return '🧵';
  if (t === 15 || t === 'forum') return '💬';
  if (t === 13 || t === 'stage') return '🎙️';
  return '#';
});

const channelTypeLabel = computed(() => {
  const t = resolvedChannel.value?.type ?? props.type;
  if (t === 2 || t === 'voice') return 'Salon Vocal';
  if (t === 4 || t === 'category') return 'Catégorie';
  if (t === 5 || t === 'announcement' || t === 'news') return 'Salon d\'Annonces';
  if (t === 10 || t === 11 || t === 12 || t === 'thread') return 'Fil de discussion (Thread)';
  if (t === 15 || t === 'forum') return 'Forum';
  if (t === 13 || t === 'stage') return 'Salon Conférence (Stage)';
  return 'Salon Textuel';
});

function handleClick(evt: MouseEvent) {
  if (props.clickable) {
    evt.stopPropagation();
    emit('click', resolvedChannel.value || { id: resolvedId.value, name: resolvedName.value });

    if (resolvedChannel.value) {
      setActiveDiscordChannel(resolvedChannel.value);
      router.push('/archives');
    }
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
.discord-channel-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  vertical-align: middle;
  transition: all 0.15s ease;
  user-select: none;
}

.discord-channel-wrapper.is-clickable {
  cursor: pointer;
}

.discord-channel-wrapper.is-clickable:hover {
  filter: brightness(1.2);
}

/* Variant Mention (#channel) */
.discord-channel-wrapper.variant-mention {
  background-color: rgba(88, 101, 242, 0.15);
  color: var(--brand-experiment, #5865f2);
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 13px;
  line-height: 1.3;
}

.discord-channel-wrapper.variant-mention:hover {
  background-color: rgba(88, 101, 242, 0.3);
  color: #ffffff;
}

.channel-icon-symbol {
  font-weight: 700;
  opacity: 0.85;
}

.channel-category-prefix {
  font-size: 11px;
  color: var(--text-muted, #949ba4);
  margin-right: 2px;
}

.channel-name-text {
  font-weight: 500;
}

.channel-topic-inline {
  font-size: 11px;
  color: var(--text-muted, #949ba4);
  margin-left: 4px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Variant Pill */
.discord-channel-wrapper.variant-pill {
  background-color: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--text-normal, #dbdee1);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* Variant Badge */
.discord-channel-wrapper.variant-badge {
  background-color: var(--bg-secondary-alt, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--text-muted, #949ba4);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}
</style>

<!-- Style Global pour le Tooltip Popover du Salon -->
<style>
.discord-channel-floating-popover {
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

.discord-channel-floating-popover .channel-popover-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.discord-channel-floating-popover .channel-popover-icon {
  font-size: 16px;
  font-weight: 700;
  color: #5865f2;
}

.discord-channel-floating-popover .channel-popover-title-block {
  display: flex;
  flex-direction: column;
}

.discord-channel-floating-popover .channel-popover-title {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}

.discord-channel-floating-popover .channel-popover-category {
  font-size: 10px;
  color: #949ba4;
}

.discord-channel-floating-popover .channel-popover-body {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 11px;
}

.discord-channel-floating-popover .channel-popover-topic {
  background: rgba(255, 255, 255, 0.04);
  padding: 6px 8px;
  border-radius: 4px;
  border-left: 2px solid #5865f2;
}

.discord-channel-floating-popover .topic-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: #949ba4;
  letter-spacing: 0.5px;
  display: block;
}

.discord-channel-floating-popover .topic-text {
  margin: 2px 0 0 0;
  color: #dbdee1;
  line-height: 1.4;
  white-space: pre-wrap;
}

.discord-channel-floating-popover .channel-popover-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.discord-channel-floating-popover .meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.discord-channel-floating-popover .meta-label {
  color: #949ba4;
}

.discord-channel-floating-popover .meta-val {
  color: #dbdee1;
  font-weight: 500;
}

.discord-channel-floating-popover .badge-nsfw {
  color: #f23f43;
  font-weight: 600;
}

.discord-channel-floating-popover code {
  font-family: Consolas, Monaco, monospace;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.3);
  padding: 1px 4px;
  border-radius: 3px;
  color: #c9cdfb;
}
</style>
