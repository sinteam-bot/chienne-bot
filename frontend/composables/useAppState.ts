import { ref, computed, readonly } from 'vue';
import { useDiscordApi } from './useDiscordApi.ts';
import { useToast } from './useToast.ts';
import { getProxiedImageUrl } from './useDiscordImageProxy.ts';

export interface ChannelItem {
  id: string;
  name: string;
  type?: number | string;
  topic?: string;
  parentId?: string | null;
  parentName?: string;
  position?: number;
  isVirtual?: boolean;
  isNsfw?: boolean;
  section?: 'bot' | 'modules' | 'games' | 'discord';
  icon?: string;
  routePath?: string;
}

export interface ChannelCategory {
  id: string;
  name: string;
  position: number;
  isVirtual?: boolean;
  collapsed?: boolean;
  channels: ChannelItem[];
}

export interface NavigationSection {
  id: 'bot' | 'modules' | 'games' | 'discord';
  title: string;
  icon: string;
  badge?: string;
  items: ChannelItem[];
  collapsed?: boolean;
}

export interface GuildInfo {
  id: string;
  name: string;
  iconUrl: string;
  bannerUrl?: string;
  memberCount: number;
  ownerTag?: string;
  initials?: string;
}

export interface BotProfile {
  id: string;
  username: string;
  tag: string;
  avatarUrl: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  ping?: number;
  uptime?: number;
}

export interface EmojiItem {
  id: string;
  name: string;
  animated?: boolean;
  url?: string;
}

const guild = ref<GuildInfo | null>(null);
const activeView = ref<string>('info'); // default view: info
const activeDiscordChannel = ref<ChannelItem | null>(null);
const discordChannels = ref<ChannelItem[]>([]);
const channelCategories = ref<ChannelCategory[]>([]);
const guildEmojis = ref<EmojiItem[]>([]);
const botProfile = ref<BotProfile>({
  id: '',
  username: 'Bot',
  tag: 'Bot#0000',
  avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
  status: 'online',
  customStatus: 'En ligne',
  ping: 24,
  uptime: 0
});
const users = ref<any[]>([]);
const roles = ref<any[]>([]);
const stats = ref<any>({});
const isLoading = ref(false);

