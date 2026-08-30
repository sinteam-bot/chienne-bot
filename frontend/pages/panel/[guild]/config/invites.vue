<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <div class="config-card">
      <div class="card-subtitle">⚙️ Configuration du Suivi des Invitations</div>
      <p class="config-desc">
        Modifiez la configuration du feature de tracking des invitations et détection de faux comptes.
      </p>

      <!-- Activation globale -->
      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">🎟️ Activer le feature Invites</label>
          <span class="config-hint">
            Active le tracking des invitations, la détection de fake et les embeds de log.
          </span>
        </div>
        <label class="switch">
          <input v-model="config.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="form-divider" style="margin: 16px 0; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06));"></div>

      <!-- Salons de log -->
      <div class="card-subtitle" style="font-size: 14px; margin-bottom: 10px;">📡 Salons de log</div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Salon de log des joins</label>
          <span class="config-hint">
            Salon où seront envoyés les embeds "X a rejoint via Y". Laissez vide pour désactiver.
          </span>
        </div>
        <div style="min-width: 260px;">
          <DiscordChannelSelect
            v-model="config.join_log_channel_id"
            :allow-null="true"
            null-label="— Aucun salon (Désactivé) —"
            :filter-text-only="true"
            placeholder="Sélectionner un salon…"
          />
        </div>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Salon de log des leaves</label>
          <span class="config-hint">Salon où seront envoyés les embeds "X a quitté".</span>
        </div>
        <div style="min-width: 260px;">
          <DiscordChannelSelect
            v-model="config.leave_log_channel_id"
            :allow-null="true"
            null-label="— Aucun salon (Désactivé) —"
            :filter-text-only="true"
            placeholder="Sélectionner un salon…"
          />
        </div>
      </div>

      <div class="form-divider" style="margin: 16px 0; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06));"></div>

      <!-- Messages personnalisés -->
      <div class="card-subtitle" style="font-size: 14px; margin-bottom: 10px;">💬 Messages personnalisés</div>

      <div style="margin-bottom: 14px;">
        <label class="form-label">Message de join</label>
        <textarea
          v-model="config.join_message"
          class="discord-textarea"
          rows="2"
          placeholder=":incoming_envelope: {member} a rejoint le serveur via l'invitation de **{inviter}** ({invite_uses} utilisation{plural})."
        ></textarea>
        <small class="form-help" style="color: var(--text-muted, #949ba4); font-size: 11px;">
          Variables : <code>{member}</code>, <code>{inviter}</code>, <code>{invite_uses}</code>, <code>{member_number}</code>, <code>{guild}</code>
        </small>
      </div>

      <div style="margin-bottom: 14px;">
        <label class="form-label">Message de leave</label>
        <textarea
          v-model="config.leave_message"
          class="discord-textarea"
          rows="2"
          placeholder=":outbox_tray: {member} a quitté le serveur (était invité par **{inviter}**)."
        ></textarea>
        <small class="form-help" style="color: var(--text-muted, #949ba4); font-size: 11px;">
          Variables : <code>{member}</code>, <code>{inviter}</code>
        </small>
      </div>

      <div class="form-row" style="margin-top: 8px;">
        <div class="col-half">
          <label class="form-label">Couleur d'embed (hex)</label>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input
              v-model="config.embed_color"
              type="color"
              style="width: 38px; height: 38px; border: none; border-radius: 4px; background: transparent; cursor: pointer;"
            />
            <input
              v-model="config.embed_color"
              type="text"
              class="discord-input"
              style="font-family: monospace; flex: 1;"
              placeholder="#2F3136"
            />
          </div>
        </div>
        <div class="col-half">
          <label class="form-label">Afficher l'âge du compte dans l'embed</label>
          <label class="switch" style="margin-top: 6px;">
            <input v-model="config.show_account_age" type="checkbox" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="form-divider" style="margin: 16px 0; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06));"></div>

      <!-- Détection des fake invites -->
      <div class="card-subtitle" style="font-size: 14px; margin-bottom: 10px;">🛡️ Détection des "Fake Invites"</div>
      <p class="config-desc">
        Ces règles permettent de flagger les invitations suspectes.
      </p>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Compte trop récent (jours)</label>
          <input
            v-model.number="config.fake_account_threshold_days"
            type="number"
            min="0"
            max="365"
            class="discord-input"
          />
          <small class="form-help" style="color: var(--text-muted, #949ba4); font-size: 11px;">
            0 = désactivé. Un compte créé il y a moins de N jours est suspect.
          </small>
        </div>
        <div class="col-half">
          <div class="config-item" style="border: 0; padding: 0;">
            <div class="config-label-group">
              <label class="config-label">Rejeter les comptes sans avatar</label>
              <span class="config-hint">Marque comme fake les comptes sans photo de profil.</span>
            </div>
            <label class="switch" style="margin-top: 6px;">
              <input v-model="config.fake_no_avatar" type="checkbox" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="form-row" style="margin-top: 10px;">
        <div class="col-half">
          <div class="config-item" style="border: 0; padding: 0;">
            <div class="config-label-group">
              <label class="config-label">Tracker les bots</label>
              <span class="config-hint">Inclure les bots dans le tracking. Désactivé par défaut.</span>
            </div>
            <label class="switch" style="margin-top: 6px;">
              <input v-model="config.track_bots" type="checkbox" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="form-divider" style="margin: 16px 0; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06));"></div>

      <!-- Leaderboard -->
      <div class="card-subtitle" style="font-size: 14px; margin-bottom: 10px;">🏆 Leaderboard</div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le leaderboard</label>
          <span class="config-hint">
            Affiche le classement des inviters dans le dashboard et via <code>/invite leaderboard</code>.
          </span>
        </div>
        <label class="switch">
          <input
            v-if="config.leaderboard"
            v-model="config.leaderboard.enabled"
            type="checkbox"
          />
          <input
            v-else
            type="checkbox"
            @change="e => { if (!config.leaderboard) config.leaderboard = {}; config.leaderboard.enabled = (e.target as HTMLInputElement).checked; }"
          />
          <span class="slider"></span>
        </label>
      </div>

      <div v-if="config.leaderboard" class="form-row" style="margin-top: 10px;">
        <div class="col-half">
          <label class="form-label">Taille de page</label>
          <input
            v-model.number="config.leaderboard.page_size"
            type="number"
            min="5"
            max="100"
            class="discord-input"
          />
          <small class="form-help" style="color: var(--text-muted, #949ba4); font-size: 11px;">Nombre d'inviteurs affichés par page (5 à 100).</small>
        </div>
        <div class="col-half">
          <div class="config-item" style="border: 0; padding: 0;">
            <div class="config-label-group">
              <label class="config-label">Afficher les avatars</label>
              <span class="config-hint">Afficher l'avatar Discord de chaque inviteur dans le classement.</span>
            </div>
            <label class="switch" style="margin-top: 6px;">
              <input v-model="config.leaderboard.show_avatars" type="checkbox" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="config-actions-bar" style="margin-top: 24px;">
        <button class="btn-primary" :disabled="isSaving" @click="saveConfig">
          {{ isSaving ? 'Enregistrement…' : '💾 Sauvegarder la configuration Invites' }}
        </button>
      </div>
    </div>

    <!-- Aide -->
    <div class="config-card">
      <div class="card-subtitle">📖 Variables &amp; équivalences</div>
      <p class="config-desc">
        Les variables dans les messages acceptent les valeurs suivantes :
      </p>
      <div class="help-grid">
        <div><code>{member}</code></div><div>Le membre qui a rejoint/quit (mention)</div>
        <div><code>{inviter}</code></div><div>Le membre qui a invité (mention)</div>
        <div><code>{invite_uses}</code></div><div>Nombre d'utilisations de l'invitation</div>
        <div><code>{member_number}</code></div><div>Rang du membre dans le serveur</div>
        <div><code>{guild}</code></div><div>Nom du serveur</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useConfigFeature } from '~/composables/useConfigFeature.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';

