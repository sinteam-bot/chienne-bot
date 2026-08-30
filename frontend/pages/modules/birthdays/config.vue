<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Paramètres Généraux -->
    <div class="config-card">
      <div class="card-subtitle">⚙️ Paramètres Généraux</div>
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

      <div class="form-divider"></div>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Mode de visibilité BDD</label>
          <select v-model="config.mode" class="discord-input discord-select">
            <option value="public">Public (Partagé entre tous les serveurs compatibles)</option>
            <option value="private">Privé (Propre uniquement à ce serveur)</option>
          </select>
        </div>
        <div class="col-half">
          <label class="form-label">Heure de l'annonce (Fuseau: {{ config.announce?.timezone || 'Europe/Paris' }})</label>
          <input v-model.number="config.announce.hour" type="number" min="0" max="23" class="discord-input" />
        </div>
      </div>
    </div>

    <!-- Salon d'Annonce et Message -->
    <div class="config-card">
      <div class="card-subtitle">📢 Salon &amp; Message d'Annonce</div>
      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Salon d'Annonce</label>
          <DiscordChannelSelect
            v-model="config.announce.channel_id"
            :allow-null="true"
            null-label="— Aucun salon (désactiver l'annonce publique) —"
            :filter-text-only="true"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Rôle à mentionner le jour J (Optionnel)</label>
          <DiscordRoleSelect
            v-model="config.announce.ping_role_id"
            :allow-null="true"
            null-label="— Aucun ping —"
          />
        </div>
      </div>

      <div style="margin-top: 14px;">
        <label class="form-label">Template du message ({user}, {age})</label>
        <input
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
      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Rôle Temporaire le Jour J</label>
          <span class="config-hint">Attribue un rôle festif le jour de l'anniversaire et le retire automatiquement à minuit.</span>
        </div>
        <label class="switch">
          <input v-model="config.temp_role.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div v-if="config.temp_role?.enabled" style="margin-top: 14px;">
        <label class="form-label">Rôle festif à attribuer</label>
        <DiscordRoleSelect
          v-model="config.temp_role.role_id"
          :allow-null="true"
          null-label="— Sélectionner le rôle festif —"
        />
      </div>

      <div class="form-divider"></div>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Bonus XP d'anniversaire offert</label>
          <input v-model.number="config.gifts.xp_per_birthday" type="number" min="0" step="50" class="discord-input" />
        </div>
        <div class="col-half">
          <label class="form-label">Nombre max de cadeaux par membre</label>
          <input v-model.number="config.gifts.max_per_user" type="number" min="1" max="10" class="discord-input" />
        </div>
      </div>
    </div>

    <div class="config-actions-bar" style="margin-top: 16px;">
      <button class="btn-primary" :disabled="isSaving" @click="saveModuleConfig">
        {{ isSaving ? 'Enregistrement…' : '💾 Sauvegarder Configuration Anniversaires' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useConfigFeature } from '~/composables/useConfigFeature.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';
import DiscordRoleSelect from '~/components/ui/DiscordRoleSelect.vue';

definePageMeta({
  title: 'Configuration',
  icon: '⚙️',
  description: 'Configuration du salon d\'annonce, rôles festifs et cadeaux XP',
  section: 'modules',
  hidden: true
});

useSeoMeta({
  title: 'Configuration - Anniversaires',
  description: 'Configuration du salon d\'annonce, rôles festifs et cadeaux XP',
  ogTitle: 'Configuration - Anniversaires',
  ogDescription: 'Configuration du salon d\'annonce, rôles festifs et cadeaux XP'
});

const { config, isSaving, load, save } = useConfigFeature('birthdays', {
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
  await save();
}

onMounted(() => {
  load();
});
</script>

<style scoped>
.form-divider {
  height: 1px;
  background: var(--border-subtle, rgba(255, 255, 255, 0.08));
  margin: 16px 0;
}

.discord-select {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 4px;
  color: var(--text-normal, #dbdee1);
  font-size: 13px;
}
</style>
