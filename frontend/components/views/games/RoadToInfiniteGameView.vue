<template>
  <div class="view-panel">
    <!-- Onglets de sous-navigation Game -->
    <div class="captcha-subtabs" style="padding: 12px 24px 0 24px; background-color: var(--bg-secondary);">
      <button
        :class="['captcha-subtab-btn', { active: activeSubTab === 'stats' }]"
        @click="activeSubTab = 'stats'"
      >
        📊 Statistiques & Classement
      </button>
      <button
        :class="['captcha-subtab-btn', { active: activeSubTab === 'config' }]"
        @click="activeSubTab = 'config'"
      >
        ⚙️ Configuration du Jeu
      </button>
    </div>

    <!-- SOUS-ONGLET 1 : STATS & CLASSEMENT -->
    <div v-if="activeSubTab === 'stats'" class="daily-scroller">
      <!-- Bannière Stats -->
      <div class="daily-stats-banner">
        <div class="daily-stat-card">
          <div class="daily-stat-icon">🔢</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Nombre Courant</span>
            <span class="daily-stat-value" style="color: var(--green); font-size: 24px;">
              {{ gameState.current_number || 0 }}
            </span>
            <span class="daily-stat-sub">Prochain nombre attendu : {{ (gameState.current_number || 0) + 1 }}</span>
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

        <div class="daily-stat-card">
          <div class="daily-stat-icon">🏆</div>
          <div class="daily-stat-info">
            <span class="daily-stat-label">Joueurs Actifs</span>
            <span class="daily-stat-value">{{ scores.length }}</span>
            <span class="daily-stat-sub">Scores de la session</span>
          </div>
        </div>
      </div>

      <!-- Tableau du Classement de la Session -->
      <div class="daily-history-header">
        <h3>Classement des Joueurs (Session en cours)</h3>
        <button class="action-btn" @click="loadGameData">
          🔄 Rafraîchir
        </button>
      </div>

      <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>

      <div v-else-if="scores.length === 0" style="color: var(--text-muted); text-align: center; padding: 40px;">
        Aucune participation enregistrée pour la session en cours.
      </div>

      <div v-else class="users-table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th>Rang</th>
              <th>Joueur</th>
              <th>Points Validés</th>
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
    <div v-else-if="activeSubTab === 'config'" class="daily-scroller" style="max-width: 800px;">
      <div class="config-card">
        <div class="form-group-toggle">
          <div class="toggle-info">
            <span class="form-label">Activer le jeu Route de l'Infini</span>
            <p class="form-help">Valide les nombres consécutifs et attribue des points aux participants.</p>
          </div>
          <label class="switch">
            <input v-model="config.enabled" type="checkbox" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="form-divider"></div>

        <div>
          <label class="form-label">Salon du Jeu (Route vers l'Infini)</label>
          <DiscordChannelSelect
            v-model="config.channel_id"
            placeholder="Sélectionner le salon du compteur..."
            :filter-text-only="true"
          />
        </div>

        <div class="card-subtitle" style="margin-top: 10px;">Emojis Personnalisés</div>
        <div class="form-row">
          <div class="col-half">
            <label class="form-label">Emoji Succès (Obsybon ID)</label>
            <input v-model="config.emojis.obsybon_id" type="text" class="discord-input" />
          </div>
          <div class="col-half">
            <label class="form-label">Emoji Erreur (Obsydemon ID)</label>
            <input v-model="config.emojis.obsydemon_id" type="text" class="discord-input" />
          </div>
        </div>

        <div class="card-subtitle" style="margin-top: 10px;">Messages Personnalisés</div>
        <div>
          <label class="form-label">Message Anti Double-Post</label>
          <input v-model="config.messages.double_post_message" type="text" class="discord-input" />
        </div>

        <div>
          <label class="form-label">En-tête Message Défaite / Ruine</label>
          <textarea v-model="config.messages.ranking_header" class="discord-textarea" rows="2"></textarea>
        </div>

        <div class="form-row">
          <div class="col-half">
            <label class="form-label">Titre de l'Embed de Défaite</label>
            <input v-model="config.messages.embed_title" type="text" class="discord-input" />
          </div>
          <div class="col-half">
            <label class="form-label">Couleur de l'Embed</label>
            <div class="color-picker-row">
              <input v-model="config.messages.embed_color" type="color" />
              <input v-model="config.messages.embed_color" type="text" class="discord-input" />
            </div>
          </div>
        </div>

        <div class="config-actions-bar">
          <button class="btn-primary" :disabled="isSaving" @click="saveGameConfig">
            {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Configuration Jeu Compteur' }}
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
const gameState = ref<any>({ current_number: 0 });
const scores = ref<any[]>([]);
const config = ref<any>({
  enabled: true,
  channel_id: '1533492692825276598',
  emojis: { obsybon_id: '1524104068514189422', obsydemon_id: '1488145689916473544' },
  messages: {
    double_post_message: '',
    ranking_header: '',
    ranking_footer: '',
    no_participation: '',
    embed_title: '❌ Perdu !',
    embed_color: '#F2C7CE'
  }
});
const isLoading = ref(true);
const isSaving = ref(false);

const channelName = computed(() => {
  const chId = config.value?.channel_id;
  if (!chId) return 'nombres';
  const found = discordChannels.value.find(c => c.id === chId);
  return found ? found.name : chId;
});

onMounted(() => {
  loadGameData();
});

async function loadGameData() {
  isLoading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data?: any }>('/api/games/counter');
    if (res.success && res.data) {
      gameState.value = res.data.state || { current_number: 0 };
      scores.value = res.data.scores || [];
      if (res.data.config) {
        config.value = {
          ...config.value,
          ...res.data.config,
          emojis: { ...config.value.emojis, ...(res.data.config.emojis || {}) },
          messages: { ...config.value.messages, ...(res.data.config.messages || {}) }
        };
      }
    }
  } catch (err) {
    console.error('Erreur chargement counter game:', err);
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
        module: 'counter',
        config: config.value
      })
    });
    if (res.success) {
      showToast('Configuration Route de l\'Infini enregistrée dans config.yml !', 'success');
    }
  } catch (err: any) {
    showToast(`Erreur d'enregistrement: ${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>
