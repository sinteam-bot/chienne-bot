import { ref, computed, readonly } from 'vue';
import { useDiscordApi } from "./useDiscordApi.ts";
import { useToast } from "./useToast.ts";

export interface ChannelItem {
  id: string;
  name: string;
  type?: number | string;
  topic?: string;
  parentId?: string | null;
  parentName?: string;
  position?: number;
  isVirtual?: boolean;
  section?: 'bot' | 'modules' | 'games' | 'discord';
  icon?: string;
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

const guild = ref<GuildInfo | null>(null);
const activeView = ref<string>('info'); // default view: info
const activeDiscordChannel = ref<ChannelItem | null>(null);
const discordChannels = ref<ChannelItem[]>([]);
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
    { id: 'info', name: 'Informations', icon: '📊', section: 'bot', topic: 'Statistiques globales, performances et état du bot' },
    { id: 'archives', name: 'Archives & Salons', icon: '💬', section: 'bot', topic: 'Explorateur de salons Discord et historique' },
    { id: 'events', name: 'Événements Discord', icon: '📡', section: 'bot', topic: 'Journal et archivage en direct de tous les événements Discord (v14)' },
    { id: 'commands', name: 'Commandes', icon: '⚡', section: 'bot', topic: 'Liste des commandes Discord et permissions' },
    { id: 'logs', name: 'Logs Console', icon: '📜', section: 'bot', topic: 'Console en direct via Server-Sent Events (SSE)' },
    { id: 'users', name: 'Membres & Rôles', icon: '👥', section: 'bot', topic: 'Annuaire des utilisateurs, rôles et modale d\'inspection' },
    { id: 'general-config', name: 'Config Générale', icon: '⚙️', section: 'bot', topic: 'Configuration générale du bot (Tokens, Auth Web, Scheduler)' }
  ];

  const MODULE_SECTION_ITEMS: ChannelItem[] = [
    { id: 'module-daily-message', name: 'Daily Message (Pensée)', icon: '🌅', section: 'modules', topic: 'Statistiques, pré-rendu et configuration de la pensée du jour' },
    { id: 'module-captcha', name: 'Captcha Mathématique', icon: '🔒', section: 'modules', topic: 'Statistiques, suivi des vérifications et réglages captcha' },
    { id: 'module-welcome', name: 'Message de Bienvenue', icon: '👋', section: 'modules', topic: 'Statistiques d\'arrivées, aperçu live et configuration d\'accueil' },
    { id: 'module-xp-level', name: 'Système XP & Level', icon: '⭐', section: 'modules', topic: 'Leaderboard XP des membres et réglages des multiplicateurs/paliers' }
  ];

  const GAME_SECTION_ITEMS: ChannelItem[] = [
    { id: 'game-road-to-infinite', name: 'Road to Infinite', icon: '🔢', section: 'games', topic: 'Jeu du Compteur : Classement des compteurs et configuration' },
    { id: 'game-countdown', name: 'Countdown (900 -> 0)', icon: '⏳', section: 'games', topic: 'Compte à rebours, statistiques des pièges et réglages' }
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
      const res = await apiFetch<{ success: boolean; data: GuildInfo; bot: BotProfile }>('/api/guild');
      if (res.success && res.data) {
        const g = res.data;
        const initials = g.name
          .split(' ')
          .map(w => w[0])
          .join('')
          .substring(0, 3)
          .toUpperCase() || 'CB';
        guild.value = { ...g, initials };
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
      const res = await apiFetch<{ success: boolean; data: any[] }>('/api/channels');
      if (res.success && Array.isArray(res.data)) {
        discordChannels.value = res.data;
        if (!activeDiscordChannel.value && res.data.length > 0) {
          activeDiscordChannel.value = res.data[0];
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
        apiFetch<{ success: boolean; data: any[] }>('/api/users'),
        apiFetch<{ success: boolean; data: any[] }>('/api/roles')
      ]);

      if (usersRes.success) users.value = usersRes.data || [];
      if (rolesRes.success) roles.value = rolesRes.data || [];
    } catch (e: any) {
      console.warn('Erreur chargement users/roles:', e.message);
    }
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
    activeView: readonly(activeView),
    activeDiscordChannel,
    discordChannels: readonly(discordChannels),
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
    navigateTo,
    refreshAll
  };
}
