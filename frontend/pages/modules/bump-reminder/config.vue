<template>
  <div class="config-grid">
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
          <input v-model="configForm.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Salon d'envoi du rappel</label>
          <span class="config-hint">Sélectionnez le salon où poster le rappel (laissez vide pour utiliser le salon du bump).</span>
        </div>
        <div style="min-width: 260px;">
          <DiscordChannelSelect v-model="configForm.channel_id" placeholder="Salon par défaut (salon du bump)" />
        </div>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Rôle à notifier</label>
          <span class="config-hint">Rôle pingé avec le rappel (ex: @Bumpers, @Membres). Si vide, @here sera utilisé.</span>
        </div>
        <div style="min-width: 260px;">
          <DiscordRoleSelect v-model="configForm.role_id" placeholder="Aucun rôle (@here par défaut)" />
        </div>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Délai d'attente (Cooldown)</label>
          <span class="config-hint">Nombre d'heures entre deux bumps (Disboard utilise 2 heures).</span>
        </div>
        <input
          v-model.number="configForm.reminder_cooldown_hours"
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
          <input v-model="configForm.mention_here" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Personnalisation du Message / Embed Discord -->
    <div class="config-card">
      <div class="card-subtitle">💬 Format & Personnalisation du Message de Rappel</div>
      <p class="config-desc">
        Choisissez entre un message texte simple et direct (recommandé) ou un embed Discord riche.
      </p>

      <!-- Type de message : Simple ou Embed -->
      <div class="config-item" style="margin-bottom: 20px;">
        <div class="config-label-group">
          <label class="config-label">Utiliser un Embed Discord</label>
          <span class="config-hint">Si désactivé, le bot enverra un message texte simple et fluide.</span>
        </div>
        <label class="switch">
          <input v-model="configForm.use_embed" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <!-- Variables dynamiques disponibles -->
      <div style="background: var(--bg-tertiary); padding: 12px 14px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--border-subtle);">
        <span style="font-size: 12px; font-weight: 700; color: var(--header-primary); display: block; margin-bottom: 6px;">
          💡 Variables dynamiques disponibles :
        </span>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
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
      <div v-if="!configForm.use_embed" class="form-group" style="margin-bottom: 16px;">
        <label class="form-label">Message de rappel (Texte simple)</label>
        <textarea
          v-model="configForm.message"
          class="discord-input"
          rows="3"
          placeholder="{role} c'est l'heure de bumper {server} <:Obsydemoncouverture:1488145689916473544> (Dernier bump par {user})"
        ></textarea>
      </div>

      <!-- 2. CAS EMBED RICHE -->
      <div v-else>
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label">Message texte brut (au-dessus de l'embed)</label>
          <input
            v-model="configForm.messages.content"
            type="text"
            class="discord-input"
            placeholder="{role}"
          />
        </div>

        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label">Titre de l'embed</label>
          <input
            v-model="configForm.messages.title"
            type="text"
            class="discord-input"
            placeholder="⏰ C'est l'heure du Bump !"
          />
        </div>

        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label">Description de l'embed</label>
          <textarea
            v-model="configForm.messages.description"
            class="discord-input"
            rows="4"
            placeholder="{role} c'est l'heure de bumper {server} <:Obsydemoncouverture:1488145689916473544> !\n(Dernier bump par {user})"
          ></textarea>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div class="form-group">
            <label class="form-label">Couleur de l'Embed</label>
            <div style="display: flex; align-items: center; gap: 10px;">
              <input
                v-model="configForm.messages.color"
                type="color"
                style="width: 40px; height: 36px; border: none; border-radius: 4px; cursor: pointer; background: transparent;"
              />
              <input
                v-model="configForm.messages.color"
                type="text"
                class="discord-input"
                style="width: 120px; font-family: var(--font-code);"
                placeholder="#f2c7ce"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Pied de page (Footer)</label>
            <input
              v-model="configForm.messages.footer"
              type="text"
              class="discord-input"
              placeholder="Disboard Auto-Reminder"
            />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div class="form-group">
            <label class="form-label">URL Vignette (Thumbnail)</label>
            <input
              v-model="configForm.messages.thumbnail"
              type="text"
              class="discord-input"
              placeholder="https://... (optionnel)"
            />
          </div>

          <div class="form-group">
            <label class="form-label">URL Image Bannière</label>
            <input
              v-model="configForm.messages.image"
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
        <div style="background: var(--bg-tertiary); padding: 14px; border-radius: 8px;">
          <!-- Aperçu mode simple -->
          <div v-if="!configForm.use_embed" style="font-size: 14px; color: var(--text-normal); line-height: 1.5;">
            {{ liveSimplePreview }}
          </div>

          <!-- Aperçu mode embed -->
          <div v-else>
            <div v-if="liveContentPreview" style="font-size: 13px; color: var(--text-normal); margin-bottom: 8px;">
              {{ liveContentPreview }}
            </div>
            <DiscordEmbed :embed="liveEmbedPreview" />
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
        <button class="action-btn" :disabled="saving" @click="loadConfig">
          Annuler
        </button>
        <button
          class="action-btn"
          :disabled="saving"
          style="background: var(--brand-experiment, #5865f2); color: white; border: none;"
          @click="saveConfig"
        >
          <span v-if="saving" class="spinner" style="width: 14px; height: 14px; margin-right: 6px;"></span>
          💾 Enregistrer la Configuration
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, type Ref } from 'vue';
import { useAppState } from '~/composables/useAppState.ts';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';
import DiscordRoleSelect from '~/components/ui/DiscordRoleSelect.vue';
import DiscordEmbed from '~/components/common/DiscordEmbed.vue';

