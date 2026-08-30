<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <div class="config-card">
      <div class="card-subtitle">⚙️ Configuration : {{ featureKey }}</div>
      <p class="config-desc">
        Éditeur dynamique pour le module <code>{{ featureKey }}</code> (Guild: {{ guildId }}).
      </p>

      <div v-if="loadError" class="alert-box error">
        ⚠️ Impossible de charger la configuration pour ce module ou module inexistant.
      </div>

      <div class="editor-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeMode === 'form' }"
          @click="activeMode = 'form'"
        >
          Formulaire
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeMode === 'json' }"
          @click="activeMode = 'json'"
        >
          Éditeur JSON
        </button>
      </div>

      <div v-if="activeMode === 'form'" class="form-fields-list">
        <div
          v-for="(val, key) in editableFields"
          :key="key"
          class="config-item"
        >
          <div class="config-label-group">
            <label class="config-label">{{ key }}</label>
            <span class="config-hint">Type: {{ typeof val }}</span>
          </div>

          <!-- Boolean Switch -->
          <label v-if="typeof val === 'boolean'" class="switch">
            <input v-model="config[key]" type="checkbox" />
            <span class="slider"></span>
          </label>

          <!-- Number -->
          <input
            v-else-if="typeof val === 'number'"
            v-model.number="config[key]"
            type="number"
            class="discord-input"
            style="width: 200px;"
          />

          <!-- String -->
          <input
            v-else-if="typeof val === 'string'"
            v-model="config[key]"
            type="text"
            class="discord-input"
            style="width: 260px;"
          />

          <!-- Complex Objects / Arrays -->
          <div v-else style="font-family: monospace; font-size: 12px; color: var(--text-muted);">
            [Objet / Tableau - voir onglet JSON]
          </div>
        </div>
      </div>

      <div v-else class="json-editor-container">
        <textarea
          v-model="rawJson"
          class="discord-textarea"
          rows="16"
          placeholder="{ ... }"
          @input="onJsonInput"
        ></textarea>
        <p v-if="jsonError" class="json-err">{{ jsonError }}</p>
      </div>

      <div class="config-actions-bar">
        <button class="btn-primary" :disabled="isSaving || !!jsonError" @click="saveConfig">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder la Configuration' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useConfigFeature } from '~/composables/useConfigFeature.ts';

definePageMeta({
  title: 'Configuration Module',
  hidden: true
});

const route = useRoute();
const guildId = computed(() => (route.params.guild as string) || 'default');
const featureKey = computed(() => (route.params.feature as string) || 'general');

const activeMode = ref<'form' | 'json'>('form');
const rawJson = ref('{}');
const jsonError = ref<string | null>(null);

const { config, isLoading, isSaving, loadError, load, save } = useConfigFeature(featureKey.value, {
  defaultConfig: {}
});

const editableFields = computed(() => {
  if (!config.value || typeof config.value !== 'object') return {};
  return config.value;
});

watch(config, (newVal) => {
  if (newVal) {
    rawJson.value = JSON.stringify(newVal, null, 2);
    jsonError.value = null;
  }
}, { deep: true, immediate: true });

watch(featureKey, (newFeature) => {
  if (newFeature) {
    load(guildId.value);
  }
});

function onJsonInput() {
  try {
    const parsed = JSON.parse(rawJson.value);
    config.value = parsed;
    jsonError.value = null;
  } catch (err: any) {
    jsonError.value = `Syntaxe JSON invalide : ${err.message}`;
  }
}

async function saveConfig() {
  if (activeMode.value === 'json') {
    try {
      config.value = JSON.parse(rawJson.value);
    } catch {
      return;
    }
  }
  await save(config.value, guildId.value);
}

onMounted(() => {
  load(guildId.value);
});
</script>

<style scoped>
.config-page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-card {
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--radius-md, 8px);
  padding: 20px;
}

.card-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: var(--header-primary, #ffffff);
  margin-bottom: 4px;
  text-transform: capitalize;
}

.config-desc {
  font-size: 13px;
  color: var(--text-muted, #949ba4);
  margin-bottom: 16px;
}

.alert-box {
  padding: 12px;
  border-radius: var(--radius-sm, 4px);
  margin-bottom: 16px;
  font-size: 13px;
}

.alert-box.error {
  background: rgba(242, 63, 67, 0.15);
  border: 1px solid var(--status-danger, #f23f43);
  color: var(--status-danger, #f23f43);
}

.editor-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  padding-bottom: 8px;
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--text-muted, #949ba4);
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--radius-sm, 4px);
  transition: all var(--transition-fast);
}

.tab-btn.active {
  background: var(--bg-tertiary, #1e1f22);
  color: var(--header-primary, #ffffff);
}

.form-fields-list {
  display: flex;
  flex-direction: column;
}

.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.04));
  gap: 16px;
}

.config-item:last-child {
  border-bottom: none;
}

.config-label-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.config-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-normal, #dbdee1);
}

.config-hint {
  font-size: 12px;
  color: var(--text-muted, #949ba4);
}

.discord-input {
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-sm, 4px);
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-normal, #dbdee1);
  outline: none;
  transition: border-color var(--transition-fast);
}

.discord-input:focus {
  border-color: var(--blurple, #5865F2);
}

.discord-textarea {
  width: 100%;
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-sm, 4px);
  padding: 12px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  color: var(--text-normal, #dbdee1);
  outline: none;
  resize: vertical;
  line-height: 1.5;
}

.discord-textarea:focus {
  border-color: var(--blurple, #5865F2);
}

.json-err {
  font-size: 12px;
  color: var(--status-danger, #f23f43);
  margin-top: 6px;
}

.config-actions-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: 14px;
}

.btn-primary {
  background: var(--blurple, #5865F2);
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-sm, 4px);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-primary:hover:not(:disabled) {
  background: var(--blurple-hover, #4752c4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-tertiary, #4e5058);
  transition: .3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--status-positive, #57f287);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.config-loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: var(--blurple, #5865F2);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
