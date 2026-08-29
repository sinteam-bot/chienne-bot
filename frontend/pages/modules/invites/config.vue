<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div class="config-card">
      <div class="card-subtitle">⚙️ Configuration du Suivi des Invitations</div>
      <p class="config-desc">
        Modifiez la configuration du feature de tracking des invitations. Les changements sont
        sauvegardés en base et prennent effet immédiatement pour les nouveaux événements.
      </p>

      <!-- Section : Activation globale -->
      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">🎟️ Activer le feature Invites</label>
          <span class="config-hint">
            Active le tracking des invitations, la détection de fake et les embeds de log.
            Vous pouvez toujours utiliser les commandes Discord <code>/invite *</code> même si désactivé.
          </span>
        </div>
        <label class="switch">
          <input v-model="config.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="form-divider"></div>

      <!-- Section : Salons de log -->
      <h4 class="section-title">📡 Salons de log</h4>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Salon de log des joins</label>
          <span class="config-hint">
            Salon où seront envoyés les embeds "X a rejoint via Y". Laissez vide pour désactiver.
          </span>
        </div>
        <div style="min-width: 260px;">
          <DiscordChannelSelect
            v-model="config.join_log_channel_id"
            :channel-types="[0, 5]"
            placeholder="Sélectionner un salon…"
          />
        </div>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Salon de log des leaves</label>
          <span class="config-hint">Salon où seront envoyés les embeds "X a quitté".</span>
        </div>
        <div style="min-width: 260px;">
          <DiscordChannelSelect
            v-model="config.leave_log_channel_id"
            :channel-types="[0, 5]"
            placeholder="Sélectionner un salon…"
          />
        </div>
      </div>

      <div class="form-divider"></div>

      <!-- Section : Messages -->
      <h4 class="section-title">💬 Messages personnalisés</h4>

      <div class="form-row">
        <div class="col-full">
          <label class="form-label">Message de join</label>
          <textarea
            v-model="config.join_message"
            class="discord-textarea"
            rows="2"
            placeholder="{member} a rejoint via {inviter}"
          />
          <small class="form-help">
            Variables : <code>{member}</code>, <code>{inviter}</code>, <code>{invite_uses}</code>,
            <code>{member_number}</code>, <code>{guild}</code>
          </small>
        </div>
      </div>

      <div class="form-row">
        <div class="col-full">
          <label class="form-label">Message de leave</label>
          <textarea
            v-model="config.leave_message"
            class="discord-textarea"
            rows="2"
            placeholder="{member} a quitté"
          />
          <small class="form-help">
            Variables : <code>{member}</code>, <code>{inviter}</code>
          </small>
        </div>
      </div>

      <div class="form-row" style="margin-top: 8px;">
        <div class="col-half">
          <label class="form-label">Couleur d'embed (hex)</label>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span
              :style="{
                background: config.embed_color,
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)'
              }"
            ></span>
            <input
              v-model="config.embed_color"
              type="text"
              class="discord-input"
              placeholder="#2F3136"
              style="font-family: var(--font-code);"
            />
          </div>
        </div>
        <div class="col-half">
          <label class="form-label">Afficher l'âge du compte dans l'embed</label>
          <label class="switch" style="margin-top: 6px;">
            <input v-model="config.show_account_age" type="checkbox" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="form-divider"></div>

      <!-- Section : Détection des fake invites -->
      <h4 class="section-title">🛡️ Détection des "Fake Invites"</h4>
      <p class="config-desc">
        Ces règles permettent de flagger les invitations suspectes. Les membres concernés
        sont marqués dans <code>invite_uses.is_fake</code> avec une raison.
      </p>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Compte trop récent (jours)</label>
          <input
            v-model.number="config.fake_account_threshold_days"
            type="number"
            min="0"
            max="365"
            class="discord-input"
          />
          <small class="form-help">
            0 = désactivé. Un compte créé il y a moins de N jours est suspect.
          </small>
        </div>
        <div class="col-half">
          <div class="config-item" style="border: 0; padding: 0;">
            <div class="config-label-group">
              <label class="config-label">Rejeter les comptes sans avatar</label>
              <span class="config-hint">Marque comme fake les comptes sans photo de profil.</span>
            </div>
            <label class="switch" style="margin-top: 6px;">
              <input v-model="config.fake_no_avatar" type="checkbox" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="col-half">
          <div class="config-item" style="border: 0; padding: 0;">
            <div class="config-label-group">
              <label class="config-label">Tracker les bots</label>
              <span class="config-hint">Inclure les bots dans le tracking. Désactivé par défaut.</span>
            </div>
            <label class="switch" style="margin-top: 6px;">
              <input v-model="config.track_bots" type="checkbox" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="form-divider"></div>

      <!-- Section : Leaderboard -->
      <h4 class="section-title">🏆 Leaderboard</h4>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le leaderboard</label>
          <span class="config-hint">
            Affiche le classement des inviters dans le dashboard et via <code>/invite leaderboard</code>.
          </span>
        </div>
        <label class="switch">
          <input
            v-model="config.leaderboard.enabled"
            type="checkbox"
            :disabled="!config.leaderboard"
          />
          <span class="slider"></span>
        </label>
      </div>

      <div class="form-row" v-if="config.leaderboard">
        <div class="col-half">
          <label class="form-label">Taille de page</label>
          <input
            v-model.number="config.leaderboard.page_size"
            type="number"
            min="5"
            max="100"
            class="discord-input"
          />
          <small class="form-help">Nombre d'inviteurs affichés par page (5 à 100).</small>
        </div>
        <div class="col-half">
          <div class="config-item" style="border: 0; padding: 0;">
            <div class="config-label-group">
              <label class="config-label">Afficher les avatars</label>
              <span class="config-hint">Afficher l'avatar Discord de chaque inviteur dans le classement.</span>
            </div>
            <label class="switch" style="margin-top: 6px;">
              <input v-model="config.leaderboard.show_avatars" type="checkbox" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="config-actions-bar" style="margin-top: 24px;">
        <button class="btn-primary" :disabled="isSaving" @click="save">
          {{ isSaving ? '⏳ Enregistrement…' : '💾 Sauvegarder la configuration' }}
        </button>
        <button class="module-btn" :disabled="isSaving || !hasChanges" @click="reset">
          🔄 Réinitialiser
        </button>
        <span v-if="lastSavedAt" class="save-indicator">
          ✅ Sauvegardé <DiscordTime :value="lastSavedAt" mode="relative" />
        </span>
      </div>
    </div>

    <!-- Aide -->
    <div class="config-card">
      <div class="card-subtitle">📖 Variables & équivalences</div>
      <p class="config-desc">
        Les changements sont persistés en base et reflétés immédiatement. Les variables
        dans les messages acceptent les valeurs suivantes :
      </p>
      <div class="help-grid">
        <div><code>{member}</code></div><div>Le membre qui a rejoint/quit (mention)</div>
        <div><code>{inviter}</code></div><div>Le membre qui a invité (mention)</div>
        <div><code>{invite_uses}</code></div><div>Nombre d'utilisations de l'invitation</div>
        <div><code>{member_number}</code></div><div>Rang du membre dans le serveur</div>
        <div><code>{guild}</code></div><div>Nom du serveur</div>
      </div>
      <p class="config-desc" style="margin-top: 14px;">
        Les commandes Discord <code>/invite config</code>, <code>/invite logs</code>,
        <code>/invite fake</code> et <code>/invite blacklist</code> restent disponibles
        pour des ajustements rapides.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useInvites } from '~/composables/useInvites';
