<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <!-- Paramètres Principaux -->
    <div class="config-card">
      <div class="card-subtitle">⚙️ Paramètres du Rappel de Bump</div>
      <p class="config-desc">
        Configurez le salon, le rôle à notifier et le message envoyé toutes les 2 heures après chaque bump Disboard.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le module Bump Reminder</label>
          <span class="config-hint">Surveille le bot Disboard et déclenche automatiquement un rappel après 2h.</span>
        </div>
        <label class="switch">
          <input v-model="config.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Salon d'envoi du rappel</label>
          <span class="config-hint">Sélectionnez le salon où poster le rappel (laissez vide pour utiliser le salon du bump).</span>
        </div>
        <div style="min-width: 260px;">
          <DiscordChannelSelect
            v-model="config.channel_id"
            :allow-null="true"
            null-label="— Salon où le bump a eu lieu —"
            :filter-text-only="true"
            placeholder="Salon par défaut (salon du bump)"
          />
        </div>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Rôle à notifier</label>
          <span class="config-hint">Rôle pingé avec le rappel (ex: @Bumpers, @Membres). Si vide, @here sera utilisé.</span>
        </div>
        <div style="min-width: 260px;">
          <DiscordRoleSelect
            v-model="config.role_id"
            :allow-null="true"
            null-label="— Aucun rôle (@here par défaut) —"
            placeholder="Aucun rôle (@here par défaut)"
          />
        </div>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Délai d'attente (Cooldown en heures)</label>
          <span class="config-hint">Nombre d'heures entre deux bumps (Disboard utilise 2 heures).</span>
        </div>
        <input
          v-model.number="config.reminder_cooldown_hours"
          type="number"
          min="1"
          max="24"
          class="discord-input"
          style="width: 100px; text-align: center;"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Mention @here en fallback</label>
          <span class="config-hint">Si aucun rôle n'est spécifié, mentionner @here lors du rappel.</span>
        </div>
        <label class="switch">
          <input v-model="config.mention_here" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Personnalisation du Message / Embed Discord -->
    <div class="config-card">
      <div class="card-subtitle">💬 Format &amp; Personnalisation du Message de Rappel</div>
      <p class="config-desc">
        Choisissez entre un message texte simple et direct ou un embed Discord riche.
      </p>

      <!-- Type de message : Simple ou Embed -->
      <div class="config-item" style="margin-bottom: 20px;">
        <div class="config-label-group">
          <label class="config-label">Utiliser un Embed Discord</label>
          <span class="config-hint">Si désactivé, le bot enverra un message texte simple et fluide.</span>
        </div>
        <label class="switch">
          <input v-model="config.use_embed" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <!-- Variables dynamiques disponibles -->
      <div class="variables-box">
        <span class="variables-title">💡 Variables dynamiques disponibles :</span>
        <div class="variables-list">
          <span class="badge-variable" title="Mention du rôle configuré ou @here">{role}</span>
          <span class="badge-variable" title="Nom du serveur">{server}</span>
          <span class="badge-variable" title="Mention du dernier bumper">{user}</span>
          <span class="badge-variable" title="Pseudo du dernier bumper">{username}</span>
          <span class="badge-variable" title="Délai en heures">{hours}</span>
          <span class="badge-variable" title="Commande cliquable Disboard">{command}</span>
          <span class="badge-variable" title="Salon du bump">{channel}</span>
        </div>
      </div>

      <!-- 1. CAS MESSAGE SIMPLE -->
      <div v-if="!config.use_embed" class="form-group" style="margin-bottom: 16px;">
        <label class="form-label">Message de rappel (Texte simple)</label>
        <textarea
          v-model="config.message"
          class="discord-textarea"
          rows="3"
          placeholder="{role} c'est l'heure de bumper {server} (Dernier bump par {user})"
        ></textarea>
      </div>

      <!-- 2. CAS EMBED RICHE -->
      <div v-else>
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label">Message texte brut (au-dessus de l'embed)</label>
          <input
            v-if="config.messages"
            v-model="config.messages.content"
            type="text"
            class="discord-input"
            placeholder="{role}"
          />
        </div>

        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label">Titre de l'embed</label>
          <input
            v-if="config.messages"
            v-model="config.messages.title"
            type="text"
            class="discord-input"
            placeholder="⏰ C'est l'heure du Bump !"
          />
        </div>

        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label">Description de l'embed</label>
          <textarea
            v-if="config.messages"
            v-model="config.messages.description"
            class="discord-textarea"
            rows="4"
            placeholder="{role} c'est l'heure de bumper {server}! (Dernier bump par {user})"
          ></textarea>
        </div>

        <div class="form-row" style="margin-bottom: 16px;">
          <div class="col-half">
            <label class="form-label">Couleur de l'Embed</label>
            <div style="display: flex; align-items: center; gap: 10px;">
              <input
                v-if="config.messages"
                v-model="config.messages.color"
                type="color"
                style="width: 40px; height: 36px; border: none; border-radius: 4px; cursor: pointer; background: transparent;"
              />
              <input
                v-if="config.messages"
                v-model="config.messages.color"
                type="text"
                class="discord-input"
                style="width: 120px; font-family: monospace;"
                placeholder="#f2c7ce"
              />
            </div>
          </div>

          <div class="col-half">
            <label class="form-label">Pied de page (Footer)</label>
            <input
              v-if="config.messages"
              v-model="config.messages.footer"
              type="text"
              class="discord-input"
              placeholder="Disboard Auto-Reminder"
            />
          </div>
        </div>

        <div class="form-row" style="margin-bottom: 16px;">
          <div class="col-half">
            <label class="form-label">URL Vignette (Thumbnail)</label>
            <input
              v-if="config.messages"
              v-model="config.messages.thumbnail"
              type="text"
              class="discord-input"
              placeholder="https://... (optionnel)"
            />
          </div>

          <div class="col-half">
            <label class="form-label">URL Image Bannière</label>
            <input
              v-if="config.messages"
              v-model="config.messages.image"
              type="text"
              class="discord-input"
              placeholder="https://... (optionnel)"
            />
          </div>
        </div>
      </div>

      <!-- Aperçu Live Discord -->
      <div style="margin-top: 20px;">
        <label class="form-label" style="margin-bottom: 8px; display: block;">👁️ Aperçu Live du Rappel</label>
        <div style="background: var(--bg-tertiary, #1e1f22); padding: 14px; border-radius: 8px;">
          <!-- Aperçu mode simple -->
          <div v-if="!config.use_embed" style="font-size: 14px; color: var(--text-normal, #dbdee1); line-height: 1.5;">
            {{ liveSimplePreview }}
          </div>

          <!-- Aperçu mode embed -->
          <div v-else>
            <div v-if="liveContentPreview" style="font-size: 13px; color: var(--text-normal, #dbdee1); margin-bottom: 8px;">
              {{ liveContentPreview }}
            </div>
            <DiscordEmbed :embed="liveEmbedPreview" />
          </div>
        </div>
      </div>

      <div class="config-actions-bar" style="margin-top: 24px;">
        <button class="btn-primary" :disabled="isSaving" @click="saveConfig">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Rappels de Bump' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAppState } from '~/composables/useAppState.ts';