definePageMeta({
  title: 'Configuration',
  icon: '⚙️',
  description: 'Configuration des salons, rôles et templates de rappel Disboard',
  section: 'modules',
  hidden: true
});

useSeoMeta({
  title: 'Configuration - Rappels de Bump',
  description: 'Configuration des salons, rôles et templates de rappel Disboard',
  ogTitle: 'Configuration - Rappels de Bump',
  ogDescription: 'Configuration des salons, rôles et templates de rappel Disboard'
});

const { discordChannels, roles } = useAppState();
const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const bumpStatus = inject<Ref<any>>('bumpStatus', ref({}));
const loadBumpStatus = inject<() => Promise<void>>('loadBumpStatus', async () => {});

const saving = ref(false);

const configForm = ref<any>({
  enabled: true,
  channel_id: '',
  role_id: '',
  reminder_cooldown_hours: 2,
  mention_here: true,
  use_embed: false,
  message: "{role} c'est l'heure de bumper {server} <:Obsydemoncouverture:1488145689916473544> (Dernier bump par {user})",
  messages: {
    content: '{role}',
    title: "⏰ C'est l'heure du Bump !",
    description: "{role} c'est l'heure de bumper {server} <:Obsydemoncouverture:1488145689916473544> !\n(Dernier bump par {user})",
    color: "#f2c7ce",
    thumbnail: '',
    image: '',
    footer: 'Disboard Auto-Reminder'
  }
});

const targetChannelName = computed(() => {
  const chId = configForm.value.channel_id || bumpStatus.value.lastBump?.channelId;
  if (!chId) return 'salon-du-bump (auto)';
  const found = discordChannels.value.find(c => c.id === chId);
  return found ? found.name : chId;
});

const targetRoleName = computed(() => {
  const rId = configForm.value.role_id;
  if (!rId) return '@Bump';
  const found = roles.value.find(r => r.id === rId);
  return found ? `@${found.name}` : `@${rId}`;
});

function formatTemplate(text: string) {
  if (!text) return '';
  const hours = configForm.value.reminder_cooldown_hours || 2;
  const roleStr = targetRoleName.value;
  const bumper = bumpStatus.value.lastBump?.bumperUsername || 'SuperBumper';
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
    .replace(/{server}/gi, 'Obsydian');
}

const liveSimplePreview = computed(() => {
  return formatTemplate(configForm.value.message);
});

const liveContentPreview = computed(() => {
  return formatTemplate(configForm.value.messages?.content || '');
});

const liveEmbedPreview = computed(() => {
  const m = configForm.value.messages || {};
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

async function loadConfig() {
  await loadBumpStatus();
  if (bumpStatus.value.config) {
    configForm.value = {
      ...configForm.value,
      ...bumpStatus.value.config,
      messages: {
        ...configForm.value.messages,
        ...(bumpStatus.value.config.messages || {})
      }
    };
  }
}

async function saveConfig() {
  saving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/bump/config', {
      method: 'POST',
      body: configForm.value
    });

    if (res.success) {
      showToast(res.message || 'Configuration sauvegardée !', 'success');
      await loadBumpStatus();
    } else {
      showToast('Erreur de sauvegarde', 'error');
    }
  } catch (err: any) {
    showToast('Erreur: ' + err.message, 'error');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.badge-variable {
  display: inline-block;
  padding: 3px 8px;
  background: var(--bg-modifier-hover, rgba(255, 255, 255, 0.07));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
  border-radius: 4px;
  font-family: var(--font-code, monospace);
  font-size: 11px;
  color: var(--brand-experiment, #5865f2);
  user-select: all;
  cursor: copy;
  transition: all 0.2s ease;
}
.badge-variable:hover {
  background: var(--brand-experiment, #5865f2);
  color: #fff;
}
</style>
