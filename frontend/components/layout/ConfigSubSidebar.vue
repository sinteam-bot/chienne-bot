<template>
  <aside class="config-sub-sidebar" aria-label="Menu de Configuration">
    <!-- En-tête du serveur / Configuration -->
    <header class="config-sub-header">
      <div class="sub-header-guild-info">
        <div class="guild-avatar-box">
          <img
            v-if="guild?.iconUrl"
            :src="guild.iconUrl"
            :alt="guild.name"
            class="guild-avatar-img"
          />
          <span v-else class="guild-avatar-fallback">⚙️</span>
        </div>
        <div class="guild-text-box">
          <h2 class="guild-name" :title="guild?.name || 'Configuration Serveur'">
            {{ guild?.name || 'Configuration' }}
          </h2>
          <span class="guild-id-badge" :title="`ID du serveur : ${currentGuildId}`">
            ID: {{ shortGuildId }}
          </span>
        </div>
      </div>
    </header>

    <!-- Barre de recherche rapide de configuration -->
    <div class="config-search-box">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          class="sub-search-input"
          placeholder="Filtrer les réglages…"
          @keydown.esc="searchQuery = ''"
        />
        <button
          v-if="searchQuery"
          class="clear-search-btn"
          title="Effacer la recherche"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Liste scrollable des catégories et fonctionnalités -->
    <div class="config-sidebar-scroller">
      <!-- Aucun résultat de recherche -->
      <div v-if="filteredCategories.length === 0" class="sub-sidebar-empty">
        <span>Aucun paramètre trouvé pour "{{ searchQuery }}"</span>
      </div>

      <!-- Groupes de catégories -->
      <div
        v-for="cat in filteredCategories"
        :key="cat.id"
        :class="['config-category-group', { collapsed: cat.collapsed }]"
      >
        <div class="config-category-header" @click="cat.collapsed = !cat.collapsed">
          <span class="category-arrow">{{ cat.collapsed ? '▸' : '▾' }}</span>
          <span class="category-name">{{ cat.title }}</span>
          <span class="category-count">{{ cat.items.length }}</span>
        </div>

        <div v-show="!cat.collapsed" class="config-category-items">
          <NuxtLink
            v-for="item in cat.items"
            :key="item.id"
            :to="`/panel/${currentGuildId}/config/${item.id}`"
            :class="['config-sub-item', { active: isFeatureActive(item.id) }]"
            @click="onItemClick(item.id)"
          >
            <span class="sub-item-icon">{{ item.icon }}</span>
            <div class="sub-item-details">
              <span class="sub-item-name">{{ item.name }}</span>
              <span v-if="item.badge" class="sub-item-badge">{{ item.badge }}</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAppState } from '~/composables/useAppState.ts';

export interface ConfigItem {
  id: string;
  name: string;
  icon: string;
  description?: string;
  keywords?: string[];
  badge?: string;
}

export interface ConfigCategory {
  id: string;
  title: string;
  icon: string;
  collapsed?: boolean;
  items: ConfigItem[];
}

const props = defineProps<{
  guildId?: string;
  activeFeature?: string;
}>();

const emit = defineEmits<{
  (e: 'select-feature', featureId: string): void;
}>();

const route = useRoute();
const { guild } = useAppState();

const searchQuery = ref('');

const currentGuildId = computed(() => {
  if (props.guildId && props.guildId.trim() !== '') return props.guildId;
  const fromRoute = route.params.guild as string;
  if (fromRoute && fromRoute.trim() !== '') return fromRoute;
  if (guild.value?.id) return guild.value.id;
  return 'default';
});

const shortGuildId = computed(() => {
  const gid = currentGuildId.value;
  if (!gid || gid === 'default') return 'Défaut';
  if (gid.length > 10) return `${gid.slice(0, 5)}...${gid.slice(-4)}`;
  return gid;
});

