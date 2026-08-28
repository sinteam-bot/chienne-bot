<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="qs-backdrop"
      @click.self="close"
      @keydown.esc="close"
      @keydown.down.prevent="navigateResults(1)"
      @keydown.up.prevent="navigateResults(-1)"
      @keydown.enter.prevent="selectHighlighted"
    >
      <div class="qs-modal">
        <!-- Input de recherche -->
        <div class="qs-input-wrapper">
          <span class="qs-search-icon">🔍</span>
          <input
            ref="inputRef"
            v-model="searchQuery"
            type="text"
            class="qs-input"
            placeholder="Rechercher une page, un salon (#), une commande (/) ou un membre..."
            autocomplete="off"
            @keydown.down.prevent="navigateResults(1)"
            @keydown.up.prevent="navigateResults(-1)"
            @keydown.enter.prevent="selectHighlighted"
            @keydown.esc="close"
          />
          <button class="qs-close-btn" @click="close">ESC</button>
        </div>

        <!-- Liste des résultats -->
        <div class="qs-results" ref="resultsListRef">
          <div v-if="filteredResults.length === 0" class="qs-empty">
            Aucun résultat correspondant pour "<strong>{{ searchQuery }}</strong>"
          </div>

          <div
            v-for="(item, index) in filteredResults"
            :key="item.id"
            class="qs-item"
            :class="{ 'is-selected': highlightedIndex === index }"
            @mouseenter="highlightedIndex = index"
            @click="selectItem(item)"
          >
            <span class="qs-item-icon">{{ item.icon }}</span>
            <div class="qs-item-info">
              <div class="qs-item-title">
                {{ item.title }}
                <span v-if="item.badge" class="qs-item-badge">{{ item.badge }}</span>
              </div>
              <div v-if="item.subtitle" class="qs-item-subtitle">{{ item.subtitle }}</div>
            </div>
            <span class="qs-item-type">{{ item.categoryLabel }}</span>
          </div>
        </div>

        <!-- Footer raccourcis -->
        <div class="qs-footer">
          <div class="qs-shortcuts">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Naviguer</span>
            <span><kbd>↵</kbd> Sélectionner</span>
            <span><kbd>ESC</kbd> Fermer</span>
          </div>
          <div class="qs-brand">Bot · Quick Switcher</div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppState } from '~/composables/useAppState';
import { useDynamicNavigation } from '~/composables/useDynamicNavigation';
import { useQuickSwitcher } from '~/composables/useQuickSwitcher';

interface SearchResultItem {
  id: string;
  category: 'page' | 'channel' | 'command' | 'user';
  categoryLabel: string;
  title: string;
  subtitle?: string;
  icon: string;
  badge?: string;
  action: () => void;
}

const router = useRouter();
const { channels, users, commands, fetchChannels, fetchUsersAndRoles } = useAppState();
const { dynamicSections } = useDynamicNavigation();
const { isOpen, close, toggle } = useQuickSwitcher();

const searchQuery = ref('');
const highlightedIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const resultsListRef = ref<HTMLElement | null>(null);

