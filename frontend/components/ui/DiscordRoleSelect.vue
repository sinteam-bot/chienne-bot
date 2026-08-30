<template>
  <div class="discord-role-select-wrapper">
    <!-- CAS 1 : MULTI-SELECT (v-model tableau de rôles) -->
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
            {{ placeholder || '➕ Ajouter un rôle Discord…' }}
          </option>

          <option
            v-for="role in visibleRolesList"
            :key="role.id"
            :value="role.id"
            :disabled="isSelected(role.id)"
          >
            @{{ role.name }} ({{ role.memberCount || 0 }} membres) {{ isSelected(role.id) ? '(Déjà ajouté)' : '' }}
          </option>
        </select>

        <div v-else style="display: flex; gap: 6px; flex: 1;">
          <input
            v-model="manualInputId"
            type="text"
            class="discord-input"
            style="flex: 1;"
            :placeholder="placeholder || 'Entrez l\'ID du rôle à ajouter (ex: 1337917252732850206)'"
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
          :title="manualMode ? 'Choisir dans la liste des rôles' : 'Saisir un ID manuellement'"
          @click="manualMode = !manualMode"
        >
          {{ manualMode ? '📋 Liste' : '✏️ ID' }}
        </button>
      </div>

      <!-- Liste des puces / chips de rôles sélectionnés -->
      <div v-if="selectedArray.length > 0" class="chips-wrapper" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px;">
        <div
          v-for="id in selectedArray"
          :key="id"
          class="role-chip"
          style="display: inline-flex; align-items: center; gap: 6px; background: var(--bg-secondary, #2b2d31); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 4px 10px; border-radius: 4px; font-size: 12px;"
        >
          <span
            style="font-weight: 600; padding: 1px 6px; border-radius: 3px; font-size: 11px;"
            :style="{
              backgroundColor: getRoleColor(id) ? `${getRoleColor(id)}33` : 'rgba(255,255,255,0.1)',
              color: getRoleColor(id) || 'var(--text-normal)'
            }"
          >
            @{{ getRoleName(id) }}
          </span>
          <code style="font-size: 10px; color: var(--text-muted);">{{ id }}</code>
          <button
            type="button"
            class="btn-remove-chip"
            style="background: transparent; border: none; color: var(--status-danger, #f23f43); cursor: pointer; font-size: 12px; padding: 0 2px; margin-left: 2px;"
            title="Retirer ce rôle"
            @click="removeMultiItem(id)"
          >
            ✕
          </button>
        </div>
      </div>
      <div v-else class="empty-chips-hint" style="margin-top: 6px; font-size: 12px; color: var(--text-muted); font-style: italic;">
        Aucun rôle configuré (accessible par tous les administrateurs).
      </div>
    </div>

    <!-- CAS 2 : SÉLECTION SIMPLE (v-model string) -->
    <div v-else>
      <div class="select-row" style="display: flex; gap: 8px; align-items: center;">
        <select
          v-if="!manualMode"
          :value="singleValue"
          class="discord-input discord-select"
          style="flex: 1; cursor: pointer; background-color: var(--bg-tertiary); color: var(--text-normal);"
          @change="onSingleSelectChange"
        >
          <option v-if="allowNull" value="">
            {{ nullLabel || '— Aucun rôle —' }}
          </option>

          <option v-if="!allowNull && !singleValue" value="" disabled selected>
            {{ placeholder || 'Sélectionner un rôle Discord...' }}
          </option>

          <option
            v-for="role in visibleRolesList"
            :key="role.id"
            :value="role.id"
          >
            @{{ role.name }} ({{ role.memberCount || 0 }} membres)
          </option>

          <option v-if="isUnknownId" :value="singleValue">
            ⚠️ Rôle ID actuel : {{ singleValue }}
          </option>
        </select>

        <input
          v-else
          :value="singleValue"
          type="text"
          class="discord-input"
          style="flex: 1;"
          :placeholder="placeholder || 'Entrez l\'ID du rôle (ex: 1337917252732850206)'"
          @input="onSingleInput"
        />

        <button
          type="button"
          class="action-btn"
          style="padding: 8px 12px; font-size: 12px; white-space: nowrap;"
          :title="manualMode ? 'Choisir dans la liste des rôles' : 'Saisir un ID manuellement'"
          @click="manualMode = !manualMode"
        >
          {{ manualMode ? '📋 Liste' : '✏️ ID' }}
        </button>
      </div>

      <div v-if="selectedRoleInfo" class="role-selected-hint" style="margin-top: 6px; font-size: 11.5px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
        <span>📌 Rôle sélectionné :</span>
        <span
          style="font-weight: 600; padding: 2px 8px; border-radius: 4px; font-size: 11px;"
          :style="{ backgroundColor: selectedRoleInfo.color ? `${selectedRoleInfo.color}33` : 'rgba(255,255,255,0.1)', color: selectedRoleInfo.color || 'var(--text-normal)' }"
        >
          @{{ selectedRoleInfo.name }}
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
    multiple?: boolean;
  }>(),
  {
    allowNull: true,
    multiple: false
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'change', value: any): void;
}>();

const { roles, fetchUsersAndRoles } = useAppState();
const manualMode = ref(false);
const manualInputId = ref('');
const selectedDropdownItem = ref('');

onMounted(async () => {
  if (roles.value.length === 0) {
    await fetchUsersAndRoles();
  }
});

const visibleRolesList = computed(() => {
  if (!Array.isArray(roles.value)) return [];
  return roles.value.filter(r => r.name !== '@everyone');
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

function getRoleName(id: string): string {
  const found = roles.value.find(r => r.id === id);
  return found ? found.name : `ID: ${id}`;
}

function getRoleColor(id: string): string | null {
  const found = roles.value.find(r => r.id === id);
  return found?.color || null;
}

const isUnknownId = computed(() => {
  if (!singleValue.value) return false;
  return !roles.value.some(r => r.id === singleValue.value);
});

const selectedRoleInfo = computed(() => {
  if (!singleValue.value) return null;
  const found = roles.value.find(r => r.id === singleValue.value);
  if (found) {
    return {
      name: found.name,
      color: found.color
    };
  }
  return {
    name: 'Rôle externe / ID direct',
    color: null
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
.discord-role-select-wrapper {
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
