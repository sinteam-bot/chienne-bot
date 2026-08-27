<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
        <span>📜 Historique des Pensées du Jour Publiées</span>
        <button class="action-btn" style="font-size: 12px; padding: 4px 10px;" @click="loadHistory">
          🔄 Rafraîchir
        </button>
      </div>

      <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>

      <div v-else-if="history.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
        Aucun message dans l'historique pour l'instant.
      </div>

      <div v-else style="display: flex; flex-direction: column; gap: 14px;">
        <div
          v-for="item in history"
          :key="item.id || item.msgId"
          style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; border: 1px solid var(--border-subtle);"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 14px;">📅</span>
              <strong style="color: var(--header-primary); font-size: 13px;">
                <DiscordTime :value="item.createdAt || item.date" mode="both" />
              </strong>
            </div>

            <div style="display: flex; gap: 6px; align-items: center;">
              <span v-if="item.model" class="badge-variable" style="font-size: 11px;">
                🤖 {{ item.model }}
              </span>
              <span v-if="item.tokens" class="badge-variable" style="font-size: 11px; background: rgba(88, 101, 242, 0.15); color: #5865F2;">
                ⚡ {{ item.tokens?.total || item.tokens }} tokens
              </span>
            </div>
          </div>

          <div style="font-size: 14px; line-height: 1.6; color: var(--text-normal); white-space: pre-wrap;">
            {{ item.content || item.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import DiscordTime from '~/components/common/DiscordTime.vue';

const { apiFetch } = useDiscordApi();

const history = ref<any[]>([]);
const isLoading = ref(true);

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

async function loadHistory() {
  isLoading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/daily-messages');
    if (res.success && res.data?.history) {
      history.value = res.data.history;
    }
  } catch (err) {
    console.error('Erreur chargement historique daily:', err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadHistory();
});
</script>

<style scoped>
.badge-variable {
  display: inline-block;
  padding: 2px 6px;
  background: var(--bg-modifier-hover, rgba(255, 255, 255, 0.07));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
  border-radius: 4px;
  font-family: var(--font-code, monospace);
  font-size: 11px;
}
</style>
