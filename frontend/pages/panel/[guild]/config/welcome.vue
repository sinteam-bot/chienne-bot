<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <!-- 1. Message de Bienvenue Public & Salon -->
    <div class="config-card">
      <div class="card-subtitle">👋 Configuration de l'Accueil Public</div>
      <p class="config-desc">
        Configurez le salon d'envoi et le message de bienvenue envoyé sur le serveur lors de l'arrivée d'un nouveau membre.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le message de bienvenue public</label>
          <span class="config-hint">Envoie un embed stylisé dès qu'un membre rejoint le serveur.</span>
        </div>
        <label class="switch">
          <input
            v-if="config.welcome_message"
            v-model="config.welcome_message.enabled"
            type="checkbox"
          />
          <input
            v-else
            type="checkbox"
            @change="e => { if (!config.welcome_message) config.welcome_message = {}; config.welcome_message.enabled = (e.target as HTMLInputElement).checked; }"
          />
          <span class="slider"></span>
        </label>
      </div>

      <div class="form-row" style="margin-top: 14px;">
        <div class="col-half">
          <label class="form-label">Salon d'Accueil (channel_id)</label>
          <DiscordChannelSelect
            v-model="config.channel_id"
            :allow-null="true"
            null-label="— Salon Système Discord par défaut —"
            placeholder="Sélectionner le salon d'accueil..."
            :filter-text-only="true"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Couleur d'Accueil (welcome_color)</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input
              v-model="config.welcome_color"
              type="color"
              style="width: 38px; height: 38px; border: none; border-radius: 4px; background: transparent; cursor: pointer;"
            />
            <input
              v-model="config.welcome_color"
              type="text"
              class="discord-input"
              style="font-family: monospace; flex: 1;"
              placeholder="#f2c7ce"
            />
          </div>
        </div>
      </div>

      <div style="margin-top: 16px;">
        <label class="form-label">Titre de l'Embed ({server}, {user}, {memberCount})</label>
        <input
          v-if="config.welcome_message"
          v-model="config.welcome_message.title"
          type="text"
          class="discord-input"
          placeholder="🎉 Bienvenue sur {server} !"
        />
      </div>

      <div style="margin-top: 16px;">
        <label class="form-label">Description du message ({user}, {username}, {server}, {memberCount})</label>
        <textarea
          v-if="config.welcome_message"
          v-model="config.welcome_message.description"
          class="discord-textarea"
          rows="3"
        ></textarea>
      </div>

      <div class="form-row" style="margin-top: 16px;">
        <div class="col-half">
          <label class="form-label">Texte de Pied de Page (Footer)</label>
          <input
            v-if="config.welcome_message"
            v-model="config.welcome_message.footer"
            type="text"
            class="discord-input"
            placeholder="Membre #{memberCount}"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Modèle de Carte Graphique SVG</label>
          <select
            v-if="config.card"
            v-model="config.card.template"
            class="discord-input"
          >
            <option value="welcome">welcome (Classique)</option>
            <option value="join">join (Moderne)</option>
            <option value="leave">leave (Minimaliste)</option>
          </select>
          <select
            v-else
            class="discord-input"
            @change="e => { if (!config.card) config.card = {}; config.card.template = (e.target as HTMLSelectElement).value; }"
          >
            <option value="welcome">welcome (Classique)</option>
            <option value="join">join (Moderne)</option>
            <option value="leave">leave (Minimaliste)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 2. Attribution Automatique de Rôles (AUTO_ROLES) -->
    <div class="config-card">
      <div class="card-subtitle">🎭 Rôles Automatiques (AUTO_ROLES)</div>
      <p class="config-desc">
        Rôles attribués instantanément et automatiquement à tout nouveau membre dès son entrée.
      </p>

      <div class="roles-manager">
        <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 14px;">
          <div style="flex: 1;">
            <DiscordRoleSelect
              v-model="newRoleToAdd"
              placeholder="Choisir un rôle à ajouter automatiquement..."
              :allow-null="true"
              null-label="— Sélectionner un rôle —"
            />
          </div>
          <button
            type="button"
            class="btn-primary"
            :disabled="!newRoleToAdd"
            style="padding: 9px 16px; font-size: 13px;"
            @click="addAutoRole"
          >
            ➕ Ajouter ce rôle
          </button>
        </div>

        <div v-if="config.AUTO_ROLES && config.AUTO_ROLES.length" class="roles-chips-list">
          <div v-for="roleId in config.AUTO_ROLES" :key="roleId" class="role-chip">
            <DiscordRole :role-id="roleId" />
            <button class="btn-remove-role" title="Retirer ce rôle" @click="removeAutoRole(roleId)">✕</button>
          </div>
        </div>
        <div v-else class="empty-roles-hint">
          Aucun rôle automatique configuré. Les nouveaux membres n'auront pas de rôle par défaut.
        </div>
      </div>
    </div>

    <!-- 3. Message Privé (DM) à l'arrivée -->
    <div class="config-card">
      <div class="card-subtitle">📩 Message Privé d'Accueil (DM)</div>
      <p class="config-desc">
        Envoyez un message direct de bienvenue au nouveau membre dans ses messages privés.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le message privé en DM</label>
          <span class="config-hint">Envoie les consignes ou un message chaleureux directement au membre.</span>
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

      <div v-if="config.dm_message && config.dm_message.enabled" style="margin-top: 16px;">
        <div style="margin-bottom: 14px;">
          <label class="form-label">Titre de l'Embed Privé</label>
          <input v-model="config.dm_message.title" type="text" class="discord-input" placeholder="👋 Bienvenue !" />
        </div>
        <div>
          <label class="form-label">Description du message en DM ({username}, {server})</label>
          <textarea v-model="config.dm_message.description" class="discord-textarea" rows="3"></textarea>
        </div>
      </div>
    </div>

    <!-- 4. Paliers de Membres (Milestones) & Messages de Départ (Leave) -->
    <div class="config-card">
      <div class="card-subtitle">🎯 Paliers de Membres &amp; Départs</div>
      <p class="config-desc">
        Célébrez les étapes clés du serveur et tracez les départs de membres.
      </p>

      <!-- Milestones -->
      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Annonces de Paliers (Milestones)</label>
          <span class="config-hint">Poste un message spécial lors du franchissement de caps (ex: 100, 500, 1000 membres).</span>
        </div>
        <label class="switch">
          <input
            v-if="config.milestones"
            v-model="config.milestones.enabled"
            type="checkbox"
          />
          <input
            v-else
            type="checkbox"
            @change="e => { if (!config.milestones) config.milestones = {}; config.milestones.enabled = (e.target as HTMLInputElement).checked; }"
          />
          <span class="slider"></span>
        </label>
      </div>

      <div v-if="config.milestones && config.milestones.enabled" style="margin-top: 14px;">
        <div class="form-row">
          <div class="col-half">
            <label class="form-label">Salon des Paliers (Milestones Channel)</label>
            <DiscordChannelSelect
              v-model="config.milestones.channel_id"
              :allow-null="true"
              null-label="— Même salon que l'accueil —"
              :filter-text-only="true"
            />
          </div>
          <div class="col-half">
            <label class="form-label">Seuils / Paliers (séparés par des virgules)</label>
            <input
              :value="config.milestones.thresholds ? config.milestones.thresholds.join(', ') : ''"
              type="text"
              class="discord-input"
              placeholder="10, 50, 100, 500, 1000, 5000"
              @input="onThresholdsInput"
            />
          </div>
        </div>
        <div style="margin-top: 14px;">
          <label class="form-label">Template du message de palier ({count})</label>
          <input v-model="config.milestones.template" type="text" class="discord-input" placeholder="🎯 Le serveur passe à {count} membres !" />
        </div>
      </div>

      <div class="form-divider" style="margin: 20px 0; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06));"></div>

      <!-- Leave -->
      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Message / Carte de Départ (Leave)</label>
          <span class="config-hint">Envoie une notification discrète ou une carte de départ lorsqu'un membre quitte le serveur.</span>
        </div>
        <label class="switch">
          <input
            v-if="config.leave"
            v-model="config.leave.enabled"
            type="checkbox"
          />
          <input
            v-else
            type="checkbox"
            @change="e => { if (!config.leave) config.leave = {}; config.leave.enabled = (e.target as HTMLInputElement).checked; }"
          />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Actions Bar -->
    <div class="config-actions-bar">
      <button class="btn-primary" :disabled="isSaving" @click="saveModuleConfig">
        {{ isSaving ? 'Enregistrement en cours...' : '💾 Sauvegarder la Configuration Bienvenue' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useConfigFeature } from '~/composables/useConfigFeature.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';
import DiscordRoleSelect from '~/components/ui/DiscordRoleSelect.vue';
import DiscordRole from '~/components/common/DiscordRole.vue';

definePageMeta({
  title: 'Configuration Bienvenue',
  hidden: true
});

useSeoMeta({
  title: 'Message de Bienvenue - Configuration',
  description: 'Configuration avancée de la bienvenue, rôles automatiques, messages DM et paliers'
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';
const newRoleToAdd = ref<string>('');

const { config, isLoading, isSaving, load, save } = useConfigFeature('welcome', {
  defaultConfig: {
    enabled: true,
    channel_id: null,
    welcome_color: '#f2c7ce',
    AUTO_ROLES: [] as string[],
    welcome_message: {
      enabled: true,
      title: '🎉 Bienvenue sur {server} !',
      description: "Bienvenue {user} !\n\nNous sommes ravis de t'accueillir parmi nous ! 🎊",
      color: '#f2c7ce',
      footer: 'Membre #{memberCount}',
      thumbnail: 'user',
      image: null
    },
    dm_message: {
      enabled: true,
      title: '👋 Bienvenue !',
      description: 'Salut {username} !\n\nBienvenue sur **{server}** !',
      color: '#f2c7ce'
    },
    card: {
      template: 'welcome'
    },
    milestones: {
      enabled: false,
      channel_id: null,
      thresholds: [10, 50, 100, 500, 1000, 5000],
      template: '🎯 Le serveur passe à {count} membres !'
    },
    leave: {
      enabled: false,
      template: 'leave'
    }
  }
});

function addAutoRole() {
  if (!newRoleToAdd.value) return;
  if (!Array.isArray(config.value.AUTO_ROLES)) {
    config.value.AUTO_ROLES = [];
  }
  if (!config.value.AUTO_ROLES.includes(newRoleToAdd.value)) {
    config.value.AUTO_ROLES.push(newRoleToAdd.value);
  }
  newRoleToAdd.value = '';
}

function removeAutoRole(roleId: string) {
  if (!Array.isArray(config.value.AUTO_ROLES)) return;
  config.value.AUTO_ROLES = config.value.AUTO_ROLES.filter((id: string) => id !== roleId);
}

function onThresholdsInput(e: any) {
  const val = e.target.value;
  config.value.milestones = config.value.milestones || {};
  config.value.milestones.thresholds = val
    .split(',')
    .map((s: string) => parseInt(s.trim(), 10))
    .filter((n: number) => !isNaN(n) && n > 0);
}

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

.roles-chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  background: var(--bg-tertiary, #1e1f22);
  padding: 12px;
  border-radius: 6px;
}

.role-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  padding: 4px 8px;
  border-radius: 4px;
}

.btn-remove-role {
  background: transparent;
  border: none;
  color: var(--status-danger, #f23f43);
  cursor: pointer;
  font-size: 12px;
  padding: 0 4px;
  font-weight: bold;
}

.btn-remove-role:hover {
  opacity: 0.8;
}

.empty-roles-hint {
  font-size: 12px;
  color: var(--text-muted, #949ba4);
  font-style: italic;
  padding: 10px;
  background: var(--bg-tertiary, #1e1f22);
  border-radius: 4px;
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
