<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between;">
        <span>📊 Vue d'ensemble</span>
        <button class="module-btn" @click="loadAll" :disabled="loading">🔄 Rafraîchir</button>
      </div>
      <p style="color: var(--text-muted); font-size: 13px; line-height: 1.6;">
        Le système d'engagement avancé vous permet de programmer des rappels, créer des déclencheurs
        automatiques sur mots-clés, et définir des commandes personnalisées pour votre serveur.
        <br>Utilisez les onglets ci-dessus pour gérer chaque sous-fonctionnalité.
      </p>
    </div>

    <div class="module-stats-banner">
      <div class="module-stat-card">
        <div class="module-stat-icon">⏰</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Rappels actifs</span>
          <span class="module-stat-value">{{ stats.reminders }}</span>
          <span class="module-stat-sub">en attente de déclenchement</span>
        </div>
      </div>
      <div class="module-stat-card">
        <div class="module-stat-icon">🎯</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Triggers configurés</span>
          <span class="module-stat-value">{{ stats.triggers }}</span>
          <span class="module-stat-sub">déclencheurs de mots</span>
        </div>
      </div>
      <div class="module-stat-card">
        <div class="module-stat-icon">⌨️</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Commandes custom</span>
          <span class="module-stat-value">{{ stats.customCommands }}</span>
          <span class="module-stat-sub">préfixe <code>!</code></span>
        </div>
      </div>
    </div>

    <div class="config-card">
      <div class="card-subtitle">💡 Aide-mémoire des commandes slash</div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin-top: 8px;">
        <div class="help-block">
          <div class="help-block__title">⏰ Rappels</div>
          <code>/remind duration:2h message:faire la vaisselle</code><br>
          <code>/reminders</code> — liste vos rappels<br>
          <code>/reminder-cancel id:...</code>
        </div>
        <div class="help-block">
          <div class="help-block__title">🎯 Triggers (admin)</div>
          <code>/trigger-add trigger:ping response:Pong</code><br>
          <code>/trigger-list</code><br>
          <code>/trigger-remove id:...</code>
        </div>
        <div class="help-block">
          <div class="help-block__title">⌨️ Commandes custom (admin)</div>
          <code>/customcmd-add name:hello response:Hi !</code><br>
          <code>/customcmd-list</code><br>
          <code>/customcmd-remove name:hello</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEngagementAdvanced } from '~/composables/useEngagementAdvanced';

const api = useEngagementAdvanced();
const stats = ref({ reminders: 0, triggers: 0, customCommands: 0 });
const loading = ref(false);

async function loadAll() {
  loading.value = true;
  try {
    const [triggers, cmds] = await Promise.all([
      api.listTriggers(process.env.GUILD_ID || '').catch(() => []),
      api.listCustomCommands(process.env.GUILD_ID || '').catch(() => [])
    ]);
    stats.value.triggers = triggers.length;
    stats.value.customCommands = cmds.length;
  } finally {
    loading.value = false;
  }
}

onMounted(loadAll);
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
.help-block {
  background: var(--background-modifier-hover);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 14px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.7;
}
.help-block__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--header-primary);
  margin-bottom: 8px;
}
.help-block code {
  font-family: 'JetBrains Mono', monospace;
  background: var(--background-secondary);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
}
</style>
