<template>
  <div class="view-panel">
    <!-- Onglets de sous-navigation Module -->
    <div class="module-subtabs">
      <button
        :class="['module-subtab-btn', { active: activeSubTab === 'stats' }]"
        @click="activeSubTab = 'stats'"
      >
        📊 Statistiques, Salons & Vérifications
      </button>
      <button
        :class="['module-subtab-btn', { active: activeSubTab === 'config' }]"
        @click="activeSubTab = 'config'"
      >
        ⚙️ Configuration du Module
      </button>
    </div>


    <!-- SOUS-ONGLET 1 : STATS & LOGS DES SALONS CAPTCHA -->
    <div v-if="activeSubTab === 'stats'" class="module-view-scroller">
      <!-- Bannière Stats -->
      <div class="module-stats-banner">
        <div class="module-stat-card">
          <div class="module-stat-icon">🔒</div>
          <div class="module-stat-info">
            <span class="module-stat-label">Total Captchas</span>
            <span class="module-stat-value">{{ logs.length }}</span>
            <span class="module-stat-sub">Vérifications générées</span>
          </div>
        </div>

        <div class="module-stat-card">
          <div class="module-stat-icon">✅</div>
          <div class="module-stat-info">
            <span class="module-stat-label">Taux de Succès</span>
            <span class="module-stat-value" style="color: var(--green);">{{ successRate }}%</span>
            <span class="module-stat-sub">{{ verifiedCount }} validé(s)</span>
          </div>
        </div>

        <div class="module-stat-card">
          <div class="module-stat-icon">❌</div>
          <div class="module-stat-info">
            <span class="module-stat-label">Échecs & Expirés</span>
            <span class="module-stat-value" style="color: var(--red);">{{ failedCount }}</span>
            <span class="module-stat-sub">Tentatives bloquées</span>
          </div>
        </div>
      </div>

      <!-- Barre d'outils -->
      <div class="module-toolbar">
        <div class="module-filter-chips">
          <button :class="['filter-chip', { active: statusFilter === 'all' }]" @click="statusFilter = 'all'">
            Tous ({{ logs.length }})
          </button>
          <button :class="['filter-chip', { active: statusFilter === 'verified' }]" @click="statusFilter = 'verified'">
            ✅ Validés ({{ verifiedCount }})
          </button>
          <button :class="['filter-chip', { active: statusFilter === 'pending' }]" @click="statusFilter = 'pending'">
            ⏳ En attente ({{ pendingCount }})
          </button>
          <button :class="['filter-chip', { active: statusFilter === 'failed' }]" @click="statusFilter = 'failed'">
            ❌ Échoués / Expirés ({{ failedCount }})
          </button>
        </div>

        <div class="search-input-wrapper" style="max-width: 280px; margin-left: auto;">
          <input
            v-model="searchQuery"
            type="text"
            class="discord-input"
            placeholder="Filtrer par utilisateur ou salon..."
          />
        </div>

        <button class="action-btn" @click="loadCaptchaLogs">
          🔄 Rafraîchir
        </button>
      </div>

      <!-- Tableau des logs de Captcha avec Salons et Actions -->
      <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>

      <div v-else-if="filteredLogs.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
        Aucun enregistrement trouvé.
      </div>

      <div v-else class="module-table-wrapper">
        <table class="module-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Salon Captcha</th>
              <th>Question & Réponse</th>
              <th>Tentatives</th>
              <th>Statut</th>
              <th>Date</th>
              <th style="text-align: center;">Messages</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredLogs"
              :key="item.id || item._id"
              class="captcha-row-clickable"
              @click="openChannelHistory(item)"
            >
              <!-- Utilisateur -->
              <td>
                <div style="display: flex; flex-direction: column;">
                  <strong style="color: var(--header-primary);">{{ item.username || item.userTag || 'Membre' }}</strong>
                  <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-code);">ID: {{ item.userId || item.user_id }}</span>
                </div>
              </td>

              <!-- Salon Discord -->
              <td>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-weight: 600; color: #5865F2; font-family: var(--font-code);">
                      #{{ item.channelName || item.channel_name || ('captcha-' + (item.username || item.userId || 'user').toLowerCase()) }}
                    </span>
                    <span
                      v-if="item.isChannelDeleted || item.is_verified || item.status === 'verified' || item.status === 'failed'"
                      class="badge-channel-status deleted"
                      title="Salon temporaire supprimé après le processus"
                    >
                      Archivé
                    </span>
                    <span
                      v-else
                      class="badge-channel-status active"
                      title="Salon actif sur Discord"
                    >
                      Actif
                    </span>
                  </div>
                  <span v-if="item.channelId || item.channel_id" style="font-size: 10px; color: var(--text-muted); font-family: var(--font-code);">
                    ID: {{ item.channelId || item.channel_id }}
                  </span>
                </div>
              </td>

              <!-- Question Arithmétique & Réponse attendue -->
              <td>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <span style="font-family: var(--font-code); font-weight: 600; color: #85c1e9;">
                    {{ item.question || item.expression || 'N/A' }}
                  </span>
                  <span v-if="item.answer" style="font-size: 11px; color: var(--text-muted);">
                    Attendu: <strong style="color: var(--text-normal); font-family: var(--font-code);">{{ item.answer }}</strong>
                  </span>
                </div>
              </td>

              <!-- Tentatives -->
              <td>
                <span :class="['captcha-attempts-pill', { danger: (item.attempts || 0) >= (item.maxAttempts || 3) }]">
                  {{ item.attempts || 0 }} / {{ item.maxAttempts || 3 }}
                </span>
              </td>

              <!-- Statut -->
              <td>
                <span :class="['module-status-pill', getStatusClass(item.status)]">
                  {{ getStatusLabel(item.status) }}
                </span>
              </td>

              <!-- Date -->
              <td style="font-size: 12px; color: var(--text-muted); white-space: nowrap;">
                {{ formatDateTime(item.createdAt || item.timestamp) }}
              </td>

              <!-- Bouton d'action Voir Messages -->
              <td style="text-align: center;" @click.stop>
                <button
                  class="btn-view-messages"
                  title="Voir tous les messages échangés dans ce salon"
                  @click="openChannelHistory(item)"
                >
                  💬 Voir messages
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SOUS-ONGLET 2 : CONFIGURATION DU MODULE -->
    <div v-else-if="activeSubTab === 'config'" class="module-view-scroller">
      <div class="config-card">
        <div class="form-group-toggle">
          <div class="toggle-info">
            <span class="form-label">Activer le Captcha Mathématique</span>
            <p class="form-help">Crée automatiquement un salon temporaire à l'arrivée d'un nouveau membre.</p>
          </div>
          <label class="switch">
            <input v-model="config.enabled" type="checkbox" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="form-divider"></div>

        <div class="form-row">
          <div class="col-half">
            <label class="form-label">Rôle Membre Vérifié (Attribué après validation)</label>
            <DiscordRoleSelect
              v-model="config.verified_role_id"
              placeholder="Sélectionner le rôle vérifié..."
            />
          </div>
          <div class="col-half">
            <label class="form-label">Nom du Salon Temporaire</label>
            <input v-model="config.captcha_channel_name" type="text" class="discord-input" />
          </div>
        </div>

        <div class="form-row">
          <div class="col-half">
            <label class="form-label">Temps limite (minutes)</label>
            <input v-model.number="config.captcha_timeout" type="number" class="discord-input" />
          </div>
          <div class="col-half">
            <label class="form-label">Nombre Max de Tentatives</label>
            <input v-model.number="config.max_attempts" type="number" class="discord-input" />
          </div>
        </div>

        <div class="config-actions-bar">
          <button class="btn-primary" :disabled="isSaving" @click="saveModuleConfig">
            {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Configuration Captcha' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODALE D'HISTORIQUE DES MESSAGES DU SALON CAPTCHA -->
    <div v-if="selectedSession" class="modal-backdrop" @click="closeChannelHistory">
      <div class="user-modal-card channel-history-modal" @click.stop>
        <!-- Header de la Modale -->
        <div class="user-modal-header" style="background-color: var(--bg-tertiary); padding: 16px; border-bottom: 1px solid var(--card-border);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="channel-hash-icon">#</div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h3 style="font-size: 16px; font-weight: 700; color: var(--header-primary); margin: 0;">
                  {{ selectedSession.channelName || ('captcha-' + (selectedSession.username || selectedSession.userId).toLowerCase()) }}
                </h3>
                <span :class="['module-status-pill', getStatusClass(selectedSession.status)]" style="font-size: 11px; padding: 2px 8px;">
                  {{ getStatusLabel(selectedSession.status) }}
                </span>
              </div>
              <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-code);">
                Salon ID: {{ selectedSession.channelId || 'Inconnu' }} • Utilisateur: {{ selectedSession.username }} ({{ selectedSession.userId }})
              </span>
            </div>
          </div>
          <button class="modal-close-btn" title="Fermer (Échap)" @click="closeChannelHistory">✕</button>
        </div>

        <!-- Corps de la Modale -->
        <div class="channel-history-body">
          <!-- Bandeau récapitulatif du Captcha -->
          <div class="captcha-context-strip">
            <div class="context-item">
              <span class="context-label">❓ Question</span>
              <span class="context-value" style="color: #85c1e9; font-weight: 600; font-family: var(--font-code);">
                {{ selectedSession.question || 'N/A' }}
              </span>
            </div>
            <div class="context-item">
              <span class="context-label">🎯 Réponse Attendue</span>
              <span class="context-value" style="color: var(--green); font-weight: 700; font-family: var(--font-code);">
                {{ selectedSession.answer || '—' }}
              </span>
            </div>
            <div class="context-item">
              <span class="context-label">📊 Tentatives</span>
              <span class="context-value">
                {{ selectedSession.attempts || 0 }} / {{ selectedSession.maxAttempts || 3 }}
              </span>
            </div>
            <div class="context-item">
              <span class="context-label">⏰ Création</span>
              <span class="context-value" style="font-size: 11px;">
                {{ formatDateTime(selectedSession.createdAt) }}
              </span>
            </div>
            <div v-if="selectedSession.verifiedAt" class="context-item">
              <span class="context-label">✅ Validé à</span>
              <span class="context-value" style="font-size: 11px; color: var(--green);">
                {{ formatDateTime(selectedSession.verifiedAt) }}
              </span>
            </div>
          </div>

          <!-- Spinner de chargement des messages -->
          <div v-if="isLoadingHistory" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; gap: 12px;">
            <div class="spinner" style="width: 28px; height: 28px;"></div>
            <span style="font-size: 13px; color: var(--text-muted);">Récupération des messages du salon...</span>
          </div>

          <!-- Liste des Messages Discord réels ou reconstruits -->
          <div v-else class="discord-chat-container">
            <!-- Messages réels en BDD -->
            <div v-if="channelHistory.messages && channelHistory.messages.length > 0" class="messages-stream">
              <div
                v-for="(msg, index) in channelHistory.messages"
                :key="msg.id || index"
                :class="['discord-chat-row', { 'is-bot': isBotAuthor(msg), 'is-user': !isBotAuthor(msg) }]"
              >
                <!-- Avatar -->
                <div class="chat-avatar-wrapper">
                  <div v-if="isBotAuthor(msg)" class="avatar-badge bot-avatar">🐕</div>
                  <div v-else class="avatar-badge user-avatar">👤</div>
                </div>

                <!-- Message Content & Header -->
                <div class="chat-content-wrapper">
                  <div class="chat-header">
                    <span class="chat-author-name" :style="{ color: isBotAuthor(msg) ? '#f2c7ce' : '#85c1e9' }">
                      {{ msg.authorUsername || (isBotAuthor(msg) ? 'Chienne' : selectedSession.username) }}
                    </span>
                    <span v-if="isBotAuthor(msg)" class="bot-badge" style="font-size: 9px; padding: 1px 4px; border-radius: 3px; background: #5865F2; color: white; font-weight: 700;">BOT</span>
                    <span class="chat-time">{{ formatTime(msg.createdAt) }}</span>
                  </div>

                  <div class="chat-text-body">
                    {{ msg.content }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Reconstruction intelligente si aucun message archivé brut -->
            <div v-else class="synthesized-chat-stream">
              <div style="background: rgba(88, 101, 242, 0.1); border: 1px solid rgba(88, 101, 242, 0.3); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; color: var(--text-muted);">
                ℹ️ Ce salon temporaire a été nettoyé par Discord. Voici le déroulé exact de la session :
              </div>

              <!-- Message initial du bot -->
              <div class="discord-chat-row is-bot">
                <div class="chat-avatar-wrapper">
                  <div class="avatar-badge bot-avatar">🐕</div>
                </div>
                <div class="chat-content-wrapper">
                  <div class="chat-header">
                    <span class="chat-author-name" style="color: #f2c7ce;">Chienne</span>
                    <span class="bot-badge" style="font-size: 9px; padding: 1px 4px; border-radius: 3px; background: #5865F2; color: white; font-weight: 700;">BOT</span>
                    <span class="chat-time">{{ formatTime(selectedSession.createdAt) }}</span>
                  </div>
                  <div class="chat-text-body">
                    Bienvenue <strong style="color: #85c1e9;">@{{ selectedSession.username }}</strong> ! Pour des raisons de sécurité, veuillez résoudre ce calcul :<br />
                    <strong style="color: #5865f2; font-size: 14px; display: inline-block; margin: 4px 0;">{{ selectedSession.question }}</strong><br />
                    <span style="font-size: 12px; color: var(--text-muted);">Répondez avec le nombre en chiffres uniquement (exemple: 12).</span>
                  </div>
                </div>
              </div>

              <!-- Tentative de l'utilisateur si validé ou échoué -->
              <div v-if="selectedSession.is_verified || selectedSession.status === 'verified'" class="discord-chat-row is-user">
                <div class="chat-avatar-wrapper">
                  <div class="avatar-badge user-avatar">👤</div>
                </div>
                <div class="chat-content-wrapper">
                  <div class="chat-header">
                    <span class="chat-author-name" style="color: #85c1e9;">{{ selectedSession.username }}</span>
                    <span class="chat-time">{{ formatTime(selectedSession.verifiedAt || selectedSession.createdAt) }}</span>
                  </div>
                  <div class="chat-text-body" style="font-family: var(--font-code); font-weight: 700; font-size: 14px; color: var(--green);">
                    {{ selectedSession.answer }}
                  </div>
                </div>
              </div>

              <!-- Réponse finale du bot -->
              <div v-if="selectedSession.is_verified || selectedSession.status === 'verified'" class="discord-chat-row is-bot">
                <div class="chat-avatar-wrapper">
                  <div class="avatar-badge bot-avatar">🐕</div>
                </div>
                <div class="chat-content-wrapper">
                  <div class="chat-header">
                    <span class="chat-author-name" style="color: #f2c7ce;">Chienne</span>
                    <span class="bot-badge" style="font-size: 9px; padding: 1px 4px; border-radius: 3px; background: #5865F2; color: white; font-weight: 700;">BOT</span>
                    <span class="chat-time">{{ formatTime(selectedSession.verifiedAt || selectedSession.createdAt) }}</span>
                  </div>
                  <div class="chat-text-body" style="color: var(--green);">
                    ✅ Bravo ! Vous avez validé le captcha avec succès. Rôle attribué et salon supprimé.
                  </div>
                </div>
              </div>

              <!-- Si échec -->
              <div v-else-if="selectedSession.status === 'failed'" class="discord-chat-row is-bot">
                <div class="chat-avatar-wrapper">
                  <div class="avatar-badge bot-avatar">🐕</div>
                </div>
                <div class="chat-content-wrapper">
                  <div class="chat-header">
                    <span class="chat-author-name" style="color: #f2c7ce;">Chienne</span>
                    <span class="bot-badge" style="font-size: 9px; padding: 1px 4px; border-radius: 3px; background: #5865F2; color: white; font-weight: 700;">BOT</span>
                  </div>
                  <div class="chat-text-body" style="color: var(--red);">
                    ❌ Nombre maximal de tentatives ({{ selectedSession.attempts || 3 }}) dépassé. L'utilisateur a été expulsé.
                  </div>
                </div>
              </div>
            </div>

            <!-- Événements d'audit Discord liés -->
            <div v-if="channelHistory.events && channelHistory.events.length > 0" style="margin-top: 20px; border-top: 1px solid var(--card-border); padding-top: 14px;">
              <span style="font-size: 12px; font-weight: 700; color: var(--header-primary); display: block; margin-bottom: 8px;">
                📜 Événements Discord enregistrés :
              </span>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <div
                  v-for="evt in channelHistory.events"
                  :key="evt.id"
                  style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-tertiary); padding: 6px 10px; border-radius: 6px; font-size: 11px;"
                >
                  <span style="color: var(--header-primary); font-weight: 600;">{{ evt.summary || evt.eventName }}</span>
                  <span style="color: var(--text-muted); font-family: var(--font-code);">{{ formatDateTime(evt.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Modale -->
        <div class="user-modal-footer" style="padding: 12px 16px; background-color: var(--bg-tertiary); border-top: 1px solid var(--card-border); display: flex; justify-content: flex-end;">
          <button class="action-btn" @click="closeChannelHistory">
            Fermer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import DiscordRoleSelect from '~/components/ui/DiscordRoleSelect.vue';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const activeSubTab = ref<'stats' | 'config'>('stats');
const logs = ref<any[]>([]);
const config = ref<any>({ enabled: true, verified_role_id: '', captcha_channel_name: '', captcha_timeout: 10, max_attempts: 3 });
const statusFilter = ref('all');
const searchQuery = ref('');
const isLoading = ref(true);
const isSaving = ref(false);

// État de la modale d'historique de salon
const selectedSession = ref<any>(null);
const isLoadingHistory = ref(false);
const channelHistory = ref<any>({ channel: null, messages: [], events: [] });

onMounted(async () => {
  await Promise.all([
    loadCaptchaLogs(),
    loadModuleConfig()
  ]);
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && selectedSession.value) {
    closeChannelHistory();
  }
}

async function loadCaptchaLogs() {
  isLoading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data?: any }>('/api/captcha-logs');
    if (res.success && res.data) {
      if (Array.isArray(res.data)) {
        logs.value = res.data;
      } else if (Array.isArray(res.data.captchas)) {
        logs.value = res.data.captchas;
      }
    }
  } catch (err) {
    console.error('Erreur logs captcha:', err);
  } finally {
    isLoading.value = false;
  }
}

async function loadModuleConfig() {
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/config');
    if (res.success && res.data?.captcha) {
      config.value = res.data.captcha;
    }
  } catch (err) {
    console.error('Erreur config captcha:', err);
  }
}

