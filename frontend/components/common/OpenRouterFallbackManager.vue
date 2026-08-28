<template>
  <div class="fallback-manager-card">
    <div class="card-header">
      <div class="header-icon">🛡️</div>
      <div>
        <h4 class="header-title">Stratégie de Résilience & Modèles de Secours (Fallback)</h4>
        <p class="header-desc">
          Politique de réessai inspirée de <strong>Polly (.NET)</strong> avec backoff exponentiel, gigue aléatoire (jitter), et liste ordonnée de déclassement si le modèle principal échoue.
        </p>
      </div>
    </div>

    <!-- 1. Modèles de Secours Ordonnés -->
    <div class="section-block">
      <div class="section-title-row">
        <span class="section-label">📋 Liste Ordonnée des Modèles de Secours</span>
        <button
          type="button"
          class="action-btn small"
          @click="showAddModal = true"
        >
          ➕ Ajouter un modèle
        </button>
      </div>

      <div v-if="fallbackModels.length === 0" class="empty-fallbacks">
        <span>Aucun modèle de secours configuré. Le bot ne tentera aucun autre modèle en cas d'erreur.</span>
      </div>

      <div v-else class="fallback-list">
        <div
          v-for="(modelId, index) in fallbackModels"
          :key="modelId"
          class="fallback-item"
        >
          <div class="item-order">#{{ index + 1 }}</div>
          <div class="item-details">
            <span class="item-name">{{ getModelName(modelId) }}</span>
            <span class="item-id">{{ modelId }}</span>
          </div>

          <div class="item-actions">
            <button
              class="move-btn"
              title="Monter"
              :disabled="index === 0"
              @click="moveUp(index)"
            >
              ▲
            </button>
            <button
              class="move-btn"
              title="Descendre"
              :disabled="index === fallbackModels.length - 1"
              @click="moveDown(index)"
            >
              ▼
            </button>
            <button
              class="delete-btn"
              title="Supprimer"
              @click="removeModel(index)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modale d'ajout de modèle de secours -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal-card fallback-modal-card">
          <h4 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: var(--header-primary);">➕ Ajouter un modèle de secours</h4>
          <p style="margin: 0 0 14px 0; font-size: 13px; color: var(--text-muted);">
            Sélectionnez un modèle LLM alternatif qui sera appelé en cascade si le modèle précédent rencontre une erreur ou un quota épuisé.
          </p>
          <OpenRouterModelSelect
            v-model="newModelToAdd"
            placeholder="Choisir un modèle OpenRouter..."
          />
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button type="button" class="action-btn" @click="showAddModal = false">Annuler</button>
            <button type="button" class="btn-primary" :disabled="!newModelToAdd" @click="confirmAddModel">Ajouter à la liste</button>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="form-divider"></div>

    <!-- 2. Paramètres de la politique de retry Polly -->
    <div class="section-block">
      <span class="section-label">⚡ Paramètres Polly Retry & Backoff</span>

      <div class="retry-grid">
        <div class="form-group">
          <label class="form-label">Nombre max de tentatives</label>
          <input
            v-model.number="retryPolicy.max_retries"
            type="number"
            min="0"
            max="10"
            class="discord-input"
          />
          <p class="form-help">Tentatives par modèle avant bascule sur le modèle suivant.</p>
        </div>

        <div class="form-group">
          <label class="form-label">Délai initial (ms)</label>
          <input
            v-model.number="retryPolicy.initial_delay_ms"
            type="number"
            min="100"
            step="100"
            class="discord-input"
          />
          <p class="form-help">Pause avant le 1er réessai (ex: 1000ms).</p>
        </div>

        <div class="form-group">
          <label class="form-label">Facteur exponentiel (Backoff)</label>
          <input
            v-model.number="retryPolicy.backoff_factor"
            type="number"
            min="1"
            max="5"
            step="0.5"
            class="discord-input"
          />
          <p class="form-help">Multiplicateur de délai entre réessais (ex: 2.0x).</p>
        </div>

        <div class="form-group">
          <label class="form-label">Timeout par requête (ms)</label>
          <input
            v-model.number="retryPolicy.timeout_ms"
            type="number"
            min="1000"
            step="1000"
            class="discord-input"
          />
          <p class="form-help">Délai limite avant abandon de la requête (ex: 25000ms).</p>
        </div>
      </div>

      <div class="form-group-toggle" style="margin-top: 14px;">
        <div class="toggle-info">
          <span class="form-label">Gigue aléatoire (Jitter)</span>
          <p class="form-help">Ajoute une variation aléatoire aux délais pour éviter la synchronisation des réessais.</p>
        </div>
        <label class="switch">
          <input v-model="retryPolicy.jitter" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Barre d'action de sauvegarde -->
    <div class="card-footer">
      <button class="btn-primary" :disabled="isSaving" @click="saveOpenRouterSettings">
        {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder la Stratégie de Résilience' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import OpenRouterModelSelect from './OpenRouterModelSelect.vue';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const fallbackModels = ref<string[]>([]);
const retryPolicy = ref<any>({
  enabled: true,
  max_retries: 3,
  initial_delay_ms: 1000,
  backoff_factor: 2.0,
  max_delay_ms: 8000,
  jitter: true,
  timeout_ms: 25000
});

const isSaving = ref(false);
const showAddModal = ref(false);
const newModelToAdd = ref('');

function getModelName(id: string): string {
  const parts = id.split('/');
  return parts[1] || id;
}

function moveUp(index: number) {
  if (index <= 0) return;
  const item = fallbackModels.value.splice(index, 1)[0];
  fallbackModels.value.splice(index - 1, 0, item);
}

function moveDown(index: number) {
  if (index >= fallbackModels.value.length - 1) return;
  const item = fallbackModels.value.splice(index, 1)[0];
  fallbackModels.value.splice(index + 1, 0, item);
}

function removeModel(index: number) {
  fallbackModels.value.splice(index, 1);
}

function confirmAddModel() {
  if (newModelToAdd.value && !fallbackModels.value.includes(newModelToAdd.value)) {
    fallbackModels.value.push(newModelToAdd.value);
    showToast(`Modèle "${newModelToAdd.value}" ajouté à la liste de secours`, 'success');
  }
  newModelToAdd.value = '';
  showAddModal.value = false;
}

async function loadOpenRouterSettings() {
  try {
    const res = await apiFetch<{ success: boolean; data?: any }>('/api/openrouter/config');
    if (res.success && res.data) {
      fallbackModels.value = res.data.fallback_models || [];
      if (res.data.retry_policy) {
        retryPolicy.value = { ...retryPolicy.value, ...res.data.retry_policy };
      }
    }
  } catch (err: any) {
    console.warn('Erreur chargement openrouter config:', err.message);
  }
}

async function saveOpenRouterSettings() {
  isSaving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/openrouter/config', {
      method: 'POST',
      body: {
        fallback_models: fallbackModels.value,
        retry_policy: retryPolicy.value
      }
    });

    if (res.success) {
      showToast('Stratégie de résilience et modèles de secours enregistrés !', 'success');
    }
  } catch (err: any) {
    showToast(`Erreur enregistrement : ${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  loadOpenRouterSettings();
});
</script>

<style scoped>
.fallback-manager-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.card-header {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.header-icon {
  font-size: 26px;
  padding: 10px;
  background: rgba(88, 101, 242, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(88, 101, 242, 0.2);
}

.header-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--header-primary);
}

.header-desc {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.4;
}

.section-block {
  margin-bottom: 16px;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--header-primary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.empty-fallbacks {
  padding: 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  background: var(--bg-tertiary);
  border-radius: 6px;
}

.fallback-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fallback-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
}

.item-order {
  font-family: var(--font-code);
  font-weight: 700;
  font-size: 12px;
  color: var(--brand, #5865f2);
  width: 28px;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--header-primary);
}

.item-id {
  font-family: var(--font-code);
  font-size: 11px;
  color: var(--text-muted);
}

.item-actions {
  display: flex;
  gap: 4px;
}

.move-btn,
.delete-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-normal);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.move-btn:hover:not(:disabled) {
  background: var(--bg-modifier-hover);
  color: var(--header-primary);
}

.delete-btn:hover {
  background: rgba(242, 63, 67, 0.2);
  color: #f23f43;
  border-color: rgba(242, 63, 67, 0.4);
}

.move-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.retry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 10px;
}

.card-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 10vh 16px 40px;
  overflow-y: auto;
  z-index: 99999;
  backdrop-filter: blur(4px);
}

.modal-card.fallback-modal-card {
  background: var(--bg-primary, #2b2d31);
  border: 1px solid var(--border-color, #3f4147);
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  max-width: 560px;
  overflow: visible !important;
  position: relative;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
}
</style>
