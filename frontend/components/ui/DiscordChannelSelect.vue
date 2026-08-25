<template>
  <div class="discord-channel-select-wrapper">
    <div class="select-row" style="display: flex; gap: 8px; align-items: center;">
      <!-- Sélecteur par liste déroulante -->
      <select
        v-if="!manualMode"
        :value="modelValue"
        class="discord-input discord-select"
        style="flex: 1; cursor: pointer; background-color: var(--bg-tertiary); color: var(--text-normal);"
        @change="onSelectChange"
      >
        <option v-if="allowNull" value="">
          {{ nullLabel || '— Aucun (ou salon système par défaut) —' }}
        </option>

        <option v-if="!allowNull && !modelValue" value="" disabled selected>
          {{ placeholder || 'Sélectionner un salon Discord...' }}
        </option>

        <!-- Canaux groupés par catégorie -->
        <template v-if="categoriesWithChannels.length > 0">
          <optgroup
            v-for="cat in categoriesWithChannels"
            :key="cat.id"
            :label="cat.name.toUpperCase()"
          >
            <option
              v-for="ch in cat.channels"
              :key="ch.id"
              :value="ch.id"
            >
              {{ getChannelPrefix(ch) }} {{ ch.name }}
            </option>
          </optgroup>
        </template>

        <!-- Canaux sans catégorie ou liste plate -->
        <optgroup v-if="uncategorizedChannels.length > 0" label="SALONS SANS CATÉGORIE">
          <option
            v-for="ch in uncategorizedChannels"
            :key="ch.id"
            :value="ch.id"
          >
            {{ getChannelPrefix(ch) }} {{ ch.name }}
          </option>
        </optgroup>

        <!-- Fallback si aucun canal n'est groupé mais que discordChannels a des données -->
        <template v-if="categoriesWithChannels.length === 0 && uncategorizedChannels.length === 0 && filteredChannelsList.length > 0">
          <option
            v-for="ch in filteredChannelsList"
            :key="ch.id"
            :value="ch.id"
          >
            {{ getChannelPrefix(ch) }} {{ ch.name }}
          </option>
        </template>

        <!-- Si l'ID actuel n'est pas dans la liste des salons chargés -->
        <option v-if="isUnknownId" :value="modelValue">
          ⚠️ Salon ID actuel : {{ modelValue }}
        </option>
      </select>

      <!-- Saisie manuelle directe si mode manuel actif -->
      <input
        v-else
        :value="modelValue"
        type="text"
        class="discord-input"
        style="flex: 1;"
        :placeholder="placeholder || 'Entrez l\'ID du salon (ex: 1337807772024180756)'"
        @input="onInput"
      />

      <!-- Bouton de bascule mode liste / mode ID manuel -->
      <button
        type="button"
        class="action-btn"
        style="padding: 8px 12px; font-size: 12px; white-space: nowrap;"
        :title="manualMode ? 'Choisir dans la liste des salons' : 'Saisir un ID manuellement'"
        @click="manualMode = !manualMode"
      >
        {{ manualMode ? '📋 Liste' : '✏️ ID' }}
      </button>
    </div>

    <!-- Badge info sous le sélecteur -->
    <div v-if="selectedChannelInfo" class="channel-selected-hint" style="margin-top: 6px; font-size: 11.5px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
      <span>📌 Salon sélectionné :</span>
      <span style="font-weight: 600; color: var(--text-normal);">
        {{ selectedChannelInfo.prefix }} {{ selectedChannelInfo.name }}
      </span>
      <code style="font-size: 10.5px; background: rgba(0,0,0,0.25); padding: 2px 6px; border-radius: 3px; color: var(--text-muted);">
        ID: {{ modelValue }}
      </code>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAppState } from '~/composables/useAppState.ts';

const props = defineProps<{
  modelValue?: string | null;
  placeholder?: string;
  allowNull?: boolean;
  nullLabel?: string;
  filterTextOnly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
}>();

const { discordChannels, channelCategories, fetchChannels } = useAppState();
const manualMode = ref(false);

onMounted(async () => {
  if (discordChannels.value.length === 0) {
    await fetchChannels();
  }
});

function getChannelPrefix(ch: any): string {
  if (ch.type === 'voice') return '🔊';
  if (ch.type === 'announcement') return '📢';
  if (ch.type === 'forum') return '💬';
  return '#';
}

const filteredChannelsList = computed(() => {
  if (!props.filterTextOnly) return discordChannels.value;
  return discordChannels.value.filter(c => c.type !== 'voice');
});

const categoriesWithChannels = computed(() => {
  if (!channelCategories.value || channelCategories.value.length === 0) return [];
  return channelCategories.value
    .map(cat => {
      const channels = (cat.channels || []).filter(ch => {
        if (props.filterTextOnly && ch.type === 'voice') return false;
        return true;
      });
      return {
        ...cat,
        channels
      };
    })
    .filter(cat => cat.channels.length > 0);
});

const uncategorizedChannels = computed(() => {
  const categorizedIds = new Set(
    channelCategories.value.flatMap(cat => (cat.channels || []).map(ch => ch.id))
  );
  return filteredChannelsList.value.filter(ch => !categorizedIds.has(ch.id));
});

const isUnknownId = computed(() => {
  if (!props.modelValue) return false;
  return !discordChannels.value.some(c => c.id === props.modelValue);
});

const selectedChannelInfo = computed(() => {
  if (!props.modelValue) return null;
  const found = discordChannels.value.find(c => c.id === props.modelValue);
  if (found) {
    return {
      name: found.name,
      prefix: getChannelPrefix(found)
    };
  }
  return {
    name: 'Salon externe / ID direct',
    prefix: '#'
  };
});

function onSelectChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  const val = target.value;
  emit('update:modelValue', val);
  emit('change', val);
}

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const val = target.value;
  emit('update:modelValue', val);
  emit('change', val);
}
</script>
