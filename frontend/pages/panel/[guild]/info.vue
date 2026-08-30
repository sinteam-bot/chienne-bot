<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <!-- 1. Bannière de Statut Principal -->
      <div class="module-stats-banner">
        <div class="module-stat-card">
          <div class="module-stat-icon">🤖</div>
          <div class="module-stat-info">
            <span class="module-stat-label">État du Bot</span>
            <span class="module-stat-value" style="color: var(--status-positive, #57f287);">En Ligne &amp; Opérationnel</span>
            <span class="module-stat-sub">Ping Discord : {{ stats.ping || 18 }} ms</span>
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
            <span class="module-stat-sub">{{ channelCategories.length }} catégories</span>
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

      <!-- 2. Grille d'identité : Serveur Discord & Profil Bot -->
      <div class="info-grid">
        <!-- Carte Serveur Discord -->
        <div class="config-card">
          <div class="card-subtitle" style="display: flex; align-items: center; gap: 8px;">
            <span>⭐</span>
            <span>Serveur Discord</span>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; margin-top: 10px;">
            <img
              :src="getProxiedImageUrl(guild?.iconUrl)"
              alt="Guild Icon"
              loading="lazy"
              referrerpolicy="no-referrer"
              style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover;"
            />
            <div style="display: flex; flex-direction: column; gap: 3px;">
              <h3 style="font-size: 18px; font-weight: 700; color: var(--header-primary, #ffffff); margin: 0;">
                {{ guild?.name || 'Serveur Discord' }}
              </h3>
              <span style="font-size: 12px; color: var(--text-muted, #949ba4); font-family: monospace;">
                ID : {{ currentGuildId }}
              </span>
              <div v-if="guild?.ownerId || guild?.ownerTag" style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted, #949ba4);">
                <span>Propriétaire :</span>
                <DiscordUser
                  v-if="guild?.ownerId"
                  :user-id="guild.ownerId"
                  :username="guild.ownerTag"
                  :avatar-size="20"
                />
                <strong v-else>{{ guild.ownerTag }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Carte Profil du Bot -->
        <div class="config-card">
          <div class="card-subtitle" style="display: flex; align-items: center; gap: 8px;">
            <span>🐕</span>
            <span>Identité du Bot</span>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; margin-top: 10px;">
            <img
              :src="getProxiedImageUrl(botProfile.avatarUrl)"
              alt="Bot Avatar"
              loading="lazy"
              referrerpolicy="no-referrer"
              style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover;"
            />
            <div style="display: flex; flex-direction: column;">
              <h3 style="font-size: 18px; font-weight: 700; color: var(--header-primary, #ffffff); margin: 0; display: flex; align-items: center; gap: 8px;">
                {{ botProfile.username }}
                <span class="bot-badge">BOT</span>
              </h3>
              <span style="font-size: 12px; color: var(--text-muted, #949ba4); font-family: monospace; margin-top: 2px;">
                Tag : {{ botProfile.tag }}
              </span>
              <span style="font-size: 12px; color: var(--status-positive, #57f287); margin-top: 2px;">
                ● Statut : {{ botProfile.customStatus || 'En ligne' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. TABLEAU / REGISTRE CONSOLIDÉ DES MODULES & FEATURES -->
      <div class="config-card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
          <div>
            <div class="card-subtitle" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span>🧩</span>
              <span>Modules &amp; Fonctionnalités du Serveur</span>
            </div>
            <p class="config-desc" style="margin: 0;">
              Activez ou désactivez les fonctionnalités en temps réel pour ce serveur et accédez à leur configuration complète.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <span class="module-status-pill verified" style="font-size: 12px;">
              🟢 {{ activeCount }} Actif{{ activeCount > 1 ? 's' : '' }}
            </span>
            <span class="module-status-pill failed" style="font-size: 12px;">
              🔴 {{ inactiveCount }} Inactif{{ inactiveCount > 1 ? 's' : '' }}
            </span>

            <!-- Bascule de mode d'affichage : Tableau / Grille -->
            <div class="view-mode-toggle">
              <button
                type="button"
                :class="['mode-btn', { active: viewMode === 'table' }]"
                title="Vue Tableau"
                @click="viewMode = 'table'"
              >
                📋 Tableau
              </button>
              <button
                type="button"
                :class="['mode-btn', { active: viewMode === 'grid' }]"
                title="Vue Grille de Cartes"
                @click="viewMode = 'grid'"
              >
                🃏 Cartes
              </button>
            </div>

            <button class="action-btn" :disabled="loading" title="Rafraîchir les fonctionnalités" @click="loadData">
              {{ loading ? '⏳ Chargement…' : '🔄 Rafraîchir' }}
            </button>
          </div>
        </div>

        <!-- Filtres & Recherche -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; background: var(--bg-tertiary, #1e1f22); padding: 10px 14px; border-radius: 6px;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 220px;">
            <span style="font-size: 14px; color: var(--text-muted, #949ba4);">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher une fonctionnalité, catégorie, description…"
              class="discord-input"
              style="padding: 6px 10px; font-size: 13px; height: 32px;"
            />
          </div>

          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <button
              :class="['filter-pill-btn', { active: statusFilter === 'all' }]"
              @click="statusFilter = 'all'"
            >
              Tous ({{ combinedFeatures.length }})
            </button>
            <button
              :class="['filter-pill-btn', { active: statusFilter === 'active' }]"
              @click="statusFilter = 'active'"
            >
              🟢 Actifs ({{ activeCount }})
            </button>
            <button
              :class="['filter-pill-btn', { active: statusFilter === 'inactive' }]"
              @click="statusFilter = 'inactive'"
            >
              🔴 Inactifs ({{ inactiveCount }})
            </button>
          </div>
        </div>

        <!-- Filtres rapides par Catégorie -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;">
          <button
            v-for="cat in availableCategories"
            :key="cat"
            :class="['category-pill-btn', { active: selectedCategory === cat }]"
            @click="selectedCategory = cat"
          >
            {{ cat }}
          </button>
        </div>

        <!-- État de chargement -->
        <div v-if="loading && combinedFeatures.length === 0" style="display: flex; justify-content: center; padding: 40px;">
          <div class="spinner" style="width: 32px; height: 32px;"></div>
        </div>

        <!-- 1. VUE TABLEAU -->
        <div v-else-if="viewMode === 'table'" class="module-table-wrapper">
          <table class="module-table">
            <thead>
              <tr>
                <th style="width: 24%;">Module &amp; Feature</th>
                <th style="width: 32%;">Description</th>
                <th style="width: 14%;">Catégorie</th>
                <th style="width: 12%;">Source</th>
                <th style="width: 10%; text-align: center;">Activation</th>
                <th style="width: 8%; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredFeatures" :key="item.name">
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">{{ item.emoji }}</span>
                    <div>
                      <div style="font-weight: 700; font-size: 13.5px; color: var(--header-primary, #ffffff);">
                        {{ item.title }}
                      </div>
                      <code style="font-size: 11px; color: var(--text-muted, #949ba4);">{{ item.name }}</code>
                    </div>
                  </div>
                </td>

                <td>
                  <span style="color: var(--text-normal, #dbdee1); font-size: 13px; line-height: 1.4;">
                    {{ item.description }}
                  </span>
                </td>

                <td>
                  <span class="category-badge-pill" :class="`cat-${item.category.toLowerCase().replace(/[^a-z0-9]/g, '')}`">
                    {{ item.category }}
                  </span>
                </td>

                <td>
                  <span class="source-badge" :class="`source-${item.source}`">
                    {{ getSourceLabel(item.source) }}
                  </span>
                </td>

                <td style="text-align: center;">
                  <label class="switch" :title="item.enabled ? 'Désactiver cette feature' : 'Activer cette feature'">
                    <input
                      type="checkbox"
                      :checked="item.enabled"
                      :disabled="item.busy"
                      @change="toggleFeature(item)"
                    />
                    <span class="slider"></span>
                  </label>
                </td>

                <td style="text-align: center;">
                  <button
                    class="btn-config-action"
                    title="Accéder aux paramètres de cette fonctionnalité"
                    @click="goToConfig(item.configRoute)"
                  >
                    ⚙️ Configurer
                  </button>
                </td>
              </tr>

              <tr v-if="filteredFeatures.length === 0">
                <td colspan="6" style="text-align: center; padding: 36px; color: var(--text-muted, #949ba4);">
                  Aucune fonctionnalité ne correspond aux filtres sélectionnés.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 2. VUE GRILLE DE CARTES -->
        <div v-else class="features-page__grid">
          <div
            v-for="item in filteredFeatures"
            :key="item.name"
            class="feature-card"
            :class="{ 'is-enabled': item.enabled, 'is-disabled': !item.enabled }"
          >
            <div class="feature-card__header">
              <span class="feature-card__emoji">{{ item.emoji }}</span>
              <div class="feature-card__title-block">
                <h3 class="feature-card__title">{{ item.title }}</h3>
                <p class="feature-card__name">{{ item.name }}</p>
              </div>
              <label class="feature-card__toggle" :title="item.enabled ? 'Désactiver' : 'Activer'">
                <input
                  type="checkbox"
                  :checked="item.enabled"
                  :disabled="item.busy"
                  @change="toggleFeature(item)"
                />
                <span class="feature-card__toggle-track">
                  <span class="feature-card__toggle-thumb"></span>
                </span>
              </label>
            </div>

            <p class="feature-card__description">{{ item.description }}</p>

            <div class="feature-card__footer" style="margin-top: auto; padding-top: 10px; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06)); display: flex; justify-content: space-between; align-items: center;">
              <span class="source-badge" :class="`source-${item.source}`">
                {{ getSourceLabel(item.source) }}
              </span>
              <button
                class="btn-config-action"
                style="padding: 4px 10px; font-size: 11px;"
                @click="goToConfig(item.configRoute)"
              >
                ⚙️ Configurer
              </button>
            </div>
          </div>
        </div>

        <footer style="margin-top: 20px; padding: 14px; background: var(--bg-tertiary, #1e1f22); border-radius: 6px; border: 1px solid var(--border-subtle, rgba(255,255,255,0.06));">
          <p style="margin: 0; color: var(--text-muted, #949ba4); font-size: 12.5px; line-height: 1.5;">
            💡 <strong>Prise en compte instantanée :</strong> Les modifications d'activation sont appliquées immédiatement pour le serveur <strong style="color: var(--header-primary, #fff);">{{ currentGuildId }}</strong> et enregistrées dans les fichiers de configuration multi-serveurs C12.
          </p>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppState } from '~/composables/useAppState.ts';
import { useFeatures, type FeatureEntry } from '~/composables/useFeatures.ts';
import { useToast } from '~/composables/useToast.ts';
import { getProxiedImageUrl } from '~/composables/useDiscordImageProxy.ts';
import DiscordUser from '~/components/common/DiscordUser.vue';

definePageMeta({
  title: 'Informations Serveur & Modules',
  icon: '📊',
  description: 'Statistiques globales, performances, état des modules et activation des features',
  section: 'bot',
  order: 1
});

useSeoMeta({
  title: 'Informations Serveur & Modules - Dashboard',
  description: 'Statistiques globales, performances, état des modules et activation des features'
});

const route = useRoute();
const router = useRouter();
const { guild, botProfile, users, roles, discordChannels, channelCategories, stats, refreshAll } = useAppState();
const featuresApi = useFeatures();
const { showToast } = useToast();

const rawGuildParam = route.params.guild as string;
const currentGuildId = computed(() => {
  if (rawGuildParam && rawGuildParam !== ':guild()' && rawGuildParam !== ':guild' && rawGuildParam.trim() !== '') {
    return rawGuildParam;
  }
  if (guild.value?.id) return guild.value.id;
  return 'default';
});

const featuresList = ref<FeatureEntry[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref<'all' | 'active' | 'inactive'>('all');
const selectedCategory = ref<string>('Toutes');
const viewMode = ref<'table' | 'grid'>('table');
const busyMap = ref<Record<string, boolean>>({});

interface DisplayFeatureItem {
  name: string;
  title: string;
  emoji: string;
  description: string;
  category: string;
  configRoute: string;
  enabled: boolean;
  source: string;
  busy: boolean;
}

const DEFAULT_KNOWN_FEATURES = [
  'welcome', 'captcha', 'bump_reminder', 'xp', 'birthdays', 'daily_message',
  'reaction_roles', 'economy', 'temp_voice', 'invites', 'tickets', 'giveaways',
  'polls', 'cards', 'automod', 'reports', 'sticky_roles', 'engagement_advanced',
  'suggestions', 'startup_notifier', 'scheduler', 'web', 'openrouter', 'general'
];

async function loadData() {
  loading.value = true;
  try {
    const [fetched] = await Promise.all([
      featuresApi.list(currentGuildId.value),
      refreshAll()
    ]);
    featuresList.value = fetched || [];
  } catch (err: any) {
    showToast(`Erreur chargement des fonctionnalités: ${err.message}`, 'error');
  } finally {
    loading.value = false;
  }
}

const combinedFeatures = computed<DisplayFeatureItem[]>(() => {
  const map = new Map<string, DisplayFeatureItem>();

  for (const f of featuresList.value) {
    const meta = featuresApi.getMeta(f.name);
    map.set(f.name, {
      name: f.name,
      title: meta.label,
      emoji: meta.emoji,
      description: meta.description,
      category: meta.category,
      configRoute: meta.configRoute,
      enabled: f.state.enabled,
      source: f.state.source || 'default',
      busy: Boolean(busyMap.value[f.name])
    });
  }

  for (const name of DEFAULT_KNOWN_FEATURES) {
    if (!map.has(name) && !map.has(name.replace(/_/g, '-')) && !map.has(name.replace(/-/g, '_'))) {
      const meta = featuresApi.getMeta(name);
      map.set(name, {
        name: name,
        title: meta.label,
        emoji: meta.emoji,
        description: meta.description,
        category: meta.category,
        configRoute: meta.configRoute,
        enabled: false,
        source: 'default',
        busy: Boolean(busyMap.value[name])
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, 'fr'));
});

const availableCategories = computed(() => {
  const cats = new Set<string>(['Toutes']);
  for (const f of combinedFeatures.value) {
    if (f.category) cats.add(f.category);
  }
  return Array.from(cats);
});

const activeCount = computed(() => combinedFeatures.value.filter(f => f.enabled).length);
const inactiveCount = computed(() => combinedFeatures.value.filter(f => !f.enabled).length);

const filteredFeatures = computed(() => {
  return combinedFeatures.value.filter(item => {
    if (statusFilter.value === 'active' && !item.enabled) return false;
    if (statusFilter.value === 'inactive' && item.enabled) return false;

    if (selectedCategory.value !== 'Toutes' && item.category !== selectedCategory.value) {
      return false;
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      return matchName || matchTitle || matchDesc || matchCat;
    }

    return true;
  });
});

function getSourceLabel(src: string): string {
  switch (src) {
    case 'db': return '💾 BDD';
    case 'yaml:features': return '📄 YAML';
    case 'yaml:legacy': return '📄 YAML';
    default: return '⚙️ Défaut';
  }
}

async function toggleFeature(item: DisplayFeatureItem) {
  busyMap.value[item.name] = true;
  const targetState = !item.enabled;
  try {
    const updated = await featuresApi.update(item.name, {
      enabled: targetState,
      guildId: currentGuildId.value
    });

    const found = featuresList.value.find(x => x.name === item.name);
    if (found) {
      found.state.enabled = updated.enabled;
      found.state.source = 'db';
    } else {
      featuresList.value.push({
        name: item.name,
        defaults: {},
        state: updated
      });
    }

    showToast(`Feature "${item.title}" ${targetState ? 'activée' : 'désactivée'} avec succès !`, 'success');
  } catch (err: any) {
    showToast(`Erreur modification "${item.title}": ${err.message}`, 'error');
  } finally {
    busyMap.value[item.name] = false;
  }
}

function goToConfig(configRoute: string) {
  router.push(`/panel/${currentGuildId.value}/config/${configRoute}`);
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
  margin-top: 0px;
  margin-bottom: 0px;
}

.config-card {
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--radius-md, 8px);
  padding: 20px;
}

.card-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: var(--header-primary, #ffffff);
  margin-bottom: 4px;
}

.config-desc {
  font-size: 13px;
  color: var(--text-muted, #949ba4);
}

.bot-badge {
  background: var(--blurple, #5865F2);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 3px;
}

.view-mode-toggle {
  display: flex;
  background: var(--bg-tertiary, #1e1f22);
  padding: 2px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
}

.mode-btn {
  background: transparent;
  border: none;
  color: var(--text-muted, #949ba4);
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mode-btn.active {
  background: var(--blurple, #5865f2);
  color: #ffffff;
}

.filter-pill-btn,
.category-pill-btn {
  background: transparent;
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  color: var(--text-muted, #949ba4);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill-btn:hover,
.category-pill-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-normal, #dbdee1);
}

.filter-pill-btn.active,
.category-pill-btn.active {
  background: var(--blurple, #5865f2);
  color: #ffffff;
  border-color: var(--blurple, #5865f2);
}

.module-status-pill {
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.module-status-pill.verified {
  background: rgba(87, 242, 135, 0.12);
  color: var(--status-positive, #57f287);
}

.module-status-pill.failed {
  background: rgba(242, 63, 67, 0.12);
  color: var(--status-danger, #f23f43);
}

.category-badge-pill {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(88, 101, 242, 0.15);
  color: #c9cdfb;
}

.source-badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  color: var(--text-muted, #949ba4);
}

.source-badge.source-db {
  color: var(--status-positive, #57f287);
  border-color: rgba(87, 242, 135, 0.3);
}

.source-badge.source-yaml\:features,
.source-badge.source-yaml\:legacy {
  color: #fee75c;
  border-color: rgba(254, 231, 92, 0.3);
}

.btn-config-action {
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  color: var(--text-normal, #dbdee1);
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-config-action:hover {
  background: var(--blurple, #5865f2);
  color: #ffffff;
  border-color: var(--blurple, #5865f2);
}

.features-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 8px;
}

.feature-card {
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.2s, border-color 0.2s;
}

.feature-card:hover {
  transform: translateY(-2px);
  border-color: var(--blurple, #5865f2);
}

.feature-card.is-enabled {
  border-color: rgba(87, 242, 135, 0.4);
}

.feature-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.feature-card__emoji {
  font-size: 28px;
}

.feature-card__title-block {
  flex: 1;
  min-width: 0;
}

.feature-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--header-primary, #ffffff);
}

.feature-card__name {
  margin: 1px 0 0;
  font-size: 11px;
  color: var(--text-muted, #949ba4);
  font-family: monospace;
}

.feature-card__description {
  margin: 0;
  color: var(--text-normal, #dbdee1);
  font-size: 13px;
  line-height: 1.4;
}

.feature-card__toggle {
  position: relative;
  width: 40px;
  height: 22px;
  cursor: pointer;
  display: inline-block;
  flex-shrink: 0;
}

.feature-card__toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.feature-card__toggle-track {
  position: absolute;
  inset: 0;
  background: #4e5058;
  border-radius: 12px;
  transition: background 0.2s;
}

.feature-card__toggle-thumb {
  position: absolute;
  width: 16px;
  height: 16px;
  top: 3px;
  left: 3px;
  background: #ffffff;
  border-radius: 50%;
  transition: transform 0.2s;
}

.feature-card__toggle input:checked + .feature-card__toggle-track {
  background: var(--status-positive, #57f287);
}

.feature-card__toggle input:checked + .feature-card__toggle-track .feature-card__toggle-thumb {
  transform: translateX(18px);
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #4e5058;
  transition: .3s;
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--status-positive, #57f287);
}

input:checked + .slider:before {
  transform: translateX(18px);
}

.action-btn {
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--text-normal, #dbdee1);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background: var(--blurple, #5865f2);
  color: #ffffff;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: var(--blurple, #5865F2);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
