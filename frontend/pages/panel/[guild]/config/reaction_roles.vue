<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <!-- Activation & Règles -->
    <div class="config-card">
      <div class="card-subtitle">⚙️ Paramètres Généraux des Rôles à Réaction</div>
      <p class="config-desc">
        Configurez l'auto-assignation, les limites par message et l'attribution des rôles.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le module Rôles à Réaction</label>
          <span class="config-hint">Active l'attribution automatique de rôles via réactions et composants.</span>
        </div>
        <label class="switch">
          <input v-model="config.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Auto-assignation par les membres</label>
          <span class="config-hint">
            Si activé, n'importe quel membre peut s'attribuer le rôle en cliquant sur la réaction.
          </span>
        </div>
        <label class="switch">
          <input v-model="config.self_assignable" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Limite par message</label>
          <span class="config-hint">Nombre maximum de paires emoji↔rôle par message (sécurité anti-spam).</span>
        </div>
        <input
          v-model.number="config.max_per_message"
          type="number"
          min="1"
          max="50"
          class="discord-input"
          style="width: 80px; text-align: center;"
        />
      </div>
    </div>

    <!-- Rôles autorisés (admin) -->
    <div class="config-card">
      <div class="card-subtitle">🛡️ Rôles autorisés (Administration)</div>
      <p class="config-desc">
        Seuls les membres avec l'un de ces rôles (ou la permission ManageRoles) peuvent utiliser les commandes <code>/reactionrole-*</code>.
      </p>
      <div style="margin-top: 12px;">
        <DiscordRoleSelect
          v-model="config.allowed_roles"
          :multiple="true"
          placeholder="Aucun (tous les modérateurs ManageRoles)"
        />
      </div>
    </div>

    <!-- Aide & Astuces -->
    <div class="config-card">
      <div class="card-subtitle">💡 Astuces &amp; Fonctionnement</div>
      <ul style="margin: 8px 0 0 20px; color: var(--text-muted, #949ba4); font-size: 13px; line-height: 1.7;">
        <li>Les <strong>réactions existantes</strong> sur un message sont automatiquement synchronisées : si un membre retire sa réaction, le rôle est automatiquement enlevé.</li>
        <li>Vous pouvez utiliser des <strong>emojis custom</strong> du serveur ou des <strong>emojis unicode</strong> standard (🎉, ✅, etc.).</li>
        <li>Quand un message de rôles à réaction est <strong>supprimé</strong>, les écouteurs sont automatiquement nettoyés.</li>
        <li>Le bot Discord ne peut pas attribuer des rôles <strong>placés au-dessus de son propre rôle</strong> dans la hiérarchie Discord.</li>
      </ul>
    </div>

    <!-- Actions Bar -->
    <div class="config-actions-bar">
      <button class="btn-primary" :disabled="isSaving" @click="saveConfig">
        {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Rôles à Réaction' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useConfigFeature } from '~/composables/useConfigFeature.ts';
import DiscordRoleSelect from '~/components/ui/DiscordRoleSelect.vue';

definePageMeta({
  title: 'Configuration Rôles à Réaction',
  hidden: true
});

useSeoMeta({
  title: 'Rôles à Réaction - Configuration',
  description: 'Configuration des rôles par bouton, menu ou réaction'
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';

const { config, isLoading, isSaving, load, save } = useConfigFeature('reaction_roles', {
  defaultConfig: {
    enabled: true,
    self_assignable: true,
    max_per_message: 25,
    allowed_roles: [] as string[]
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
