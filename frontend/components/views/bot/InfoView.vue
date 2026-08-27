<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <!-- Bannière de Statut Principal -->
      <div class="module-stats-banner">
        <div class="module-stat-card">
          <div class="module-stat-icon">🤖</div>
          <div class="module-stat-info">
            <span class="module-stat-label">État du Bot</span>
            <span class="module-stat-value" style="color: var(--green);">En Ligne & Opérationnel</span>
            <span class="module-stat-sub">Ping Discord: {{ stats.ping || 18 }} ms</span>
          </div>
        </div>

        <div class="module-stat-card">
          <div class="module-stat-icon">👥</div>
          <div class="module-stat-info">
            <span class="module-stat-label">Membres du Serveur</span>
            <span class="module-stat-value">{{ guild?.memberCount || users.length || 0 }}</span>
            <span class="module-stat-sub">{{ roles.length }} rôles configurés</span>
          </div>
        </div>

        <div class="module-stat-card">
          <div class="module-stat-icon">💬</div>
          <div class="module-stat-info">
            <span class="module-stat-label">Salons Discord</span>
            <span class="module-stat-value">{{ discordChannels.length }}</span>
            <span class="module-stat-sub">{{ discordChannels.length }} salons détectés</span>
          </div>
        </div>

        <div class="module-stat-card">
          <div class="module-stat-icon">⏱️</div>
          <div class="module-stat-info">
            <span class="module-stat-label">Uptime Serveur</span>
            <span class="module-stat-value">{{ stats.uptimeFormatted || 'En ligne' }}</span>
            <span class="module-stat-sub">Node.js {{ stats.nodeVersion || '' }}</span>
          </div>
        </div>
      </div>

      <!-- Grille d'informations détaillées -->
      <div class="info-grid">
        <!-- Carte Serveur Discord -->
        <div class="config-card">
          <div class="card-subtitle" style="display: flex; align-items: center; gap: 8px;">
            <span>⭐</span>
            <span>Serveur Discord</span>
          </div>

          <div style="display: flex; align-items: center; gap: 16px;">
            <img
              :src="getProxiedImageUrl(guild?.iconUrl)"
              alt="Guild Icon"
              loading="lazy"
              referrerpolicy="no-referrer"
              style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover;"
            />
            <div style="display: flex; flex-direction: column;">
              <h3 style="font-size: 18px; font-weight: 700; color: var(--header-primary);">{{ guild?.name || 'Chienne Bot Serveur' }}</h3>
              <span style="font-size: 12px; color: var(--text-muted); font-family: var(--font-code);">ID: {{ guild?.id || 'Inconnu' }}</span>
              <span v-if="guild?.ownerTag" style="font-size: 12px; color: var(--text-muted);">Propriétaire : <strong>{{ guild.ownerTag }}</strong></span>
            </div>
          </div>
        </div>

        <!-- Carte Profil du Bot -->
        <div class="config-card">
          <div class="card-subtitle" style="display: flex; align-items: center; gap: 8px;">
            <span>🐕</span>
            <span>Identité du Bot</span>
          </div>

          <div style="display: flex; align-items: center; gap: 16px;">
            <img
              :src="getProxiedImageUrl(botProfile.avatarUrl)"
              alt="Bot Avatar"
              loading="lazy"
              referrerpolicy="no-referrer"
              style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover;"
            />
            <div style="display: flex; flex-direction: column;">
              <h3 style="font-size: 18px; font-weight: 700; color: var(--header-primary);">
                {{ botProfile.username }}
                <span class="bot-badge">BOT</span>
              </h3>
              <span style="font-size: 12px; color: var(--text-muted); font-family: var(--font-code);">Tag: {{ botProfile.tag }}</span>
              <span style="font-size: 12px; color: var(--green);">● Statut: {{ botProfile.customStatus || 'En ligne' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TABLEAU RÉCAPITULATIF DES MODULES (config.yml)                            -->
      <!-- ========================================================================= -->
      <div class="config-card" style="margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
          <div>
            <div class="card-subtitle" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span>📊</span>
              <span>État des Modules & Fonctionnalités (config.yml)</span>
            </div>
            <p class="config-desc" style="margin: 0;">
              Vue consolidée de l'activation et configuration de chaque module du bot.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="module-status-pill verified" style="font-size: 12px;">
              🟢 {{ activeModulesCount }} Actif{{ activeModulesCount > 1 ? 's' : '' }}
            </span>
            <span class="module-status-pill failed" style="font-size: 12px;">
              🔴 {{ inactiveModulesCount }} Inactif{{ inactiveModulesCount > 1 ? 's' : '' }}
            </span>
            <button class="action-btn" :disabled="loadingModules" @click="fetchModulesStatus" title="Rafraîchir les statuts">
              🔄 Rafraîchir
            </button>
          </div>
        </div>

        <!-- Filtres et Recherche -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; background: var(--bg-secondary-alt); padding: 10px 14px; border-radius: 6px;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 200px;">
            <span style="font-size: 14px; color: var(--text-muted);">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Filtrer un module ou sous-fonctionnalité..."
              class="discord-input"
              style="padding: 6px 10px; font-size: 13px; height: 32px;"
            />
          </div>

          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <button
              :class="['filter-pill-btn', { active: statusFilter === 'all' }]"
              @click="statusFilter = 'all'"
            >
              Tous ({{ modules.length }})
            </button>
            <button
              :class="['filter-pill-btn', { active: statusFilter === 'active' }]"
              @click="statusFilter = 'active'"
            >
              🟢 Actifs ({{ activeModulesCount }})
            </button>
            <button
              :class="['filter-pill-btn', { active: statusFilter === 'inactive' }]"
              @click="statusFilter = 'inactive'"
            >
              🔴 Inactifs ({{ inactiveModulesCount }})
            </button>
          </div>
        </div>

        <!-- Tableau des Modules -->
        <div v-if="loadingModules" style="display: flex; justify-content: center; padding: 40px;">
          <div class="spinner" style="width: 32px; height: 32px;"></div>
        </div>

        <div v-else class="module-table-wrapper">
          <table class="module-table">
            <thead>
              <tr>
                <th style="width: 28%;">Module</th>
                <th style="width: 28%;">Sous-fonctionnalité</th>
                <th style="width: 14%;">Catégorie</th>
                <th style="width: 18%;">Configuration</th>
                <th style="width: 12%;">État</th>
                <th style="width: 10%; text-align: center;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mod in filteredModules" :key="mod.key" :style="mod.parent ? 'background-color: rgba(0, 0, 0, 0.1);' : ''">
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;" :style="mod.parent ? 'padding-left: 20px;' : ''">
                    <span v-if="mod.parent" style="color: var(--text-muted); font-size: 12px;">└─</span>
                    <span style="font-size: 16px;">{{ mod.icon }}</span>
                    <span :style="mod.parent ? 'font-weight: 500; font-size: 13px;' : 'font-weight: 700; font-size: 13px; color: var(--header-primary);'">
                      {{ mod.name }}
                    </span>
                  </div>
                </td>
                <td>
                  <span style="color: var(--text-normal); font-size: 13px;">
                    {{ mod.subFeature }}
                  </span>
                </td>
                <td>
                  <span class="live-status-pill" style="font-size: 10px; background-color: rgba(88, 101, 242, 0.12); color: #c9cdfb;">
                    {{ mod.category }}
                  </span>
                </td>
                <td>
                  <span style="font-size: 12px; color: var(--text-muted); font-family: var(--font-code);">
                    {{ mod.details || '—' }}
                  </span>
                </td>
                <td>
                  <span v-if="mod.enabled" class="module-status-pill verified">
                    🟢 Activé
                  </span>
                  <span v-else class="module-status-pill failed">
                    🔴 Désactivé
                  </span>
                </td>
                <td style="text-align: center;">
                  <button
                    v-if="mod.viewId"
                    class="action-btn"
                    style="font-size: 11px; padding: 4px 8px;"
                    title="Ouvrir la vue dédiée pour configurer ce module"
                    @click="navigateTo(mod.viewId)"
                  >
                    ⚙️ Gérer
                  </button>
                  <span v-else style="color: var(--text-muted); font-size: 12px;">—</span>
                </td>
              </tr>

              <tr v-if="filteredModules.length === 0">
                <td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">
                  Aucun module ne correspond aux critères de recherche.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAppState } from '~/composables/useAppState.ts';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { getProxiedImageUrl } from '~/composables/useDiscordImageProxy.ts';

export interface ModuleStatusItem {
  key: string;
  name: string;
  subFeature: string;
  category: string;
  icon: string;
  enabled: boolean;
  parent?: string;
  viewId?: string;
  details?: string;
}

const { guild, botProfile, users, roles, discordChannels, stats, navigateTo, refreshAll } = useAppState();
const { apiFetch } = useDiscordApi();

const modules = ref<ModuleStatusItem[]>([]);
const loadingModules = ref(false);
const searchQuery = ref('');
const statusFilter = ref<'all' | 'active' | 'inactive'>('all');

async function fetchModulesStatus() {
  loadingModules.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data: ModuleStatusItem[] }>('/api/modules/status');
    if (res.success && Array.isArray(res.data)) {
      modules.value = res.data;
    }
  } catch (error: any) {
    console.warn('Erreur chargement modules status:', error.message);
  } finally {
    loadingModules.value = false;
  }
}

