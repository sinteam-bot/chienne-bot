<template>
  <div class="view-panel">
    <!-- Onglets de sous-navigation Module -->
    <div class="module-subtabs">
      <button
        :class="['module-subtab-btn', { active: activeSubTab === 'countdown' }]"
        @click="activeSubTab = 'countdown'"
      >
        🚀 Décompte & Historique
      </button>
      <button
        :class="['module-subtab-btn', { active: activeSubTab === 'config' }]"
        @click="activeSubTab = 'config'"
      >
        ⚙️ Configuration du Module
      </button>
    </div>


    <!-- SOUS-ONGLET 1 : STATUT & DÉCOMPTE -->
    <div v-if="activeSubTab === 'countdown'" class="module-view-scroller">
      <!-- Bannière Stats & État -->
      <div class="module-stats-banner">
        <div class="module-stat-card">
          <div class="module-stat-icon">⏰</div>
          <div class="module-stat-info">
            <span class="module-stat-label">Statut du Bump</span>
            <span v-if="bumpStatus.isReady" class="module-stat-value" style="color: var(--green); font-weight: 800;">
              🚀 PRÊT À BUMPER !
            </span>
            <span v-else class="module-stat-value" style="color: var(--brand-experiment, #5865f2); font-family: var(--font-code);">
              {{ formattedRemaining }}
            </span>
            <span class="module-stat-sub">
              {{ bumpStatus.isReady ? 'Disponible immédiatement' : 'Temps restant avant rappel' }}
            </span>
          </div>
        </div>

        <div class="module-stat-card">
          <div class="module-stat-icon">👤</div>
          <div class="module-stat-info">
            <span class="module-stat-label">Dernier Bumper</span>
            <span class="module-stat-value" style="font-size: 16px; font-weight: 700; color: var(--header-primary);">
              {{ bumpStatus.lastBump?.bumperUsername || 'Aucun' }}
            </span>
            <span class="module-stat-sub">
              {{ bumpStatus.lastBump?.bumpedAt ? formatDate(bumpStatus.lastBump.bumpedAt) : 'En attente du 1er bump' }}
            </span>
          </div>
        </div>

        <div class="module-stat-card">
          <div class="module-stat-icon">📢</div>
          <div class="module-stat-info">
            <span class="module-stat-label">Salon de Rappel</span>
            <span class="module-stat-value" style="font-size: 15px; font-weight: 600; color: var(--header-primary);">
              #{{ targetChannelName }}
            </span>
            <span class="module-stat-sub">
              {{ targetRoleName }}
            </span>
          </div>
        </div>
      </div>

      <!-- Widget Live Countdown & Progression -->
      <div class="config-card" style="margin-bottom: 20px; border-left: 4px solid var(--brand);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
          <div>
            <div class="card-subtitle" style="display: flex; align-items: center; gap: 8px; margin: 0;">
              <span>⚡</span>
              <span>Décompte Disboard en Temps Réel</span>
            </div>
            <p class="config-desc" style="margin: 4px 0 0 0;">
              Disboard autorise 1 bump toutes les {{ configForm.reminder_cooldown_hours || 2 }} heures. Le bot mentionnera le rôle configuré dès l'expiration du délai.
            </p>
          </div>

          <div style="display: flex; gap: 10px; align-items: center;">
            <button
              class="action-btn"
              :disabled="sendingTest"
              style="background: var(--brand-experiment, #5865f2); color: white; border: none;"
              @click="handleTestReminder"
            >
              <span v-if="sendingTest" class="spinner" style="width: 14px; height: 14px; margin-right: 6px;"></span>
              🔔 Tester le Rappel Discord
            </button>

            <button class="action-btn" :disabled="loading" @click="loadBumpStatus">
              🔄 Rafraîchir
            </button>
          </div>
        </div>

        <!-- Barre de progression -->
        <div style="background: var(--bg-tertiary); border-radius: 8px; height: 14px; overflow: hidden; position: relative; margin-top: 14px;">
          <div
            :style="{
              width: `${progressPercent}%`,
              background: bumpStatus.isReady ? 'linear-gradient(90deg, #43b581, #2ecc71)' : 'linear-gradient(90deg, #5865f2, #eb459e)',
              height: '100%',
              transition: 'width 0.5s ease'
            }"
          ></div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 12px; color: var(--text-muted);">
          <span>Dernier bump : {{ bumpStatus.lastBump?.bumpedAt ? formatDate(bumpStatus.lastBump.bumpedAt) : '—' }}</span>
          <span><strong>{{ progressPercent }}%</strong> écoulé</span>
          <span>Prochain rappel : {{ nextReminderTime }}</span>
        </div>
      </div>

      <!-- Historique des bumps -->
      <div class="config-card">
        <div class="card-subtitle" style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
          <span>📜</span>
          <span>Historique des Bumps Récents</span>
        </div>

        <div v-if="loading" style="display: flex; justify-content: center; padding: 40px;">
          <div class="spinner" style="width: 32px; height: 32px;"></div>
        </div>

        <div v-else-if="!bumpStatus.history || bumpStatus.history.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
          Aucun bump enregistré pour l'instant dans la base de données.
        </div>

        <div v-else class="module-table-wrapper">
          <table class="module-table">
            <thead>
              <tr>
                <th style="width: 10%;">ID</th>
                <th style="width: 25%;">Membre (Bumper)</th>
                <th style="width: 25%;">Salon</th>
                <th style="width: 20%;">Date du Bump</th>
                <th style="width: 20%;">Statut Rappel</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in bumpStatus.history" :key="item.id">
                <td style="font-family: var(--font-code); color: var(--text-muted);">#{{ item.id }}</td>
                <td>
                  <strong style="color: var(--header-primary);">{{ item.bumper_username || item.username || 'Inconnu' }}</strong>
                  <div v-if="item.bumper_id" style="font-size: 11px; color: var(--text-muted); font-family: var(--font-code);">ID: {{ item.bumper_id }}</div>
                </td>
                <td>
                  <span class="discord-mention discord-mention-channel">#{{ resolveChannelName(item.channel_id) }}</span>
                </td>
                <td style="font-size: 13px; color: var(--text-normal);">
                  {{ formatDate(item.bumped_at || item.bumpedAt) }}
                </td>
                <td>
                  <span v-if="item.reminder_sent === 1 || item.reminderSent === 1" class="module-status-pill verified">
                    🟢 Rappel Envoyé
                  </span>
                  <span v-else class="module-status-pill pending">
                    ⏳ En Attente
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- SOUS-ONGLET 2 : CONFIGURATION DU MODULE -->
    <div v-else-if="activeSubTab === 'config'" class="module-view-scroller">
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
              <span class="config-hint">Rôle pingé avec l'embed (ex: @Bumpers, @Membres). Si vide, @here sera utilisé.</span>
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
          <div style="background: var(--bg-tertiary); padding: 12px 14px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--card-border);">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAppState } from '~/composables/useAppState.ts';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';
