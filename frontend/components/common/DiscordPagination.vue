<template>
  <div v-if="totalItems > 0" class="discord-pagination-bar">
    <!-- Informations sur la plage d'éléments affichés -->
    <div class="pagination-info">
      <span class="info-range">
        Affichage de <strong>{{ startItem }}</strong> à <strong>{{ endItem }}</strong> sur <strong>{{ totalItems }}</strong> entrées
      </span>
    </div>

    <!-- Contrôles de navigation et taille de page -->
    <div class="pagination-controls">
      <!-- Sélecteur d'éléments par page -->
      <div v-if="showPageSizeSelect" class="page-size-selector">
        <label class="page-size-label">Par page :</label>
        <select
          :value="pageSize"
          class="discord-select-mini"
          @change="onPageSizeChange"
        >
          <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
      </div>

      <!-- Boutons de pagination -->
      <div class="pagination-nav">
        <!-- Première page -->
        <button
          class="page-btn"
          :disabled="currentPage <= 1"
          title="Première page"
          @click="setPage(1)"
        >
          «
        </button>

        <!-- Page précédente -->
        <button
          class="page-btn"
          :disabled="currentPage <= 1"
          title="Page précédente"
          @click="setPage(currentPage - 1)"
        >
          ‹
        </button>

        <!-- Numéros de page visibles avec ellipses -->
        <template v-for="(p, idx) in visiblePages" :key="idx">
          <span v-if="p === '...'" class="page-ellipsis">…</span>
          <button
            v-else
            :class="['page-btn page-num', { active: p === currentPage }]"
            @click="setPage(Number(p))"
          >
            {{ p }}
          </button>
        </template>

        <!-- Page suivante -->
        <button
          class="page-btn"
          :disabled="currentPage >= totalPages"
          title="Page suivante"
          @click="setPage(currentPage + 1)"
        >
          ›
        </button>

        <!-- Dernière page -->
        <button
          class="page-btn"
          :disabled="currentPage >= totalPages"
          title="Dernière page"
          @click="setPage(totalPages)"
        >
          »
        </button>
      </div>

      <!-- Indicateur de page courante -->
      <span class="page-indicator">
        Page <strong>{{ currentPage }}</strong> / <strong>{{ totalPages }}</strong>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: number; // currentPage (1-indexed)
    totalItems: number;
    pageSize?: number;
    pageSizeOptions?: number[];
    showPageSizeSelect?: boolean;
  }>(),
  {
    pageSize: 15,
    pageSizeOptions: () => [10, 15, 25, 50, 100],
    showPageSizeSelect: true
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', page: number): void;
  (e: 'update:pageSize', size: number): void;
  (e: 'change', payload: { page: number; pageSize: number }): void;
}>();

const currentPage = computed(() => Math.max(1, props.modelValue || 1));

const totalPages = computed(() => {
  if (!props.totalItems || props.totalItems <= 0) return 1;
  return Math.ceil(props.totalItems / props.pageSize);
});

const startItem = computed(() => {
  if (props.totalItems === 0) return 0;
  return (currentPage.value - 1) * props.pageSize + 1;
});

const endItem = computed(() => {
  return Math.min(props.totalItems, currentPage.value * props.pageSize);
});

const visiblePages = computed(() => {
  const current = currentPage.value;
  const total = totalPages.value;

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];

  // Toujours afficher la première page
  pages.push(1);

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  // Toujours afficher la dernière page
  pages.push(total);

  return pages;
});

function setPage(page: number) {
  const target = Math.max(1, Math.min(page, totalPages.value));
  if (target !== currentPage.value) {
    emit('update:modelValue', target);
    emit('change', { page: target, pageSize: props.pageSize });
  }
}

function onPageSizeChange(evt: Event) {
  const val = parseInt((evt.target as HTMLSelectElement).value, 10);
  if (!isNaN(val) && val > 0) {
    emit('update:pageSize', val);
    // Ajuster la page courante si nécessaire
    const newTotalPages = Math.ceil(props.totalItems / val);
    const newPage = Math.min(currentPage.value, newTotalPages || 1);
    emit('update:modelValue', newPage);
    emit('change', { page: newPage, pageSize: val });
  }
}
</script>

<style scoped>
.discord-pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  margin-top: 16px;
  font-size: 13px;
  color: var(--text-normal, #dbdee1);
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted, #949ba4);
}

.pagination-info strong {
  color: var(--header-primary, #ffffff);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-size-label {
  font-size: 12px;
  color: var(--text-muted, #949ba4);
}

.discord-select-mini {
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
  color: var(--header-primary, #ffffff);
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s ease;
}

.discord-select-mini:hover,
.discord-select-mini:focus {
  border-color: var(--brand-experiment, #5865f2);
}

.pagination-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 30px;
  padding: 0 6px;
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 5px;
  color: var(--text-normal, #dbdee1);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.page-btn:hover:not(:disabled) {
  background: var(--bg-modifier-hover, rgba(255, 255, 255, 0.08));
  color: var(--header-primary, #ffffff);
  border-color: var(--border-subtle, rgba(255, 255, 255, 0.2));
}

.page-btn.active {
  background: var(--brand-experiment, #5865f2);
  border-color: var(--brand-experiment, #5865f2);
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(88, 101, 242, 0.4);
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-ellipsis {
  padding: 0 4px;
  color: var(--text-muted, #949ba4);
  user-select: none;
}

.page-indicator {
  font-size: 12px;
  color: var(--text-muted, #949ba4);
}

.page-indicator strong {
  color: var(--header-primary, #ffffff);
}
</style>
