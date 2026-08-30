<template>
  <div class="view-panel">
    <!-- Onglets de sous-navigation Game -->
    <div class="module-subtabs">
      <button
        :class="['module-subtab-btn', { active: activeSubTab === 'stats' }]"
        @click="activeSubTab = 'stats'"
      >
        📊 Statistiques & Classement
      </button>
      <button
        :class="['module-subtab-btn', { active: activeSubTab === 'config' }]"
        @click="activeSubTab = 'config'"
      >
        ⚙️ Configuration du Jeu
      </button>
    </div>


    <!-- SOUS-ONGLET 1 : STATS & CLASSEMENT -->
    <div v-if="activeSubTab === 'stats'" class="module-view-scroller">
      <!-- Bannière Stats -->
      <div class="module-stats-banner">
        <div class="module-stat-card">
          <div class="module-stat-icon">🔢</div>
          <div class="module-stat-info">
            <span class="module-stat-label">Nombre Courant</span>
            <span class="module-stat-value" style="color: var(--green); font-size: 24px;">
              {{ gameState.current_number || 0 }}
            </span>
            <span class="module-stat-sub">Prochain nombre attendu : {{ (gameState.current_number || 0) + 1 }}</span>
          </div>
        </div>

        <div class="module-stat-card">
          <div class="module-stat-icon">⚠️</div>
          <div class="module-stat-info">
            <span class="module-stat-label">Erreurs / Tolérance</span>
            <span class="module-stat-value" :style="{ color: (gameState.error_count || 0) > 0 ? 'var(--yellow)' : 'var(--green)' }">
              {{ gameState.error_count || 0 }} / {{ config.max_errors || 1 }}
            </span>
            <span class="module-stat-sub">
              {{ Math.max(0, (config.max_errors || 1) - (gameState.error_count || 0)) }} restante(s) avant réinitialisation
            </span>
          </div>
        </div>

        <div class="module-stat-card">
          <div class="module-stat-icon">📢</div>
          <div class="module-stat-info">
            <span class="module-stat-label">Salon Dédié</span>
            <span class="module-stat-value">#{{ channelName }}</span>
            <span class="module-stat-sub">ID: {{ config.channel_id || 'Non défini' }}</span>
          </div>
        </div>
      </div>

      <!-- Tableau du Classement de la Session -->
      <div class="module-history-header">
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

      <div v-else class="module-table-wrapper">
        <table class="module-table">
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
    <div v-else-if="activeSubTab === 'config'" class="module-view-scroller">
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

        <div class="form-row">
          <div class="col-half">
            <label class="form-label">Salon du Jeu (Route vers l'Infini)</label>
            <DiscordChannelSelect
              v-model="config.channel_id"
              placeholder="Sélectionner le salon du compteur..."
              :filter-text-only="true"
            />
          </div>
          <div class="col-half">
            <label class="form-label">Erreurs Max avant Reset</label>
            <input v-model.number="config.max_errors" type="number" min="1" max="100" class="discord-input" />
            <span class="form-help" style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 4px;">
              Nombre de fautes autorisées avant remise à 0 du compteur (défaut : 1).
            </span>
          </div>
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
          <label class="form-label">Message d'Avertissement d'Erreur ({userId}, {errorsCount}, {maxErrors}, {expectedNumber})</label>
          <input v-model="config.messages.warning_message" type="text" class="discord-input" placeholder="⚠️ <@{userId}> s'est trompé(e) ! ({errorsCount}/{maxErrors} erreurs)..." />
        </div>

        <div>
          <label class="form-label">En-tête Message Défaite / Reset ({maxErrors})</label>
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
import { ref, computed, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import { useAppState } from '~/composables/useAppState.ts';
import { useConfigFeature } from '~/composables/useConfigFeature.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();
const { discordChannels } = useAppState();
const { config, isSaving, load: loadCounterConfig, save: saveCounterConfig } = useConfigFeature('counter', {
  defaultConfig: {
    enabled: true,
    channel_id: '1533492692825276598',
    max_errors: 1,
    emojis: { obsybon_id: '1524104068514189422', obsydemon_id: '1488145689916473544' },
    messages: {
      double_post_message: '',
      warning_message: '',
      ranking_header: '',
      ranking_footer: '',
      no_participation: '',
      embed_title: '❌ Perdu !',
      embed_color: '#F2C7CE'
    }
  }
});

const activeSubTab = ref<'stats' | 'config'>('stats');
const gameState = ref<any>({ current_number: 0, error_count: 0 });
const scores = ref<any[]>([]);
const isLoading = ref(true);

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
    }
    await loadCounterConfig();
  } catch (err) {
    console.error('Erreur chargement counter game:', err);
  } finally {
    isLoading.value = false;
  }
}

async function saveGameConfig() {
  try {
    await saveCounterConfig();
    showToast('Configuration Route de l\'Infini enregistrée !', 'success');
  } catch (err: any) {
    showToast(`Erreur d'enregistrement: ${err.message}`, 'error');
  }
}
</script>
