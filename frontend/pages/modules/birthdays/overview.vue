<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- KPIs -->
    <div class="kpis-grid">
      <div class="kpi-card">
        <div class="kpi-icon">🎂</div>
        <div class="kpi-info">
          <div class="kpi-val">{{ config.enabled ? 'Activé' : 'Désactivé' }}</div>
          <div class="kpi-lbl">Statut du module</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">👥</div>
        <div class="kpi-info">
          <div class="kpi-val">{{ upcomingBirthdays.length }}</div>
          <div class="kpi-lbl">Membres inscrits</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">🎁</div>
        <div class="kpi-info">
          <div class="kpi-val">{{ config.gifts?.xp_per_birthday || 500 }} XP</div>
          <div class="kpi-lbl">Cadeau XP annuel</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">⏰</div>
        <div class="kpi-info">
          <div class="kpi-val">{{ config.announce?.hour ?? 9 }}:00</div>
          <div class="kpi-lbl">Heure d'annonce</div>
        </div>
      </div>
    </div>

    <!-- Liste des Anniversaires à venir -->
    <div class="card-section">
      <div class="card-header">
        <h2 style="font-size: 16px; font-weight: 700; color: var(--header-primary); margin: 0;">🎉 Anniversaires à venir</h2>
        <div class="card-header-actions" style="display: flex; align-items: center; gap: 10px;">
          <button class="btn-secondary-sm" :disabled="loading" @click="loadUpcoming">
            {{ loading ? 'Chargement…' : '🔄 Actualiser' }}
          </button>
          <span class="badge-mode">Mode : {{ config.mode === 'public' ? 'Public (Global)' : 'Privé (Serveur)' }}</span>
        </div>
      </div>

      <div v-if="loading" class="empty-state">Chargement des anniversaires…</div>
      <div v-else-if="upcomingBirthdays.length === 0" class="empty-state">
        Aucun anniversaire enregistré ou à venir prochainement. Les membres peuvent renseigner leur date avec <code>/anniversaire set</code> ou <code>!anniversaire set</code>.
      </div>
      <div v-else class="birthdays-list">
        <div v-for="b in upcomingBirthdays" :key="b.userId" class="birthday-row">
          <div class="bday-user">
            <DiscordUser :user-id="b.userId" :show-id="true" />
          </div>
          <div class="bday-date">
            🗓️ {{ b.dateFormatted }} <span v-if="b.age" class="age-hint">({{ b.age }} ans)</span>
          </div>
          <div class="bday-days">
            <span v-if="b.daysLeft === 0" class="today-badge">🎉 Aujourd'hui !</span>
            <span v-else class="days-badge">Dans {{ b.daysLeft }} jour(s)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useConfigFeature } from '~/composables/useConfigFeature.ts';
import DiscordUser from '~/components/common/DiscordUser.vue';

definePageMeta({
  title: 'Prochains Anniversaires',
  icon: '📅',
  description: 'Liste des anniversaires à venir sur le serveur',
  section: 'modules',
  hidden: true
});

useSeoMeta({
  title: 'Prochains Anniversaires - Bot',
  description: 'Liste des anniversaires à venir sur le serveur',
  ogTitle: 'Prochains Anniversaires - Bot',
  ogDescription: 'Liste des anniversaires à venir sur le serveur'
});

const { apiFetch } = useDiscordApi();
const { config, load: loadConfig } = useConfigFeature('birthdays', {
  defaultConfig: {
    enabled: true,
    mode: 'public',
    announce: {
      channel_id: null,
      hour: 9,
      timezone: 'Europe/Paris'
    },
    gifts: {
      xp_per_birthday: 500
    }
  }
});

const loading = ref(false);
const upcomingBirthdays = ref<any[]>([]);

async function loadUpcoming() {
  loading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data: any[] }>('/api/birthdays/upcoming?limit=30');
    if (res.success && Array.isArray(res.data)) {
      upcomingBirthdays.value = res.data;
    }
  } catch (err) {
    console.error('Erreur chargement anniversaires à venir:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadConfig(), loadUpcoming()]);
});
</script>

<style scoped>
.kpis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  padding: 16px;
}

.kpi-icon {
  font-size: 28px;
}

.kpi-val {
  font-size: 18px;
  font-weight: 700;
  color: var(--header-primary, #ffffff);
}

.kpi-lbl {
  font-size: 12px;
  color: var(--text-muted, #949ba4);
}

.card-section {
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}

.btn-secondary-sm {
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
  color: var(--text-normal, #dbdee1);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.badge-mode {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--bg-modifier-hover, rgba(255, 255, 255, 0.07));
  color: var(--text-muted, #949ba4);
}

.birthdays-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.birthday-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
  border-radius: 6px;
  gap: 12px;
  flex-wrap: wrap;
}

.bday-date {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-normal, #dbdee1);
}

.age-hint {
  color: var(--text-muted, #949ba4);
  font-size: 12px;
  font-weight: normal;
}

.days-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--bg-modifier-hover, rgba(255, 255, 255, 0.07));
  color: var(--text-normal, #dbdee1);
}

.today-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(87, 242, 135, 0.15);
  color: #57f287;
  border: 1px solid rgba(87, 242, 135, 0.3);
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: var(--text-muted, #949ba4);
  font-size: 13px;
}
</style>
