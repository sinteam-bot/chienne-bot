<template>
  <div class="birthdays-page">
    <header class="birthdays-page__header">
      <div>
        <h1>🎂 Anniversaires</h1>
        <p>Célébration automatique des anniversaires des membres, attribution de rôles temporaires et cadeaux.</p>
      </div>
      <div class="birthdays-page__tabs">
        <button
          class="tab-btn"
          :class="{ active: currentTab === 'overview' }"
          @click="currentTab = 'overview'"
        >
          📅 Prochains Anniversaires
        </button>
        <button
          class="tab-btn"
          :class="{ active: currentTab === 'config' }"
          @click="currentTab = 'config'"
        >
          ⚙️ Configuration
        </button>
      </div>
    </header>

    <!-- Onglet 1: Aperçu & Prochains Anniversaires -->
    <div v-if="currentTab === 'overview'" class="tab-content">
      <div class="kpis-grid">
        <div class="kpi-card">
          <div class="kpi-icon">🎂</div>
          <div class="kpi-info">
            <div class="kpi-val">{{ config.enabled ? 'Activé' : 'Désactivé' }}</div>
            <div class="kpi-lbl">Statut du module</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">🎁</div>
          <div class="kpi-info">
            <div class="kpi-val">{{ config.gifts.xp_per_birthday }} XP</div>
            <div class="kpi-lbl">Cadeau XP annuel</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">⏰</div>
          <div class="kpi-info">
            <div class="kpi-val">{{ config.announce.hour }}:00</div>
            <div class="kpi-lbl">Heure d'annonce</div>
          </div>
        </div>
      </div>

      <div class="card-section">
        <div class="card-header">
          <h2>🎉 Anniversaires à venir</h2>
          <span class="badge-mode">Mode : {{ config.mode === 'public' ? 'Public (Global)' : 'Privé (Serveur)' }}</span>
        </div>

        <div v-if="loading" class="empty-state">Chargement des anniversaires…</div>
        <div v-else-if="upcomingBirthdays.length === 0" class="empty-state">
          Aucun anniversaire enregistré ou à venir prochainement. Les membres peuvent renseigner leur date avec <code>/anniversaire set</code>.
        </div>
        <div v-else class="birthdays-list">
          <div v-for="b in upcomingBirthdays" :key="b.userId" class="birthday-row">
            <div class="bday-user">
              <DiscordUser :user-id="b.userId" :show-id="true" />
            </div>
            <div class="bday-date">
              🗓️ {{ b.dateFormatted }}
            </div>
            <div class="bday-days">
              <span v-if="b.daysLeft === 0" class="today-badge">🎉 Aujourd'hui !</span>
              <span v-else>Dans {{ b.daysLeft }} jour(s)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Onglet 2: Configuration -->
    <div v-else-if="currentTab === 'config'" class="tab-content config-tab">
      <div class="config-card">
        <div class="card-subtitle">⚙️ Paramètres Généraux</div>
        <div class="config-item">
          <div class="config-label-group">
            <label class="config-label">Activer le module Anniversaires</label>
            <span class="config-hint">Planifie les annonces quotidiennes et l'attribution des rôles.</span>
          </div>
          <label class="switch">
            <input v-model="config.enabled" type="checkbox" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="form-divider"></div>

        <div class="form-row">
          <div class="col-half">
            <label class="form-label">Mode de visibilité BDD</label>
            <select v-model="config.mode" class="discord-input discord-select">
              <option value="public">Public (Partagé entre tous les serveurs compatibles)</option>
              <option value="private">Privé (Propre uniquement à ce serveur)</option>
            </select>
          </div>
          <div class="col-half">
            <label class="form-label">Heure de l'annonce (Fuseau: {{ config.announce.timezone }})</label>
            <input v-model.number="config.announce.hour" type="number" min="0" max="23" class="discord-input" />
          </div>
        </div>
      </div>

      <!-- Salon d'Annonce et Message -->
      <div class="config-card">
        <div class="card-subtitle">📢 Salon &amp; Message d'Annonce</div>
        <div class="form-row">
          <div class="col-half">
            <label class="form-label">Salon d'Annonce</label>
            <DiscordChannelSelect
              v-model="config.announce.channel_id"
              :allow-null="true"
              null-label="— Aucun salon (désactiver l'annonce publique) —"
              :filter-text-only="true"
            />
          </div>
          <div class="col-half">
            <label class="form-label">Rôle à mentionner le jour J (Optionnel)</label>
            <DiscordRoleSelect
              v-model="config.announce.ping_role_id"
              :allow-null="true"
              null-label="— Aucun ping —"
            />
          </div>
        </div>

        <div style="margin-top: 14px;">
          <label class="form-label">Template du message ({user}, {age})</label>
          <input
            v-model="config.announce.message_template"
            type="text"
            class="discord-input"
            placeholder="🎂 Joyeux anniversaire {user} ! Tu fêtes tes **{age} ans** aujourd'hui ! 🎉"
          />
        </div>
      </div>

      <!-- Rôle temporaire & Cadeaux XP -->
      <div class="config-card">
        <div class="card-subtitle">🎁 Rôle Temporaire &amp; Cadeaux</div>
        <div class="config-item">
          <div class="config-label-group">
            <label class="config-label">Rôle Temporaire le Jour J</label>
            <span class="config-hint">Attribue un rôle festif le jour de l'anniversaire et le retire automatiquement à minuit.</span>
          </div>
          <label class="switch">
            <input v-model="config.temp_role.enabled" type="checkbox" />
            <span class="slider"></span>
          </label>
        </div>

        <div v-if="config.temp_role.enabled" style="margin-top: 14px;">
          <label class="form-label">Rôle festif à attribuer</label>
          <DiscordRoleSelect
            v-model="config.temp_role.role_id"
            :allow-null="true"
            null-label="— Sélectionner le rôle festif —"
          />
        </div>

        <div class="form-divider"></div>

        <div class="form-row">
          <div class="col-half">
            <label class="form-label">Bonus XP d'anniversaire offert</label>
            <input v-model.number="config.gifts.xp_per_birthday" type="number" min="0" step="50" class="discord-input" />
          </div>
          <div class="col-half">
            <label class="form-label">Nombre max de cadeaux par membre</label>
            <input v-model.number="config.gifts.max_per_user" type="number" min="1" max="10" class="discord-input" />
          </div>
        </div>
      </div>

      <div class="config-actions-bar">
        <button class="btn-primary" :disabled="isSaving" @click="saveConfig">
          {{ isSaving ? 'Enregistrement…' : '💾 Sauvegarder Configuration Anniversaires' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi';
import { useToast } from '~/composables/useToast';
import DiscordUser from '~/components/common/DiscordUser.vue';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';
import DiscordRoleSelect from '~/components/ui/DiscordRoleSelect.vue';

definePageMeta({
  title: 'Anniversaires',
  icon: '🎂',
  description: 'Célébration automatique des anniversaires, rôles temporaires et cadeaux',
  section: 'modules',
  order: 6
});

useSeoMeta({
  title: 'Anniversaires - Chienne Bot',
  description: 'Célébration automatique des anniversaires, rôles temporaires et cadeaux',
  ogTitle: 'Anniversaires - Chienne Bot',
  ogDescription: 'Célébration automatique des anniversaires, rôles temporaires et cadeaux'
});

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const currentTab = ref<'overview' | 'config'>('overview');
const loading = ref(false);
const isSaving = ref(false);

const upcomingBirthdays = ref<any[]>([]);

const config = ref<any>({
  enabled: false,
  allowed_roles: [],
  mode: 'public',
  default_visibility: true,
  announce: {
    channel_id: null,
    hour: 9,
    timezone: 'Europe/Paris',
    ping_role_id: null,
    message_template: '🎂 Joyeux anniversaire {user} ! Tu fêtes tes **{age} ans** aujourd\'hui ! 🎉'
  },
  temp_role: {
    enabled: true,
    role_id: null
  },
  gifts: {
    max_per_user: 2,
    xp_per_birthday: 500
  },
  cooldown: {
    first_change_days: 1,
    second_change_days: 2,
    third_change_days: 180,
    default_change_days: 365
  }
});

async function loadConfig() {
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/config');
    if (res.success && res.data?.birthdays) {
      const b = res.data.birthdays;
      config.value = {
        ...config.value,
        ...b,
        announce: { ...config.value.announce, ...(b.announce || {}) },
        temp_role: { ...config.value.temp_role, ...(b.temp_role || {}) },
        gifts: { ...config.value.gifts, ...(b.gifts || {}) }
      };
    }
  } catch (err) {
    console.error('Erreur chargement config birthdays:', err);
  }
}

async function saveConfig() {
  isSaving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/config', {
      method: 'POST',
      body: {
        module: 'birthdays',
        config: config.value
      }
    });
    if (res.success) {
      showToast('Configuration Anniversaires enregistrée avec succès !', 'success');
    } else {
      showToast('Erreur lors de l\'enregistrement', 'error');
    }
  } catch (err: any) {
    showToast('Erreur: ' + err.message, 'error');
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.birthdays-page {
  max-width: 1100px;
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

.birthdays-page__tabs {
  display: flex;
  gap: 8px;
  background: #1e1f22;
  padding: 4px;
  border-radius: 8px;
}

.tab-btn {
  background: transparent;
  border: none;
  color: #b5bac1;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn.active {
  background: #5865f2;
  color: white;
  font-weight: 600;
}

.tab-content { display: flex; flex-direction: column; gap: 20px; }

.kpis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-radius: 8px;
  padding: 16px 20px;
}

.kpi-icon { font-size: 30px; }
.kpi-val { font-size: 20px; font-weight: bold; color: #f2f3f5; }
.kpi-lbl { font-size: 12px; color: #80848e; }

.card-section {
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-radius: 8px;
  padding: 20px 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h2 { margin: 0; font-size: 18px; }
.badge-mode { background: #1e1f22; padding: 4px 10px; border-radius: 6px; font-size: 12px; color: #fee75c; }

.empty-state {
  text-align: center;
  color: #b5bac1;
  padding: 30px;
  background: #1e1f22;
  border-radius: 6px;
  font-size: 14px;
}
.empty-state code { font-family: 'JetBrains Mono', monospace; background: #2b2d31; padding: 2px 6px; border-radius: 4px; }

.birthdays-list { display: flex; flex-direction: column; gap: 8px; }
.birthday-row {
  display: grid;
  grid-template-columns: 1fr 140px 140px;
  align-items: center;
  background: #1e1f22;
  border-radius: 6px;
  padding: 12px 16px;
}

.today-badge {
  background: #57f287;
  color: #1e1f22;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

/* Config cards */
.config-card {
  background: #2b2d31;
  border: 1px solid #3f4147;
  border-radius: 8px;
  padding: 20px 24px;
}

.card-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: #f2f3f5;
  margin-bottom: 14px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.config-label { font-weight: 500; color: #f2f3f5; font-size: 14px; }
.config-hint { font-size: 12px; color: #80848e; display: block; }

.form-divider { height: 1px; background: #3f4147; margin: 16px 0; }
.form-row { display: flex; gap: 16px; flex-wrap: wrap; }
.col-half { flex: 1; min-width: 260px; }
.form-label { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #b5bac1; margin-bottom: 6px; }

.discord-input, .discord-select {
  width: 100%; background: #1e1f22; border: 1px solid #3f4147; color: #f2f3f5;
  border-radius: 4px; padding: 10px 12px; font-size: 14px; outline: none;
}
.discord-input:focus, .discord-select:focus { border-color: #5865f2; }

.config-actions-bar { display: flex; justify-content: flex-end; margin-top: 10px; }
.btn-primary {
  background: #5865f2; color: white; border: none; border-radius: 6px;
  padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer;
}
.btn-primary:hover:not(:disabled) { background: #4752c4; }

/* Switch */
.switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #4e5058; transition: .3s; border-radius: 24px; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
input:checked + .slider { background-color: #57f287; }
input:checked + .slider:before { transform: translateX(20px); }
</style>