import { useConfigFeature } from '~/composables/useConfigFeature.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';
import DiscordRoleSelect from '~/components/ui/DiscordRoleSelect.vue';
import DiscordEmbed from '~/components/common/DiscordEmbed.vue';

definePageMeta({
  title: 'Configuration Rappels de Bump',
  hidden: true
});

useSeoMeta({
  title: 'Rappels de Bump - Configuration',
  description: 'Configuration des salons, rôles et templates de rappel Disboard'
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';
const { discordChannels, roles, guild } = useAppState();

const { config, isLoading, isSaving, load, save } = useConfigFeature('bump_reminder', {
  defaultConfig: {
    enabled: true,
    channel_id: '',
    role_id: '',
    reminder_cooldown_hours: 2,
    mention_here: true,
    use_embed: false,
    message: "{role} c'est l'heure de bumper {server} (Dernier bump par {user})",
    messages: {
      content: '{role}',
      title: "⏰ C'est l'heure du Bump !",
      description: "{role} c'est l'heure de bumper {server} (Dernier bump par {user})",
      color: "#f2c7ce",
      thumbnail: '',
      image: '',
      footer: 'Disboard Auto-Reminder'
    }
  }
});

const targetChannelName = computed(() => {
  const chId = config.value?.channel_id;
  if (!chId) return 'salon-du-bump (auto)';
  const found = discordChannels.value.find(c => c.id === chId);
  return found ? found.name : chId;
});

const targetRoleName = computed(() => {
  const rId = config.value?.role_id;
  if (!rId) return config.value?.mention_here ? '@here' : '@Bump';
  const found = roles.value.find(r => r.id === rId);
  return found ? `@${found.name}` : `@${rId}`;
});

function formatTemplate(text: string) {
  if (!text) return '';
  const hours = config.value?.reminder_cooldown_hours || 2;
  const roleStr = targetRoleName.value;
  const bumper = 'MembreExemple';
  const serverName = guild.value?.name || 'Serveur Discord';
  const chName = targetChannelName.value;
  return text
    .replace(/{hours}/gi, String(hours))
    .replace(/{role}/gi, roleStr)
    .replace(/{mention}/gi, roleStr)
    .replace(/{user}/gi, `@${bumper}`)
    .replace(/{last_user}/gi, `@${bumper}`)
    .replace(/{username}/gi, bumper)
    .replace(/{bumper}/gi, `@${bumper}`)
    .replace(/{command}/gi, '/bump')
    .replace(/{channel}/gi, `#${chName}`)
    .replace(/{server}/gi, serverName);
}

const liveSimplePreview = computed(() => {
  return formatTemplate(config.value?.message || '');
});

const liveContentPreview = computed(() => {
  return formatTemplate(config.value?.messages?.content || '');
});

const liveEmbedPreview = computed(() => {
  const m = config.value?.messages || {};
  return {
    title: formatTemplate(m.title || "⏰ C'est l'heure du Bump !"),
    description: formatTemplate(m.description || "{role} c'est l'heure de bumper {server} !"),
    color: m.color || '#f2c7ce',
    footer: { text: formatTemplate(m.footer || 'Disboard Auto-Reminder') },
    thumbnail: m.thumbnail ? { url: m.thumbnail } : undefined,
    image: m.image ? { url: m.image } : undefined,
    timestamp: new Date().toISOString()
  };
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

.variables-box {
  background: var(--bg-tertiary, #1e1f22);
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
}

.variables-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--header-primary, #ffffff);
  display: block;
  margin-bottom: 6px;
}

.variables-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.badge-variable {
  display: inline-block;
  padding: 3px 8px;
  background: rgba(88, 101, 242, 0.15);
  border: 1px solid rgba(88, 101, 242, 0.3);
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  color: var(--blurple, #5865f2);
  user-select: all;
  cursor: copy;
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