async function saveModuleConfig() {
  isSaving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/config', {
      method: 'POST',
      body: JSON.stringify({
        module: 'captcha',
        config: config.value
      })
    });
    if (res.success) {
      showToast('Configuration Captcha enregistrée dans config.yml !', 'success');
    }
  } catch (err: any) {
    showToast(`Erreur de sauvegarde: ${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}

async function openChannelHistory(item: any) {
  selectedSession.value = item;
  isLoadingHistory.value = true;
  channelHistory.value = { channel: null, messages: [], events: [] };

  try {
    const chId = item.channelId || item.channel_id || '';
    const uId = item.userId || item.user_id || '';
    const res = await apiFetch<{ success: boolean; data: any }>(
      `/api/captcha-logs/messages?channel_id=${encodeURIComponent(chId)}&user_id=${encodeURIComponent(uId)}`
    );
    if (res.success && res.data) {
      channelHistory.value = res.data;
    }
  } catch (err: any) {
    console.error('Erreur chargement historique messages:', err);
  } finally {
    isLoadingHistory.value = false;
  }
}

function closeChannelHistory() {
  selectedSession.value = null;
  channelHistory.value = { channel: null, messages: [], events: [] };
}

function isBotAuthor(msg: any): boolean {
  if (!msg) return false;
  if (msg.authorUsername && (msg.authorUsername.toLowerCase().includes('bot') || msg.authorUsername.toLowerCase().includes('chienne'))) {
    return true;
  }
  if (msg.authorId && selectedSession.value && msg.authorId !== selectedSession.value.userId) {
    return true;
  }
  return false;
}

const verifiedCount = computed(() => logs.value.filter(l => l.status === 'verified' || l.status === 'success' || l.isVerified).length);
const pendingCount = computed(() => logs.value.filter(l => l.status === 'pending').length);
const failedCount = computed(() => logs.value.filter(l => l.status === 'failed' || l.status === 'expired').length);
const successRate = computed(() => {
  if (logs.value.length === 0) return 100;
  return Math.round((verifiedCount.value / logs.value.length) * 100);
});

const filteredLogs = computed(() => {
  const sf = statusFilter.value;
  const q = searchQuery.value.toLowerCase().trim();

  return logs.value.filter(item => {
    if (sf === 'verified' && item.status !== 'verified' && item.status !== 'success' && !item.isVerified) return false;
    if (sf === 'pending' && item.status !== 'pending') return false;
    if (sf === 'failed' && item.status !== 'failed' && item.status !== 'expired') return false;

    if (q) {
      const uMatch = (item.username && item.username.toLowerCase().includes(q)) ||
                     (item.userId && item.userId.includes(q));
      const chMatch = (item.channelName && item.channelName.toLowerCase().includes(q)) ||
                      (item.channelId && item.channelId.includes(q));
      if (!uMatch && !chMatch) return false;
    }
    return true;
  });
});

function getStatusClass(status: string): string {
  const st = (status || '').toLowerCase();
  if (st === 'verified' || st === 'success') return 'verified';
  if (st === 'failed') return 'failed';
  if (st === 'expired') return 'expired';
  return 'pending';
}

function getStatusLabel(status: string): string {
  const st = (status || '').toLowerCase();
  if (st === 'verified' || st === 'success') return '✅ Vérifié';
  if (st === 'failed') return '❌ Échoué';
  if (st === 'expired') return '⏰ Expiré';
  return '⏳ En attente';
}

const { formatLocalDate, formatDateWithRelative } = useDateFormatter();

function formatDateTime(dateStr: string): string {
  return formatDateWithRelative(dateStr);
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return '';
  }
}
</script>

<style scoped>
.captcha-row-clickable {
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.captcha-row-clickable:hover {
  background-color: var(--bg-modifier-hover);
}

.badge-channel-status {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}
.badge-channel-status.active {
  background: rgba(35, 165, 90, 0.15);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.3);
}
.badge-channel-status.deleted {
  background: rgba(148, 155, 164, 0.15);
  color: var(--text-muted);
  border: 1px solid rgba(148, 155, 164, 0.25);
}

.btn-view-messages {
  background: var(--bg-tertiary);
  border: 1px solid var(--card-border);
  color: var(--header-primary);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-view-messages:hover {
  background: var(--brand-experiment, #5865F2);
  color: white;
  border-color: transparent;
}

.channel-history-modal {
  max-width: 720px;
  width: 95%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
}

.channel-hash-icon {
  font-size: 20px;
  font-weight: 800;
  color: #5865F2;
  background: rgba(88, 101, 242, 0.15);
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.channel-history-body {
  padding: 16px;
  max-height: 72vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.captcha-context-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
  background: var(--bg-tertiary);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
}

.context-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.context-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.context-value {
  font-size: 13px;
  color: var(--header-primary);
}

.discord-chat-container {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 14px;
  border: 1px solid var(--card-border);
}

.messages-stream,
.synthesized-chat-stream {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.discord-chat-row {
  display: flex;
  gap: 12px;
  padding: 4px 0;
}

.chat-avatar-wrapper {
  flex-shrink: 0;
}

.avatar-badge {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.avatar-badge.bot-avatar {
  background: linear-gradient(135deg, #f2c7ce, #e91e63);
}
.avatar-badge.user-avatar {
  background: linear-gradient(135deg, #5865f2, #85c1e9);
}

.chat-content-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-author-name {
  font-weight: 700;
  font-size: 14px;
}

.chat-time {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-code);
}

.chat-text-body {
  font-size: 13.5px;
  line-height: 1.45;
  color: var(--text-normal);
  word-break: break-word;
}
</style>

