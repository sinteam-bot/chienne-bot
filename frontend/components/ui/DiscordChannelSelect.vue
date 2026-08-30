<template>
  <div class="discord-channel-select-wrapper">
    <!-- CAS 1 : MULTI-SELECT (v-model tableau) -->
    <div v-if="multiple" class="multi-select-container">
      <div class="select-row" style="display: flex; gap: 8px; align-items: center;">
        <select
          v-if="!manualMode"
          class="discord-input discord-select"
          style="flex: 1; cursor: pointer; background-color: var(--bg-tertiary); color: var(--text-normal);"
          :value="selectedDropdownItem"
          @change="onMultiSelectAdd"
        >
          <option value="" disabled selected>
            {{ placeholder || (isCategoryMode ? '➕ Ajouter une catégorie Discord…' : '➕ Ajouter un salon Discord…') }}
          </option>

          <!-- Si mode catégorie -->
          <template v-if="isCategoryMode">
            <option
              v-for="cat in availableCategories"
              :key="cat.id"
              :value="cat.id"
              :disabled="isSelected(cat.id)"
            >
              📁 {{ cat.name }} {{ isSelected(cat.id) ? '(Déjà ajouté)' : '' }}
            </option>
          </template>

          <!-- Si mode salons réguliers ou vocaux -->
          <template v-else>
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
                  :disabled="isSelected(ch.id)"
                >
                  {{ getChannelPrefix(ch) }} {{ ch.name }} {{ isSelected(ch.id) ? '(Déjà ajouté)' : '' }}
                </option>
              </optgroup>
            </template>

            <optgroup v-if="uncategorizedChannels.length > 0" label="SALONS SANS CATÉGORIE">
              <option
                v-for="ch in uncategorizedChannels"
                :key="ch.id"
                :value="ch.id"
                :disabled="isSelected(ch.id)"
              >
                {{ getChannelPrefix(ch) }} {{ ch.name }} {{ isSelected(ch.id) ? '(Déjà ajouté)' : '' }}
              </option>
            </optgroup>
          </template>
        </select>

        <div v-else style="display: flex; gap: 6px; flex: 1;">
          <input
            v-model="manualInputId"
            type="text"
            class="discord-input"
            style="flex: 1;"
            :placeholder="placeholder || 'Entrez l\'ID Discord à ajouter (ex: 1337807772024180756)'"
            @keydown.enter.prevent="addManualId"
          />
          <button
            type="button"
            class="btn-secondary"
            :disabled="!manualInputId.trim()"
            style="padding: 6px 12px; font-size: 12px;"
            @click="addManualId"
          >
            Ajouter
          </button>
        </div>

        <button
          type="button"
          class="action-btn"
          style="padding: 8px 12px; font-size: 12px; white-space: nowrap;"
          :title="manualMode ? 'Choisir dans la liste' : 'Saisir un ID manuellement'"
          @click="manualMode = !manualMode"
        >
          {{ manualMode ? '📋 Liste' : '✏️ ID' }}
        </button>
      </div>

      <!-- Liste des puces / chips sélectionnées -->
      <div v-if="selectedArray.length > 0" class="chips-wrapper" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px;">
        <div
          v-for="id in selectedArray"
          :key="id"
          class="channel-chip"
          style="display: inline-flex; align-items: center; gap: 6px; background: var(--bg-secondary, #2b2d31); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 4px 10px; border-radius: 4px; font-size: 12px;"
        >
          <span style="font-weight: 500; color: var(--text-normal);">
            {{ resolveItemLabel(id) }}
          </span>
          <code style="font-size: 10px; color: var(--text-muted);">{{ id }}</code>
          <button
            type="button"
            class="btn-remove-chip"
            style="background: transparent; border: none; color: var(--status-danger, #f23f43); cursor: pointer; font-size: 12px; padding: 0 2px; margin-left: 2px;"
            title="Retirer"
            @click="removeMultiItem(id)"
          >
            ✕
          </button>
        </div>
      </div>
      <div v-else class="empty-chips-hint" style="margin-top: 6px; font-size: 12px; color: var(--text-muted); font-style: italic;">
        Aucun salon sélectionné.
      </div>
    </div>

    <!-- CAS 2 : SÉLECTION SIMPLE (v-model string) -->
    <div v-else>
      <div class="select-row" style="display: flex; gap: 8px; align-items: center;">
        <!-- Sélecteur par liste déroulante -->
        <select
          v-if="!manualMode"
          :value="singleValue"
          class="discord-input discord-select"
          style="flex: 1; cursor: pointer; background-color: var(--bg-tertiary); color: var(--text-normal);"
          @change="onSingleSelectChange"
        >
          <option v-if="allowNull" value="">
            {{ nullLabel || (isCategoryMode ? '— Aucune catégorie (racine du serveur) —' : '— Aucun salon —') }}
          </option>

          <option v-if="!allowNull && !singleValue" value="" disabled selected>
            {{ placeholder || (isCategoryMode ? 'Sélectionner une catégorie Discord…' : 'Sélectionner un salon Discord…') }}
          </option>

          <!-- MODE 1 : SÉLECTION DE CATÉGORIE -->
          <template v-if="isCategoryMode">
            <option
              v-for="cat in availableCategories"
              :key="cat.id"
              :value="cat.id"
            >
              📁 {{ cat.name }}
            </option>
          </template>

          <!-- MODE 2 : SÉLECTION DE SALONS -->
          <template v-else>
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
          </template>

          <!-- Si l'ID actuel n'est pas dans la liste des salons chargés -->
          <option v-if="isUnknownId" :value="singleValue">
            ⚠️ {{ isCategoryMode ? 'Catégorie ID' : 'Salon ID' }} : {{ singleValue }}
          </option>
        </select>

        <!-- Saisie manuelle directe si mode manuel actif -->
        <input
          v-else
          :value="singleValue"
          type="text"
          class="discord-input"
          style="flex: 1;"
          :placeholder="placeholder || (isCategoryMode ? 'Entrez l\'ID de la catégorie (ex: 1337807772024180756)' : 'Entrez l\'ID du salon (ex: 1337807772024180756)')"
          @input="onSingleInput"
        />

        <!-- Bouton de bascule mode liste / mode ID manuel -->
        <button
          type="button"
          class="action-btn"
          style="padding: 8px 12px; font-size: 12px; white-space: nowrap;"
          :title="manualMode ? 'Choisir dans la liste' : 'Saisir un ID manuellement'"
          @click="manualMode = !manualMode"
        >
          {{ manualMode ? '📋 Liste' : '✏️ ID' }}
        </button>
      </div>

      <!-- Badge info sous le sélecteur -->
      <div v-if="selectedItemInfo" class="channel-selected-hint" style="margin-top: 6px; font-size: 11.5px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
        <span>📌 {{ isCategoryMode ? 'Catégorie sélectionnée :' : 'Salon sélectionné :' }}</span>
        <span style="font-weight: 600; color: var(--text-normal);">
          {{ selectedItemInfo.prefix }} {{ selectedItemInfo.name }}
        </span>
        <code style="font-size: 10.5px; background: rgba(0,0,0,0.25); padding: 2px 6px; border-radius: 3px; color: var(--text-muted);">
          ID: {{ singleValue }}
        </code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAppState } from '~/composables/useAppState.ts';