import { useToast } from '~/composables/useToast';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';
import DiscordTime from '~/components/common/DiscordTime.vue';

definePageMeta({
  title: 'Configuration des Invites',
  icon: '⚙️',
  description: 'Salons de log, messages, détection des fake invites',
  section: 'modules',
  hidden: true
});

useSeoMeta({
  title: 'Configuration des Invites - Bot',
  description: 'Salons de log, messages, détection des fake invites',
  ogTitle: 'Configuration des Invites - Bot'
});

const invites = useInvites();
const { showToast } = useToast();

const DEFAULTS = {
  enabled: false,
  join_log_channel_id: '',
  leave_log_channel_id: '',
  join_message: ':incoming_envelope: {member} a rejoint le serveur via l\'invitation de **{inviter}** ({invite_uses} utilisation{plural}).',
  leave_message: ':outbox_tray: {member} a quitté le serveur (était invité par **{inviter}**).',
  embed_color: '#2F3136',
  show_account_age: true,
  track_bots: false,
  fake_account_threshold_days: 7,
  fake_no_avatar: true,
  leaderboard: {
    enabled: true,
    page_size: 25,
    show_avatars: true
  }
};

const config = ref<any>(JSON.parse(JSON.stringify(DEFAULTS)));
const originalConfig = ref<any>({});
const loading = ref(false);
const isSaving = ref(false);
const lastSavedAt = ref<number | null>(null);

