<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
        <span>📜 Journal Complet des Captchas & Salons Éphémères</span>
        <button class="action-btn" style="font-size: 12px; padding: 4px 10px;" @click="loadCaptchaLogs">
          🔄 Rafraîchir
        </button>
      </div>

      <!-- Barre d'outils -->
      <div class="module-toolbar" style="margin-bottom: 14px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between;">
        <input
          v-model="searchQuery"
          type="text"
          class="discord-input"
          placeholder="🔍 Filtrer par utilisateur, ID, salon..."
          style="min-width: 240px; flex: 1; max-width: 360px;"
        />
        <div class="module-filter-group" style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button :class="['module-filter-btn', { active: statusFilter === 'all' }]" @click="statusFilter = 'all'">
            Tous ({{ logs.length }})
          </button>
          <button :class="['module-filter-btn', { active: statusFilter === 'verified' }]" @click="statusFilter = 'verified'">
            ✅ Validés ({{ verifiedCount }})
          </button>
          <button :class="['module-filter-btn', { active: statusFilter === 'pending' }]" @click="statusFilter = 'pending'">
            ⏳ En attente ({{ pendingCount }})
          </button>
          <button :class="['module-filter-btn', { active: statusFilter === 'failed' }]" @click="statusFilter = 'failed'">
            ❌ Échoués ({{ failedCount }})
          </button>
        </div>
      </div>

      <!-- Tableau des logs de Captcha -->
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
                      title="Salon temporaire supprimé"
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
              <td style="font-size: 12px; color: var(--text-normal); white-space: nowrap;">
                <DiscordTime :value="item.createdAt || item.timestamp" mode="both" />
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

    <!-- Modale d'historique de salon -->
    <div v-if="selectedChannelModal" class="modal-backdrop" @click.self="selectedChannelModal = null">
      <div class="modal-card" style="max-width: 680px; max-height: 85vh; display: flex; flex-direction: column;">
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
          <div>
            <h3 style="margin: 0; font-size: 16px; color: var(--header-primary);">
              💬 Historique du salon #{{ selectedChannelModal.channelName || 'captcha' }}
            </h3>
            <span style="font-size: 12px; color: var(--text-muted);">
              Membre: <strong>{{ selectedChannelModal.username }}</strong>
            </span>
          </div>
          <button class="action-btn" style="padding: 4px 8px;" @click="selectedChannelModal = null">✕</button>
        </div>

        <div style="flex: 1; overflow-y: auto; padding: 16px 0; display: flex; flex-direction: column; gap: 12px;">
          <div v-if="modalLoading" style="display: flex; justify-content: center; padding: 40px;">
            <div class="spinner" style="width: 28px; height: 28px;"></div>
          </div>
          <div v-else-if="modalMessages.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
            Aucun message enregistré dans ce salon.
          </div>
          <div
            v-for="msg in modalMessages"
            v-else
            :key="msg.id"
            style="background: var(--bg-tertiary); padding: 10px 14px; border-radius: 8px;"
          >
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
              <strong style="color: var(--header-primary);">{{ msg.author_username || msg.author || 'Inconnu' }}</strong>
              <DiscordTime :value="msg.created_at || msg.timestamp" mode="both" />
            </div>
            <p style="margin: 0; font-size: 13px; color: var(--text-normal); white-space: pre-wrap;">{{ msg.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import DiscordTime from '~/components/common/DiscordTime.vue';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const logs = ref<any[]>([]);
const isLoading = ref(true);
const statusFilter = ref<'all' | 'verified' | 'pending' | 'failed'>('all');
const searchQuery = ref('');

const selectedChannelModal = ref<any>(null);
const modalMessages = ref<any[]>([]);
const modalLoading = ref(false);

const verifiedCount = computed(() => logs.value.filter(l => l.verified || l.status === 'verified').length);
const failedCount = computed(() => logs.value.filter(l => l.status === 'failed' || (!l.verified && (l.attempts || 0) >= (l.maxAttempts || 3))).length);
const pendingCount = computed(() => logs.value.filter(l => !l.verified && l.status !== 'verified' && l.status !== 'failed' && (l.attempts || 0) < (l.maxAttempts || 3)).length);

const filteredLogs = computed(() => {
  let list = logs.value;
  if (statusFilter.value === 'verified') {
    list = list.filter(l => l.verified || l.status === 'verified');
  } else if (statusFilter.value === 'pending') {
    list = list.filter(l => !l.verified && l.status !== 'verified' && l.status !== 'failed' && (l.attempts || 0) < (l.maxAttempts || 3));
  } else if (statusFilter.value === 'failed') {
    list = list.filter(l => l.status === 'failed' || (!l.verified && (l.attempts || 0) >= (l.maxAttempts || 3)));
  }

  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(l => {
      const u = (l.username || l.userTag || '').toLowerCase();
      const id = String(l.userId || l.user_id || '');
      const ch = (l.channelName || l.channel_name || '').toLowerCase();
      return u.includes(q) || id.includes(q) || ch.includes(q);
    });
  }

  return list;
});

function getStatusClass(status: string) {
  if (status === 'verified') return 'verified';
  if (status === 'failed') return 'failed';
  return 'pending';
}

function getStatusLabel(status: string) {
  if (status === 'verified') return '✅ Validé';
  if (status === 'failed') return '❌ Échoué';
  return '⏳ En cours';
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

async function loadCaptchaLogs() {
  isLoading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data: any[] }>('/api/security-question/logs');
    if (res.success && Array.isArray(res.data)) {
      logs.value = res.data;
    }
  } catch (err: any) {
    showToast('Erreur chargement logs: ' + err.message, 'error');
  } finally {
    isLoading.value = false;
  }
}

async function openChannelHistory(item: any) {
  selectedChannelModal.value = item;
  modalLoading.value = true;
  modalMessages.value = [];
  try {
    const channelId = item.channelId || item.channel_id;
    if (channelId) {
      const res = await apiFetch<{ success: boolean; data: any[] }>(`/api/security-question/channel/${channelId}/messages`);
      if (res.success && Array.isArray(res.data)) {
        modalMessages.value = res.data;
      }
    }
  } catch (err: any) {
    showToast('Erreur messages salon: ' + err.message, 'error');
  } finally {
    modalLoading.value = false;
  }
}

onMounted(() => {
  loadCaptchaLogs();
});
</script>

<style scoped>
.captcha-row-clickable {
  cursor: pointer;
  transition: background 0.15s ease;
}
.captcha-row-clickable:hover {
  background: var(--bg-modifier-hover, rgba(255, 255, 255, 0.04));
}
.badge-channel-status {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}
.badge-channel-status.active {
  background: rgba(87, 242, 135, 0.15);
  color: var(--green, #57f287);
}
.badge-channel-status.deleted {
  background: rgba(148, 155, 164, 0.15);
  color: var(--text-muted, #949ba4);
}
.captcha-attempts-pill {
  display: inline-block;
  font-family: var(--font-code, monospace);
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-tertiary);
  color: var(--text-normal);
}
.captcha-attempts-pill.danger {
  background: rgba(237, 66, 69, 0.15);
  color: var(--red, #ed4245);
}
.btn-view-messages {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  color: var(--text-normal);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-view-messages:hover {
  background: var(--brand-experiment, #5865f2);
  color: #fff;
  border-color: var(--brand-experiment, #5865f2);
}
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-card {
  background: var(--bg-secondary, #2b2d31);
  border-radius: 10px;
  padding: 20px;
  width: 90%;
  border: 1px solid var(--border-subtle);
}
</style>
