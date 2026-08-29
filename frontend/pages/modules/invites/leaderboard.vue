<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Bannière stats -->
    <div class="module-stats-banner">
      <div class="module-stat-card">
        <div class="module-stat-icon">🏆</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Top inviter</span>
          <span class="module-stat-value">{{ topTotal.toLocaleString('fr-FR') }} 📨</span>
          <span v-if="topEntry" class="module-stat-sub">
            par @{{ topEntry.inviterUsername || topEntry.inviterId.slice(0, 10) }}
          </span>
          <span v-else class="module-stat-sub">Aucun inviteur</span>
        </div>
      </div>
      <div class="module-stat-card">
        <div class="module-stat-icon">📊</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Inviteurs classés</span>
          <span class="module-stat-value">{{ leaderboard.length }}</span>
          <span class="module-stat-sub">Total sur le serveur</span>
        </div>
      </div>
      <div class="module-stat-card">
        <div class="module-stat-icon">🎯</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Total invitations</span>
          <span class="module-stat-value">{{ grandTotal.toLocaleString('fr-FR') }}</span>
          <span class="module-stat-sub">Toutes catégories</span>
        </div>
      </div>
    </div>

    <!-- Tableau leaderboard -->
    <div class="config-card">
      <div
        class="card-subtitle"
        style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;"
      >
        <span>🏆 Classement des Inviteurs</span>
        <button class="module-btn" @click="load" :disabled="loading">
          {{ loading ? '⏳' : '🔄' }} Rafraîchir
        </button>
      </div>

      <div v-if="error" class="config-card" style="color: var(--red);">
        ❌ {{ error }}
      </div>

      <div
        v-else-if="loading && leaderboard.length === 0"
        style="color: var(--text-muted); text-align: center; padding: 40px;"
      >
        ⏳ Chargement du classement…
      </div>

      <div
        v-else-if="!loading && leaderboard.length === 0"
        style="color: var(--text-muted); text-align: center; padding: 40px;"
      >
        Aucun inviteur classé pour le moment. Le tracking démarre dès qu'un membre rejoint le serveur.
      </div>

      <div v-else class="module-table-wrapper">
        <table class="module-table">
          <thead>
            <tr>
              <th style="width: 100px; text-align: center;">Rang</th>
              <th>Inviteur</th>
              <th style="width: 120px; text-align: right;">Réelles</th>
              <th style="width: 120px; text-align: right;">Bonus</th>
              <th style="width: 140px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(e, idx) in paginated"
              :key="e.inviterId"
            >
              <td style="text-align: center;">
                <strong :class="medalClass(idx)">
                  {{ medalLabel(idx) }}
                </strong>
              </td>
              <td>
                <DiscordUser :user-id="e.inviterId" :show-id="true" :avatar-size="32" />
                <span style="color: var(--text-muted); font-size: 12px; margin-left: 8px;">
                  @{{ e.inviterUsername || 'inconnu' }}
                </span>
              </td>
              <td style="text-align: right;">{{ e.real.toLocaleString('fr-FR') }}</td>
              <td style="text-align: right;">{{ e.bonus.toLocaleString('fr-FR') }}</td>
              <td style="text-align: right;">
                <strong style="color: var(--green, #57f287);">
                  {{ e.total.toLocaleString('fr-FR') }}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <DiscordPagination
        v-if="leaderboard.length > pageSize"
        v-model="page"
        v-model:page-size="pageSize"
        :total-items="leaderboard.length"
        :page-size-options="[10, 25, 50, 100]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useInvites } from '~/composables/useInvites';
import { useToast } from '~/composables/useToast';
import DiscordPagination from '~/components/common/DiscordPagination.vue';
import DiscordUser from '~/components/common/DiscordUser.vue';

definePageMeta({
  title: 'Classement des Invites',
  icon: '🏆',
  description: 'Top des inviters du serveur (réelles + bonus)',
  section: 'modules',
  hidden: true
});

useSeoMeta({
  title: 'Classement des Invites - Bot',
  description: 'Top des membres qui ont invité le plus sur le serveur',
  ogTitle: 'Classement des Invites - Bot'
});

const invites = useInvites();
const { showToast } = useToast();

const leaderboard = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const page = ref(1);
const pageSize = ref(25);

const topEntry = computed(() => leaderboard.value[0] || null);
const topTotal = computed(() => topEntry.value?.total || 0);
const grandTotal = computed(() => leaderboard.value.reduce((s, e) => s + (e.total || 0), 0));

const paginated = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return leaderboard.value.slice(start, start + pageSize.value);
});

function medalLabel(idx: number): string {
  const rank = (page.value - 1) * pageSize.value + idx + 1;
  if (rank === 1) return '🥇 #1';
  if (rank === 2) return '🥈 #2';
  if (rank === 3) return '🥉 #3';
  return `#${rank}`;
}

function medalClass(idx: number): string {
  const rank = (page.value - 1) * pageSize.value + idx + 1;
  if (rank === 1) return 'medal-gold';
  if (rank === 2) return 'medal-silver';
  if (rank === 3) return 'medal-bronze';
  return '';
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const params = new URLSearchParams(window.location.search);
    const guildId = params.get('guild_id') || '';
    if (!guildId) {
      error.value = 'Aucun serveur sélectionné. Spécifiez ?guild_id=... dans l\'URL.';
      leaderboard.value = [];
      return;
    }
    const data = await invites.getLeaderboard(guildId, 1000);
    leaderboard.value = Array.isArray(data) ? data : [];
  } catch (e: any) {
    error.value = e.message || 'Erreur inconnue';
    showToast({ type: 'error', message: error.value });
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.medal-gold { color: #f1c40f; }
.medal-silver { color: #bdc3c7; }
.medal-bronze { color: #e67e22; }

.module-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--background-modifier-hover);
  color: var(--text-normal);
  font-size: 12px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  font-family: inherit;
}
.module-btn:hover:not(:disabled) {
  background: var(--brand-experiment, #5865f2);
  color: white;
}
</style>
