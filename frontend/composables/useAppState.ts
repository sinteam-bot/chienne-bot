import { useDiscordApi } from './useDiscordApi';
import { useToast } from './useToast';

export interface ChannelItem {
  id: string;
  name: string;
  type: number | string;
  topic?: string;
  parentId?: string | null;
  parentName?: string;
  position?: number;
  isVirtual?: boolean;
}

export interface ChannelCategory {
  id: string;
  name: string;
  position: number;
  channels: ChannelItem[];
  collapsed?: boolean;
  isVirtual?: boolean;
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
const categories = ref<ChannelCategory[]>([]);
const activeChannel = ref<ChannelItem | null>(null);
const activeVirtualView = ref<string>('messages');
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
const isLoading = ref(false);

export function useAppState() {
  const { apiFetch } = useDiscordApi();
  const { showToast } = useToast();

  const VIRTUAL_CHANNELS: ChannelItem[] = [
    { id: 'virtual-logs', name: '📜-logs-console', type: 'virtual', isVirtual: true, topic: 'Journal d\'exécution et logs en temps réel (SSE)' },
    { id: 'virtual-config', name: '⚙️-configuration-bot', type: 'virtual', isVirtual: true, topic: 'Tableau de bord de gestion unifié (config.yml)' },
    { id: 'virtual-users', name: '👥-membres-et-roles', type: 'virtual', isVirtual: true, topic: 'Annuaire des utilisateurs, rôles et statistiques XP' },
    { id: 'virtual-daily-messages', name: '🌅-pensee-du-jour-ia', type: 'virtual', isVirtual: true, topic: 'Historique et validation des messages quotidiens générés par IA' },
    { id: 'virtual-captcha-logs', name: '🔒-logs-captchas', type: 'virtual', isVirtual: true, topic: 'Suivi et historique des vérifications Captcha' }
  ];

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
        botProfile.value = {
          ...botProfile.value,
          ...res.bot
        };
      }
    } catch (e: any) {
      console.warn('Erreur chargement informations guild:', e.message);
    }
  }

  async function fetchChannels() {
    try {
      isLoading.value = true;
      const res = await apiFetch<{ success: boolean; data: any[] }>('/api/channels');
      if (res.success && Array.isArray(res.data)) {
        const rawChannels = res.data;
        
        // Regrouper par catégorie
        const catMap = new Map<string, ChannelCategory>();

        // Catégorie sans catégorie
        const defaultCat: ChannelCategory = {
          id: 'no-category',
          name: 'Salons Textuels',
          position: 0,
          channels: [],
          collapsed: false
        };

        for (const ch of rawChannels) {
          // Filtrer les salons vocaux ou non textuels si nécessaire (on garde textuels + annonces + forums)
          if (ch.parentId && ch.parentName) {
            if (!catMap.has(ch.parentId)) {
              catMap.set(ch.parentId, {
                id: ch.parentId,
                name: ch.parentName,
                position: ch.parentPosition ?? 1,
                channels: [],
                collapsed: false
              });
            }
            catMap.get(ch.parentId)!.channels.push(ch);
          } else {
            defaultCat.channels.push(ch);
          }
        }

        const sortedCategories = Array.from(catMap.values()).sort((a, b) => a.position - b.position);
        if (defaultCat.channels.length > 0) {
          sortedCategories.unshift(defaultCat);
        }

        // Ajouter la catégorie spéciale Salons Virtuels Bot en tête
        const virtualCat: ChannelCategory = {
          id: 'virtual-cat',
          name: '⭐ Salons Virtuels Bot',
          position: -1,
          channels: VIRTUAL_CHANNELS,
          isVirtual: true,
          collapsed: false
        };

        categories.value = [virtualCat, ...sortedCategories];

        // Sélectionner par défaut le premier salon textuel réel si aucun salon actif
        if (!activeChannel.value) {
          const firstRealChannel = defaultCat.channels[0] || sortedCategories[0]?.channels[0] || VIRTUAL_CHANNELS[0];
          if (firstRealChannel) {
            selectChannel(firstRealChannel);
          }
        }
      }
    } catch (e: any) {
      console.error('Erreur chargement salons:', e.message);
      showToast('Impossible de charger les salons Discord', 'error');
    } finally {
      isLoading.value = false;
    }
  }

  function selectChannel(channel: ChannelItem) {
    activeChannel.value = channel;
    if (channel.id.startsWith('virtual-')) {
      activeVirtualView.value = channel.id.replace('virtual-', '');
    } else {
      activeVirtualView.value = 'messages';
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
      console.warn('Erreur chargement utilisateurs/rôles:', e.message);
    }
  }

  async function refreshAll() {
    await Promise.all([
      fetchGuild(),
      fetchChannels(),
      fetchUsersAndRoles()
    ]);
    showToast('Données rafraîchies avec succès', 'success');
  }

  return {
    guild: readonly(guild),
    categories,
    activeChannel: readonly(activeChannel),
    activeVirtualView: readonly(activeVirtualView),
    botProfile: readonly(botProfile),
    users: readonly(users),
    roles: readonly(roles),
    isLoading: readonly(isLoading),
    fetchGuild,
    fetchChannels,
    fetchUsersAndRoles,
    selectChannel,
    refreshAll
  };
}