const categories = ref<ConfigCategory[]>([
  {
    id: 'system',
    title: 'SYSTÈME & INFRASTRUCTURE',
    icon: '⚙️',
    collapsed: false,
    items: [
      { id: 'general', name: 'Général & Discord', icon: '🤖', description: 'Tokens, Préfixe, Couleurs, Client ID', keywords: ['prefix', 'bot', 'discord', 'couleur', 'status', 'token'] },
      { id: 'web', name: 'Sécurité API & Web', icon: '🛡️', description: 'Clés API, Auth JWT, CORS, Rate Limiting', keywords: ['api', 'dashboard', 'port', 'jwt', 'security', 'auth', 'ip'] },
      { id: 'scheduler', name: 'Planificateur / Crons', icon: '⏰', description: 'Tâches automatisées, fuseau horaire, intervalles', keywords: ['cron', 'scheduler', 'interval', 'timezone', 'tache'] },
      { id: 'openrouter', name: 'Modèles IA & OpenRouter', icon: '🧠', description: 'Clé API OpenRouter, modèles de fallback, Polly', keywords: ['ai', 'ia', 'openrouter', 'chatgpt', 'gemini', 'polly'] },
      { id: 'startup_notifier', name: 'Startup Notifier', icon: '🚀', description: 'Notification au démarrage et suivi des versions GitHub', keywords: ['github', 'commit', 'version', 'startup', 'update', 'deploy'] }
    ]
  },
  {
    id: 'security',
    title: 'SÉCURITÉ & MODÉRATION',
    icon: '🛡️',
    collapsed: false,
    items: [
      { id: 'captcha', name: 'Captcha & Anti-Raid', icon: '🔒', description: 'Sas de vérification mathématique, salon privé, anti-raid', keywords: ['captcha', 'math', 'anti-raid', 'verification', 'sas', 'bot'] },
      { id: 'automod', name: 'Modération Automatique', icon: '🚨', description: 'Filtres de mots interdits, anti-spam, purges programmées', keywords: ['automod', 'spam', 'purge', 'sanction', 'badwords', 'filtre'] },
      { id: 'reports', name: 'Signalements Staff', icon: '🚩', description: 'File d\'attente des signalements communautaires et logs', keywords: ['report', 'signalement', 'plainte', 'staff', 'mod'] }
    ]
  },
  {
    id: 'welcome_members',
    title: 'ACCUEIL & MEMBRES',
    icon: '👋',
    collapsed: false,
    items: [
      { id: 'welcome', name: 'Messages de Bienvenue', icon: '👋', description: 'Embed d\'arrivée public, DM de bienvenue, rôles automatiques', keywords: ['welcome', 'bienvenue', 'dm', 'accueil', 'join', 'role'] },
      { id: 'invites', name: 'Suivi des Invitations', icon: '🎟️', description: 'InviteLogger, tracking des créateurs de lien, logs join/leave', keywords: ['invite', 'invitation', 'tracker', 'inviter', 'code'] },
      { id: 'sticky_roles', name: 'Rôles Sticky', icon: '📌', description: 'Conservation automatique des rôles lors du départ/retour', keywords: ['sticky', 'persistant', 'rejoin', 'leave', 'role'] }
    ]
  },
  {
    id: 'engagement',
    title: 'ENGAGEMENT & COMMUNAUTÉ',
    icon: '⭐',
    collapsed: false,
    items: [
      { id: 'xp', name: 'Système XP & Niveaux', icon: '⭐', description: 'Multiplicateurs XP, paliers de rôles, salon de level up', keywords: ['xp', 'level', 'niveau', 'classement', 'leaderboard', 'rang'] },
      { id: 'birthdays', name: 'Anniversaires', icon: '🎂', description: 'Annonces automatiques, rôles temporaires et cadeaux', keywords: ['birthday', 'anniversaire', 'fete', 'gateau', 'cadeau'] },
      { id: 'daily_message', name: 'Daily Message (Pensée IA)', icon: '🌅', description: 'Pensée du jour générée par IA et prévisualisation', keywords: ['daily', 'pensee', 'matin', 'citation', 'ia', 'message'] },
      { id: 'bump_reminder', name: 'Rappels de Bump Disboard', icon: '⏰', description: 'Décompte 2h Disboard, rôle de rappel, salon dédié', keywords: ['bump', 'disboard', 'rappel', 'timer', 'pub'] },
      { id: 'reaction_roles', name: 'Rôles à Réaction', icon: '🎭', description: 'Boutons, menus déroulants et réactions emojis', keywords: ['reaction', 'button', 'menu', 'role', 'select'] },
      { id: 'suggestions', name: 'Boîte à Idées & Suggestions', icon: '💡', description: 'Système de votes pour les suggestions communautaires', keywords: ['suggestion', 'idee', 'vote', 'staff', 'boite'] },
      { id: 'engagement_advanced', name: 'Engagement Avancé', icon: '⚡', description: 'Rappels DM, mots déclencheurs (triggers), commandes custom', keywords: ['reminder', 'trigger', 'customcmd', 'declencheur', 'mot'] }
    ]
  },
  {
    id: 'utilities',
    title: 'OUTILS & MODULES',
    icon: '📦',
    collapsed: false,
    items: [
      { id: 'economy', name: 'Économie & Boutique', icon: '💰', description: 'Monnaie virtuelle, work, daily, boutique et inventaire', keywords: ['economy', 'monnaie', 'argent', 'shop', 'boutique', 'work'] },
      { id: 'temp_voice', name: 'Salons Vocaux Éphémères', icon: '🔊', description: 'Join-to-Create : création dynamique de salons vocaux', keywords: ['voice', 'vocal', 'temporaire', 'j2c', 'ephemere'] },
      { id: 'tickets', name: 'Tickets de Support', icon: '🎫', description: 'Panneaux de tickets, transcripts et rôles de support', keywords: ['ticket', 'support', 'aide', 'transcript', 'staff'] },
      { id: 'giveaways', name: 'Giveaways & Concours', icon: '🎉', description: 'Tirages au sort automatiques, durées par défaut et salons', keywords: ['giveaway', 'concours', 'tirage', 'lot', 'cadeau'] },
      { id: 'polls', name: 'Sondages & Votes', icon: '🗳️', description: 'Sondages interactifs, durée et options multiples', keywords: ['poll', 'sondage', 'vote', 'choix'] },
      { id: 'cards', name: 'Cartes & Canvas Graphiques', icon: '🃏', description: 'Personnalisation des cartes de profil et bannières', keywords: ['card', 'canvas', 'carte', 'profil', 'rang', 'image'] }
    ]
  }
]);

