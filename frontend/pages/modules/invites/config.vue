<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div class="config-card">
      <div class="card-subtitle" style="margin-bottom: 14px;">
        ⚙️ Configuration du feature Invites
      </div>

      <p style="color: var(--text-muted); font-size: 13px; line-height: 1.6; margin: 0 0 16px;">
        Cette section est <strong>lecture seule</strong>. Pour modifier la configuration,
        utilisez les commandes Discord <code>/invite config</code>, <code>/invite logs</code>,
        <code>/invite fake</code> et <code>/invite blacklist</code>.
      </p>

      <div v-if="error" style="color: var(--red); margin-bottom: 12px;">❌ {{ error }}</div>

      <div v-if="loading" style="color: var(--text-muted);">⏳ Chargement…</div>

      <div v-else-if="config" class="config-grid">
        <!-- Section : Salons de log -->
        <div class="config-section">
          <h4>📡 Salons de log</h4>
          <div class="config-row">
            <label>Salon de log des joins</label>
            <DiscordChannel v-if="config.join_log_channel_id" :channel-id="config.join_log_channel_id" />
            <code v-else>Non configuré</code>
          </div>
          <div class="config-row">
            <label>Salon de log des leaves</label>
            <DiscordChannel v-if="config.leave_log_channel_id" :channel-id="config.leave_log_channel_id" />
            <code v-else>Non configuré</code>
          </div>
        </div>

        <!-- Section : Messages -->
        <div class="config-section">
          <h4>💬 Messages personnalisés</h4>
          <div class="config-row config-row-block">
            <label>Message de join</label>
            <code class="message-preview">{{ config.join_message }}</code>
            <small style="color: var(--text-muted); font-size: 11px;">
              Variables : <code>{member}</code>, <code>{inviter}</code>, <code>{invite_uses}</code>,
              <code>{member_number}</code>, <code>{guild}</code>
            </small>
          </div>
          <div class="config-row config-row-block">
            <label>Message de leave</label>
            <code class="message-preview">{{ config.leave_message }}</code>
            <small style="color: var(--text-muted); font-size: 11px;">
              Variables : <code>{member}</code>, <code>{inviter}</code>
            </small>
          </div>
          <div class="config-row">
            <label>Couleur d'embed</label>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span :style="{ background: config.embed_color, width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }"></span>
              <code>{{ config.embed_color }}</code>
            </div>
          </div>
        </div>

        <!-- Section : Détection des fakes -->
        <div class="config-section">
          <h4>🛡️ Détection des "Fake Invites"</h4>
          <div class="config-row">
            <label>Compte trop récent (jours)</label>
            <code>{{ config.fake_account_threshold_days }} jour{{ config.fake_account_threshold_days > 1 ? 's' : '' }}</code>
          </div>
          <div class="config-row">
            <label>Rejeter les comptes sans avatar</label>
            <span :class="config.fake_no_avatar ? 'badge-on' : 'badge-off'">
              {{ config.fake_no_avatar ? '✅ Oui' : '❌ Non' }}
            </span>
          </div>
        </div>

        <!-- Section : Tracking -->
        <div class="config-section">
          <h4>🎯 Tracking</h4>
          <div class="config-row">
            <label>Tracker les bots</label>
            <span :class="config.track_bots ? 'badge-on' : 'badge-off'">
              {{ config.track_bots ? '✅ Oui' : '❌ Non' }}
            </span>
          </div>
          <div class="config-row">
            <label>Afficher l'âge du compte dans l'embed</label>
            <span :class="config.show_account_age ? 'badge-on' : 'badge-off'">
              {{ config.show_account_age ? '✅ Oui' : '❌ Non' }}
            </span>
          </div>
        </div>

        <!-- Section : Leaderboard -->
        <div v-if="config.leaderboard" class="config-section">
          <h4>🏆 Leaderboard</h4>
          <div class="config-row">
            <label>Activé</label>
            <span :class="config.leaderboard.enabled ? 'badge-on' : 'badge-off'">
              {{ config.leaderboard.enabled ? '✅ Oui' : '❌ Non' }}
            </span>
          </div>
          <div class="config-row">
            <label>Taille de page</label>
            <code>{{ config.leaderboard.page_size }} membres</code>
          </div>
        </div>
      </div>
    </div>

    <!-- Guide des commandes -->
    <div class="config-card">
      <div class="card-subtitle" style="margin-bottom: 14px;">
        📖 Commandes de configuration
      </div>
      <div class="commands-grid">
        <div class="cmd-card">
          <code>/invite config [key] [value]</code>
          <p>Lire ou modifier une clé de configuration.</p>
          <small>Ex: <code>/invite config embed_color #57f287</code></small>
        </div>
        <div class="cmd-card">
          <code>/invite logs &lt;join|leave&gt; #channel</code>
          <p>Définir le salon de log des joins ou des leaves.</p>
        </div>
        <div class="cmd-card">
          <code>/invite fake &lt;setting&gt; [value]</code>
          <p>Configurer la détection des fake invites.</p>
          <small>Ex: <code>/invite fake account_age_threshold 14</code></small>
        </div>
        <div class="cmd-card">
          <code>/invite blacklist &lt;add-member|add-role|remove|list&gt;</code>
          <p>Gérer la blacklist des inviters.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useInvites } from '~/composables/useInvites';
import { useToast } from '~/composables/useToast';
import DiscordChannel from '~/components/common/DiscordChannel.vue';

definePageMeta({
  title: 'Configuration des Invites',
  icon: '⚙️',
  description: 'Configuration du feature de tracking des invites',
  section: 'modules',
  hidden: true
});

useSeoMeta({
  title: 'Configuration des Invites - Bot',
  description: 'Salons de log, messages, détection des fake invites',
  ogTitle: 'Configuration des Invites - Bot'
});

const invites = useInvites();
const { showToast } = useToast();

const config = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const params = new URLSearchParams(window.location.search);
    const guildId = params.get('guild_id') || '';
    if (!guildId) {
      error.value = 'Aucun serveur sélectionné.';
      config.value = null;
      return;
    }
    config.value = await invites.getConfig(guildId);
  } catch (e: any) {
    error.value = e.message || 'Erreur inconnue';
    showToast({ type: 'error', message: error.value });
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
@media (max-width: 900px) {
  .config-grid { grid-template-columns: 1fr; }
}

.config-section {
  background: var(--background-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
}
.config-section h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--header-primary);
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 8px;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  color: var(--text-muted);
  gap: 12px;
}
.config-row-block {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.config-row label {
  color: var(--text-normal);
  font-weight: 500;
}

.message-preview {
  display: block;
  background: var(--background-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 8px 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-normal);
  width: 100%;
  word-break: break-word;
}

.badge-on, .badge-off {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}
.badge-on {
  background: rgba(87, 242, 135, 0.15);
  color: #57f287;
  border: 1px solid rgba(87, 242, 135, 0.3);
}
.badge-off {
  background: rgba(150, 155, 165, 0.15);
  color: #969ba5;
  border: 1px solid rgba(150, 155, 165, 0.3);
}

.commands-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 900px) {
  .commands-grid { grid-template-columns: 1fr; }
}

.cmd-card {
  background: var(--background-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 12px 14px;
}
.cmd-card code {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #5865f2;
  margin-bottom: 4px;
  font-weight: 600;
}
.cmd-card p {
  margin: 4px 0;
  font-size: 12px;
  color: var(--text-muted);
}
.cmd-card small {
  font-size: 11px;
  color: var(--text-muted);
  font-style: italic;
}
</style>
