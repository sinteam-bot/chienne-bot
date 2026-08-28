<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div v-if="error" class="config-card" style="color: var(--red);">❌ {{ error }}</div>

    <div class="module-stats-banner">
      <div class="module-stat-card">
        <div class="module-stat-icon">🔊</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Salons actifs</span>
          <span class="module-stat-value" :style="{ color: activeCount > 0 ? 'var(--green)' : 'var(--text-muted)' }">
            {{ activeCount }}
          </span>
          <span class="module-stat-sub">vocaux temporaires en cours</span>
        </div>
      </div>
      <div class="module-stat-card">
        <div class="module-stat-icon">⚙️</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Statut</span>
          <span class="module-stat-value" :style="{ color: config.enabled ? 'var(--green)' : 'var(--red)' }">
            {{ config.enabled ? '✅' : '❌' }}
          </span>
          <span class="module-stat-sub">{{ config.enabled ? 'activé' : 'désactivé' }}</span>
        </div>
      </div>
      <div class="module-stat-card">
        <div class="module-stat-icon">📁</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Catégorie</span>
          <span class="module-stat-value">
            <code v-if="config.categoryId">{{ config.categoryId.slice(0, 12) }}…</code>
            <span v-else>—</span>
          </span>
          <span class="module-stat-sub">salon par défaut</span>
        </div>
      </div>
      <div class="module-stat-card">
        <div class="module-stat-icon">⏱️</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Delay suppression</span>
          <span class="module-stat-value">{{ config.deleteDelaySeconds }}s</span>
          <span class="module-stat-sub">après channel vide</span>
        </div>
      </div>
    </div>

    <div class="config-card">
      <div class="card-subtitle">💡 Comment ça marche</div>
      <ol style="margin: 8px 0 0 20px; color: var(--text-muted); font-size: 13px; line-height: 1.7;">
        <li>Active la feature dans l'onglet <strong>Configuration</strong>.</li>
        <li>Sélectionne un ou plusieurs <strong>Join-to-Trigger channels</strong> (salons vocaux où un user entre pour créer son propre salon).</li>
        <li>Le bot créera un <strong>salon vocal privé</strong> dans la catégorie configurée, nommé d'après le template (ex : <code>"{user}'s game"</code>).</li>
        <li>Si plusieurs users rejoignent le même salon temporaire, un suffix <code>🎮</code> est ajouté automatiquement.</li>
        <li>Quand le salon devient vide, il est supprimé après le <strong>délai configuré</strong> (5s par défaut).</li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTempVoice, type TempVoiceConfig } from '~/composables/useTempVoice';

const api = useTempVoice();
const config = ref<TempVoiceConfig>({
  guildId: '',
  categoryId: null,
  format: "{user}'s game",
  deleteDelaySeconds: 5,
  maxPerGuild: 0,
  lockedRoleId: null,
  joinChannels: [],
  enabled: false,
  updatedAt: 0
});
const activeCount = ref(0);
const error = ref<string | null>(null);

async function load() {
  try {
    const [c, count] = await Promise.all([api.getConfig(), api.count()]);
    config.value = c;
    activeCount.value = count;
  } catch (e: any) {
    error.value = e.message;
  }
}

onMounted(load);
</script>

<style scoped>
.config-card {
  background: var(--background-modifier-hover);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
  color: var(--text-normal);
}
.config-card ol { margin: 8px 0 0 20px; }
.config-card code { font-family: 'JetBrains Mono', monospace; background: var(--background-secondary); padding: 1px 4px; border-radius: 3px; }
</style>
