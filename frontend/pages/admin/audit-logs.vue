<template>
  <div class="audit-logs-page" style="padding: 24px; max-width: 1200px; margin: 0 auto;">
    <header style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
      <div>
        <h1 style="font-size: 24px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
          🛡️ Journaux d'Audit & Sécurité
        </h1>
        <p style="color: var(--text-muted); font-size: 14px; margin: 0;">
          Historique en direct des tentatives d'authentification, rafraîchissements de token et blocages de sécurité.
        </p>
      </div>

      <div style="display: flex; gap: 10px;">
        <button class="btn-secondary" :disabled="loading" @click="loadLogs">
          🔄 Actualiser
        </button>
      </div>
    </header>

    <!-- Filtres -->
    <div style="background: var(--background-secondary); padding: 16px; border-radius: 8px; margin-bottom: 20px; display: flex; gap: 14px; flex-wrap: wrap; align-items: flex-end;">
      <div style="flex: 1; min-width: 180px;">
        <label class="form-label">Type d'événement</label>
        <select v-model="filterEventType" class="discord-input" style="width: 100%;" @change="loadLogs">
          <option value="">Tous les événements</option>
          <option value="LOGIN_SUCCESS">✅ LOGIN_SUCCESS</option>
          <option value="LOGIN_FAILURE">❌ LOGIN_FAILURE</option>
          <option value="REFRESH_SUCCESS">🔄 REFRESH_SUCCESS</option>
          <option value="REFRESH_FAILURE">⚠️ REFRESH_FAILURE</option>
          <option value="IP_BLOCKED">🚫 IP_BLOCKED</option>
          <option value="LOGOUT">🚪 LOGOUT</option>
        </select>
      </div>

      <div style="flex: 1; min-width: 180px;">
        <label class="form-label">Adresse IP</label>
        <input v-model="filterIp" type="text" class="discord-input" placeholder="ex: 127.0.0.1" @keyup.enter="loadLogs" />
      </div>

      <div style="flex: 1; min-width: 180px;">
        <label class="form-label">Discord User ID</label>
        <input v-model="filterUserId" type="text" class="discord-input" placeholder="ex: 1337543177086959657" @keyup.enter="loadLogs" />
      </div>

      <button class="btn-primary" @click="loadLogs">
        Filtrer
      </button>
    </div>

    <!-- Table des logs -->
    <div style="background: var(--background-secondary); border-radius: 8px; overflow: hidden; border: 1px solid var(--background-modifier-accent);">
      <div v-if="loading" style="padding: 40px; text-align: center; color: var(--text-muted);">
        Chargement des logs d'audit...
      </div>

      <div v-else-if="logs.length === 0" style="padding: 40px; text-align: center; color: var(--text-muted);">
        Aucun log d'audit correspondant aux filtres.
      </div>

      <table v-else style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
        <thead>
          <tr style="background: var(--background-tertiary); border-bottom: 1px solid var(--background-modifier-accent); color: var(--text-muted);">
            <th style="padding: 12px 16px;">Horodatage</th>
            <th style="padding: 12px 16px;">Événement</th>
            <th style="padding: 12px 16px;">Utilisateur</th>
            <th style="padding: 12px 16px;">Adresse IP</th>
            <th style="padding: 12px 16px;">Détails / Raison</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in logs"
            :key="log.id"
            style="border-bottom: 1px solid var(--background-modifier-accent);"
          >
            <td style="padding: 12px 16px; font-family: var(--font-code); color: var(--text-muted); white-space: nowrap;">
              {{ formatDate(log.createdAt || log.created_at) }}
            </td>
            <td style="padding: 12px 16px;">
              <span :class="['event-badge', getBadgeClass(log.eventType || log.event_type)]">
                {{ log.eventType || log.event_type }}
              </span>
            </td>
            <td style="padding: 12px 16px;">
              <div v-if="log.username || log.userId || log.user_id" style="display: flex; flex-direction: column;">
                <span style="font-weight: 600; color: var(--header-primary);">{{ log.username || 'Inconnu' }}</span>
                <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-code);">{{ log.userId || log.user_id }}</span>
              </div>
              <span v-else style="color: var(--text-muted);">—</span>
            </td>
            <td style="padding: 12px 16px; font-family: var(--font-code);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>{{ log.ipAddress || log.ip_address }}</span>
                <button
                  v-if="(log.eventType || log.event_type) === 'IP_BLOCKED'"
                  class="btn-secondary"
                  style="padding: 2px 6px; font-size: 11px;"
                  title="Débloquer cette IP"
                  @click="unblockIp(log.ipAddress || log.ip_address)"
                >
                  Débloquer
                </button>
              </div>
            </td>
            <td style="padding: 12px 16px; color: var(--text-normal);">
              <span>{{ log.reason || '—' }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div style="padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; background: var(--background-tertiary);">
        <span style="font-size: 12px; color: var(--text-muted);">
          Total : {{ totalLogs }} entrée(s)
        </span>
        <div style="display: flex; gap: 8px;">
          <button class="btn-secondary" :disabled="offset === 0" @click="prevPage">
            ◀ Précédent
          </button>
          <button class="btn-secondary" :disabled="offset + limit >= totalLogs" @click="nextPage">
            Suivant ▶
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi';
import { useToast } from '~/composables/useToast';

useSeoMeta({
  title: 'Audit & Sécurité - Bot',
  description: 'Journaux d\'audit de sécurité et historique d\'authentification'
});

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const logs = ref<any[]>([]);
const totalLogs = ref(0);
const loading = ref(false);
const limit = 50;
const offset = ref(0);

const filterEventType = ref('');
const filterIp = ref('');
const filterUserId = ref('');

async function loadLogs() {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset.value)
    });

    if (filterEventType.value) params.append('eventType', filterEventType.value);
    if (filterIp.value) params.append('ipAddress', filterIp.value.trim());
    if (filterUserId.value) params.append('userId', filterUserId.value.trim());

    const res = await apiFetch(`/api/auth/audit-logs?${params.toString()}`);
    if (res.success) {
      logs.value = res.data || [];
      totalLogs.value = res.total || 0;
    }
  } catch (err: any) {
    showToast(err.message || 'Erreur chargement des audit logs', 'error');
  } finally {
    loading.value = false;
  }
}

