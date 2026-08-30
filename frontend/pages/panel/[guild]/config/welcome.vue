<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <div class="config-card">
      <div class="card-subtitle">👋 Message de Bienvenue &amp; Accueil des Nouveaux</div>
      <p class="config-desc">
        Configurez l'embed public d'accueil, les messages privés (DM) et l'attribution automatique de rôles.
      </p>

      <!-- Message Public -->
      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le Message Public</label>
          <span class="config-hint">Envoie un embed de bienvenue dans le salon choisi à l'arrivée d'un nouveau membre.</span>
        </div>
        <label class="switch">
          <input
            v-if="config.public_message"
            v-model="config.public_message.enabled"
            type="checkbox"
          />
          <input
            v-else
            type="checkbox"
            @change="e => { if (!config.public_message) config.public_message = {}; config.public_message.enabled = (e.target as HTMLInputElement).checked; }"
          />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">📢 Salon Discord de Bienvenue</label>
          <span class="config-hint">Salon où l'embed de bienvenue public sera envoyé.</span>
        </div>
        <div style="min-width: 260px;">
          <DiscordChannelSelect
            v-if="config.public_message"
            v-model="config.public_message.channel_id"
            :allow-null="true"
            null-label="— Aucun salon (Désactivé) —"
            :filter-text-only="true"
            placeholder="Sélectionner un salon…"
          />
        </div>
      </div>

      <div class="form-row" style="margin-top: 12px;">
        <div class="col-half">
          <label class="form-label">Titre du Message Public</label>
          <input
            v-if="config.public_message"
            v-model="config.public_message.title"
            type="text"
            class="discord-input"
            placeholder="Bienvenue {user} sur {server} !"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Couleur de l'Embed</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input
              v-if="config.public_message"
              v-model="config.public_message.color"
              type="color"
              style="width: 38px; height: 38px; border: none; border-radius: 4px; background: transparent; cursor: pointer;"
            />
            <input
              v-if="config.public_message"
              v-model="config.public_message.color"
              type="text"
              class="discord-input"
              style="flex: 1;"
              placeholder="#f2c7ce"
            />
          </div>
        </div>
      </div>

      <div style="margin-top: 12px;">
        <label class="form-label">Contenu / Description de l'Embed Public</label>
        <textarea
          v-if="config.public_message"
          v-model="config.public_message.description"
          rows="3"
          class="discord-input"
          style="width: 100%; resize: vertical;"
          placeholder="Nous sommes ravis de t'accueillir parmi nous !"
        ></textarea>
      </div>

      <div class="form-divider" style="margin: 16px 0; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06));"></div>

      <!-- Message Privé (DM) -->
      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">📩 Message Privé (DM) de Bienvenue</label>
          <span class="config-hint">Envoie un message direct amical au nouveau membre à son arrivée.</span>
        </div>
        <label class="switch">
          <input
            v-if="config.dm_message"
            v-model="config.dm_message.enabled"
            type="checkbox"
          />
          <input
            v-else
            type="checkbox"
            @change="e => { if (!config.dm_message) config.dm_message = {}; config.dm_message.enabled = (e.target as HTMLInputElement).checked; }"
          />
          <span class="slider"></span>
        </label>
      </div>

      <div style="margin-top: 12px;">
        <label class="form-label">Contenu du Message DM</label>
        <textarea
          v-if="config.dm_message"
          v-model="config.dm_message.content"
          rows="3"
          class="discord-input"
          style="width: 100%; resize: vertical;"
          placeholder="Bienvenue sur le serveur ! N'hésite pas à lire les règles."
        ></textarea>
      </div>

      <div class="form-divider" style="margin: 16px 0; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06));"></div>

      <!-- Auto Roles -->
      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">🏷️ Rôle Automatique à l'Arrivée</label>
          <span class="config-hint">Rôle attribué immédiatement aux nouveaux arrivants (hors captcha).</span>
        </div>
        <div style="min-width: 260px;">
          <DiscordRoleSelect
            v-model="config.auto_role_id"
            placeholder="Sélectionner un rôle automatique…"
          />
        </div>
      </div>

      <div class="config-actions-bar">
        <button class="btn-primary" :disabled="isSaving" @click="saveConfig">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Message de Bienvenue' }}
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
import DiscordRoleSelect from '~/components/ui/DiscordRoleSelect.vue';

definePageMeta({
  title: 'Configuration Message de Bienvenue',
  hidden: true
});

useSeoMeta({
  title: 'Message de Bienvenue - Configuration',
  description: 'Configuration du message d\'accueil et rôles automatiques'
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';

const { config, isLoading, isSaving, load, save } = useConfigFeature('welcome', {
  defaultConfig: {
    public_message: {
      enabled: true,
      channel_id: null,
      title: 'Bienvenue {user} sur {server} !',
      description: 'Nous sommes ravis de t\'accueillir parmi nous !',
      color: '#f2c7ce'
    },
    dm_message: {
      enabled: false,
      content: 'Bienvenue sur le serveur !'
    },
    auto_role_id: null
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