function normalizeFeatureName(name?: string): string {
  if (!name) return '';
  const n = name.replace(/-/g, '_').toLowerCase();
  if (n === 'xp_level') return 'xp';
  if (n === 'security_question') return 'captcha';
  return n;
}

function isFeatureActive(featureId: string): boolean {
  const current = normalizeFeatureName(props.activeFeature || (route.params.feature as string) || '');
  const target = normalizeFeatureName(featureId);
  return current === target;
}

function onItemClick(featureId: string) {
  emit('select-feature', featureId);
}

const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return categories.value;

  return categories.value
    .map(cat => {
      const matchingItems = cat.items.filter(item => {
        if (item.name.toLowerCase().includes(q)) return true;
        if (item.id.toLowerCase().includes(q)) return true;
        if (item.description?.toLowerCase().includes(q)) return true;
        if (item.keywords?.some(k => k.toLowerCase().includes(q))) return true;
        return false;
      });

      return {
        ...cat,
        collapsed: false,
        items: matchingItems
      };
    })
    .filter(cat => cat.items.length > 0);
});
</script>

<style scoped>
.config-sub-sidebar {
  width: 250px;
  height: 100%;
  background-color: var(--bg-secondary, #2b2d31);
  border-right: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  display: flex;
  flex-direction: column;
  user-select: none;
  flex-shrink: 0;
}

.config-sub-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  background: var(--bg-secondary, #2b2d31);
}

.sub-header-guild-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.guild-avatar-box {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--bg-tertiary, #1e1f22);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.guild-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.guild-avatar-fallback {
  font-size: 18px;
}

.guild-text-box {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.guild-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--header-primary, #ffffff);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.guild-id-badge {
  font-size: 11px;
  color: var(--text-muted, #949ba4);
  font-family: monospace;
}

.config-search-box {
  padding: 10px 12px 6px 12px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 8px;
  font-size: 12px;
  color: var(--text-muted, #949ba4);
  pointer-events: none;
}

.sub-search-input {
  width: 100%;
  background-color: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: 4px;
  padding: 6px 26px 6px 28px;
  font-size: 12.5px;
  color: var(--text-normal, #dbdee1);
  outline: none;
  transition: all 0.2s ease;
}

.sub-search-input:focus {
  border-color: var(--blurple, #5865F2);
  background-color: var(--bg-primary, #313338);
}

.clear-search-btn {
  position: absolute;
  right: 6px;
  background: transparent;
  border: none;
  color: var(--text-muted, #949ba4);
  font-size: 11px;
  cursor: pointer;
  padding: 2px 4px;
}

.clear-search-btn:hover {
  color: var(--header-primary, #ffffff);
}

.config-sidebar-scroller {
  flex: 1;
  overflow-y: auto;
  padding: 8px 8px 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sub-sidebar-empty {
  padding: 20px 10px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted, #949ba4);
}

.config-category-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.config-category-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted, #949ba4);
  letter-spacing: 0.03em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.15s ease;
}

.config-category-header:hover {
  color: var(--header-primary, #ffffff);
}

.category-arrow {
  font-size: 10px;
  width: 10px;
}

.category-name {
  flex: 1;
}

.category-count {
  font-size: 10px;
  opacity: 0.6;
}

.config-category-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.config-sub-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 4px;
  color: var(--text-muted, #949ba4);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.config-sub-item:hover {
  background-color: var(--bg-modifier-hover, rgba(255, 255, 255, 0.05));
  color: var(--header-primary, #ffffff);
}

.config-sub-item.active {
  background-color: var(--bg-modifier-selected, rgba(88, 101, 242, 0.15));
  color: var(--blurple, #5865F2);
  font-weight: 600;
}

.sub-item-icon {
  font-size: 15px;
  flex-shrink: 0;
}

.sub-item-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
}

.sub-item-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-item-badge {
  font-size: 10px;
  background: var(--blurple, #5865F2);
  color: #ffffff;
  padding: 1px 5px;
  border-radius: 8px;
  font-weight: 700;
}
</style>
