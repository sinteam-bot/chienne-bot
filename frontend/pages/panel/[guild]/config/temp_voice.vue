<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <div class="config-card">
      <div class="card-subtitle">🔊 Configuration des Vocaux Temporaires (Join-to-Create)</div>
      <p class="config-desc">
        Sélectionnez les salons vocaux qui serviront de "Join-to-Trigger" : un membre qui y entre déclenche la création d'un salon vocal privé éphémère.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le module Vocaux Temporaires</label>
          <span class="config-hint">Active l'écoute des connexions sur les salons maîtres configurés.</span>
        </div>
        <label class="switch">
          <input v-model="config.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Salons Déclencheurs (Join-to-Trigger)</label>
          <span class="config-hint">Salons vocaux sur lesquels cliquer pour créer automatiquement un vocal privé.</span>
        </div>
        <div style="flex: 1; max-width: 400px;">
          <DiscordChannelSelect
            v-model="config.join_channels"
            :multiple="true"
            channel-type="guild-voice"
            placeholder="Sélectionner un ou plusieurs salons vocaux"
          />
        </div>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Catégorie Parente des Salons Créés</label>
          <span class="config-hint">Catégorie Discord où les salons éphémères seront créés.</span>
        </div>
        <div style="flex: 1; max-width: 400px;">
          <DiscordChannelSelect
            v-model="config.category_id"
            channel-type="guild-category"
            placeholder="Aucune (racine du serveur)"
          />
        </div>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Template du Nom du Salon</label>
          <span class="config-hint">Variables : <code>{user}</code> = surnom, <code>{username}</code> = pseudo Discord</span>
        </div>
        <input
          v-model="config.format"
          class="discord-input"
          placeholder="{user}'s game"
          style="width: 260px;"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Délai de suppression (secondes)</label>
          <span class="config-hint">Délai avant suppression une fois le salon vide (0 = suppression immédiate).</span>
        </div>
        <input
          v-model.number="config.delete_delay_seconds"
          type="number"
          min="0"
          max="300"
          class="discord-input"
          style="width: 100px; text-align: center;"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Max vocaux simultanés par serveur</label>
          <span class="config-hint">Limite anti-spam (0 = illimité).</span>
        </div>
        <input
          v-model.number="config.max_per_guild"
          type="number"
          min="0"
          max="50"
          class="discord-input"
          style="width: 100px; text-align: center;"
        />
      </div>

      <div class="config-actions-bar" style="margin-top: 20px;">
        <button class="btn-primary" :disabled="isSaving" @click="saveConfig">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Vocaux Temporaires' }}
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
  title: 'Configuration Vocaux Temporaires',
  hidden: true
});

useSeoMeta({
  title: 'Salons Vocaux Temporaires - Configuration',
  description: 'Configuration du système Join-to-Create'
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';

const { config, isLoading, isSaving, load, save } = useConfigFeature('temp_voice', {
  defaultConfig: {
    enabled: true,
    allowed_roles: [] as string[],
    join_channels: [] as string[],
    category_id: null as string | null,
    format: "{user}'s game",
    delete_delay_seconds: 5,
    max_per_guild: 0
  }
});

async function saveConfig() {
  const joinChans = Array.isArray(config.value.join_channels)
    ? config.value.join_channels
    : (config.value.join_channels ? [String(config.value.join_channels)] : []);

  const payload = {
    enabled: config.value.enabled !== false,
    allowed_roles: config.value.allowed_roles || [],
    join_channels: joinChans,
    category_id: config.value.category_id || null,
    format: config.value.format || "{user}'s game",
    delete_delay_seconds: Number(config.value.delete_delay_seconds) || 5,
    max_per_guild: Number(config.value.max_per_guild) || 0
  };
  await save(payload, guildId);
}

onMounted(async () => {
  await load(guildId);
  if (config.value) {
    const raw = config.value.join_channels || (config.value as any).joinChannels || [];
    config.value.join_channels = Array.isArray(raw) ? raw : (typeof raw === 'string' && raw ? [raw] : []);
    if (!config.value.category_id && (config.value as any).categoryId) {
      config.value.category_id = (config.value as any).categoryId;
    }
    if (config.value.delete_delay_seconds === undefined && (config.value as any).deleteDelaySeconds !== undefined) {
      config.value.delete_delay_seconds = (config.value as any).deleteDelaySeconds;
    }
    if (config.value.max_per_guild === undefined && (config.value as any).maxPerGuild !== undefined) {
      config.value.max_per_guild = (config.value as any).maxPerGuild;
    }
  }
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
