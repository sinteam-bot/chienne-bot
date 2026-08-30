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
          <button :class="['module-filter-btn', { active: statusFilter === 'expired' }]" @click="statusFilter = 'expired'">
            ⏰ Expirés ({{ expiredCount }})
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
              v-for="item in paginatedLogs"
              :key="item.id || item.token"
              class="captcha-row-clickable"
              @click="openChannelHistory(item)"
            >
              <!-- Utilisateur -->
              <td>
                <DiscordUser
                  :user-id="item.userId || item.user_id"
                  :username="item.username || item.userTag"
                  :show-id="true"
                  :avatar-size="32"
                />
              </td>

              <!-- Salon Temporaire Dédié -->
              <td>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <DiscordChannel
                    :channel-id="item.channelId || item.channel_id"
                    :name="item.channelName || item.channel_name || 'captcha-inconnu'"
                    :clickable="false"
                  />
                  <span
                    v-if="item.isChannelDeleted || item.is_verified || item.status === 'verified' || item.status === 'failed' || item.status === 'expired'"
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

      <!-- Pagination Discord -->
      <DiscordPagination
        v-model="currentPage"
        v-model:page-size="pageSize"
        :total-items="filteredLogs.length"
        :page-size-options="[10, 15, 25, 50, 100]"
      />
    </div>

    <!-- Modale d'historique de salon -->
    <div v-if="selectedChannelModal" class="modal-backdrop" @click.self="selectedChannelModal = null">
      <div class="modal-card" style="max-width: 680px; max-height: 85vh; display: flex; flex-direction: column;">
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
          <div>
            <h3 style="margin: 0; font-size: 16px; color: var(--header-primary);">
              💬 Historique du salon #{{ modalChannelInfo?.name || selectedChannelModal.channelName || selectedChannelModal.channel_name || 'captcha' }}
            </h3>
            <span style="font-size: 12px; color: var(--text-muted);">
              Membre: <strong>{{ selectedChannelModal.username || selectedChannelModal.userTag || selectedChannelModal.userId }}</strong>
              <span v-if="modalChannelInfo?.isDeleted" class="badge-channel-status deleted" style="margin-left: 6px;">Archivé</span>
            </span>
          </div>
          <button class="action-btn" style="padding: 4px 8px;" @click="selectedChannelModal = null">✕</button>
        </div>

        <div style="flex: 1; overflow-y: auto; padding: 16px 0; display: flex; flex-direction: column; gap: 12px;">
          <div v-if="modalLoading" style="display: flex; justify-content: center; padding: 40px;">
            <div class="spinner" style="width: 28px; height: 28px;"></div>
          </div>
          <template v-else>
            <!-- Événements archivés (création/suppression salon, audit) -->
            <div v-if="modalEvents.length > 0" style="display: flex; flex-direction: column; gap: 6px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">
                🗂️ Événements ({{ modalEvents.length }})
              </div>
              <div
                v-for="evt in modalEvents"
                :key="evt.id"
                style="background: var(--bg-secondary); padding: 6px 10px; border-radius: 6px; font-size: 12px; color: var(--text-normal); display: flex; justify-content: space-between; gap: 8px;"
              >
                <span>📌 <strong>{{ evt.eventName }}</strong> — {{ evt.summary }}</span>
                <DiscordTime :value="evt.createdAt" mode="relative" />
              </div>
            </div>

            <!-- Messages du salon -->
            <div v-if="modalMessages.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
              Aucun message enregistré dans ce salon.
            </div>
            <div
              v-for="msg in modalMessages"
              :key="msg.id"
              style="background: var(--bg-tertiary); padding: 10px 14px; border-radius: 8px;"
            >
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 12px;">
                <DiscordUser
                  :user-id="msg.authorId || msg.author_id"
                  :username="msg.authorUsername || msg.author_username || msg.author"
                  :avatar-size="20"
                />
                <DiscordTime :value="msg.createdAt || msg.created_at" mode="both" />
              </div>
              <p style="margin: 0; font-size: 13px; color: var(--text-normal); white-space: pre-wrap;">{{ msg.content }}</p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useAppState } from '~/composables/useAppState.ts';
