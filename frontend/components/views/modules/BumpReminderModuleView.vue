<template>
  <div class="view-panel">
    <!-- Onglets de sous-navigation Module -->
    <div class="captcha-subtabs" style="padding: 12px 24px 0 24px; background-color: var(--bg-secondary);">
      <button
        :class="['captcha-subtab-btn', { active: activeSubTab === 'countdown' }]"
        @click="activeSubTab = 'countdown'"
      >
        🚀 Décompte & Historique
      </button>
      <button
        :class="['captcha-subtab-btn', { active: activeSubTab === 'config' }]"
        @click="activeSubTab = 'config'"
      >
        ⚙️ Configuration du Module
      </button>
    </div>

    <!-- SOUS-ONGLET 1 : STATUT & DÉCOMPTE -->
    <div v-if="activeSubTab === 'countdown'" class="captcha-view-scroller">
      <!-- Bannière Stats & État -->
      <div class="captcha-stats-banner">
        <div class="captcha-stat-card">
          <div class="captcha-stat-icon">⏰</div>
          <div class="captcha-stat-info">
            <span class="captcha-stat-label">Statut du Bump</span>
            <span v-if="bumpStatus.isReady" class="captcha-stat-value" style="color: var(--green); font-weight: 800;">
              🚀 PRÊT À BUMPER !
            </span>
            <span v-else class="captcha-stat-value" style="color: var(--brand-experiment, #5865f2); font-family: var(--font-code);">
              {{ formattedRemaining }}
            </span>
            <span class="captcha-stat-sub">
              {{ bumpStatus.isReady ? 'Disponible immédiatement' : 'Temps restant avant rappel' }}
            </span>
          </div>
        </div>

        <div class="captcha-stat-card">
          <div class="captcha-stat-icon">👤</div>
          <div class="captcha-stat-info">
            <span class="captcha-stat-label">Dernier Bumper</span>
            <span class="captcha-stat-value" style="font-size: 16px; font-weight: 700; color: var(--header-primary);">
              {{ bumpStatus.lastBump?.bumperUsername || 'Aucun' }}
            </span>
            <span class="captcha-stat-sub">
              {{ bumpStatus.lastBump?.bumpedAt ? formatDate(bumpStatus.lastBump.bumpedAt) : 'En attente du 1er bump' }}
            </span>
          </div>
        </div>

        <div class="captcha-stat-card">
          <div class="captcha-stat-icon">📢</div>
          <div class="captcha-stat-info">
            <span class="captcha-stat-label">Salon de Rappel</span>
            <span class="captcha-stat-value" style="font-size: 15px; font-weight: 600; color: var(--header-primary);">
              #{{ targetChannelName }}
            </span>
            <span class="captcha-stat-sub">
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

        <div v-else class="captcha-table-wrapper">
          <table class="captcha-table">
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
                  <span v-if="item.reminder_sent === 1 || item.reminderSent === 1" class="captcha-status-pill verified">
                    🟢 Rappel Envoyé
                  </span>
                  <span v-else class="captcha-status-pill pending">
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
    <div v-else-if="activeSubTab === 'config'" class="captcha-view-scroller">
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
            <label class="discord-switch">
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
            <label class="discord-switch">
              <input v-model="configForm.mention_here" type="checkbox" />
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <!-- Personnalisation de l'Embed Discord -->
        <div class="config-card">
          <div class="card-subtitle">🎨 Personnalisation de l'Embed Discord</div>
          <p class="config-desc">
            Personnalisez le titre, le texte et la couleur de l'embed envoyé aux membres.
          </p>

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
            <label class="form-label">Description / Message</label>
            <textarea
              v-model="configForm.messages.description"
              class="discord-input"
              rows="4"
              placeholder="Tapez </bump:947088344167366698> pour faire monter le serveur sur Disboard 🚀"
            ></textarea>
          </div>

          <div class="form-group" style="margin-bottom: 16px;">
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

          <!-- Aperçu Live Embed Discord -->
          <div style="margin-top: 20px;">
            <label class="form-label" style="margin-bottom: 8px; display: block;">👁️ Aperçu Live du Rappel</label>
            <div style="background: var(--bg-tertiary); padding: 14px; border-radius: 8px;">
              <div style="font-size: 13px; color: var(--text-normal); margin-bottom: 8px;">
                🔔 <span class="discord-mention" :style="{ backgroundColor: configForm.role_id ? 'rgba(88, 101, 242, 0.2)' : 'rgba(250, 166, 26, 0.15)', color: configForm.role_id ? '#c9cdfb' : '#faa61a' }">
                  {{ configForm.role_id ? targetRoleName : '@here' }}
                </span>
              </div>

              <DiscordEmbed :embed="liveEmbedPreview" />
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
  messages: {
    title: "⏰ C'est l'heure du Bump !",
    description: "2 heures se sont écoulées depuis le dernier bump !\n\nTapez </bump:947088344167366698> pour faire monter le serveur sur Disboard 🚀",
    color: "#f2c7ce"
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
  if (!rId) return '@here';
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

const liveEmbedPreview = computed(() => {
  return {
    title: configForm.value.messages?.title || "⏰ C'est l'heure du Bump !",
    description: configForm.value.messages?.description || "2 heures se sont écoulées depuis le dernier bump !\n\nTapez </bump:947088344167366698> pour faire monter le serveur sur Disboard 🚀",
    color: configForm.value.messages?.color || '#f2c7ce',
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