const hasChanges = computed(() => JSON.stringify(config.value) !== JSON.stringify(originalConfig.value));

async function load() {
  loading.value = true;
  try {
    const guildId = await invites.getGuildId();
    if (!guildId) {
      showToast({ type: 'error', message: 'Aucun serveur détecté' });
      return;
    }
    const cfg = await invites.getConfig(guildId);
    // Merge avec les defaults pour garantir que tous les champs existent
    config.value = deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), cfg || {});
    originalConfig.value = JSON.parse(JSON.stringify(config.value));
  } catch (e: any) {
    showToast({ type: 'error', message: 'Erreur chargement: ' + e.message });
  } finally {
    loading.value = false;
  }
}

function deepMerge(target: any, source: any): any {
  if (source == null) return target;
  if (typeof source !== 'object' || Array.isArray(source)) return source;
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null
    ) {
      target[key] = deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

function reset() {
  config.value = JSON.parse(JSON.stringify(originalConfig.value));
}

async function save() {
  isSaving.value = true;
  try {
    const guildId = await invites.getGuildId();
    if (!guildId) {
      showToast({ type: 'error', message: 'Aucun serveur détecté' });
      return;
    }

    // Préparer le payload : envoyer la config complète + le flag enabled
    // (l'API PATCH /api/features/:name accepte un patch partiel mais on
    // envoie tout pour rester simple).
    const payload = {
      enabled: config.value.enabled,
      config: {
        join_log_channel_id: config.value.join_log_channel_id || null,
        leave_log_channel_id: config.value.leave_log_channel_id || null,
        join_message: config.value.join_message,
        leave_message: config.value.leave_message,
        embed_color: config.value.embed_color,
        show_account_age: config.value.show_account_age,
        track_bots: config.value.track_bots,
        fake_account_threshold_days: config.value.fake_account_threshold_days,
        fake_no_avatar: config.value.fake_no_avatar,
        leaderboard: {
          enabled: config.value.leaderboard.enabled,
          page_size: config.value.leaderboard.page_size,
          show_avatars: config.value.leaderboard.show_avatars
        }
      }
    };

    await invites.updateConfig(guildId, payload);

    // Recharger pour synchroniser l'état "original"
    await load();
    lastSavedAt.value = Date.now();
    showToast({ type: 'success', message: '✅ Configuration sauvegardée avec succès !' });
  } catch (e: any) {
    showToast({ type: 'error', message: 'Erreur sauvegarde: ' + e.message });
  } finally {
    isSaving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.section-title {
  color: var(--header-primary);
  margin: 4px 0 8px;
  font-size: 15px;
  font-weight: 700;
}

.col-full { width: 100%; }
.col-half { flex: 1; }

.form-divider {
  background-color: var(--border-subtle);
  height: 1px;
  margin: 8px 0;
}

.config-actions-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.save-indicator {
  color: var(--green, #23a55a);
  font-size: 12px;
  margin-left: auto;
}

.help-grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 8px 16px;
  font-size: 12px;
  color: var(--text-muted);
}
.help-grid code {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: var(--font-code);
  color: var(--text-normal);
}
</style>
