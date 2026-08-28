<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div v-if="error" class="config-card" style="color: var(--red);">❌ {{ error }}</div>
    <div v-if="loading && list.length === 0" class="config-card" style="color: var(--text-muted); text-align: center; padding: 24px;">Chargement…</div>
    <div v-else-if="list.length === 0" class="config-card" style="color: var(--text-muted); text-align: center; padding: 24px;">
      Aucun salon vocal temporaire actif pour le moment. 🌱
    </div>
    <div v-else class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between;">
        <span>🔊 Salons temporaires actifs ({{ list.length }})</span>
        <button class="module-btn" @click="load" :disabled="loading">{{ loading ? '⏳' : '🔄' }} Rafraîchir</button>
      </div>
      <div v-for="c in list" :key="c.channelId" class="tv-row">
        <div class="tv-row__icon">🔊</div>
        <div class="tv-row__body">
          <div class="tv-row__title">
            <strong><a :href="`https://discord.com/channels/${c.guildId}/${c.channelId}`" target="_blank">#${c.channelId.slice(-6)}</a></strong>
          </div>
          <div class="tv-row__meta">
            créateur <code>{{ c.creatorId.slice(0, 14) }}…</code>
            · créé <t :datetime="new Date(c.createdAt).toISOString()">–</t>
            <span v-if="c.lastEmptyAt > 0">· vide depuis <t :datetime="new Date(c.lastEmptyAt).toISOString()">–</t></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTempVoice, type TempVoiceChannel } from '~/composables/useTempVoice';

const api = useTempVoice();
const list = ref<TempVoiceChannel[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    list.value = await api.listActive();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.config-card { background: var(--background-modifier-hover); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; }
.tv-row {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.tv-row:last-child { border-bottom: none; }
.tv-row__icon {
  font-size: 22px;
  text-align: center;
  width: 40px;
  height: 40px;
  line-height: 40px;
  background: rgba(88, 101, 242, 0.1);
  border-radius: 8px;
}
.tv-row__title { font-size: 14px; }
.tv-row__title a { color: var(--brand-experiment, #5865f2); text-decoration: none; }
.tv-row__meta { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.tv-row__meta code { font-family: 'JetBrains Mono', monospace; }

.module-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; background: var(--background-modifier-hover); color: var(--text-normal); font-size: 12px; border: 1px solid var(--border-subtle); cursor: pointer; font-family: inherit; }
.module-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