import DiscordRoleSelect from '~/components/ui/DiscordRoleSelect.vue';
import DiscordEmbed from '~/components/common/DiscordEmbed.vue';

const { discordChannels, roles } = useAppState();
const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const activeSubTab = ref<'countdown' | 'config'>('countdown');
const loading = ref(false);
const saving = ref(false);
const sendingTest = ref(false);

const bumpStatus = ref<any>({
  enabled: true,
  hasBump: false,
  isReady: false,
  remainingSeconds: 0,
  targetTimestamp: 0,
  lastBump: null,
  history: []
});

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

let timerInterval: any = null;

const remainingSeconds = ref(0);

const formattedRemaining = computed(() => {
  if (remainingSeconds.value <= 0) return '00:00:00';
  const h = Math.floor(remainingSeconds.value / 3600);
  const m = Math.floor((remainingSeconds.value % 3600) / 60);
  const s = remainingSeconds.value % 60;

  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  }
  return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
});

const progressPercent = computed(() => {
  const total = (configForm.value.reminder_cooldown_hours || 2) * 3600;
  if (total <= 0) return 100;
  const elapsed = Math.max(0, total - remainingSeconds.value);
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
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

const nextReminderTime = computed(() => {
  if (bumpStatus.value.isReady) return 'Maintenant';
  if (!bumpStatus.value.lastBump?.bumpedAt) return '—';
  try {
    const d = new Date(new Date(bumpStatus.value.lastBump.bumpedAt).getTime() + (configForm.value.reminder_cooldown_hours || 2) * 3600 * 1000);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '—';
  }
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
  const msg = configForm.value.message || "{role} c'est l'heure de bumper {server} <:Obsydemoncouverture:1488145689916473544> (Dernier bump par {user})";
  return formatTemplate(msg);
});

const liveContentPreview = computed(() => {
  const raw = configForm.value.messages?.content;
  if (raw === undefined || raw === null || raw.trim() === '') {
    return '';
  }
  return formatTemplate(raw);
});

const liveEmbedPreview = computed(() => {
  const defTitle = "⏰ C'est l'heure du Bump !";
  const defDesc = "{role} c'est l'heure de bumper {server} <:Obsydemoncouverture:1488145689916473544> !\n(Dernier bump par {user})";

  const t = configForm.value.messages?.title || defTitle;
  const d = configForm.value.messages?.description || defDesc;
  const f = configForm.value.messages?.footer;

  return {
    title: formatTemplate(t),
    description: formatTemplate(d),
    color: configForm.value.messages?.color || '#f2c7ce',
    thumbnail: configForm.value.messages?.thumbnail || undefined,
    image: configForm.value.messages?.image || undefined,
    footer: f ? { text: formatTemplate(f) } : undefined,
    timestamp: new Date().toISOString()
  };
});

function resolveChannelName(channelId: string) {
  if (!channelId) return 'inconnu';
  const found = discordChannels.value.find(c => c.id === channelId);
  return found ? found.name : channelId;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

async function loadBumpStatus() {
  loading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/bump');
    if (res.success && res.data) {
      bumpStatus.value = res.data;
      remainingSeconds.value = res.data.remainingSeconds || 0;

      if (res.data.config) {
        configForm.value = {
          ...configForm.value,
          ...res.data.config,
          messages: {
            ...configForm.value.messages,
            ...(res.data.config.messages || {})
          }
        };
      }
    }
  } catch (err: any) {
    showToast('Erreur chargement bump: ' + err.message, 'error');
  } finally {
    loading.value = false;
  }
}

async function loadConfig() {
  await loadBumpStatus();
  showToast('Données rafraîchies', 'info');
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

async function handleTestReminder() {
  sendingTest.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/bump/test-reminder', {
      method: 'POST'
    });

    if (res.success) {
      showToast('🔔 Rappel envoyé avec succès sur Discord !', 'success');
    } else {
      showToast('Erreur envoi rappel: ' + (res as any).error, 'error');
    }
  } catch (err: any) {
    showToast('Erreur: ' + err.message, 'error');
  } finally {
    sendingTest.value = false;
  }
}

onMounted(() => {
  loadBumpStatus();
  timerInterval = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
      if (remainingSeconds.value === 0) {
        bumpStatus.value.isReady = true;
      }
    }
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
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
