import { ref, computed, readonly } from 'vue';
import { useDiscordApi } from './useDiscordApi.ts';
import { useToast } from './useToast.ts';

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
  username: 'Chienne Bot',
  tag: 'Chienne Bot#0000',
  avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
  status: 'online',
  customStatus: 'En ligne'
});
const users = ref<any[]>([]);
const roles = ref<any[]>([]);
const stats = ref<any>({});
const isLoading = ref(false);

export function useAppState() {
  const { apiFetch } = useDiscordApi();
  const { showToast } = useToast();

  const BOT_SECTION_ITEMS: ChannelItem[] = [
    { id: 'info', name: 'Informations', icon: '📊', routePath: '/info', section: 'bot', topic: 'Statistiques globales, performances et état du bot' },
    { id: 'archives', name: 'Archives & Salons', icon: '💬', routePath: '/archives', section: 'bot', topic: 'Explorateur de salons Discord et historique' },
    { id: 'events', name: 'Événements Discord', icon: '📡', routePath: '/events', section: 'bot', topic: 'Journal et archivage en direct de tous les événements Discord (v14)' },
    { id: 'commands', name: 'Commandes', icon: '⚡', routePath: '/commands', section: 'bot', topic: 'Liste des commandes Discord et permissions' },
    { id: 'logs', name: 'Logs Console', icon: '📜', routePath: '/logs', section: 'bot', topic: 'Console en direct via Server-Sent Events (SSE)' },
    { id: 'users', name: 'Membres & Rôles', icon: '👥', routePath: '/users', section: 'bot', topic: 'Annuaire des utilisateurs, rôles et modale d\'inspection' },
    { id: 'general-config', name: 'Config Générale', icon: '⚙️', routePath: '/general-config', section: 'bot', topic: 'Configuration générale du bot (Tokens, Auth Web, Scheduler)' }
  ];

  const MODULE_SECTION_ITEMS: ChannelItem[] = [
    { id: 'module-daily-message', name: 'Daily Message (Pensée)', icon: '🌅', routePath: '/modules/daily-message', section: 'modules', topic: 'Statistiques, pré-rendu et configuration de la pensée du jour' },
    { id: 'module-captcha', name: 'Captcha Mathématique', icon: '🔒', routePath: '/modules/captcha', section: 'modules', topic: 'Statistiques, suivi des vérifications et réglages captcha' },
    { id: 'module-welcome', name: 'Message de Bienvenue', icon: '👋', routePath: '/modules/welcome', section: 'modules', topic: 'Statistiques d\'arrivées, aperçu live et configuration d\'accueil' },
    { id: 'module-xp-level', name: 'Système XP & Level', icon: '⭐', routePath: '/modules/xp-level', section: 'modules', topic: 'Leaderboard XP des membres et réglages des multiplicateurs/paliers' }
  ];

  const GAME_SECTION_ITEMS: ChannelItem[] = [
    { id: 'game-road-to-infinite', name: 'Road to Infinite', icon: '🔢', routePath: '/games/road-to-infinite', section: 'games', topic: 'Jeu du Compteur : Classement des compteurs et configuration' },
    { id: 'game-countdown', name: 'Countdown (900 -> 0)', icon: '⏳', routePath: '/games/countdown', section: 'games', topic: 'Compte à rebours, statistiques des pièges et réglages' }
  ];

  const sections = ref<NavigationSection[]>([
    {
      id: 'bot',
      title: 'Chienne Bot',
      icon: '🐕',
      items: BOT_SECTION_ITEMS,
      collapsed: false
    },
    {
      id: 'modules',
      title: 'Modules',
      icon: '🧩',
      badge: '4',
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
      if (res.bot) {
        botProfile.value = { ...botProfile.value, ...res.bot };
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
    for (const sec of sections.value) {
      const found = sec.items.find(i => i.id === activeView.value);
      if (found) return found;
    }
    if (activeView.value === 'archives' && activeDiscordChannel.value) {
      return {
        id: activeDiscordChannel.value.id,
        name: `#${activeDiscordChannel.value.name}`,
        icon: '💬',
        topic: activeDiscordChannel.value.topic || 'Historique du salon'
      };
    }
    return { id: activeView.value, name: activeView.value, icon: '⭐', topic: '' };
  });

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
    setActiveDiscordChannel,
    navigateTo,
    refreshAll
  };
}