watch(isOpen, (newVal) => {
  if (newVal) {
    searchQuery.value = '';
    highlightedIndex.value = 0;
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
});

// Préparation des résultats de recherche combinés
const allResults = computed<SearchResultItem[]>(() => {
  const items: SearchResultItem[] = [];

  // 1. Pages du Dashboard
  for (const sec of dynamicSections.value) {
    for (const item of sec.items) {
      const path = item.routePath || ('/' + item.id);
      items.push({
        id: `page-${path}`,
        category: 'page',
        categoryLabel: sec.title || 'Navigation',
        title: item.name,
        subtitle: item.topic || path,
        icon: item.icon || '📄',
        badge: item.badge,
        action: () => {
          router.push(path);
          close();
        }
      });
    }
  }

  // 2. Salons Discord
  if (Array.isArray(channels.value)) {
    for (const ch of channels.value) {
      items.push({
        id: `channel-${ch.id}`,
        category: 'channel',
        categoryLabel: 'Salon Discord',
        title: `# ${ch.name}`,
        subtitle: ch.parentName ? `Catégorie: ${ch.parentName}` : `ID: ${ch.id}`,
        icon: ch.type === 2 ? '🔊' : '💬',
        action: () => {
          router.push(`/archives/${ch.id}`);
          close();
        }
      });
    }
  }

  // 3. Commandes Slash
  if (Array.isArray(commands.value)) {
    for (const cmd of commands.value) {
      items.push({
        id: `cmd-${cmd.name}`,
        category: 'command',
        categoryLabel: 'Commande',
        title: `/${cmd.name}`,
        subtitle: cmd.description || 'Commande Discord',
        icon: '⚡',
        action: () => {
          router.push('/commands');
          close();
        }
      });
    }
  }

  // 4. Membres du serveur
  if (Array.isArray(users.value)) {
    for (const u of users.value.slice(0, 100)) {
      items.push({
        id: `user-${u.id}`,
        category: 'user',
        categoryLabel: 'Membre',
        title: u.tag || u.displayName || u.username || u.id,
        subtitle: `ID: ${u.id}`,
        icon: '👤',
        action: () => {
          router.push('/users');
          close();
        }
      });
    }
  }

  return items;
});

const filteredResults = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    // Par défaut affiche les pages principales
    return allResults.value.filter(item => item.category === 'page').slice(0, 12);
  }

  // Recherche par préfixe # (salons) ou / (commandes) ou @ (membres)
  if (query.startsWith('#')) {
    const q = query.slice(1).trim();
    return allResults.value
      .filter(item => item.category === 'channel' && (!q || item.title.toLowerCase().includes(q)))
      .slice(0, 15);
  }

  if (query.startsWith('/')) {
    const q = query.slice(1).trim();
    return allResults.value
      .filter(item => item.category === 'command' && (!q || item.title.toLowerCase().includes(q)))
      .slice(0, 15);
  }

  if (query.startsWith('@')) {
    const q = query.slice(1).trim();
    return allResults.value
      .filter(item => item.category === 'user' && (!q || item.title.toLowerCase().includes(q)))
      .slice(0, 15);
  }

  return allResults.value
    .filter(item => {
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchSub = item.subtitle?.toLowerCase().includes(query);
      const matchCat = item.categoryLabel.toLowerCase().includes(query);
      return matchTitle || matchSub || matchCat;
    })
    .slice(0, 15);
});

// Réinitialiser la surbrillance lors du changement de query
watch(searchQuery, () => {
  highlightedIndex.value = 0;
});

function navigateResults(direction: number) {
  const total = filteredResults.value.length;
  if (total === 0) return;
  highlightedIndex.value = (highlightedIndex.value + direction + total) % total;
  scrollHighlightedIntoView();
}

function selectHighlighted() {
  const item = filteredResults.value[highlightedIndex.value];
  if (item) {
    selectItem(item);
  }
}

function selectItem(item: SearchResultItem) {
  item.action();
}

function scrollHighlightedIntoView() {
  nextTick(() => {
    const el = resultsListRef.value?.querySelector('.is-selected') as HTMLElement;
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    toggle();
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleGlobalKeydown);
  }
  fetchChannels();
  fetchUsersAndRoles();
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleGlobalKeydown);
  }
});
</script>

<style scoped>
.qs-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 12vh;
  animation: fadeIn 0.15s ease-out;
}

.qs-modal {
  width: 100%;
  max-width: 640px;
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.qs-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #1e1f22;
  border-bottom: 1px solid #3f4147;
}

.qs-search-icon {
  font-size: 18px;
  opacity: 0.7;
}

.qs-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #f2f3f5;
  font-size: 16px;
  outline: none;
}

.qs-input::placeholder {
  color: #80848e;
}

.qs-close-btn {
  background: #35373c;
  color: #b5bac1;
  border: 1px solid #4e5058;
  border-radius: 4px;
  font-size: 11px;
  padding: 2px 6px;
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
}

.qs-results {
  max-height: 380px;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qs-empty {
  padding: 24px;
  text-align: center;
  color: #80848e;
  font-size: 14px;
}

.qs-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.qs-item:hover,
.qs-item.is-selected {
  background: #35373c;
}

.qs-item.is-selected .qs-item-title {
  color: #5865f2;
}

.qs-item-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.qs-item-info {
  flex: 1;
  min-width: 0;
}

.qs-item-title {
  font-size: 14px;
  font-weight: 500;
  color: #f2f3f5;
  display: flex;
  align-items: center;
  gap: 8px;
}

.qs-item-badge {
  background: #5865f2;
  color: white;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.qs-item-subtitle {
  font-size: 12px;
  color: #80848e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qs-item-type {
  font-size: 11px;
  color: #80848e;
  background: #1e1f22;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.qs-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #1e1f22;
  border-top: 1px solid #3f4147;
  font-size: 11px;
  color: #80848e;
}

.qs-shortcuts {
  display: flex;
  gap: 12px;
}

.qs-shortcuts kbd {
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-radius: 3px;
  padding: 1px 5px;
  color: #b5bac1;
  font-family: 'JetBrains Mono', monospace;
}

.qs-brand {
  font-weight: 500;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
</style>
