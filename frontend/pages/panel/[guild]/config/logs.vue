<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <!-- SECTION 1 : ÉTAT GÉNÉRAL DU MODULE -->
    <div class="config-card">
      <div class="card-subtitle">📜 Journalisation &amp; Audit des Événements (Logs)</div>
      <p class="config-desc">
        Configurez le système complet d'audit Discord : routage des événements vers des salons dédiés, filtrage granulaire par type d'action et exclusions.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le module Logs &amp; Audit</label>
          <span class="config-hint">Active l'écoute, le traitement et la journalisation des événements Discord pour ce serveur.</span>
        </div>
        <label class="switch">
          <input v-model="config.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Format de publication des logs</label>
          <span class="config-hint">Style visuel des messages envoyés dans vos salons de logs Discord.</span>
        </div>
        <div style="display: flex; gap: 10px;">
          <button
            type="button"
            :class="['format-btn', { active: config.format === 'embed' }]"
            @click="config.format = 'embed'"
          >
            🎨 Embed Discord Riche
          </button>
          <button
            type="button"
            :class="['format-btn', { active: config.format === 'text' }]"
            @click="config.format = 'text'"
          >
            📝 Texte Brut Markdown
          </button>
        </div>
      </div>

      <div v-if="config.format === 'embed'" class="config-item">
        <div class="config-label-group">
          <label class="config-label">Couleur par défaut des Embeds</label>
          <span class="config-hint">Couleur de la bordure gauche pour les embeds de logs informatifs génériques.</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <input
            v-model="config.color"
            type="color"
            class="color-picker-input"
          />
          <input
            v-model="config.color"
            type="text"
            class="discord-input"
            style="width: 100px; font-family: monospace; text-transform: uppercase;"
          />
        </div>
      </div>
    </div>

    <!-- SECTION 2 : ROUTAGE VERS SALONS DÉDIÉS -->
    <div class="config-card">
      <div class="card-subtitle">📍 Salons Discord Dédiés (Routage par Catégorie)</div>
      <p class="config-desc">
        Définissez dans quels salons envoyer chaque type d'événement. Si aucun salon n'est configuré pour une catégorie, les événements sont uniquement archivés en base de données.
      </p>

      <div class="channels-grid">
        <!-- 1. Modération -->
        <div class="channel-route-item">
          <div class="route-header">
            <span class="route-icon">🛡️</span>
            <div class="route-text">
              <span class="route-title">Sanctions &amp; Modération</span>
              <span class="route-desc">Bans, débans, expulsions, sanctions automod</span>
            </div>
          </div>
          <DiscordChannelSelect
            v-model="config.channels.moderation"
            channel-type="guild-text"
            placeholder="— Aucun salon (Archive BDD uniquement) —"
          />
        </div>

        <!-- 2. Messages -->
        <div class="channel-route-item">
          <div class="route-header">
            <span class="route-icon">💬</span>
            <div class="route-text">
              <span class="route-title">Messages &amp; Discussions</span>
              <span class="route-desc">Suppressions, modifications, purges massives</span>
            </div>
          </div>
          <DiscordChannelSelect
            v-model="config.channels.messages"
            channel-type="guild-text"
            placeholder="— Aucun salon (Archive BDD uniquement) —"
          />
        </div>

        <!-- 3. Membres -->
        <div class="channel-route-item">
          <div class="route-header">
            <span class="route-icon">👥</span>
            <div class="route-text">
              <span class="route-title">Membres &amp; Arrivées / Départs</span>
              <span class="route-desc">Joins, leaves, changements de pseudonymes et avatars</span>
            </div>
          </div>
          <DiscordChannelSelect
            v-model="config.channels.members"
            channel-type="guild-text"
            placeholder="— Aucun salon (Archive BDD uniquement) —"
          />
        </div>

        <!-- 4. Vocaux -->
        <div class="channel-route-item">
          <div class="route-header">
            <span class="route-icon">🔊</span>
            <div class="route-text">
              <span class="route-title">Salons Vocaux</span>
              <span class="route-desc">Connexions, déconnexions, déplacements vocaux</span>
            </div>
          </div>
          <DiscordChannelSelect
            v-model="config.channels.voice"
            channel-type="guild-text"
            placeholder="— Aucun salon (Archive BDD uniquement) —"
          />
        </div>

        <!-- 5. Rôles -->
        <div class="channel-route-item">
          <div class="route-header">
            <span class="route-icon">🎭</span>
            <div class="route-text">
              <span class="route-title">Rôles &amp; Permissions</span>
              <span class="route-desc">Créations, modifications et suppressions de rôles</span>
            </div>
          </div>
          <DiscordChannelSelect
            v-model="config.channels.roles"
            channel-type="guild-text"
            placeholder="— Aucun salon (Archive BDD uniquement) —"
          />
        </div>

        <!-- 6. Salons Discord -->
        <div class="channel-route-item">
          <div class="route-header">
            <span class="route-icon">📁</span>
            <div class="route-text">
              <span class="route-title">Structure des Salons</span>
              <span class="route-desc">Créations, modifications et suppressions de canaux</span>
            </div>
          </div>
          <DiscordChannelSelect
            v-model="config.channels.channels_log"
            channel-type="guild-text"
            placeholder="— Aucun salon (Archive BDD uniquement) —"
          />
        </div>

        <!-- 7. Serveur & Emojis -->
        <div class="channel-route-item">
          <div class="route-header">
            <span class="route-icon">🏰</span>
            <div class="route-text">
              <span class="route-title">Serveur &amp; Emojis</span>
              <span class="route-desc">Modifications de paramètres serveur, ajouts d'émojis</span>
            </div>
          </div>
          <DiscordChannelSelect
            v-model="config.channels.server"
            channel-type="guild-text"
            placeholder="— Aucun salon (Archive BDD uniquement) —"
          />
        </div>
      </div>
    </div>

    <!-- SECTION 3 : ÉVÉNEMENTS ÉCOUTÉS & FILTRAGE -->
    <div class="config-card">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
        <div>
          <div class="card-subtitle">⚡ Événements Discord Pris en Charge</div>
          <p class="config-desc" style="margin: 0;">
            Activez ou désactivez individuellement la capture de chaque événement Discord.
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn-action-small" @click="toggleAllEvents(true)">
            ✅ Tout activer
          </button>
          <button type="button" class="btn-action-small" @click="toggleAllEvents(false)">
            ❌ Tout désactiver
          </button>
        </div>
      </div>

      <div class="events-categories-grid">
        <!-- Groupe Messages -->
        <div class="event-group-card">
          <div class="event-group-title">💬 Messages</div>
          <div class="event-toggle-list">
            <label class="event-toggle-row">
              <span class="event-name">🗑️ Message supprimé</span>
              <input v-model="config.events.message_delete" type="checkbox" class="event-checkbox" />
            </label>
            <label class="event-toggle-row">
              <span class="event-name">✏️ Message modifié</span>
              <input v-model="config.events.message_edit" type="checkbox" class="event-checkbox" />
            </label>
            <label class="event-toggle-row">
              <span class="event-name">🧹 Purge / Bulk Delete</span>
              <input v-model="config.events.message_bulk_delete" type="checkbox" class="event-checkbox" />
            </label>
          </div>
        </div>

        <!-- Groupe Membres & Modération -->
        <div class="event-group-card">
          <div class="event-group-title">👥 Membres &amp; Modération</div>
          <div class="event-toggle-list">
            <label class="event-toggle-row">
              <span class="event-name">📥 Membre a rejoint</span>
              <input v-model="config.events.member_join" type="checkbox" class="event-checkbox" />
            </label>
            <label class="event-toggle-row">
              <span class="event-name">📤 Membre a quitté</span>
              <input v-model="config.events.member_leave" type="checkbox" class="event-checkbox" />
            </label>
            <label class="event-toggle-row">
              <span class="event-name">👤 Profil modifié (Pseudo/Rôles)</span>
              <input v-model="config.events.member_update" type="checkbox" class="event-checkbox" />
            </label>
            <label class="event-toggle-row">
              <span class="event-name">🔨 Membre banni</span>
              <input v-model="config.events.member_ban_add" type="checkbox" class="event-checkbox" />
            </label>
            <label class="event-toggle-row">
              <span class="event-name">🔓 Membre débanni</span>
              <input v-model="config.events.member_ban_remove" type="checkbox" class="event-checkbox" />
            </label>
          </div>
        </div>

        <!-- Groupe Rôles & Salons -->
        <div class="event-group-card">
          <div class="event-group-title">📁 Salons &amp; Rôles</div>
          <div class="event-toggle-list">
            <label class="event-toggle-row">
              <span class="event-name">➕ Rôle créé</span>
              <input v-model="config.events.role_create" type="checkbox" class="event-checkbox" />
            </label>
            <label class="event-toggle-row">
              <span class="event-name">✏️ Rôle modifié</span>
              <input v-model="config.events.role_update" type="checkbox" class="event-checkbox" />
            </label>
            <label class="event-toggle-row">
              <span class="event-name">❌ Rôle supprimé</span>
              <input v-model="config.events.role_delete" type="checkbox" class="event-checkbox" />
            </label>
            <label class="event-toggle-row">
              <span class="event-name">➕ Salon créé</span>
              <input v-model="config.events.channel_create" type="checkbox" class="event-checkbox" />
            </label>
            <label class="event-toggle-row">
              <span class="event-name">📝 Salon modifié</span>
              <input v-model="config.events.channel_update" type="checkbox" class="event-checkbox" />
            </label>
            <label class="event-toggle-row">
              <span class="event-name">🗑️ Salon supprimé</span>
              <input v-model="config.events.channel_delete" type="checkbox" class="event-checkbox" />
            </label>
          </div>
        </div>

        <!-- Groupe Vocaux & Serveur -->
        <div class="event-group-card">
          <div class="event-group-title">🏰 Vocaux &amp; Serveur</div>
          <div class="event-toggle-list">
            <label class="event-toggle-row">
              <span class="event-name">🔊 Déplacements vocaux</span>
              <input v-model="config.events.voice_state_update" type="checkbox" class="event-checkbox" />
            </label>
            <label class="event-toggle-row">
              <span class="event-name">🏰 Serveur mis à jour</span>
              <input v-model="config.events.guild_update" type="checkbox" class="event-checkbox" />
            </label>
            <label class="event-toggle-row">
              <span class="event-name">😀 Émoji ajouté</span>
              <input v-model="config.events.emoji_create" type="checkbox" class="event-checkbox" />
            </label>
            <label class="event-toggle-row">
              <span class="event-name">🗑️ Émoji supprimé</span>
              <input v-model="config.events.emoji_delete" type="checkbox" class="event-checkbox" />
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 4 : FILTRES & EXCLUSIONS -->
    <div class="config-card">
      <div class="card-subtitle">🚫 Exclusions &amp; Filtres de Sécurité</div>
      <p class="config-desc">
        Ignorez certains salons ou utilisateurs (bots, spam) pour éviter la saturation des logs.
      </p>

      <!-- Salons ignorés -->
      <div class="config-item" style="flex-direction: column; align-items: stretch; gap: 10px;">
        <div class="config-label-group">
          <label class="config-label">Salons ignorés des logs</label>
          <span class="config-hint">Les événements se produisant dans ces salons ne généreront aucun log.</span>
        </div>
        <DiscordChannelSelect
          v-model="config.ignored_channels"
          :multiple="true"
          channel-type="guild-text"
          placeholder="Ajouter un salon à ignorer…"
        />
      </div>

      <!-- Rôles autorisés -->
      <div class="config-item" style="flex-direction: column; align-items: stretch; gap: 10px;">
        <div class="config-label-group">
          <label class="config-label">Rôles autorisés à inspecter les logs</label>
          <span class="config-hint">Rôles ayant accès au panneau de logs et aux commandes d'audit (en plus des administrateurs).</span>
        </div>
        <DiscordRoleSelect
          v-model="config.allowed_roles"
          :multiple="true"
          placeholder="Ajouter un rôle autorisé…"
        />
      </div>

      <!-- Utilisateurs ignorés -->
      <div class="config-item" style="flex-direction: column; align-items: stretch; gap: 10px;">
        <div class="config-label-group">
          <label class="config-label">IDs Utilisateurs &amp; Bots ignorés</label>
          <span class="config-hint">Ignorer les actions de bots tiers ou utilisateurs de test spécifiques.</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <input
            v-model="newIgnoredUser"
            type="text"
            class="discord-input"
            placeholder="Entrez un ID utilisateur Discord (ex: 1337917252732850206)"
            style="flex: 1;"
            @keydown.enter.prevent="addIgnoredUser"
          />
          <button
            type="button"
            class="btn-action-small"
            :disabled="!newIgnoredUser.trim()"
            @click="addIgnoredUser"
          >
            ➕ Ajouter
          </button>
        </div>
        <div v-if="config.ignored_users.length > 0" class="chips-container" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px;">
          <div
            v-for="uId in config.ignored_users"
            :key="uId"
            class="item-chip"
          >
            <span>👤 ID: {{ uId }}</span>
            <button type="button" class="btn-remove-chip" @click="removeIgnoredUser(uId)">✕</button>
          </div>
        </div>
      </div>

      <!-- Domaines Whitelistés -->
      <div class="config-item" style="flex-direction: column; align-items: stretch; gap: 10px;">
        <div class="config-label-group">
          <label class="config-label">Domaines de liens de confiance (Whitelist)</label>
          <span class="config-hint">Liens exemptés de la censure / sanitization dans les résumés de logs.</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <input
            v-model="newDomain"
            type="text"
            class="discord-input"
            placeholder="Ex: discord.gg, github.com, monsite.fr"
            style="flex: 1;"
            @keydown.enter.prevent="addDomain"
          />
          <button
            type="button"
            class="btn-action-small"
            :disabled="!newDomain.trim()"
            @click="addDomain"
          >
            ➕ Ajouter
          </button>
        </div>
        <div v-if="config.whitelist_domains.length > 0" class="chips-container" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px;">
          <div
            v-for="dom in config.whitelist_domains"
            :key="dom"
            class="item-chip"
          >
            <span>🌐 {{ dom }}</span>
            <button type="button" class="btn-remove-chip" @click="removeDomain(dom)">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 5 : PARAMÈTRES AVANCÉS & TEMPS RÉEL -->
    <div class="config-card">
      <div class="card-subtitle">⚙️ Paramètres Avancés</div>
      <p class="config-desc">
        Réglages de performance et de diffusion en temps réel vers le tableau de bord web.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Longueur maximale des extraits de message</label>
          <span class="config-hint">Nombre maximal de caractères affichés avant tronquage dans les logs.</span>
        </div>
        <input
          v-model.number="config.settings.max_content_length"
          type="number"
          min="100"
          max="4000"
          step="100"
          class="discord-input"
          style="width: 120px; text-align: center;"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Tronquer les noms de pièces jointes lourdes</label>
          <span class="config-hint">Évite les embeds surdimensionnés en cas de fichiers multiples attachés.</span>
        </div>
        <label class="switch">
          <input v-model="config.settings.truncate_attachments" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Diffusion en temps réel vers le Dashboard (Live Feed SSE)</label>
          <span class="config-hint">Émet les événements d'audit en direct vers la console web et la page de logs.</span>
        </div>
        <label class="switch">
          <input v-model="config.settings.live_feed_emit" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <!-- Actions de Sauvegarde -->
      <div class="config-actions-bar" style="margin-top: 24px;">
        <button class="btn-primary" :disabled="isSaving" @click="saveConfig">
          {{ isSaving ? 'Enregistrement…' : '💾 Sauvegarder la Configuration des Logs' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useConfigFeature } from '~/composables/useConfigFeature.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';
import DiscordRoleSelect from '~/components/ui/DiscordRoleSelect.vue';

definePageMeta({
  title: 'Configuration Logs & Audit',
  hidden: true
});

useSeoMeta({
  title: 'Logs & Audit - Configuration',
  description: 'Configuration du système d\'audit et de journalisation Discord'
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';

const newIgnoredUser = ref('');
const newDomain = ref('');

const { config, isLoading, isSaving, load, save } = useConfigFeature('logs', {
  defaultConfig: {
    enabled: true,
    allowed_roles: [] as string[],
    channels: {
      moderation: null as string | null,
      messages: null as string | null,
      members: null as string | null,
      voice: null as string | null,
      roles: null as string | null,
      channels_log: null as string | null,
      server: null as string | null
    },
    events: {
      message_delete: true,
      message_edit: true,
      message_bulk_delete: true,
      member_join: true,
      member_leave: true,
      member_update: true,
      member_ban_add: true,
      member_ban_remove: true,
      role_create: true,
      role_update: true,
      role_delete: true,
      channel_create: true,
      channel_update: true,
      channel_delete: true,
      voice_state_update: true,
      guild_update: true,
      emoji_create: true,
      emoji_delete: true
    },
    format: 'embed' as 'embed' | 'text',
    color: '#2F3136',
    ignored_channels: [] as string[],
    ignored_users: [] as string[],
    whitelist_domains: ['discord.com', 'discord.gg', 'github.com'] as string[],
    settings: {
      max_content_length: 1024,
      truncate_attachments: true,
      live_feed_emit: true
    }
  }
});

function toggleAllEvents(value: boolean) {
  if (!config.value.events) config.value.events = {};
  for (const key of Object.keys(config.value.events)) {
    config.value.events[key] = value;
  }
}

function addIgnoredUser() {
  const val = newIgnoredUser.value.trim();
  if (!val) return;
  if (!Array.isArray(config.value.ignored_users)) config.value.ignored_users = [];
  if (!config.value.ignored_users.includes(val)) {
    config.value.ignored_users.push(val);
  }
  newIgnoredUser.value = '';
}

function removeIgnoredUser(id: string) {
  config.value.ignored_users = (config.value.ignored_users || []).filter(u => u !== id);
}

function addDomain() {
  const val = newDomain.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!val) return;
  if (!Array.isArray(config.value.whitelist_domains)) config.value.whitelist_domains = [];
  if (!config.value.whitelist_domains.includes(val)) {
    config.value.whitelist_domains.push(val);
  }
  newDomain.value = '';
}

function removeDomain(domain: string) {
  config.value.whitelist_domains = (config.value.whitelist_domains || []).filter(d => d !== domain);
}

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

.color-picker-input {
  width: 40px;
  height: 36px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  background: transparent;
  cursor: pointer;
  padding: 2px;
}

.format-btn {
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--text-muted, #949ba4);
  padding: 8px 14px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.format-btn.active {
  background: var(--blurple, #5865f2);
  color: #ffffff;
  border-color: var(--blurple, #5865f2);
}

.channels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.channel-route-item {
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: 6px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.route-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.route-icon {
  font-size: 22px;
}

.route-text {
  display: flex;
  flex-direction: column;
}

.route-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--header-primary, #ffffff);
}

.route-desc {
  font-size: 11.5px;
  color: var(--text-muted, #949ba4);
}

.events-categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.event-group-card {
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: 6px;
  padding: 14px;
}

.event-group-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--header-primary, #ffffff);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
}

.event-toggle-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--text-normal, #dbdee1);
  cursor: pointer;
  padding: 2px 0;
}

.event-toggle-row:hover {
  color: #ffffff;
}

.event-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--status-positive, #57f287);
  cursor: pointer;
}

.item-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-normal, #dbdee1);
}

.btn-remove-chip {
  background: transparent;
  border: none;
  color: var(--status-danger, #f23f43);
  cursor: pointer;
  font-size: 12px;
  padding: 0 2px;
}

.btn-action-small {
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--text-normal, #dbdee1);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action-small:hover:not(:disabled) {
  background: var(--blurple, #5865f2);
  color: #ffffff;
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