const activeModulesCount = computed(() => {
  return modules.value.filter(m => m.enabled).length;
});

const inactiveModulesCount = computed(() => {
  return modules.value.filter(m => !m.enabled).length;
});

const filteredModules = computed(() => {
  return modules.value.filter(mod => {
    // Filtre de statut
    if (statusFilter.value === 'active' && !mod.enabled) return false;
    if (statusFilter.value === 'inactive' && mod.enabled) return false;

    // Filtre de recherche texte
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchName = mod.name.toLowerCase().includes(q);
      const matchSub = mod.subFeature.toLowerCase().includes(q);
      const matchCat = mod.category.toLowerCase().includes(q);
      const matchDetails = (mod.details || '').toLowerCase().includes(q);
      return matchName || matchSub || matchCat || matchDetails;
    }

    return true;
  });
});

async function refreshAllData() {
  await Promise.all([
    refreshAll(),
    fetchModulesStatus()
  ]);
}

onMounted(() => {
  fetchModulesStatus();
});
</script>

<style scoped>
.filter-pill-btn {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-normal);
  border-color: var(--border-normal);
}

.filter-pill-btn.active {
  background: var(--brand-experiment, #5865f2);
  color: #fff;
  border-color: var(--brand-experiment, #5865f2);
}
</style>

