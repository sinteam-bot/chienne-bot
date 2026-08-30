<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Alerte si aucun salon n'est configuré -->
    <div v-if="!status?.channelId" class="config-card" style="border-left: 4px solid var(--status-warning, #faa61a);">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">⚠️</span>
          <div>
            <div style="font-weight: 600; color: var(--header-primary);">Aucun salon de notification configuré</div>
            <div style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">
              Le bot ne peut pas envoyer la notification de démarrage tant qu'aucun salon n'est sélectionné.
            </div>
          </div>
        </div>
        <NuxtLink to="/modules/startup-notifier/config" class="btn-primary" style="font-size: 12px; padding: 6px 14px; text-decoration: none;">
          ⚙️ Configurer un salon
        </NuxtLink>
      </div>
    </div>

    <!-- Grille de KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon">📦</div>
        <div class="kpi-content">
          <span class="kpi-label">Version Active (Commit)</span>
          <span class="kpi-value" style="font-family: monospace; font-size: 18px;">
            <a
              v-if="status?.currentSha"
              :href="`https://github.com/${status.githubRepo || 'sinteam-bot/chienne-bot'}/commit/${status.currentSha}`"
              target="_blank"
              style="color: var(--blurple, #5865F2); text-decoration: none;"
            >
              {{ status.shortSha || status.currentSha.substring(0, 7) }}
            </a>
            <span v-else style="color: var(--text-muted);">Inconnu</span>
          </span>
          <span class="kpi-subtext" style="color: var(--text-muted); font-size: 12px;">
            Source: {{ status?.source || 'inconnue' }}
          </span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">⚡</div>
        <div class="kpi-content">
          <span class="kpi-label">Statut du Module</span>
          <span class="kpi-value">
            <span v-if="status?.enabled" class="badge-active">🟢 Activé</span>
            <span v-else class="badge-inactive">🔴 Désactivé</span>
          </span>
          <span class="kpi-subtext" style="color: var(--text-muted); font-size: 12px;">
            {{ status?.notifyOnUpdateOnly ? 'Mises à jour uniquement' : 'Tous les démarrages' }}
          </span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">💬</div>
        <div class="kpi-content">
          <span class="kpi-label">Salon Discord Cible</span>
          <span class="kpi-value" style="font-size: 15px;">
            <span v-if="status?.channelId" style="color: var(--text-link);">
              #{{ getChannelName(status.channelId) || status.channelId }}
            </span>
            <span v-else style="color: var(--text-muted); font-style: italic;">
              Non configuré
            </span>
          </span>
          <span class="kpi-subtext" style="color: var(--text-muted); font-size: 12px;">
            {{ status?.channelId ? `ID: ${status.channelId}` : 'Aucune notification' }}
          </span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">⏱️</div>
        <div class="kpi-content">
          <span class="kpi-label">Dernier Démarrage</span>
          <span class="kpi-value" style="font-size: 14px;">
            {{ formatDate(status?.lastStartupAt) }}
          </span>
          <span class="kpi-subtext" style="color: var(--text-muted); font-size: 12px;">
            Notifié: {{ status?.lastNotifiedCommit ? status.lastNotifiedCommit.substring(0, 7) : 'Aucun' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Carte d'action et déclenchement test -->
    <div class="config-card">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
        <div>
          <div class="card-subtitle" style="font-size: 16px;">🚀 Envoi Manuel de Notification</div>
          <p class="config-desc" style="margin: 4px 0 0 0;">
            Déclenchez immédiatement une notification test dans le salon Discord configuré avec la version et les derniers commits.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button
            class="btn-secondary"
            :disabled="isLoading"
            @click="fetchStatus"
          >
            🔄 Rafraîchir
          </button>
          <button
            class="btn-primary"
            :disabled="isTriggering || !status?.channelId"
            @click="triggerTestNotification"
          >
            {{ isTriggering ? 'Envoi en cours...' : '🚀 Envoyer la notification' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Historique des commits récents -->
    <div class="config-card">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
        <div class="card-subtitle" style="font-size: 16px;">📝 Commits Récents du Dépôt</div>
        <a
          v-if="status?.githubRepo"
          :href="`https://github.com/${status.githubRepo}/commits`"
          target="_blank"
          style="color: var(--blurple, #5865F2); font-size: 13px; text-decoration: none;"
        >
          Voir sur GitHub ↗
        </a>
      </div>

      <div v-if="status?.latestCommits && status.latestCommits.length > 0" style="display: flex; flex-direction: column; gap: 10px;">
        <div
          v-for="commit in status.latestCommits"
          :key="commit.fullSha || commit.sha"
          style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-tertiary, #2b2d31); border-radius: var(--radius-sm, 6px); border: 1px solid var(--border-subtle, rgba(255,255,255,0.06));"
        >
          <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
            <span style="font-family: monospace; font-weight: 600; color: var(--blurple, #5865F2); font-size: 13px;">
              {{ commit.sha }}
            </span>
            <span style="color: var(--text-normal, #dbdee1); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              {{ commit.message }}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 14px; font-size: 12px; color: var(--text-muted); flex-shrink: 0;">
            <span>👤 {{ commit.author }}</span>
            <span v-if="commit.date">{{ formatDate(commit.date) }}</span>
            <a
              :href="commit.url"
              target="_blank"
              style="color: var(--text-muted); text-decoration: none;"
            >
              🔗
            </a>
          </div>
        </div>
      </div>
      <div v-else style="color: var(--text-muted); font-size: 13px; padding: 20px; text-align: center;">
        Aucun historique de commits disponible (vérifiez la connexion GitHub ou le dossier Git).
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi';
import { useToast } from '~/composables/useToast';
import { useAppState } from '~/composables/useAppState';

definePageMeta({
  title: 'Vue d\'ensemble',
  hidden: true
});

useSeoMeta({
  title: 'Startup Notifier - Vue d\'ensemble',
  description: 'Vue d\'ensemble du module de notification au démarrage',
  ogTitle: 'Startup Notifier - Vue d\'ensemble',
  ogDescription: 'Vue d\'ensemble du module de notification au démarrage'
});

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();
const { discordChannels, fetchChannels } = useAppState();

const status = ref<any>(null);
const isLoading = ref(false);
const isTriggering = ref(false);

function getChannelName(channelId: string) {
  const ch = discordChannels.value?.find((c: any) => c.id === channelId);
  return ch ? ch.name : null;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Jamais';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('fr-FR', {
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

async function fetchStatus() {
  isLoading.value = true;
  try {
    const res = await apiFetch<any>('/api/notifier/startup/status');
    if (res?.success && res.data) {
      status.value = res.data;
    }
  } catch (err: any) {
    showToast({
      title: 'Erreur',
      message: 'Impossible de charger l\'état du module : ' + (err.message || 'Erreur réseau'),
      type: 'error'
    });
  } finally {
    isLoading.value = false;
  }
}

async function triggerTestNotification() {
  isTriggering.value = true;
  try {
    const res = await apiFetch<any>('/api/notifier/startup/trigger', {
      method: 'POST',
      body: {}
    });
    if (res?.success && res.sent) {
      showToast({
        title: 'Notification Envoyée',
        message: `Notification envoyée avec succès sur le salon #${res.channelId || status.value?.channelId} !`,
        type: 'success'
      });
      await fetchStatus();
    } else {
      showToast({
        title: 'Erreur Envoi',
        message: res?.error || res?.reason || 'Échec de l\'envoi de la notification',
        type: 'error'
      });
    }
  } catch (err: any) {
    showToast({
      title: 'Erreur',
      message: 'Impossible de déclencher la notification : ' + (err.message || 'Erreur réseau'),
      type: 'error'
    });
  } finally {
    isTriggering.value = false;
  }
}

onMounted(() => {
  fetchStatus();
});
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.kpi-card {
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--radius-md, 8px);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.kpi-icon {
  font-size: 28px;
  background: var(--bg-modifier-hover, rgba(255, 255, 255, 0.05));
  border-radius: var(--radius-sm, 6px);
  padding: 10px;
}

.kpi-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.kpi-label {
  font-size: 12px;
  color: var(--text-muted, #949ba4);
  font-weight: 500;
  text-transform: uppercase;
}

.kpi-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--header-primary, #ffffff);
}

.badge-active {
  color: var(--status-positive, #57f287);
}

.badge-inactive {
  color: var(--status-danger, #ed4245);
}
</style>
