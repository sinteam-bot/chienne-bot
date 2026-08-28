<template>
  <div class="birthdays-page">
    <header class="birthdays-page__header">
      <div>
        <h1>🎂 Anniversaires</h1>
        <p>Surveillance des anniversaires du serveur.</p>
      </div>
      <div class="birthdays-page__actions">
        <button class="btn-refresh" :disabled="loading" @click="load">
          {{ loading ? '⏳' : '🔄' }} Rafraîchir
        </button>
      </div>
    </header>

    <div v-if="error" class="birthdays-page__error">❌ {{ error }}</div>

    <section class="birthdays-page__section" v-if="today.length > 0">
      <h2>🎉 Aujourd'hui</h2>
      <div class="birthdays-today">
        <div v-for="u in today" :key="u.userId" class="birthday-card">
          <span class="birthday-card__emoji">🎂</span>
          <span class="birthday-card__name">{{ u.username }}</span>
          <span class="birthday-card__id">(<code>{{ u.userId.slice(0, 12) }}…</code>)</span>
        </div>
      </div>
    </section>

    <section v-if="today.length === 0" class="birthdays-page__empty">
      Aucun anniversaire aujourd'hui.
    </section>

    <section class="birthdays-page__section">
      <h2>📅 Prochains ({{ upcoming.length }})</h2>
      <div v-if="upcoming.length === 0" class="birthdays-page__empty">Aucun.</div>
      <div v-else class="birthdays-upcoming">
        <div
          v-for="b in upcoming"
          :key="b.userId + '-' + b.days_until"
          class="upcoming-row"
          :class="{ 'is-today': b.days_until === 0 }"
        >
          <div class="upcoming-row__countdown">
            <span v-if="b.days_until === 0">🎂 Aujourd'hui</span>
            <span v-else-if="b.days_until === 1">📅 Demain</span>
            <span v-else>J-{{ b.days_until }}</span>
          </div>
          <div class="upcoming-row__user">
            {{ b.username }}
            <span class="upcoming-row__age">({{ b.age }} ans)</span>
          </div>
          <div class="upcoming-row__id">
            <code>{{ b.userId.slice(0, 14) }}…</code>
          </div>
        </div>
      </div>
    </section>

    <section v-if="history.length > 0" class="birthdays-page__section">
      <h2>📜 Historique récent ({{ history.length }})</h2>
      <div class="birthdays-history">
        <div v-for="h in history.slice(0, 20)" :key="h.id" class="history-row">
          <span class="history-row__time">{{ formatTime(h.announcedAt) }}</span>
          <span class="history-row__user">{{ h.username }}</span>
          <span v-if="h.age" class="history-row__age">({{ h.age }} ans)</span>
          <span v-if="h.giftsGiven && h.giftsGiven.length" class="history-row__gifts">
            {{ formatGifts(h.giftsGiven) }}
          </span>
        </div>
      </div>
    </section>

    <section class="birthdays-page__section">
      <h2>⚙️ Configuration</h2>
      <div v-if="settings" class="birthdays-config">
        <div class="config-row">
          <span class="config-row__label">Mode</span>
          <span class="config-row__value">{{ settings.mode }}</span>
        </div>
        <div class="config-row">
          <span class="config-row__label">Activé</span>
          <span class="config-row__value">{{ settings.enabled ? '✅' : '❌' }}</span>
        </div>
        <div class="config-row">
          <span class="config-row__label">Salon d'annonce</span>
          <span class="config-row__value">
            <code v-if="settings.announceChannelId">{{ settings.announceChannelId }}</code>
            <span v-else>—</span>
          </span>
        </div>
        <div class="config-row">
          <span class="config-row__label">Heure d'annonce</span>
          <span class="config-row__value">{{ settings.announceHour }}:00 ({{ settings.announceTimezone }})</span>
        </div>
        <div class="config-row">
          <span class="config-row__label">Rôle à mentionner</span>
          <span class="config-row__value">
            <code v-if="settings.pingRoleId">{{ settings.pingRoleId }}</code>
            <span v-else>—</span>
          </span>
        </div>
        <div class="config-row">
          <span class="config-row__label">Rôle temporaire</span>
          <span class="config-row__value">
            <code v-if="settings.tempRoleId">{{ settings.tempRoleId }}</code>
            <span v-else>—</span>
          </span>
        </div>
        <div class="config-row">
          <span class="config-row__label">Template</span>
          <span class="config-row__value config-row__template">{{ settings.messageTemplate }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useBirthdays, type BirthdaySettings, type UpcomingBirthday, type BirthdayHistoryEntry } from '~/composables/useBirthdays';