const props = withDefaults(
  defineProps<{
    modelValue?: string | string[] | null;
    placeholder?: string;
    allowNull?: boolean;
    nullLabel?: string;
    filterTextOnly?: boolean;
    filterVoiceOnly?: boolean;
    channelType?: 'guild-text' | 'guild-voice' | 'guild-category' | 'category' | 'voice' | 'text' | 'all' | string;
    multiple?: boolean;
  }>(),
  {
    allowNull: true,
    filterTextOnly: false,
    filterVoiceOnly: false,
    multiple: false
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'change', value: any): void;
}>();

const { discordChannels, channelCategories, fetchChannels } = useAppState();
const manualMode = ref(false);
const manualInputId = ref('');
const selectedDropdownItem = ref('');

onMounted(async () => {
  if (discordChannels.value.length === 0 || channelCategories.value.length === 0) {
    await fetchChannels();
  }
});

const isCategoryMode = computed(() => {
  return props.channelType === 'guild-category' || props.channelType === 'category';
});

const isVoiceOnly = computed(() => {
  return props.filterVoiceOnly || props.channelType === 'guild-voice' || props.channelType === 'voice';
});

const isTextOnly = computed(() => {
  return props.filterTextOnly || props.channelType === 'guild-text' || props.channelType === 'text';
});

function getChannelPrefix(ch: any): string {
  if (ch.type === 'voice') return '🔊';
  if (ch.type === 'announcement') return '📢';
  if (ch.type === 'forum') return '💬';
  return '#';
}

