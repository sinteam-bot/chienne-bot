<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div v-if="error" class="config-card" style="color: var(--red);">❌ {{ error }}</div>

    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between;">
        <span>⌨️ Commandes personnalisées ({{ commands.length }})</span>
        <button class="module-btn" @click="load" :disabled="loading">{{ loading ? '⏳' : '🔄' }} Rafraîchir</button>
      </div>
      <div v-if="loading && commands.length === 0" style="color: var(--text-muted); padding: 16px; text-align: center;">Chargement…</div>
      <div v-else-if="commands.length === 0" style="color: var(--text-muted); padding: 16px; text-align: center;">
        Aucune commande. Créez-en une avec <code>/customcmd-add</code> sur Discord.
      </div>
      <div v-else>
        <div v-for="c in commands" :key="c.id" class="cmd-row">
          <div class="cmd-row__prefix">!</div>
          <div class="cmd-row__name"><code>{{ c.name }}</code></div>
          <div class="cmd-row__response">{{ c.responseText || '_(embed)_' }}</div>
          <div class="cmd-row__meta">coold. {{ c.cooldownSeconds }}s</div>
          <button class="module-btn module-btn-sm" @click="del(c)" style="background: rgba(237, 66, 69, 0.15); color: #ed4245;">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEngagementAdvanced } from '~/composables/useEngagementAdvanced';

const api = useEngagementAdvanced();
const commands = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.listCustomCommands();
    commands.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    error.value = e.message;
    commands.value = [];
  } finally {
    loading.value = false;
  }
}

async function del(c: any) {
  if (!confirm(`Supprimer la commande !${c.name} ?`)) return;
  try {
    await api.deleteCustomCommand(c.id);
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

.cmd-row {
  display: grid;
  grid-template-columns: 30px 180px 1fr 100px auto;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.cmd-row:last-child { border-bottom: none; }
.cmd-row__prefix {
  font-size: 20px;
  font-weight: 700;
  color: var(--brand-experiment, #5865f2);
  text-align: center;
}
.cmd-row__name code { font-family: 'JetBrains Mono', monospace; font-size: 14px; }
.cmd-row__response { font-size: 13px; }
.cmd-row__meta { font-size: 11px; color: var(--text-muted); }
</style>
