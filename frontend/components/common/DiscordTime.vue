<template>
  <span
    class="discord-time-wrapper"
    :class="[modeClass, customClass, { 'has-tooltip': enableTooltip && !!parsedDate }]"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <span class="discord-time-trigger">
      <span v-if="prefix" class="time-prefix">{{ prefix }}</span>

      <!-- Mode : Date & Heure complète locale -->
      <template v-if="mode === 'datetime'">
        {{ formattedText }}
      </template>

      <!-- Mode : Temps Relatif uniquement (il y a X min) -->
      <template v-else-if="mode === 'relative'">
        {{ relativeText }}
      </template>

      <!-- Mode : Date/Heure + (Temps Relatif) -->
      <template v-else-if="mode === 'both'">
        <span class="time-main">{{ formattedText }}</span>
        <span class="time-sub">({{ relativeText }})</span>
      </template>

      <!-- Mode : Date uniquement -->
      <template v-else-if="mode === 'date'">
        {{ formattedDateOnly }}
      </template>

      <!-- Mode : Heure uniquement -->
      <template v-else-if="mode === 'time'">
        {{ formattedTimeOnly }}
      </template>

      <!-- Mode : Badge visuel -->
      <template v-else-if="mode === 'badge'">
        <span class="time-badge">
          <span class="badge-dot"></span>
          <span class="badge-text">{{ formattedText }}</span>
          <span class="badge-ago">{{ relativeText }}</span>
        </span>
      </template>
    </span>

    <!-- Infobulle / Tooltip Flottant Discord sur Hover -->
    <Teleport to="body" v-if="showFloatingTooltip && parsedDate">
      <div
        class="discord-time-floating-popover"
        :style="popoverStyle"
      >
        <div class="popover-arrow"></div>
        <div class="popover-content">
          <div class="popover-title">
            <span>📅</span>
            <strong>{{ fullLocalizedText }}</strong>
          </div>
          <div class="popover-meta">
            <span class="popover-tag relative-tag">⏳ {{ relativeDetailText }}</span>
            <span class="popover-tag tz-tag">📍 {{ browserTz }}</span>
          </div>
          <div class="popover-utc">
            <span class="utc-label">UTC :</span>
            <code>{{ utcText }}</code>
          </div>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useDateFormatter } from '~/composables/useDateFormatter.ts';

const props = withDefaults(
  defineProps<{
    value: any;
    mode?: 'datetime' | 'relative' | 'both' | 'date' | 'time' | 'badge';
    showSeconds?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
    prefix?: string;
    customClass?: string;
    fallback?: string;
    enableTooltip?: boolean;
  }>(),
  {
    mode: 'datetime',
    showSeconds: true,
    autoRefresh: true,
    refreshInterval: 15000,
    prefix: '',
    customClass: '',
    fallback: '—',
    enableTooltip: true
  }
);

const {
  parseDateSafe,
  formatLocalDate,
  getFullLocalizedDateTime,
  formatTimeAgo,
  getBrowserTimezone
} = useDateFormatter();

const nowTick = ref(Date.now());
let timer: ReturnType<typeof setInterval> | null = null;

const parsedDate = computed(() => parseDateSafe(props.value));

const formattedText = computed(() => {
  if (!parsedDate.value) return props.fallback;
  return formatLocalDate(parsedDate.value, {
    showSeconds: props.showSeconds,
    showDate: true,
    showTime: true,
    fallback: props.fallback
  });
});

const formattedDateOnly = computed(() => {
  if (!parsedDate.value) return props.fallback;
  return formatLocalDate(parsedDate.value, {
    showDate: true,
    showTime: false,
    fallback: props.fallback
  });
});

const formattedTimeOnly = computed(() => {
  if (!parsedDate.value) return props.fallback;
  return formatLocalDate(parsedDate.value, {
    showSeconds: props.showSeconds,
    showDate: false,
    showTime: true,
    fallback: props.fallback
  });
});

const relativeText = computed(() => {
  if (nowTick.value && !parsedDate.value) return props.fallback;
  return formatTimeAgo(parsedDate.value, { fallback: props.fallback });
});

