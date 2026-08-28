<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div v-if="error" class="config-card" style="color: var(--red);">❌ {{ error }}</div>

    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between;">
        <span>🎯 Triggers de mots ({{ triggers.length }})</span>
        <button class="module-btn" @click="load" :disabled="loading">{{ loading ? '⏳' : '🔄' }} Rafraîchir</button>
      </div>
      <div v-if="loading && triggers.length === 0" style="color: var(--text-muted); padding: 16px; text-align: center;">Chargement…</div>
      <div v-else-if="triggers.length === 0" style="color: var(--text-muted); padding: 16px; text-align: center;">
        Aucun trigger. Créez-en un avec <code>/trigger-add</code> sur Discord.
      </div>
      <div v-else>
        <div v-for="t in triggers" :key="t.id" class="trigger-row">
          <div class="trigger-row__match" :class="`match-${t.matchType}`">{{ t.matchType }}</div>
          <div class="trigger-row__trigger">
            <code>{{ t.triggerText }}</code>
          </div>
          <div class="trigger-row__response">{{ t.responseText || '_(embed)_' }}</div>
          <div class="trigger-row__meta">coold. {{ t.cooldownSeconds }}s</div>
          <button class="module-btn module-btn-sm" @click="del(t)" style="background: rgba(237, 66, 69, 0.15); color: #ed4245;">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEngagementAdvanced } from '~/composables/useEngagementAdvanced';

const api = useEngagementAdvanced();
const triggers = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.listTriggers();
    triggers.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    error.value = e.message;
    triggers.value = [];
  } finally {
    loading.value = false;
  }
}

async function del(t: any) {
  if (!confirm(`Supprimer le trigger "${t.triggerText}" ?`)) return;
  try {
    await api.deleteTrigger(t.id);
    await load();
  } catch (e: any) {
    error.value = e.message;
  }
}

onMounted(load);
</script>

<style scoped>
.module-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--background-modifier-hover);
  color: var(--text-normal);
  font-size: 12px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  font-family: inherit;
}
.module-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.module-btn-sm { padding: 4px 10px; }

.trigger-row {
  display: grid;
  grid-template-columns: 80px 150px 1fr 100px auto;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.trigger-row:last-child { border-bottom: none; }
.trigger-row__match {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--background-modifier-hover);
}
.trigger-row__match.match-exact { background: rgba(88, 101, 242, 0.2); color: #5865f2; }
.trigger-row__match.match-contains { background: rgba(155, 89, 182, 0.2); color: #9b59b6; }
.trigger-row__trigger code { font-family: 'JetBrains Mono', monospace; }
.trigger-row__response { font-size: 13px; }
.trigger-row__meta { font-size: 11px; color: var(--text-muted); }
</style>
