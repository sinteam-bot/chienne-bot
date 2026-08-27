<template>
  <div class="view-panel">
    <!-- Barre d'outils des Logs -->
    <div class="logs-toolbar" style="flex-wrap: wrap; gap: 10px;">
      <div class="filter-group">
        <label for="log-level-select">Niveau :</label>
        <select id="log-level-select" v-model="levelFilter" class="discord-select">
          <option value="ALL">Tous les niveaux</option>
          <option value="INFO">ℹ️ INFO</option>
          <option value="WARN">⚠️ WARN</option>
          <option value="ERROR">❌ ERROR</option>
          <option value="EVENT">🎧 EVENT</option>
          <option value="DEBUG">🔍 DEBUG</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="log-module-select">Module / Origine :</label>
        <select id="log-module-select" v-model="moduleFilter" class="discord-select">
          <option value="ALL">Tous les modules</option>
          <option value="SYSTEM">⚙️ SYSTEM</option>
          <option value="DISCORD">🤖 DISCORD</option>
          <option value="CAPTCHA">🔒 CAPTCHA</option>
          <option value="BUMP">🔔 BUMP REMINDER</option>
          <option value="DAILY">🌅 DAILY (IA)</option>
          <option value="XP">⭐ XP & NIVEAUX</option>
          <option value="COUNTDOWN">⏳ COUNTDOWN</option>
          <option value="INFINITE">🔢 ROAD TO INFINITE</option>
          <option value="WELCOME">👋 WELCOME</option>
          <option value="STARTUP">🚀 STARTUP NOTIFIER</option>
          <option value="API">🌐 WEB & API</option>
          <option value="DATABASE">🗄️ DATABASE</option>
          <option value="SCHEDULER">⏰ CRON / SCHEDULER</option>
          <option value="EVENT">🎧 EVENT BUS</option>
          <option value="CONFIG">📄 CONFIG</option>
        </select>
      </div>

      <div class="search-input-wrapper" style="min-width: 220px; flex: 1;">
        <input
          v-model="searchQuery"
          type="text"
          class="discord-input"
          placeholder="Rechercher dans les messages de log..."
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
          
          <!-- Badge Niveau -->
          <span :class="['log-level-badge', getLevelBadgeClass(entry.level)]">
            {{ entry.level }}
          </span>

          <!-- Badge Module / Catégorie -->
          <span :class="['log-module-badge', getModuleBadgeClass(entry.module)]">
            <span>{{ getModuleIcon(entry.module) }}</span>
            <span>{{ getModuleLabel(entry.module) }}</span>
          </span>

          <!-- Badge Fichier / Ligne Appelant (Winston Localization) -->
          <span v-if="entry.caller?.file" class="log-caller-badge" :title="`Fichier source : ${entry.caller.path || entry.caller.file}`">
            📁 {{ entry.caller.file }}
          </span>

          <!-- Message -->
          <span class="log-msg">{{ entry.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLogsSSE } from '~/composables/useLogsSSE.ts';

const {
  filteredLogs,
  autoScroll,
  levelFilter,
  moduleFilter,
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

function getLevelBadgeClass(level: string): string {
  switch (level?.toUpperCase()) {
    case 'ERROR': return 'badge-level-error';
    case 'WARN': return 'badge-level-warn';
    case 'EVENT': return 'badge-level-event';
    case 'DEBUG': return 'badge-level-debug';
    default: return 'badge-level-info';
  }
}

function getModuleBadgeClass(mod?: string): string {
  const m = (mod || 'SYSTEM').toUpperCase();
  if (m.includes('CAPTCHA') || m.includes('SECURITY_QUESTION') || m.includes('SECURITYQUESTION')) return 'badge-mod-captcha';
  if (m.includes('BUMP')) return 'badge-mod-bump';
  if (m.includes('DAILY') || m.includes('AI')) return 'badge-mod-daily';
  if (m.includes('XP') || m.includes('LEVEL')) return 'badge-mod-xp';
  if (m.includes('COUNTDOWN') || m.includes('COUNT_DOWN')) return 'badge-mod-countdown';
  if (m.includes('INFINITE') || m.includes('COUNTER')) return 'badge-mod-infinite';
  if (m.includes('WELCOME')) return 'badge-mod-welcome';
  if (m.includes('STARTUP')) return 'badge-mod-startup';
  if (m.includes('DISCORD')) return 'badge-mod-discord';
  if (m.includes('API') || m.includes('WEB')) return 'badge-mod-api';
  if (m.includes('DATA') || m.includes('DB') || m.includes('DRIZZLE') || m.includes('POSTGRES')) return 'badge-mod-db';
  if (m.includes('SCHEDULER') || m.includes('CRON')) return 'badge-mod-scheduler';
  if (m.includes('EVENT')) return 'badge-mod-event';
  if (m.includes('CONFIG')) return 'badge-mod-config';
  return 'badge-mod-system';
}

function getModuleIcon(mod?: string): string {
  const m = (mod || 'SYSTEM').toUpperCase();
  if (m.includes('CAPTCHA') || m.includes('SECURITY_QUESTION') || m.includes('SECURITYQUESTION')) return '🔒';
  if (m.includes('BUMP')) return '🔔';
  if (m.includes('DAILY') || m.includes('AI')) return '🌅';
  if (m.includes('XP') || m.includes('LEVEL')) return '⭐';
  if (m.includes('COUNTDOWN') || m.includes('COUNT_DOWN')) return '⏳';
  if (m.includes('INFINITE') || m.includes('COUNTER')) return '🔢';
  if (m.includes('WELCOME')) return '👋';
  if (m.includes('STARTUP')) return '🚀';
  if (m.includes('DISCORD')) return '🤖';
  if (m.includes('API') || m.includes('WEB')) return '🌐';
  if (m.includes('DATA') || m.includes('DB') || m.includes('DRIZZLE') || m.includes('POSTGRES')) return '🗄️';
  if (m.includes('SCHEDULER') || m.includes('CRON')) return '⏰';
  if (m.includes('EVENT')) return '🎧';
  if (m.includes('CONFIG')) return '📄';
  return '⚙️';
}

function getModuleLabel(mod?: string): string {
  const m = (mod || 'SYSTEM').toUpperCase();
  if (m.includes('CAPTCHA') || m.includes('SECURITY_QUESTION') || m.includes('SECURITYQUESTION')) return 'CAPTCHA';
  if (m.includes('BUMP')) return 'BUMP';
  if (m.includes('DAILY') || m.includes('AI')) return 'DAILY AI';
  if (m.includes('XP') || m.includes('LEVEL')) return 'XP';
  if (m.includes('COUNTDOWN') || m.includes('COUNT_DOWN')) return 'COUNTDOWN';
  if (m.includes('INFINITE') || m.includes('COUNTER')) return 'INFINITE';
  if (m.includes('WELCOME')) return 'WELCOME';
  if (m.includes('STARTUP')) return 'STARTUP';
  if (m.includes('DISCORD_CACHE')) return 'CACHE';
  if (m.includes('DISCORD')) return 'DISCORD';
  if (m.includes('API') || m.includes('WEB')) return 'API';
  if (m.includes('DATA') || m.includes('DB') || m.includes('DRIZZLE') || m.includes('POSTGRES')) return 'DB';
  if (m.includes('SCHEDULER') || m.includes('CRON')) return 'CRON';
  if (m.includes('EVENT_BUS')) return 'EVENT BUS';
  if (m.includes('EVENT')) return 'EVENT';
  if (m.includes('CONFIG')) return 'CONFIG';
  return 'SYSTEM';
}
</script>