import { useToast } from '~/composables/useToast.ts';
import DiscordTime from '~/components/common/DiscordTime.vue';
import DiscordPagination from '~/components/common/DiscordPagination.vue';
import DiscordUser from '~/components/common/DiscordUser.vue';
import DiscordChannel from '~/components/common/DiscordChannel.vue';

definePageMeta({
  title: 'Journal des Vérifications',
  icon: '📜',
  description: 'Journal complet des sessions captcha et tentatives de résolution',
  section: 'modules',
  hidden: true
});

useSeoMeta({
  title: 'Journal des Vérifications - Captcha',
  description: 'Journal complet des sessions captcha et tentatives de résolution',
  ogTitle: 'Journal des Vérifications - Captcha',
  ogDescription: 'Journal complet des sessions captcha et tentatives de résolution'
});

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const logs = ref<any[]>([]);
const isLoading = ref(true);
const statusFilter = ref<'all' | 'verified' | 'pending' | 'failed' | 'expired'>('all');
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(15);

const selectedChannelModal = ref<any>(null);
const modalMessages = ref<any[]>([]);
const modalEvents = ref<any[]>([]);
const modalChannelInfo = ref<any>(null);
const modalLoading = ref(false);

const verifiedCount = computed(() => logs.value.filter(l => l.verified || l.status === 'verified').length);
const failedCount = computed(() => logs.value.filter(l => l.status === 'failed' || (!l.verified && (l.attempts || 0) >= (l.maxAttempts || 3))).length);
const expiredCount = computed(() => logs.value.filter(l => l.status === 'expired' || l.expiredAt).length);
const pendingCount = computed(() => logs.value.filter(l => !l.verified && l.status !== 'verified' && l.status !== 'failed' && l.status !== 'expired' && (l.attempts || 0) < (l.maxAttempts || 3)).length);

const filteredLogs = computed(() => {
  let list = logs.value;
  if (statusFilter.value === 'verified') {
    list = list.filter(l => l.verified || l.status === 'verified');
  } else if (statusFilter.value === 'pending') {
    list = list.filter(l => !l.verified && l.status !== 'verified' && l.status !== 'failed' && l.status !== 'expired' && (l.attempts || 0) < (l.maxAttempts || 3));
  } else if (statusFilter.value === 'failed') {
    list = list.filter(l => l.status === 'failed' || (!l.verified && (l.attempts || 0) >= (l.maxAttempts || 3)));
  } else if (statusFilter.value === 'expired') {
    list = list.filter(l => l.status === 'expired' || !!l.expiredAt);
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

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredLogs.value.slice(start, start + pageSize.value);
});

watch([searchQuery, statusFilter], () => {
  currentPage.value = 1;
});

function getStatusClass(status: string) {
  if (status === 'verified') return 'verified';
  if (status === 'failed') return 'failed';
  if (status === 'expired') return 'expired';
  return 'pending';
}

function getStatusLabel(status: string) {
  if (status === 'verified') return '✅ Validé';
  if (status === 'failed') return '❌ Échoué';
  if (status === 'expired') return '⏰ Expiré';
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
    const res = await apiFetch<{ success: boolean; data: any }>('/api/captcha/logs');
    if (res.success && res.data) {
      // L'API renvoie { stats, config, captchas, logs } : on prend `captchas`.
      logs.value = Array.isArray(res.data.captchas) ? res.data.captchas : [];
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
  modalEvents.value = [];
  modalChannelInfo.value = null;
  try {
    const channelId = item.channelId || item.channel_id;
    if (channelId) {
      const res = await apiFetch<{ success: boolean; data: any }>(`/api/captcha/messages?channel_id=${encodeURIComponent(channelId)}`);
      if (res.success && res.data && typeof res.data === 'object') {
        modalChannelInfo.value = res.data.channel || null;
        modalMessages.value = Array.isArray(res.data.messages) ? res.data.messages : [];
        modalEvents.value = Array.isArray(res.data.events) ? res.data.events : [];
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