async function unblockIp(ip: string) {
  try {
    const res = await apiFetch('/api/auth/unblock-ip', {
      method: 'POST',
      body: { ip }
    });
    if (res.success) {
      showToast(res.message || `IP ${ip} débloquée !`, 'success');
      loadLogs();
    }
  } catch (err: any) {
    showToast(err.message || 'Erreur déblocage IP', 'error');
  }
}

function prevPage() {
  if (offset.value >= limit) {
    offset.value -= limit;
    loadLogs();
  }
}

function nextPage() {
  if (offset.value + limit < totalLogs.value) {
    offset.value += limit;
    loadLogs();
  }
}

function formatDate(ts: number | string): string {
  if (!ts) return '—';
  const num = Number(ts);
  const date = isNaN(num) ? new Date(ts) : new Date(num);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getBadgeClass(eventType: string): string {
  switch (eventType) {
    case 'LOGIN_SUCCESS':
    case 'REFRESH_SUCCESS':
      return 'badge-success';
    case 'LOGIN_FAILURE':
    case 'REFRESH_FAILURE':
      return 'badge-danger';
    case 'IP_BLOCKED':
      return 'badge-warning';
    default:
      return 'badge-neutral';
  }
}

onMounted(() => {
  loadLogs();
});
</script>

<style scoped>
.event-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 4px;
  font-family: var(--font-code);
  display: inline-block;
}

.badge-success {
  background: rgba(87, 242, 135, 0.15);
  color: #57f287;
  border: 1px solid rgba(87, 242, 135, 0.3);
}

.badge-danger {
  background: rgba(237, 66, 69, 0.15);
  color: #ed4245;
  border: 1px solid rgba(237, 66, 69, 0.3);
}

.badge-warning {
  background: rgba(254, 231, 92, 0.15);
  color: #fee75c;
  border: 1px solid rgba(254, 231, 92, 0.3);
}

.badge-neutral {
  background: rgba(148, 155, 164, 0.15);
  color: #949ba4;
  border: 1px solid rgba(148, 155, 164, 0.3);
}
</style>
