<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <!-- Paramètres Généraux -->
    <div class="config-card">
      <div class="card-subtitle">⚙️ Paramètres Généraux</div>
      <p class="config-desc">
        Planifie les annonces quotidiennes et l'attribution des rôles festifs d'anniversaire.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le module Anniversaires</label>
          <span class="config-hint">Planifie les annonces quotidiennes et l'attribution des rôles festifs.</span>
        </div>
        <label class="switch">
          <input v-model="config.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="form-row" style="margin-top: 14px;">
        <div class="col-half">
          <label class="form-label">Mode de visibilité BDD</label>
          <select v-model="config.mode" class="discord-input">
            <option value="public">Public (Partagé entre tous les serveurs compatibles)</option>
            <option value="private">Privé (Propre uniquement à ce serveur)</option>
          </select>
        </div>
        <div class="col-half">
          <label class="form-label">Heure de l'annonce (Fuseau: {{ config.announce?.timezone || 'Europe/Paris' }})</label>
          <input
            v-if="config.announce"
            v-model.number="config.announce.hour"
            type="number"
            min="0"
            max="23"
            class="discord-input"
          />
        </div>
      </div>
    </div>

    <!-- Salon d'Annonce et Message -->
    <div class="config-card">
      <div class="card-subtitle">📢 Salon &amp; Message d'Annonce</div>
      <p class="config-desc">
        Salon et format du message festif diffusé automatiquement le jour de l'anniversaire du membre.
      </p>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Salon d'Annonce</label>
          <DiscordChannelSelect
            v-if="config.announce"
            v-model="config.announce.channel_id"
            :allow-null="true"
            null-label="— Aucun salon (désactiver l'annonce publique) —"
            :filter-text-only="true"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Rôle à mentionner le jour J (Optionnel)</label>
          <DiscordRoleSelect
            v-if="config.announce"
            v-model="config.announce.ping_role_id"
            :allow-null="true"
            null-label="— Aucun ping —"
          />
        </div>
      </div>

      <div style="margin-top: 14px;">
        <label class="form-label">Template du message ({user}, {age})</label>
        <input
          v-if="config.announce"
          v-model="config.announce.message_template"
          type="text"
          class="discord-input"
          placeholder="🎂 Joyeux anniversaire {user} ! Tu fêtes tes **{age} ans** aujourd'hui ! 🎉"
        />
      </div>
    </div>

    <!-- Rôle temporaire & Cadeaux XP -->
    <div class="config-card">
      <div class="card-subtitle">🎁 Rôle Temporaire &amp; Cadeaux</div>
      <p class="config-desc">
        Attribuez un rôle exclusif pendant 24h et offrez des points d'XP en cadeau d'anniversaire.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Rôle Temporaire le Jour J</label>
          <span class="config-hint">Attribue un rôle festif le jour de l'anniversaire et le retire automatiquement à minuit.</span>
        </div>
        <label class="switch">
          <input
            v-if="config.temp_role"
            v-model="config.temp_role.enabled"
            type="checkbox"
          />
          <span class="slider"></span>
        </label>
      </div>

      <div v-if="config.temp_role && config.temp_role.enabled" style="margin-top: 14px;">
        <label class="form-label">Rôle festif à attribuer</label>
        <DiscordRoleSelect
          v-model="config.temp_role.role_id"
          :allow-null="true"
          null-label="— Sélectionner le rôle festif —"
        />
      </div>

      <div class="form-row" style="margin-top: 16px;">
        <div class="col-half">
          <label class="form-label">Bonus XP d'anniversaire offert</label>
          <input
            v-if="config.gifts"
            v-model.number="config.gifts.xp_per_birthday"
            type="number"
            min="0"
            step="50"
            class="discord-input"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Nombre max de cadeaux par membre</label>
          <input
            v-if="config.gifts"
            v-model.number="config.gifts.max_per_user"
            type="number"
            min="1"
            max="10"
            class="discord-input"
          />
        </div>
      </div>
    </div>

    <div class="config-actions-bar">
      <button class="btn-primary" :disabled="isSaving" @click="saveModuleConfig">
        {{ isSaving ? 'Enregistrement…' : '💾 Sauvegarder Configuration Anniversaires' }}
      </button>
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
  title: 'Configuration Anniversaires',
  hidden: true
});

useSeoMeta({
  title: 'Anniversaires - Configuration',
  description: 'Configuration du salon d\'annonce, rôles festifs et cadeaux XP'
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';

const { config, isLoading, isSaving, load, save } = useConfigFeature('birthdays', {
  defaultConfig: {
    enabled: true,
    mode: 'public',
    announce: {
      channel_id: null,
      hour: 9,
      timezone: 'Europe/Paris',
      ping_role_id: null,
      message_template: "🎂 Joyeux anniversaire {user} ! Tu fêtes tes **{age} ans** aujourd'hui ! 🎉"
    },
    temp_role: {
      enabled: true,
      role_id: null
    },
    gifts: {
      max_per_user: 2,
      xp_per_birthday: 500
    },
    cooldown: {
      first_change_days: 1,
      second_change_days: 2,
      third_change_days: 180,
      default_change_days: 365
    }
  }
});

async function saveModuleConfig() {
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