export function useAppState() {
  const { apiFetch } = useDiscordApi();
  const { showToast } = useToast();

  const BOT_SECTION_ITEMS: ChannelItem[] = [
    { id: 'info', name: 'Informations', icon: '📊', routePath: '/panel/default/info', section: 'bot', topic: 'Statistiques globales, performances et état du bot' },
    { id: 'archives', name: 'Archives & Salons', icon: '💬', routePath: '/archives', section: 'bot', topic: 'Explorateur de salons Discord et historique' },
    { id: 'events', name: 'Événements Discord', icon: '📡', routePath: '/events', section: 'bot', topic: 'Journal et archivage en direct de tous les événements Discord (v14)' },
    { id: 'commands', name: 'Commandes', icon: '⚡', routePath: '/commands', section: 'bot', topic: 'Liste des commandes Discord et permissions' },
    { id: 'logs', name: 'Logs Console', icon: '📜', routePath: '/logs', section: 'bot', topic: 'Console en direct via Server-Sent Events (SSE)' },
    { id: 'users', name: 'Membres & Rôles', icon: '👥', routePath: '/users', section: 'bot', topic: 'Annuaire des utilisateurs, rôles et modale d\'inspection' },
    { id: 'templates', name: 'Moteur de Templates', icon: '🎨', routePath: '/templates', section: 'bot', topic: 'Moteur de templating Discord universel avec prévisualisation en direct (Embeds, Boucles, Conditions, Filtres)' },
    { id: 'config', name: 'Configuration Serveur', icon: '⚙️', routePath: '/panel/default/config/general', section: 'bot', topic: 'Configuration générale et modulaire par serveur Discord' }
  ];

  const MODULE_SECTION_ITEMS: ChannelItem[] = [
    { id: 'module-daily-message', name: 'Daily Message (Pensée)', icon: '🌅', routePath: '/modules/daily-message', section: 'modules', topic: 'Statistiques, pré-rendu et configuration de la pensée du jour' },
    { id: 'module-bump-reminder', name: 'Rappels de Bump', icon: '⏰', routePath: '/modules/bump-reminder', section: 'modules', topic: 'Décompte Disboard en temps réel, historique des bumps et configuration' },
    { id: 'module-captcha', name: 'Captcha Mathématique', icon: '🔒', routePath: '/modules/captcha', section: 'modules', topic: 'Statistiques, suivi des vérifications et réglages captcha' },
    { id: 'module-welcome', name: 'Message de Bienvenue', icon: '👋', routePath: '/modules/welcome', section: 'modules', topic: 'Statistiques d\'arrivées, aperçu live et configuration d\'accueil' },
    { id: 'module-xp-level', name: 'Système XP & Level', icon: '⭐', routePath: '/modules/xp-level', section: 'modules', topic: 'Leaderboard XP des membres et réglages des multiplicateurs/paliers' },
    { id: 'module-birthdays', name: 'Anniversaires', icon: '🎂', routePath: '/modules/birthdays', section: 'modules', topic: 'Célébration automatique des anniversaires, rôles temporaires et cadeaux' },
    { id: 'module-giveaways', name: 'Giveaways & Concours', icon: '🎉', routePath: '/modules/giveaways', section: 'modules', topic: 'Gestion et tirage au sort des concours communautaires' },
    { id: 'module-polls', name: 'Sondages & Votes', icon: '🗳️', routePath: '/modules/polls', section: 'modules', topic: 'Création et résultats des votes et sondages du serveur' },
    { id: 'module-tickets', name: 'Tickets de Support', icon: '🎫', routePath: '/modules/tickets', section: 'modules', topic: 'Gestion des tickets de support, transcripts et réglages du panel' },
    { id: 'module-cards', name: 'Cartes & Canvas', icon: '🃏', routePath: '/modules/cards', section: 'modules', topic: 'Générateur et prévisualisation des cartes de profil Discord' },
    { id: 'module-reaction-roles', name: 'Rôles à Réaction', icon: '🎭', routePath: '/modules/reaction-roles', section: 'modules', topic: 'Attribution automatique de rôles via réactions sur un message' },
    { id: 'module-economy', name: 'Économie & Inventaire', icon: '💰', routePath: '/modules/economy', section: 'modules', topic: 'Monnaie virtuelle, boutique d\'items, drops et échanges entre membres' },
    { id: 'module-sticky-roles', name: 'Rôles Sticky', icon: '🎭', routePath: '/modules/sticky-roles', section: 'modules', topic: 'Rôles automatiquement ré-attribués aux membres à leur retour' },
    { id: 'module-info', name: 'Commandes d\'Information', icon: 'ℹ️', routePath: '/modules/info', section: 'modules', topic: '/serverinfo, /userinfo, /avatar et leur équivalent dashboard' },
    { id: 'module-games-stats', name: 'Statistiques de Jeux', icon: '🎮', routePath: '/modules/games-stats', section: 'modules', topic: 'Compteur et Countdown — état en temps réel et top joueurs' },
    { id: 'module-engagement-advanced', name: 'Engagement Avancé', icon: '📌', routePath: '/modules/engagement-advanced', section: 'modules', topic: 'Rappels DM, déclencheurs de mots et commandes personnalisées' },
    { id: 'module-reports', name: 'Signalements', icon: '🚩', routePath: '/modules/reports', section: 'modules', topic: 'File d\'attente des signalements de la communauté (bouton + context menu)' },
    { id: 'module-temp-voice', name: 'Salons vocaux temporaires', icon: '🔊', routePath: '/modules/temp-voice', section: 'modules', topic: 'Join-to-Create : vocaux éphémères créés à la demande' },
    { id: 'module-startup-notifier', name: 'Startup Notifier', icon: '🚀', routePath: '/modules/startup-notifier', section: 'modules', topic: 'Notifications de démarrage, déploiement et suivi des versions' }
  ];

  const GAME_SECTION_ITEMS: ChannelItem[] = [
    { id: 'game-road-to-infinite', name: 'Road to Infinite', icon: '🔢', routePath: '/games/road-to-infinite', section: 'games', topic: 'Jeu du Compteur : Classement des compteurs et configuration' },
    { id: 'game-countdown', name: 'Countdown (900 -> 0)', icon: '⏳', routePath: '/games/countdown', section: 'games', topic: 'Compte à rebours, statistiques des pièges et réglages' }
  ];

  const sections = ref<NavigationSection[]>([
    {
      id: 'bot',
      title: 'Bot',
      icon: '🐕',
      items: BOT_SECTION_ITEMS,
      collapsed: false
    },
    {
      id: 'modules',
      title: 'Modules',
      icon: '🧩',
      items: MODULE_SECTION_ITEMS,
      collapsed: false
    },
    {
      id: 'games',
      title: 'Games',
      icon: '🎮',
      badge: '2',
      items: GAME_SECTION_ITEMS,
      collapsed: false
    }
  ]);

  async function fetchGuild() {
    try {
      const res = await apiFetch<{ success: boolean; data: any; bot: BotProfile }>('/api/guild');
      if (res.success && res.data) {
        const g = res.data;
        const initials = (g.name || 'CB')
          .split(' ')
          .map((w: string) => w[0])
          .join('')
          .substring(0, 3)
          .toUpperCase() || 'CB';
        guild.value = { ...g, initials };

        if (Array.isArray(g.emojis)) {
          guildEmojis.value = g.emojis;
        }
      }
      const botData = res.bot || res.data?.bot;
      if (botData) {
        botProfile.value = { ...botProfile.value, ...botData };
      }
    } catch (e: any) {
      console.warn('Erreur chargement guild:', e.message);
    }
  }

  async function fetchChannels() {
    try {
      const res = await apiFetch<{ success: boolean; data: any[]; categories?: any[]; channels?: any[] }>('/api/channels');
      if (res.success) {
        let cats: ChannelCategory[] = [];
        let flat: ChannelItem[] = [];

        if (Array.isArray(res.categories)) {
          cats = res.categories;
        } else if (Array.isArray(res.data) && res.data.length > 0 && res.data[0].channels) {
          cats = res.data;
        }

        if (Array.isArray(res.channels) && res.channels.length > 0) {
          flat = res.channels;
        } else if (cats.length > 0) {
          flat = cats.flatMap(c => c.channels || []);
        } else if (Array.isArray(res.data)) {
          flat = res.data;
        }

        channelCategories.value = cats.map(c => ({ ...c, collapsed: false }));
        discordChannels.value = flat;

        if (!activeDiscordChannel.value && flat.length > 0) {
          const defaultChannel = flat.find(c => c.type === 'text' || !c.type) || flat[0];
          activeDiscordChannel.value = defaultChannel;
        }
      }
    } catch (e: any) {
      console.warn('Erreur chargement salons discord:', e.message);
    }
  }

  async function fetchStats() {
    try {
      const res = await apiFetch<{ success: boolean; data: any }>('/api/stats');
      if (res.success && res.data) {
        stats.value = res.data;
      }
    } catch (e: any) {
      console.warn('Erreur chargement stats globales:', e.message);
    }
  }

  async function fetchUsersAndRoles() {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        apiFetch<{ success: boolean; data: any; users?: any[] }>('/api/users'),
        apiFetch<{ success: boolean; data: any; roles?: any[] }>('/api/roles')
      ]);

      if (usersRes.success) {
        if (Array.isArray(usersRes.data)) {
          users.value = usersRes.data;
        } else if (Array.isArray(usersRes.data?.users)) {
          users.value = usersRes.data.users;
        } else if (Array.isArray(usersRes.users)) {
          users.value = usersRes.users;
        } else {
          users.value = [];
        }
      }
      if (rolesRes.success) {
        if (Array.isArray(rolesRes.data)) {
          roles.value = rolesRes.data;
        } else if (Array.isArray(rolesRes.data?.roles)) {
          roles.value = rolesRes.data.roles;
        } else if (Array.isArray(rolesRes.roles)) {
          roles.value = rolesRes.roles;
        } else {
          roles.value = [];
        }
      }
    } catch (e: any) {
      console.warn('Erreur chargement users/roles:', e.message);
    }
  }

  function setActiveDiscordChannel(channel: ChannelItem) {
    activeDiscordChannel.value = channel;
  }

  function navigateTo(viewId: string, discordChannel?: ChannelItem) {
    activeView.value = viewId;
    if (discordChannel) {
      activeDiscordChannel.value = discordChannel;
    }
  }

  async function refreshAll() {
    isLoading.value = true;
    try {
      await Promise.all([
        fetchGuild(),
        fetchChannels(),
        fetchStats(),
        fetchUsersAndRoles()
      ]);
      showToast('Données rafraîchies avec succès !', 'success');
    } finally {
      isLoading.value = false;
    }
  }

  const currentViewTitle = computed(() => {
    try {
      const route = useRoute();
      if (route.path.startsWith('/archives') && activeDiscordChannel.value) {
        return {
          id: activeDiscordChannel.value.id,
          name: `#${activeDiscordChannel.value.name}`,
          icon: '💬',
          topic: activeDiscordChannel.value.topic || 'Explorateur de salons Discord et historique'
        };
      }
      if (route.meta?.title) {
        return {
          id: (route.name as string) || route.path,
          name: (route.meta.title as string),
          icon: (route.meta.icon as string) || '⭐',
          topic: (route.meta.description as string) || (route.meta.topic as string) || ''
        };
      }
    } catch (_) {}

    for (const sec of sections.value) {
      const found = sec.items.find(i => i.id === activeView.value);
      if (found) return found;
    }
    return { id: activeView.value, name: 'Bot', icon: '🐕', topic: 'Interface Web Discord' };
  });

  function getUserAvatar(userId?: string): string {
    if (!userId) return getProxiedImageUrl('https://cdn.discordapp.com/embed/avatars/0.png');
    const u = users.value.find((m: any) => m.id === userId || m.userId === userId || m.user_id === userId);
    if (u && (u.avatarUrl || u.avatar || u.displayAvatarURL)) {
      return getProxiedImageUrl(u.avatarUrl || u.avatar || u.displayAvatarURL);
    }
    try {
      const idx = (BigInt(userId) >> 22n) % 6n;
      return getProxiedImageUrl(`https://cdn.discordapp.com/embed/avatars/${Number(idx)}.png`);
    } catch {
      return getProxiedImageUrl('https://cdn.discordapp.com/embed/avatars/0.png');
    }
  }

  return {
    guild: readonly(guild),
    sections,
    activeView,
    activeDiscordChannel,
    discordChannels: readonly(discordChannels),
    channelCategories,
    guildEmojis: readonly(guildEmojis),
    botProfile: readonly(botProfile),
    users: readonly(users),
    roles: readonly(roles),
    stats: readonly(stats),
    isLoading: readonly(isLoading),
    currentViewTitle,
    fetchGuild,
    fetchChannels,
    fetchStats,
    fetchUsersAndRoles,
    getUserAvatar,
    getProxiedImageUrl,
    setActiveDiscordChannel,
    navigateTo,
    refreshAll
  };
}
