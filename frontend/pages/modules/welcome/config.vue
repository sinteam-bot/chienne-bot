<template>
  <div style="display: flex; flex-direction: column; gap: 24px;">
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
          <input v-model="config.welcome_message.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="form-divider"></div>

      <div class="form-row">
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
          <div class="color-picker-row">
            <input v-model="config.welcome_color" type="color" />
            <input v-model="config.welcome_color" type="text" class="discord-input" style="font-family: var(--font-code);" />
          </div>
        </div>
      </div>

      <div style="margin-top: 16px;">
        <label class="form-label">Titre de l'Embed ({server}, {user}, {memberCount})</label>
        <input v-model="config.welcome_message.title" type="text" class="discord-input" placeholder="🎉 Bienvenue sur {server} !" />
      </div>

      <div style="margin-top: 16px;">
        <label class="form-label">Description du message ({user}, {username}, {server}, {memberCount})</label>
        <textarea v-model="config.welcome_message.description" class="discord-textarea" rows="3"></textarea>
      </div>

      <div class="form-row" style="margin-top: 16px;">
        <div class="col-half">
          <label class="form-label">Texte de Pied de Page (Footer)</label>
          <input v-model="config.welcome_message.footer" type="text" class="discord-input" placeholder="Membre #{memberCount}" />
        </div>
        <div class="col-half">
          <label class="form-label">Modèle de Carte Graphique SVG</label>
          <select v-model="config.card.template" class="discord-input discord-select">
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
        <div class="role-add-row" style="display: flex; gap: 12px; align-items: center; margin-bottom: 14px;">
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
          <input v-model="config.dm_message.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div v-if="config.dm_message.enabled" style="margin-top: 16px;">
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
          <input v-model="config.milestones.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div v-if="config.milestones.enabled" style="margin-top: 14px;">
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

      <div class="form-divider" style="margin: 20px 0;"></div>

      <!-- Leave -->
      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Message / Carte de Départ (Leave)</label>
          <span class="config-hint">Envoie une notification discrète ou une carte de départ lorsqu'un membre quitte le serveur.</span>
        </div>
        <label class="switch">
          <input v-model="config.leave.enabled" type="checkbox" />
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
import { useDiscordApi } from '~/composables/useDiscordApi';
import { useToast } from '~/composables/useToast';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';
import DiscordRoleSelect from '~/components/ui/DiscordRoleSelect.vue';
import DiscordRole from '~/components/common/DiscordRole.vue';

definePageMeta({
  title: 'Configuration',
  icon: '⚙️',
  description: 'Configuration avancée de la bienvenue, rôles automatiques, messages DM et paliers',
  section: 'modules',
  hidden: true
});

useSeoMeta({
  title: 'Configuration - Bienvenue',
  description: 'Configuration avancée de la bienvenue, rôles automatiques, messages DM et paliers',
  ogTitle: 'Configuration - Bienvenue',
  ogDescription: 'Configuration avancée de la bienvenue, rôles automatiques, messages DM et paliers'
});

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const isSaving = ref(false);
const newRoleToAdd = ref<string>('');

