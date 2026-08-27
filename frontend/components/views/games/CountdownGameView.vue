<template>
  <div class="view-panel">
    <!-- Onglets de sous-navigation Game -->
    <div class="module-subtabs">
      <button
        :class="['module-subtab-btn', { active: activeSubTab === 'stats' }]"
        @click="activeSubTab = 'stats'"
      >
        📊 Progression & Parties
      </button>
      <button
        :class="['module-subtab-btn', { active: activeSubTab === 'config' }]"
        @click="activeSubTab = 'config'"
      >
        ⚙️ Configuration du Jeu
      </button>
    </div>


    <!-- SOUS-ONGLET 1 : STATS & PROGRESSION -->
    <div v-if="activeSubTab === 'stats'" class="daily-scroller">
      <!-- Bannière Stats -->
      <div class="daily-stats-banner">
        <div class="daily-stat-card">
          <div class="daily-stat-icon">⏳</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Décompte Courant</span>
            <span class="daily-stat-value" style="color: #f5b041; font-size: 24px;">
              {{ gameState.current_number || config.start_number || 900 }}
            </span>
            <span class="daily-stat-sub">Objectif : 0 (Départ {{ config.start_number || 900 }})</span>
          </div>
        </div>

        <div class="daily-stat-card">
          <div class="daily-stat-icon">⚠️</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Erreurs / Tolérance</span>
            <span class="daily-stat-value" :style="{ color: (gameState.error_count || 0) > 0 ? 'var(--yellow)' : 'var(--green)' }">
              {{ gameState.error_count || 0 }} / {{ config.max_errors || 1 }}
            </span>
            <span class="daily-stat-sub">
              {{ Math.max(0, (config.max_errors || 1) - (gameState.error_count || 0)) }} restante(s) avant réinitialisation
            </span>
          </div>
        </div>

        <div class="daily-stat-card">
          <div class="daily-stat-icon">🪤</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Statut Piège Bot</span>
            <span class="daily-stat-value" :style="{ color: gameState.is_trap_active ? 'var(--red)' : 'var(--green)' }">
              {{ gameState.is_trap_active ? '⚠️ PIÈGE EN COURS !' : 'Désactivé' }}
            </span>
            <span class="daily-stat-sub">{{ (config.trap_chance * 100) || 15 }}% chance par tour</span>
          </div>
        </div>

        <div class="daily-stat-card">
          <div class="daily-stat-icon">📢</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Salon Dédié</span>
            <span class="daily-stat-value">#{{ channelName }}</span>
            <span class="daily-stat-sub">ID: {{ config.channel_id || 'Non défini' }}</span>
          </div>
        </div>
      </div>

      <!-- Progression de la Partie -->
      <div class="config-card">
        <div class="card-subtitle">Progression vers la Victoire (Objectif 0)</div>
        <div style="width: 100%; height: 12px; background-color: var(--bg-tertiary); border-radius: 6px; overflow: hidden; margin-top: 8px;">
          <div
            :style="{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #5865F2, #23a55a)', transition: 'width 0.3s ease' }"
          ></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-top: 4px;">
          <span>Départ: {{ config.start_number || 900 }}</span>
          <span>{{ progressPercent }}% complété</span>
          <span>Objectif: 0</span>
        </div>
      </div>

      <!-- Classement de la Partie -->
      <div class="daily-history-header">
        <h3>Classement de la Partie</h3>
        <button class="action-btn" @click="loadGameData">
          🔄 Rafraîchir
        </button>
      </div>

      <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>

      <div v-else-if="scores.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
        Aucune participation enregistrée pour la partie en cours.
      </div>

      <div v-else class="users-table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th style="width: 70px;">Rang</th>
              <th>Joueur</th>
              <th style="width: 140px;">Points Validés</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s, idx) in scores" :key="s.user_id">
              <td>
                <strong :style="{ color: idx === 0 ? '#f1c40f' : idx === 1 ? '#bdc3c7' : idx === 2 ? '#e67e22' : 'var(--text-muted)' }">
                  {{ idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}` }}
                </strong>
              </td>
              <td>
                <strong style="color: var(--header-primary);">{{ s.username }}</strong>
                <span style="font-size: 11px; color: var(--text-muted); margin-left: 6px; font-family: var(--font-code);">ID: {{ s.user_id }}</span>
              </td>
              <td>
                <span class="user-level-pill" style="font-size: 13px;">
                  {{ s.score }} point(s)
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SOUS-ONGLET 2 : CONFIGURATION DU JEU -->
    <div v-else-if="activeSubTab === 'config'" class="daily-scroller">
      <div class="config-card">
        <div class="form-group-toggle">
          <div class="toggle-info">
            <span class="form-label">Activer le jeu Countdown</span>
            <p class="form-help">Décompte de {{ config.start_number || 900 }} à 0 avec pièges aléatoires du bot.</p>
          </div>
          <label class="switch">
            <input v-model="config.enabled" type="checkbox" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="form-divider"></div>

        <div class="form-row">
          <div class="col-half">
            <label class="form-label">Salon du Jeu Countdown</label>
            <DiscordChannelSelect
              v-model="config.channel_id"
              placeholder="Sélectionner le salon countdown..."
              :filter-text-only="true"
            />
          </div>
          <div class="col-half">
            <label class="form-label">Nombre de Départ</label>
            <input v-model.number="config.start_number" type="number" class="discord-input" />
          </div>
        </div>

        <div class="form-row">
          <div class="col-half">
            <label class="form-label">Probabilité de Piège (0.15 = 15%)</label>
            <input v-model.number="config.trap_chance" type="number" step="0.05" min="0" max="1" class="discord-input" />
          </div>
          <div class="col-half">
            <label class="form-label">Erreurs Max avant Reset</label>
            <input v-model.number="config.max_errors" type="number" min="1" max="100" class="discord-input" />
            <span class="form-help" style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 4px;">
              Nombre de fautes tolérées avant remise à zéro (défaut : 1).
            </span>
          </div>
        </div>

        <div class="card-subtitle" style="margin-top: 10px;">Messages Personnalisés</div>
        <div>
          <label class="form-label">Message de Début / Reset ({number})</label>
          <input v-model="config.messages.start_message" type="text" class="discord-input" />
        </div>

        <div>
          <label class="form-label">Message Esquive de Piège</label>
          <input v-model="config.messages.trap_dodge_message" type="text" class="discord-input" />
        </div>

        <div>
          <label class="form-label">Message Tombé dans le Piège ({userId}, {errorsCount}, {maxErrors}, {expectedNumber})</label>
          <input v-model="config.messages.trap_failed_message" type="text" class="discord-input" />
        </div>

        <div>
          <label class="form-label">Message d'Avertissement d'Erreur ({userId}, {errorsCount}, {maxErrors}, {expectedNumber})</label>
          <input v-model="config.messages.warning_message" type="text" class="discord-input" placeholder="⚠️ <@{userId}> s'est trompé(e) ! ({errorsCount}/{maxErrors} erreurs)..." />
        </div>

        <div>
          <label class="form-label">Message de Victoire (Arrivée à 0)</label>
          <input v-model="config.messages.finish_message" type="text" class="discord-input" />
        </div>

        <div>
          <label class="form-label">Message d'Erreur ({userId})</label>
          <input v-model="config.messages.error_message" type="text" class="discord-input" />
        </div>

        <div class="config-actions-bar">
          <button class="btn-primary" :disabled="isSaving" @click="saveGameConfig">
            {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Configuration Countdown' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import { useAppState } from '~/composables/useAppState.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();
const { discordChannels } = useAppState();

const activeSubTab = ref<'stats' | 'config'>('stats');
const gameState = ref<any>({ current_number: 900, is_trap_active: 0, error_count: 0 });
const scores = ref<any[]>([]);
const config = ref<any>({
  enabled: true,
  channel_id: '1533492760697503805',
  start_number: 900,
  max_errors: 1,
  trap_chance: 0.15,
  emojis: { obsybon_id: '1524104068514189422', obsydemon_id: '1488145689916473544' },
  messages: {
    start_message: '',
    double_post_message: '',
    trap_dodge_message: '',
    trap_failed_message: '',
    finish_message: '',
    warning_message: '',
    error_message: '',
    no_participation: '',
    embed_title: '🏆 **Classement de la partie**',
    embed_color: '#F2C7CE'
  }
});
const isLoading = ref(true);
const isSaving = ref(false);

const channelName = computed(() => {
  const chId = config.value?.channel_id;
  if (!chId) return 'countdown';
  const found = discordChannels.value.find(c => c.id === chId);
  return found ? found.name : chId;
});

const progressPercent = computed(() => {
  const start = config.value?.start_number || 900;
  const current = gameState.value?.current_number !== undefined ? gameState.value.current_number : start;
  if (start <= 0) return 100;
  const done = Math.max(0, start - current);
  return Math.min(100, Math.round((done / start) * 100));
});

onMounted(() => {
  loadGameData();
});

async function loadGameData() {
  isLoading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data?: any }>('/api/games/countdown');
    if (res.success && res.data) {
      gameState.value = res.data.state || { current_number: 900 };
      scores.value = res.data.scores || [];
      if (res.data.config) {
        config.value = {
          ...config.value,
          ...res.data.config,
          messages: { ...config.value.messages, ...(res.data.config.messages || {}) }
        };
      }
    }
  } catch (err) {
    console.error('Erreur chargement countdown game:', err);
  } finally {
    isLoading.value = false;
  }
}

async function saveGameConfig() {
  isSaving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/config', {
      method: 'POST',
      body: JSON.stringify({
        module: 'countdown',
        config: config.value
      })
    });
    if (res.success) {
      showToast('Configuration Countdown enregistrée dans config.yml !', 'success');
    }
  } catch (err: any) {
    showToast(`Erreur d'enregistrement: ${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>
