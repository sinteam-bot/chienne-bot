<template>
  <div class="feature-card" :class="{ 'is-enabled': enabled, 'is-disabled': !enabled }">
    <div class="feature-card__header">
      <span class="feature-card__emoji">{{ emoji }}</span>
      <div class="feature-card__title-block">
        <h3 class="feature-card__title">{{ title }}</h3>
        <p class="feature-card__name">{{ name }}</p>
      </div>
      <label class="feature-card__toggle" :title="enabled ? 'Désactiver' : 'Activer'">
        <input
          type="checkbox"
          :checked="enabled"
          :disabled="busy"
          @change="onToggle"
        />
        <span class="feature-card__toggle-track">
          <span class="feature-card__toggle-thumb"></span>
        </span>
      </label>
    </div>

    <p class="feature-card__description">{{ description }}</p>

    <div class="feature-card__footer">
      <span class="feature-card__source" :class="`source-${source}`">
        {{ sourceLabel }}
      </span>
      <span v-if="lastUpdated" class="feature-card__updated">
        mis à jour {{ lastUpdated }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useFeatures } from '~/composables/useFeatures';

interface Props {
  name: string;
  title: string;
  emoji: string;
  description: string;
  enabled: boolean;
  source: 'db' | 'yaml:features' | 'yaml:legacy' | 'default';
  guildId?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'updated', value: { name: string; enabled: boolean }): void }>();

const { toggle } = useFeatures();
const busy = ref(false);

const sourceLabel = computed(() => {
  switch (props.source) {
    case 'db': return '💾 Base de données';
    case 'yaml:features': return '📄 YAML (features)';
    case 'yaml:legacy': return '📄 YAML (legacy)';
    default: return '⚙️ Défaut';
  }
});

const lastUpdated = ref<string | null>(null);

async function onToggle() {
  if (busy.value) return;
  busy.value = true;
  try {
    const result = await toggle(props.name, props.guildId);
    emit('updated', { name: result.name, enabled: result.enabled });
    lastUpdated.value = new Date().toLocaleTimeString('fr-FR');
  } catch (err) {
    console.error(`Erreur toggle ${props.name}:`, err);
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.feature-card {
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-radius: 12px;
  padding: 18px;
  transition: border-color 0.2s, transform 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-card:hover {
  border-color: #5865f2;
  transform: translateY(-2px);
}

.feature-card.is-enabled {
  border-color: #57f287;
  box-shadow: 0 0 0 1px rgba(87, 242, 135, 0.15) inset;
}

.feature-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feature-card__emoji {
  font-size: 32px;
  line-height: 1;
}

.feature-card__title-block {
  flex: 1;
  min-width: 0;
}

.feature-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #f2f3f5;
}

.feature-card__name {
  margin: 2px 0 0;
  font-size: 12px;
  color: #80848e;
  font-family: 'JetBrains Mono', monospace;
}

.feature-card__description {
  margin: 0;
  color: #b5bac1;
  font-size: 14px;
  line-height: 1.4;
}

.feature-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #80848e;
}

.feature-card__source {
  padding: 2px 8px;
  border-radius: 10px;
  background: #1e1f22;
  border: 1px solid #3f4147;
}

.feature-card__source.source-db { color: #57f287; border-color: #57f287; }
.feature-card__source.source-yaml\:features { color: #fee75c; }
.feature-card__source.source-yaml\:legacy { color: #fee75c; opacity: 0.7; }

.feature-card__toggle {
  position: relative;
  width: 44px;
  height: 24px;
  cursor: pointer;
  display: inline-block;
}

.feature-card__toggle input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.feature-card__toggle-track {
  position: absolute;
  inset: 0;
  background: #4e5058;
  border-radius: 12px;
  transition: background 0.2s;
}

.feature-card__toggle-thumb {
  position: absolute;
  width: 18px;
  height: 18px;
  top: 3px;
  left: 3px;
  background: #f2f3f5;
  border-radius: 50%;
  transition: transform 0.2s;
}

.feature-card__toggle input:checked + .feature-card__toggle-track {
  background: #57f287;
}

.feature-card__toggle input:checked + .feature-card__toggle-track .feature-card__toggle-thumb {
  transform: translateX(20px);
}

.feature-card__toggle input:disabled + .feature-card__toggle-track {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
