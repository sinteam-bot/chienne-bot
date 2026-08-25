<template>
  <div class="discord-role-select-wrapper">
    <div class="select-row" style="display: flex; gap: 8px; align-items: center;">
      <select
        v-if="!manualMode"
        :value="modelValue"
        class="discord-input discord-select"
        style="flex: 1; cursor: pointer; background-color: var(--bg-tertiary); color: var(--text-normal);"
        @change="onSelectChange"
      >
        <option v-if="allowNull" value="">
          {{ nullLabel || '— Aucun rôle —' }}
        </option>

        <option v-if="!allowNull && !modelValue" value="" disabled selected>
          {{ placeholder || 'Sélectionner un rôle Discord...' }}
        </option>

        <option
          v-for="role in visibleRolesList"
          :key="role.id"
          :value="role.id"
        >
          @{{ role.name }} ({{ role.memberCount || 0 }} membres)
        </option>

        <option v-if="isUnknownId" :value="modelValue">
          ⚠️ Rôle ID actuel : {{ modelValue }}
        </option>
      </select>

      <input
        v-else
        :value="modelValue"
        type="text"
        class="discord-input"
        style="flex: 1;"
        :placeholder="placeholder || 'Entrez l\'ID du rôle (ex: 1337917252732850206)'"
        @input="onInput"
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
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
}>();

const { roles, fetchUsersAndRoles } = useAppState();
const manualMode = ref(false);

onMounted(async () => {
  if (roles.value.length === 0) {
    await fetchUsersAndRoles();
  }
});

const visibleRolesList = computed(() => {
  if (!Array.isArray(roles.value)) return [];
  return roles.value.filter(r => r.name !== '@everyone');
});

const isUnknownId = computed(() => {
  if (!props.modelValue) return false;
  return !roles.value.some(r => r.id === props.modelValue);
});

const selectedRoleInfo = computed(() => {
  if (!props.modelValue) return null;
  const found = roles.value.find(r => r.id === props.modelValue);
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