const relativeDetailText = computed(() => {
  if (nowTick.value && !parsedDate.value) return props.fallback;
  return formatTimeAgo(parsedDate.value, { detailed: true, fallback: props.fallback });
});

const fullLocalizedText = computed(() => {
  if (!parsedDate.value) return '';
  return getFullLocalizedDateTime(parsedDate.value);
});

const utcText = computed(() => {
  if (!parsedDate.value) return '';
  return parsedDate.value.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
});

const browserTz = computed(() => getBrowserTimezone());

const modeClass = computed(() => `mode-${props.mode}`);

// Gestion de la modale flottante au survol
const showFloatingTooltip = ref(false);
const popoverTop = ref(0);
const popoverLeft = ref(0);
let hoverTimeout: any = null;

function onMouseEnter(evt: MouseEvent) {
  if (!props.enableTooltip || !parsedDate.value) return;

  const target = evt.currentTarget as HTMLElement;
  if (!target) return;

  const rect = target.getBoundingClientRect();
  popoverTop.value = rect.top + window.scrollY - 10;
  popoverLeft.value = rect.left + window.scrollX + rect.width / 2;

  hoverTimeout = setTimeout(() => {
    showFloatingTooltip.value = true;
  }, 80);
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

onMounted(() => {
  if (props.autoRefresh) {
    timer = setInterval(() => {
      nowTick.value = Date.now();
    }, props.refreshInterval);
  }
});

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  clearTimeout(hoverTimeout);
});
</script>

<style scoped>
.discord-time-wrapper {
  display: inline-flex;
  align-items: center;
  position: relative;
}

.discord-time-wrapper.has-tooltip .discord-time-trigger {
  cursor: help;
  border-bottom: 1px dotted rgba(255, 255, 255, 0.25);
  padding-bottom: 1px;
  transition: all 0.15s ease;
}

.discord-time-wrapper.has-tooltip:hover .discord-time-trigger {
  color: var(--header-primary, #ffffff);
  border-bottom-color: var(--brand-experiment, #5865f2);
  background-color: rgba(88, 101, 242, 0.08);
  border-radius: 3px;
  padding: 1px 4px;
  margin: -1px -4px;
}

.time-prefix {
  opacity: 0.85;
}

.time-sub {
  font-size: 0.88em;
  color: var(--text-muted, #949ba4);
  margin-left: 4px;
}

.time-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  background: var(--bg-tertiary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 4px;
  font-size: 12px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-experiment, #5865f2);
}

.badge-ago {
  font-size: 11px;
  color: var(--text-muted, #949ba4);
}
</style>

<!-- Style Global pour le Tooltip Flottant téléporté dans le body -->
<style>
.discord-time-floating-popover {
  position: absolute;
  z-index: 10000;
  pointer-events: none;
  background: #111214;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
  min-width: 260px;
  max-width: 380px;
  animation: popoverFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

@keyframes popoverFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -92%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
  }
}

.discord-time-floating-popover .popover-arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 10px;
  height: 10px;
  background: #111214;
  border-right: 1px solid rgba(255, 255, 255, 0.14);
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.discord-time-floating-popover .popover-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.discord-time-floating-popover .popover-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #ffffff;
  font-weight: 600;
  line-height: 1.3;
}

.discord-time-floating-popover .popover-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.discord-time-floating-popover .popover-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
}

.discord-time-floating-popover .popover-tag.relative-tag {
  background: rgba(88, 101, 242, 0.2);
  color: #c9cdfb;
  border: 1px solid rgba(88, 101, 242, 0.4);
}

.discord-time-floating-popover .popover-tag.tz-tag {
  background: rgba(255, 255, 255, 0.08);
  color: #949ba4;
}

.discord-time-floating-popover .popover-utc {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #80848e;
  margin-top: 2px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  padding-top: 6px;
}

.discord-time-floating-popover .popover-utc code {
  font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
  font-size: 11px;
  color: #dbdee1;
  background: rgba(0, 0, 0, 0.3);
  padding: 1px 4px;
  border-radius: 3px;
}
</style>
