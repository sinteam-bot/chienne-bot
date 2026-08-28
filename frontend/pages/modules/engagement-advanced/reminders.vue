<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div class="config-card" v-if="error" style="color: var(--red);">❌ {{ error }}</div>

    <div class="config-card">
      <div class="card-subtitle">⏰ Vos rappels actifs ({{ reminders.length }})</div>
      <div v-if="!currentUserId" style="color: var(--text-muted); padding: 16px; text-align: center;">
        Entrez votre ID Discord pour voir vos rappels.
      </div>
      <div v-else>
        <div v-if="loading" style="color: var(--text-muted); padding: 16px; text-align: center;">Chargement…</div>
        <div v-else-if="reminders.length === 0" style="color: var(--text-muted); padding: 16px; text-align: center;">
          Aucun rappel actif. Programmez-en un avec <code>/remind</code> sur Discord.
        </div>
        <div v-else>
          <div v-for="r in reminders" :key="r.id" class="reminder-row">
            <div class="reminder-row__time">
              <strong><t :datetime="new Date(r.fireAt).toISOString()">--</t></strong><br>
              <span class="reminder-row__ago">(dans <strong>{{ formatRelative(r.fireAt) }}</strong>)</span>
            </div>
            <div class="reminder-row__text">{{ r.reminderText }}</div>
            <button class="module-btn module-btn-sm" @click="cancel(r)" style="background: rgba(237, 66, 69, 0.15); color: #ed4245;">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <div class="config-card">
      <div class="card-subtitle">💡 Astuce</div>
      <p class="config-desc">
        Pour programmer un rappel, utilisez la commande slash <code>/remind duration:2h message:...</code> sur Discord.
        Vous pouvez aussi préciser un salon via <code>channel:#salon</code> (sinon c'est un DM).
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useEngagementAdvanced } from '~/composables/useEngagementAdvanced';

const api = useEngagementAdvanced();
const currentUserId = ref<string>(''); // Could be auto-filled from useAppState
const reminders = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

async function load() {
  if (!currentUserId.value) return;
  loading.value = true;
  error.value = null;
  try {
    reminders.value = await api.listReminders(currentUserId.value);
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function cancel(r: any) {
  if (!confirm('Annuler ce rappel ?')) return;
  try {
    await api.cancelReminder(r.id, currentUserId.value);
    await load();
  } catch (e: any) {
    error.value = e.message;
  }
}

function formatRelative(fireAt: number): string {
  const diff = fireAt - Date.now();
  if (diff < 0) return 'maintenant';
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}j`;
}

import { onMounted } from 'vue';
onMounted(() => {
  // L'utilisateur peut entrer son ID via le dashboard global
  // Pour l'instant on laisse vide (l'API accepte l'ID via l'UI)
});
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
.module-btn-sm { padding: 4px 10px; }
.config-desc { font-size: 12px; color: var(--text-muted); line-height: 1.5; margin: 0; }
.config-desc code { font-family: 'JetBrains Mono', monospace; background: var(--background-secondary); padding: 1px 4px; border-radius: 3px; }

.reminder-row {
  display: grid;
  grid-template-columns: 200px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.reminder-row:last-child { border-bottom: none; }
.reminder-row__time { font-size: 13px; }
.reminder-row__ago { font-size: 11px; color: var(--text-muted); }
.reminder-row__text { font-size: 13px; }
</style>