definePageMeta({
  title: 'Configuration Invitations',
  hidden: true
});

useSeoMeta({
  title: 'Suivi des Invitations - Configuration',
  description: 'Salons de log, messages, détection des fake invites'
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';

const { config, isLoading, isSaving, load, save } = useConfigFeature('invites', {
  defaultConfig: {
    enabled: true,
    join_log_channel_id: '',
    leave_log_channel_id: '',
    join_message: ':incoming_envelope: {member} a rejoint le serveur via l\'invitation de **{inviter}** ({invite_uses} utilisation{plural}).',
    leave_message: ':outbox_tray: {member} a quitté le serveur (était invité par **{inviter}**).',
    embed_color: '#2F3136',
    show_account_age: true,
    track_bots: false,
    fake_account_threshold_days: 7,
    fake_no_avatar: true,
    leaderboard: {
      enabled: true,
      page_size: 25,
      show_avatars: true
    }
  }
});

async function saveConfig() {
  await save(config.value, guildId);
}

onMounted(() => {
  load(guildId);
});
</script>

<style scoped>
.config-page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-card {
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--radius-md, 8px);
  padding: 20px;
}

.card-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: var(--header-primary, #ffffff);
  margin-bottom: 4px;
}

.config-desc {
  font-size: 13px;
  color: var(--text-muted, #949ba4);
  margin-bottom: 16px;
}

.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.04));
  gap: 16px;
}

.config-item:last-child {
  border-bottom: none;
}

.config-label-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.config-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-normal, #dbdee1);
}

.config-hint {
  font-size: 12px;
  color: var(--text-muted, #949ba4);
}

.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.col-half {
  flex: 1;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-normal, #dbdee1);
}

.discord-input,
.discord-textarea {
  width: 100%;
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-sm, 4px);
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-normal, #dbdee1);
  outline: none;
  transition: border-color var(--transition-fast);
}

.discord-textarea {
  resize: vertical;
}

.discord-input:focus,
.discord-textarea:focus {
  border-color: var(--blurple, #5865F2);
}

.help-grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 8px 16px;
  font-size: 12px;
  color: var(--text-muted, #949ba4);
}

.help-grid code {
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  color: var(--text-normal, #dbdee1);
}

.config-actions-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}

.btn-primary {
  background: var(--blurple, #5865F2);
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-sm, 4px);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-primary:hover:not(:disabled) {
  background: var(--blurple-hover, #4752c4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-tertiary, #4e5058);
  transition: .3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--status-positive, #57f287);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.config-loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: var(--blurple, #5865F2);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
