<template>
  <div class="user-card" :class="`user-card--${template}`">
    <div v-if="loading" class="user-card__loading">
      <span class="spinner" />
      Génération…
    </div>

    <div v-else-if="error" class="user-card__error">
      ❌ {{ error }}
    </div>

    <div v-else class="user-card__inner">
      <!-- Mode 1: SVG inline (rendu serveur) -->
      <div v-if="svg" class="user-card__svg-wrap" v-html="svg" />

      <!-- Mode 2: <img src=...> (cache navigateur) -->
      <img
        v-else-if="imgSrc"
        :src="imgSrc"
        :alt="alt || `Card ${template}`"
        class="user-card__img"
        :width="width"
        :height="height"
        @load="$emit('loaded', $event)"
        @error="$emit('error', $event)"
      />
    </div>

    <footer v-if="$slots.footer || caption" class="user-card__footer">
      <slot name="footer">
        <span v-if="caption">{{ caption }}</span>
      </slot>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useCards, type CardPayload } from '~/composables/useCards';

interface Props {
  template: CardPayload['template'];
  payload?: Record<string, any>;
  guildId?: string;
  userId?: string;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  mode?: 'svg' | 'img' | 'auto';
}

const props = withDefaults(defineProps<Props>(), {
  payload: () => ({}),
  width: 1024,
  height: 512,
  mode: 'auto'
});

defineEmits<{
  (e: 'loaded', payload: Event): void;
  (e: 'error', payload: Event): void;
}>();

const cards = useCards();
const svg = ref<string | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

/**
 * Construit l'URL du SVG en mode "img" (utilise le cache navigateur)
 */
const imgSrc = computed<string | null>(() => {
  if (props.mode === 'svg') return null;
  const all: CardPayload = {
    template: props.template,
    ...props.payload,
    width: props.width,
    height: props.height,
    guild_id: props.guildId,
    user_id: props.userId
  };
  return cards.svgUrl(all);
});

async function loadInline() {
  if (props.mode === 'img') return;
  loading.value = true;
  error.value = null;
  try {
    const all: CardPayload = {
      template: props.template,
      ...props.payload,
      width: props.width,
      height: props.height,
      guild_id: props.guildId,
      user_id: props.userId
    };
    svg.value = await cards.render(all);
  } catch (e: any) {
    error.value = e.message || 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.template, JSON.stringify(props.payload), props.guildId, props.userId, props.width, props.height, props.mode],
  () => { if (props.mode !== 'img') loadInline(); }
);

onMounted(() => { if (props.mode !== 'img') loadInline(); });
</script>

<style scoped>
.user-card {
  background: #1e1f22;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-card--welcome { border-top: 3px solid #5865f2; }
.user-card--join { border-top: 3px solid #57f287; }
.user-card--leave { border-top: 3px solid #ed4245; }
.user-card--level_up { border-top: 3px solid #fee75c; }
.user-card--giveaway { border-top: 3px solid #eb459e; }
.user-card--generic { border-top: 3px solid #80848e; }

.user-card__inner {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #2b2d31;
  border-radius: 8px;
  overflow: hidden;
  min-height: 200px;
}

.user-card__svg-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
}

.user-card__svg-wrap :deep(svg) {
  max-width: 100%;
  height: auto;
  display: block;
}

.user-card__img {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: 6px;
}

.user-card__loading {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #b5bac1;
  padding: 32px;
  font-size: 14px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #3f4147;
  border-top-color: #fee75c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.user-card__error {
  color: #ed4245;
  padding: 24px;
  text-align: center;
  font-size: 14px;
}

.user-card__footer {
  font-size: 12px;
  color: #80848e;
  padding: 4px 8px;
}
</style>