const availableCategories = computed(() => {
  if (!Array.isArray(channelCategories.value)) return [];
  return channelCategories.value;
});

const filteredChannelsList = computed(() => {
  if (isCategoryMode.value) return [];
  if (isVoiceOnly.value) {
    return discordChannels.value.filter(c => c.type === 'voice' || c.type === 2);
  }
  if (isTextOnly.value) {
    return discordChannels.value.filter(c => c.type !== 'voice' && c.type !== 2);
  }
  return discordChannels.value;
});

const categoriesWithChannels = computed(() => {
  if (isCategoryMode.value) return [];
  if (!channelCategories.value || channelCategories.value.length === 0) return [];
  return channelCategories.value
    .map(cat => {
      const channels = (cat.channels || []).filter(ch => {
        if (isVoiceOnly.value) return ch.type === 'voice' || ch.type === 2;
        if (isTextOnly.value) return ch.type !== 'voice' && ch.type !== 2;
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
  if (isCategoryMode.value) return [];
  const categorizedIds = new Set(
    channelCategories.value.flatMap(cat => (cat.channels || []).map(ch => ch.id))
  );
  return filteredChannelsList.value.filter(ch => !categorizedIds.has(ch.id));
});

const singleValue = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue[0] || '';
  }
  return props.modelValue || '';
});

const selectedArray = computed<string[]>(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue;
  }
  if (props.modelValue) {
    return [String(props.modelValue)];
  }
  return [];
});

function isSelected(id: string): boolean {
  return selectedArray.value.includes(id);
}

function resolveItemLabel(id: string): string {
  if (isCategoryMode.value) {
    const cat = availableCategories.value.find(c => c.id === id);
    if (cat) return `📁 ${cat.name}`;
    return `📁 ID: ${id}`;
  }
  const ch = discordChannels.value.find(c => c.id === id);
  if (ch) return `${getChannelPrefix(ch)} ${ch.name}`;
  return `# ID: ${id}`;
}

const isUnknownId = computed(() => {
  if (!singleValue.value) return false;
  if (isCategoryMode.value) {
    return !availableCategories.value.some(c => c.id === singleValue.value);
  }
  return !discordChannels.value.some(c => c.id === singleValue.value);
});

const selectedItemInfo = computed(() => {
  if (!singleValue.value) return null;
  if (isCategoryMode.value) {
    const found = availableCategories.value.find(c => c.id === singleValue.value);
    if (found) {
      return {
        name: found.name,
        prefix: '📁'
      };
    }
    return {
      name: 'Catégorie externe / ID direct',
      prefix: '📁'
    };
  }

  const found = discordChannels.value.find(c => c.id === singleValue.value);
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

function onSingleSelectChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  const val = target.value;
  emit('update:modelValue', val);
  emit('change', val);
}

function onSingleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const val = target.value;
  emit('update:modelValue', val);
  emit('change', val);
}

function onMultiSelectAdd(e: Event) {
  const target = e.target as HTMLSelectElement;
  const val = target.value;
  if (!val) return;
  if (!selectedArray.value.includes(val)) {
    const newArr = [...selectedArray.value, val];
    emit('update:modelValue', newArr);
    emit('change', newArr);
  }
  selectedDropdownItem.value = '';
  target.value = '';
}

function addManualId() {
  const val = manualInputId.value.trim();
  if (!val) return;
  if (!selectedArray.value.includes(val)) {
    const newArr = [...selectedArray.value, val];
    emit('update:modelValue', newArr);
    emit('change', newArr);
  }
  manualInputId.value = '';
}

function removeMultiItem(id: string) {
  const newArr = selectedArray.value.filter(item => item !== id);
  emit('update:modelValue', newArr);
  emit('change', newArr);
}
</script>

<style scoped>
.discord-channel-select-wrapper {
  width: 100%;
}

.discord-select {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-sm, 4px);
  color: var(--text-normal, #dbdee1);
  font-size: 13.5px;
  outline: none;
  transition: border-color var(--transition-fast);
}

.discord-select:focus {
  border-color: var(--blurple, #5865f2);
}

.action-btn {
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--text-muted, #949ba4);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--bg-modifier-hover, rgba(255, 255, 255, 0.05));
  color: var(--header-primary, #ffffff);
}

.btn-secondary {
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--text-normal, #dbdee1);
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-modifier-hover, rgba(255, 255, 255, 0.05));
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