const config = ref<any>({
  enabled: true,
  channel_id: null,
  welcome_color: '#f2c7ce',
  AUTO_ROLES: [] as string[],
  welcome_message: {
    enabled: true,
    title: '🎉 Bienvenue sur {server} !',
    description: 'Bienvenue {user} !\n\nNous sommes ravis de t\'accueillir parmi nous ! 🎊',
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
  config.value.milestones.thresholds = val
    .split(',')
    .map((s: string) => parseInt(s.trim(), 10))
    .filter((n: number) => !isNaN(n) && n > 0);
}

async function loadConfig() {
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/config');
    if (res.success && res.data?.welcome) {
      const w = res.data.welcome;
      config.value = {
        enabled: w.enabled ?? true,
        channel_id: w.channel_id || null,
        welcome_color: w.welcome_color || '#f2c7ce',
        AUTO_ROLES: Array.isArray(w.AUTO_ROLES) ? w.AUTO_ROLES : [],
        welcome_message: {
          enabled: w.welcome_message?.enabled ?? true,
          title: w.welcome_message?.title || '🎉 Bienvenue sur {server} !',
          description: w.welcome_message?.description || 'Bienvenue {user} !\n\nNous sommes ravis de t\'accueillir parmi nous ! 🎊',
          color: w.welcome_message?.color || '#f2c7ce',
          footer: w.welcome_message?.footer || 'Membre #{memberCount}',
          thumbnail: w.welcome_message?.thumbnail || 'user',
          image: w.welcome_message?.image || null
        },
        dm_message: {
          enabled: w.dm_message?.enabled ?? true,
          title: w.dm_message?.title || '👋 Bienvenue !',
          description: w.dm_message?.description || 'Salut {username} !\n\nBienvenue sur **{server}** !',
          color: w.dm_message?.color || '#f2c7ce'
        },
        card: {
          template: w.card?.template || 'welcome'
        },
        milestones: {
          enabled: w.milestones?.enabled ?? false,
          channel_id: w.milestones?.channel_id || null,
          thresholds: w.milestones?.thresholds || [10, 50, 100, 500, 1000, 5000],
          template: w.milestones?.template || '🎯 Le serveur passe à {count} membres !'
        },
        leave: {
          enabled: w.leave?.enabled ?? false,
          template: w.leave?.template || 'leave'
        }
      };
    }
  } catch (err) {
    console.error('Erreur chargement config welcome:', err);
  }
}

async function saveModuleConfig() {
  isSaving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/config', {
      method: 'POST',
      body: {
        module: 'welcome',
        config: config.value
      }
    });
    if (res.success) {
      showToast('Configuration Bienvenue enregistrée avec succès !', 'success');
    } else {
      showToast('Erreur lors de l\'enregistrement', 'error');
    }
  } catch (err: any) {
    showToast('Erreur: ' + err.message, 'error');
  } finally {
    isSaving.value = false;
  }
}

onMounted(loadConfig);
</script>

<style scoped>
.config-card {
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-radius: 8px;
  padding: 20px 24px;
}

.card-subtitle {
  font-size: 18px;
  font-weight: 600;
  color: #f2f3f5;
  margin-bottom: 6px;
}

.config-desc {
  color: #b5bac1;
  font-size: 13px;
  margin-bottom: 18px;
  line-height: 1.4;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.config-label {
  font-weight: 500;
  color: #f2f3f5;
  font-size: 14px;
  display: block;
}

.config-hint {
  font-size: 12px;
  color: #80848e;
}

.form-divider {
  height: 1px;
  background: #3f4147;
  margin: 16px 0;
}

.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.col-half {
  flex: 1;
  min-width: 280px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #b5bac1;
  margin-bottom: 6px;
}

.discord-input,
.discord-textarea,
.discord-select {
  width: 100%;
  background: #1e1f22;
  border: 1px solid #3f4147;
  color: #f2f3f5;
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}

.discord-input:focus,
.discord-textarea:focus,
.discord-select:focus {
  border-color: #5865f2;
}

.discord-textarea {
  resize: vertical;
}

.color-picker-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-picker-row input[type="color"] {
  width: 42px;
  height: 38px;
  border: 1px solid #3f4147;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  padding: 2px;
}

.roles-chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  background: #1e1f22;
  padding: 12px;
  border-radius: 6px;
}

.role-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #2b2d31;
  border: 1px solid #3f4147;
  padding: 4px 8px;
  border-radius: 4px;
}

.btn-remove-role {
  background: transparent;
  border: none;
  color: #ed4245;
  cursor: pointer;
  font-size: 12px;
  padding: 0 4px;
  font-weight: bold;
}

.btn-remove-role:hover {
  color: #ff7b7d;
}

.empty-roles-hint {
  font-size: 12px;
  color: #80848e;
  font-style: italic;
  padding: 10px;
  background: #1e1f22;
  border-radius: 4px;
}

.config-actions-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.btn-primary {
  background: #5865f2;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #4752c4;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Switch styling */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.switch input { opacity: 0; width: 0; height: 0; }

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #4e5058;
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
  background-color: #57f287;
}

input:checked + .slider:before {
  transform: translateX(20px);
}
</style>
