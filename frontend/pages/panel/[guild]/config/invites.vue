<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <div class="config-card">
      <div class="card-subtitle">🎟️ Suivi des Invitations &amp; Anti-Fake</div>
      <p class="config-desc">
        Tracking précis de qui invite qui, détection des départs/retours rapides et logs détaillés.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le Suivi des Invitations</label>
          <span class="config-hint">Active l'écoute des invitations et le calcul des statistiques des membres.</span>
        </div>
        <label class="switch">
          <input v-model="config.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">📥 Salon de Log des Arrivées (Joins)</label>
          <span class="config-hint">Salon où le bot envoie le message "X a rejoint via l'invitation de Y".</span>
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
          <label class="config-label">📤 Salon de Log des Départs (Leaves)</label>
          <span class="config-hint">Salon où le bot annonce les départs et l'impact sur le compteur d'invites.</span>
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

      <div class="card-subtitle" style="font-size: 14px; margin-bottom: 10px;">🛡️ Détection des Faux Comptes (Fake)</div>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Âge Minimum du Compte (jours)</label>
          <input
            v-model.number="config.fake_account_threshold_days"
            type="number"
            class="discord-input"
            placeholder="3"
          />
        </div>
      </div>

      <div class="config-actions-bar">
        <button class="btn-primary" :disabled="isSaving" @click="saveConfig">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Invitations' }}
        </button>
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
  description: 'Configuration du tracking des invitations et logs Discord'
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';

const { config, isLoading, isSaving, load, save } = useConfigFeature('invites', {
  defaultConfig: {
    enabled: true,
    join_log_channel_id: null,
    leave_log_channel_id: null,
    fake_account_threshold_days: 3
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

.discord-input {
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-sm, 4px);
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-normal, #dbdee1);
  outline: none;
  transition: border-color var(--transition-fast);
}

.discord-input:focus {
  border-color: var(--blurple, #5865F2);
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
