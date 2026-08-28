<template>
  <div class="openrouter-select-wrapper">
    <div class="openrouter-input-row">
      <!-- Input de sélection / recherche -->
      <div class="select-box" @click="isOpen = !isOpen">
        <div class="selected-model-display">
          <span v-if="selectedModelObj?.isFree" class="model-badge free">GRATUIT</span>
          <span class="selected-name">{{ selectedModelObj?.name || modelValue || placeholder }}</span>
          <span v-if="selectedModelObj?.contextLength" class="context-tag">{{ formatContext(selectedModelObj.contextLength) }}</span>
        </div>
        <div class="select-arrows">
          <span class="arrow-icon">{{ isOpen ? '▲' : '▼' }}</span>
        </div>
      </div>

      <button
        type="button"
        class="refresh-models-btn"
        title="Rafraîchir les modèles depuis OpenRouter"
        :disabled="isLoading"
        @click.stop="fetchModels(true)"
      >
        <span :class="{ 'spin-icon': isLoading }">🔄</span>
      </button>
    </div>

    <!-- Dropdown flottant -->
    <div v-if="isOpen" class="openrouter-dropdown">
      <!-- Barre de recherche -->
      <div class="dropdown-header">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            class="dropdown-search-input"
            placeholder="Rechercher un modèle (ex: gpt-4o, claude, llama, free)..."
            autofocus
            @click.stop
          />
          <button v-if="searchQuery" class="clear-search-btn" @click.stop="searchQuery = ''">✕</button>
        </div>

        <!-- Filtres par provider -->
        <div class="provider-filter-chips">
          <button
            v-for="p in providers"
            :key="p.id"
            :class="['provider-chip', { active: activeProvider === p.id }]"
            @click.stop="activeProvider = p.id"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <!-- Liste des modèles scrollable -->
      <div class="models-list">
        <div v-if="isLoading" class="dropdown-loading">
          <span>Chargement des modèles OpenRouter...</span>
        </div>

        <div v-else-if="filteredModels.length === 0" class="dropdown-empty">
          <span>Aucun modèle trouvé pour cette recherche.</span>
        </div>

        <div
          v-for="m in filteredModels"
          v-else
          :key="m.id"
          :class="['model-option-item', { active: m.id === modelValue }]"
          @click="selectModel(m.id)"
        >
          <div class="model-item-main">
            <div class="model-item-top">
              <span v-if="m.isFree" class="model-badge free">GRATUIT</span>
              <span class="model-item-name">{{ m.name }}</span>
              <span v-if="m.contextLength" class="context-tag">{{ formatContext(m.contextLength) }}</span>
            </div>
            <span class="model-item-id">{{ m.id }}</span>
          </div>

          <div v-if="m.id === modelValue" class="model-check">
            ✓
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  isFree?: boolean;
  pricing?: {
    prompt: number;
    completion: number;
  };
  provider?: string;
}

const props = withDefaults(defineProps<{
  modelValue?: string;
  placeholder?: string;
}>(), {
  modelValue: '',
  placeholder: 'Sélectionner un modèle OpenRouter...'
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'select', model: OpenRouterModel): void;
}>();

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const isOpen = ref(false);
const isLoading = ref(false);
const models = ref<OpenRouterModel[]>([]);
const searchQuery = ref('');
const activeProvider = ref('all');

const providers = [
  { id: 'all', label: 'Tous' },
  { id: 'free', label: '🆓 Gratuits' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'meta-llama', label: 'Meta' },
  { id: 'google', label: 'Google' },
  { id: 'mistralai', label: 'Mistral' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'qwen', label: 'Qwen' },
  { id: 'nvidia', label: 'Nvidia' }
];

const selectedModelObj = computed(() => {
  return models.value.find(m => m.id === props.modelValue);
});

const filteredModels = computed(() => {
  let list = models.value;

  if (activeProvider.value === 'free') {
    list = list.filter(m => m.isFree);
  } else if (activeProvider.value !== 'all') {
    list = list.filter(m => m.provider?.toLowerCase().includes(activeProvider.value));
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(m =>
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q))
    );
  }

  return list;
});

function formatContext(tokens?: number): string {
  if (!tokens) return '';
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M ctx`;
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}k ctx`;
  return `${tokens} ctx`;
}

function selectModel(modelId: string) {
  emit('update:modelValue', modelId);
  const found = models.value.find(m => m.id === modelId);
  if (found) emit('select', found);
  isOpen.value = false;
}

async function fetchModels(force = false) {
  isLoading.value = true;
  try {
    const url = force ? '/api/openrouter/models?refresh=true' : '/api/openrouter/models';
    const res = await apiFetch<{ success: boolean; data?: OpenRouterModel[] }>(url);
    if (res.success && Array.isArray(res.data)) {
      models.value = res.data;
      if (force) {
        showToast('Liste des modèles OpenRouter synchronisée avec succès !', 'success');
      }
    }
  } catch (err: any) {
    console.warn('Erreur chargement modèles OpenRouter:', err.message);
  } finally {
    isLoading.value = false;
  }
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.openrouter-select-wrapper')) {
    isOpen.value = false;
  }
}

onMounted(() => {
  fetchModels();
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.openrouter-select-wrapper {
  position: relative;
  width: 100%;
}

.openrouter-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.select-box {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.select-box:hover {
  border-color: rgba(88, 101, 242, 0.5);
}

.selected-model-display {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.selected-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--header-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}

.model-badge.free {
  background-color: rgba(46, 204, 113, 0.15);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.3);
}

.context-tag {
  font-family: var(--font-code);
  font-size: 11px;
  color: var(--text-muted);
  background-color: rgba(255, 255, 255, 0.05);
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.arrow-icon {
  font-size: 10px;
  color: var(--text-muted);
}

.refresh-models-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 10px 12px;
  color: var(--text-normal);
  cursor: pointer;
  transition: background 0.15s ease;
}

.refresh-models-btn:hover:not(:disabled) {
  background: var(--bg-modifier-hover);
  color: var(--header-primary);
}

.spin-icon {
  display: inline-block;
  animation: spin 1s infinite linear;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.openrouter-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 100000;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6);
  max-height: 380px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dropdown-header {
  padding: 12px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-tertiary);
  border-radius: 8px 8px 0 0;
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
}

.dropdown-search-input {
  width: 100%;
  padding: 8px 30px 8px 32px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-normal);
  font-size: 13px;
  outline: none;
}

.dropdown-search-input:focus {
  border-color: var(--brand, #5865f2);
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
}

.provider-filter-chips {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.provider-chip {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.provider-chip:hover {
  background: var(--bg-modifier-hover);
  color: var(--text-normal);
}

.provider-chip.active {
  background: rgba(88, 101, 242, 0.2);
  color: var(--brand, #5865f2);
  border-color: rgba(88, 101, 242, 0.4);
  font-weight: 600;
}

.models-list {
  overflow-y: auto;
  max-height: 300px;
  padding: 6px;
}

.dropdown-loading,
.dropdown-empty {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.model-option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.1s ease;
}

.model-option-item:hover {
  background: var(--bg-modifier-hover);
}

.model-option-item.active {
  background: rgba(88, 101, 242, 0.15);
  border: 1px solid rgba(88, 101, 242, 0.3);
}

.model-item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.model-item-top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.model-item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--header-primary);
}

.model-item-id {
  font-family: var(--font-code);
  font-size: 11px;
  color: var(--text-muted);
}

.model-check {
  font-size: 14px;
  color: var(--brand, #5865f2);
  font-weight: 700;
}
</style>