const api = useBirthdays();
const today = ref<{ userId: string; username: string }[]>([]);
const upcoming = ref<UpcomingBirthday[]>([]);
const history = ref<BirthdayHistoryEntry[]>([]);
const settings = ref<BirthdaySettings | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

function formatTime(ts: number) {
  return new Date(ts).toLocaleString('fr-FR');
}

function formatGifts(gifts: string[]) {
  if (!gifts || gifts.length === 0) return '';
  return gifts.map(g => {
    if (g === 'role') return '🎖️';
    if (g === 'xp') return '⭐';
    if (g.startsWith('custom:')) return `🎁 ${g.slice(7)}`;
    return g;
  }).join(' ');
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const [t, u, h, s] = await Promise.all([
      api.getToday(),
      api.getUpcoming(undefined, 30),
      api.getHistory(undefined, undefined, 50),
      api.getSettings()
    ]);
    today.value = t || [];
    upcoming.value = u || [];
    history.value = h || [];
    settings.value = s || null;
  } catch (e: any) {
    error.value = e.message || 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.birthdays-page {
  max-width: 1024px;
  margin: 0 auto;
  padding: 24px;
  color: #f2f3f5;
}

.birthdays-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.birthdays-page__header h1 { margin: 0 0 4px; font-size: 28px; }
.birthdays-page__header p { margin: 0; color: #b5bac1; font-size: 14px; }

.birthdays-page__actions { display: flex; gap: 8px; }
.btn-refresh {
  background: #4e5058; color: #f2f3f5; border: none;
  padding: 8px 16px; border-radius: 6px; cursor: pointer;
}
.btn-refresh:hover:not(:disabled) { background: #5865f2; }

.birthdays-page__error,
.birthdays-page__empty {
  background: #2b2d31; border: 1px solid #3f4147; padding: 16px;
  border-radius: 8px; text-align: center; color: #b5bac1; margin-bottom: 16px;
}
.birthdays-page__error { background: #ed4245; color: white; border-color: #ed4245; }

.birthdays-page__section {
  background: #1e1f22; border: 1px solid #3f4147; border-radius: 12px;
  padding: 20px; margin-bottom: 20px;
}
.birthdays-page__section h2 {
  margin: 0 0 16px; font-size: 16px; color: #fee75c;
  text-transform: uppercase; letter-spacing: 0.5px;
}

/* Today */
.birthdays-today {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.birthday-card {
  display: flex; align-items: center; gap: 10px;
  background: linear-gradient(90deg, rgba(255, 192, 203, 0.2), #2b2d31);
  border: 1px solid #f2c7ce; border-radius: 8px;
  padding: 12px 14px;
}
.birthday-card__emoji { font-size: 24px; }
.birthday-card__name { font-weight: 600; flex: 1; }
.birthday-card__id code { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #80848e; }

/* Upcoming */
.birthdays-upcoming { display: flex; flex-direction: column; gap: 6px; }
.upcoming-row {
  display: grid; grid-template-columns: 120px 1fr 180px;
  align-items: center; gap: 12px;
  background: #2b2d31; border: 1px solid #3f4147; border-radius: 6px;
  padding: 8px 12px;
}
.upcoming-row.is-today { border-color: #f2c7ce; background: linear-gradient(90deg, rgba(255,192,203,0.1), #2b2d31); }
.upcoming-row__countdown { color: #fee75c; font-weight: 600; font-size: 13px; }
.upcoming-row__user { font-size: 14px; }
.upcoming-row__age { color: #b5bac1; font-size: 12px; margin-left: 4px; }
.upcoming-row__id code { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #80848e; }

/* History */
.birthdays-history { display: flex; flex-direction: column; gap: 4px; }
.history-row {
  display: flex; gap: 12px; align-items: center;
  background: #2b2d31; border-radius: 4px; padding: 6px 10px;
  font-size: 12px;
}
.history-row__time { color: #80848e; font-family: 'JetBrains Mono', monospace; }
.history-row__user { font-weight: 600; }
.history-row__age { color: #b5bac1; }
.history-row__gifts { margin-left: auto; color: #fee75c; }

/* Config */
.birthdays-config { display: flex; flex-direction: column; gap: 8px; }
.config-row {
  display: grid; grid-template-columns: 180px 1fr; gap: 12px;
  padding: 6px 0; border-bottom: 1px solid #2b2d31;
  font-size: 13px;
}
.config-row:last-child { border-bottom: none; }
.config-row__label { color: #80848e; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
.config-row__value { color: #f2f3f5; }
.config-row__value code { font-family: 'JetBrains Mono', monospace; background: #1e1f22; padding: 1px 6px; border-radius: 3px; font-size: 12px; }
.config-row__template { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #fee75c; }
</style>
