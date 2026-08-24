<template>
  <div class="view-panel">
    <!-- Barre d'outils des Logs -->
    <div class="logs-toolbar">
      <div class="filter-group">
        <label for="log-level-select">Niveau :</label>
        <select id="log-level-select" v-model="levelFilter" class="discord-select">
          <option value="ALL">Tous les niveaux</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
          <option value="EVENT">EVENT</option>
          <option value="CAPTCHA">CAPTCHA</option>
          <option value="XP">XP</option>
          <option value="AI">AI</option>
          <option value="WEB">WEB</option>
        </select>
      </div>

      <div class="search-input-wrapper">
        <input
          v-model="searchQuery"
          type="text"
          class="discord-input"
          placeholder="Rechercher dans les logs..."
        />
      </div>

      <div class="logs-actions">
        <button
          :class="['action-btn', { active: autoScroll }]"
          title="Défilement automatique"
          @click="autoScroll = !autoScroll"
        >
          ⬇ Auto-scroll {{ autoScroll ? 'Activé' : 'Pause' }}
        </button>

        <button class="action-btn" title="Télécharger les logs" @click="exportLogs">
          💾 Exporter
        </button>

        <button class="action-btn danger" title="Effacer la console" @click="clearLogs">
          🗑 Effacer
        </button>
      </div>
    </div>

    <!-- Terminal des Logs -->
    <div ref="terminalRef" class="logs-terminal">
      <div v-if="filteredLogs.length === 0" style="color: var(--text-muted); padding: 20px; text-align: center;">
        Aucun log correspondant aux filtres. En attente d'événements...
      </div>

      <div v-else class="log-entries">
        <div v-for="entry in filteredLogs" :key="entry.id" class="log-line">
          <span class="log-time">[{{ entry.time }}]</span>
          <span :class="['log-badge', getBadgeClass(entry.level, entry.module)]">
            {{ entry.module ? `${entry.module}:${entry.level}` : entry.level }}
          </span>
          <span class="log-msg">{{ entry.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLogsSSE } from '~/composables/useLogsSSE';

const {
  filteredLogs,
  autoScroll,
  levelFilter,
  searchQuery,
  startStream,
  stopStream,
  clearLogs,
  exportLogs
} = useLogsSSE();

const terminalRef = ref<HTMLElement | null>(null);

onMounted(() => {
  startStream();
});

onUnmounted(() => {
  stopStream();
});

watch(filteredLogs, () => {
  if (autoScroll.value) {
    nextTick(() => {
      if (terminalRef.value) {
        terminalRef.value.scrollTop = terminalRef.value.scrollHeight;
      }
    });
  }
});

function getBadgeClass(level: string, module?: string): string {
  if (module === 'CAPTCHA') return 'badge-captcha';
  if (module === 'XP') return 'badge-xp';
  if (module === 'AI' || module === 'DAILY') return 'badge-ai';
  if (module === 'WEB') return 'badge-web';

  switch (level) {
    case 'ERROR': return 'badge-error';
    case 'WARN': return 'badge-warn';
    case 'EVENT': return 'badge-event';
    default: return 'badge-info';
  }
}
</script>
