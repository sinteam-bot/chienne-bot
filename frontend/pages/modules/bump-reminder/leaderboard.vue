<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>🏆</span>
          <span>Classement des Membres (Bumpers)</span>
        </div>
        <span style="font-size: 12px; color: var(--text-muted);">
          {{ leaderboard.length }} membre(s) classé(s)
        </span>
      </div>

      <p class="config-desc">
        Classement basé sur le nombre de bumps enregistrés sur le serveur Disboard.
      </p>

      <div v-if="leaderboard.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
        Aucun bump enregistré pour l'instant pour établir le classement.
      </div>

      <div v-else class="module-table-wrapper">
        <table class="module-table">
          <thead>
            <tr>
              <th style="width: 10%; text-align: center;">Rang</th>
              <th style="width: 40%;">Membre</th>
              <th style="width: 25%; text-align: center;">Total Bumps</th>
              <th style="width: 25%;">Dernier Bump</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, index) in leaderboard" :key="entry.userId">
              <td style="text-align: center; font-size: 16px;">
                <span v-if="index === 0">🥇</span>
                <span v-else-if="index === 1">🥈</span>
                <span v-else-if="index === 2">🥉</span>
                <span v-else style="font-family: var(--font-code); color: var(--text-muted); font-size: 13px;">#{{ index + 1 }}</span>
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div>
                    <strong style="color: var(--header-primary);">{{ entry.username }}</strong>
                    <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-code);">ID: {{ entry.userId }}</div>
                  </div>
                </div>
              </td>
              <td style="text-align: center;">
                <span class="module-status-pill verified" style="font-size: 13px; font-weight: 700;">
                  🚀 {{ entry.count }} bump{{ entry.count > 1 ? 's' : '' }}
                </span>
              </td>
              <td style="font-size: 13px; color: var(--text-normal);">
                {{ formatDate(entry.lastBumpAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, type Ref } from 'vue';

const bumpStatus = inject<Ref<any>>('bumpStatus', ref({}));

interface LeaderboardEntry {
  userId: string;
  username: string;
  count: number;
  lastBumpAt: string;
}

const leaderboard = computed<LeaderboardEntry[]>(() => {
  const history = bumpStatus.value.history || [];
  const map = new Map<string, LeaderboardEntry>();

  for (const item of history) {
    const userId = item.bumper_id || item.userId || item.bumper_username || item.username;
    if (!userId) continue;

    // Filter out obvious test users in leaderboard if desired
    const username = item.bumper_username || item.username || 'Inconnu';
    if (username.toLowerCase() === 'superbumper' || username.toLowerCase() === 'bumperman' || String(userId).startsWith('user_bumper')) {
      continue;
    }

    const existing = map.get(userId);
    if (!existing) {
      map.set(userId, {
        userId,
        username,
        count: 1,
        lastBumpAt: item.bumped_at || item.bumpedAt
      });
    } else {
      existing.count++;
      const curDate = new Date(existing.lastBumpAt).getTime();
      const newDate = new Date(item.bumped_at || item.bumpedAt).getTime();
      if (newDate > curDate) {
        existing.lastBumpAt = item.bumped_at || item.bumpedAt;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
});

function formatDate(dateStr: string) {
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
</script>
