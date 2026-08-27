import { useDiscordApi } from './useDiscordApi';

export interface FeatureState {
  enabled: boolean;
  config: Record<string, any>;
  allowedRoles: string[];
  source: 'db' | 'yaml:features' | 'yaml:legacy' | 'default';
}

export interface FeatureEntry {
  name: string;
  defaults: Record<string, any>;
  state: FeatureState;
}

const FEATURE_LABELS: Record<string, { label: string; emoji: string; description: string }> = {
  xp: {
    label: 'Système XP & Niveaux',
    emoji: '⭐',
    description: 'Gagne de l\'XP en discutant et en vocal, monte de niveau, débloque des rôles.'
  },
  welcome: {
    label: 'Accueil automatique',
    emoji: '👋',
    description: 'Message de bienvenue et attribution automatique de rôles à l\'arrivée.'
  },
  daily_message: {
    label: 'Message du jour',
    emoji: '📅',
    description: 'Génération et publication automatique d\'un message quotidien par IA.'
  },
  counter: {
    label: 'Compteur (Route de l\'Infini)',
    emoji: '🔢',
    description: 'Mini-jeu de comptage collaboratif avec classement.'
  },
  countdown: {
    label: 'Compte à rebours',
    emoji: '⏳',
    description: 'Mini-jeu de countdown avec pièges aléatoires.'
  },
  bump_reminder: {
    label: 'Rappel de bump',
    emoji: '⏰',
    description: 'Rappel automatique pour bumper le serveur (Disboard).'
  },
  captcha: {
    label: 'Captcha de vérification',
    emoji: '🔒',
    description: 'Vérification mathématique à l\'arrivée des nouveaux membres.'
  },
  automod: {
    label: 'Modération automatique',
    emoji: '🛡️',
    description: 'Anti-spam, bad-words, anti-raid, sanctions progressives.'
  },
  tickets: {
    label: 'Tickets de support',
    emoji: '🎫',
    description: 'Système de tickets avec boutons, catégories et transcripts.'
  },
  logs: {
    label: 'Logs détaillés',
    emoji: '📜',
    description: 'Logs paramétrables de tous les événements importants.'
  },
  giveaways: {
    label: 'Giveaways',
    emoji: '🎉',
    description: 'Concours avec tirage automatique et bouton de participation.'
  },
  polls: {
    label: 'Sondages',
    emoji: '📊',
    description: 'Sondages à choix multiples avec résultats en direct.'
  }
};

export function useFeatures() {
  const api = useDiscordApi();

  function label(name: string) {
    return FEATURE_LABELS[name]?.label || name;
  }

  function emoji(name: string) {
    return FEATURE_LABELS[name]?.emoji || '⚙️';
  }

  function description(name: string) {
    return FEATURE_LABELS[name]?.description || 'Feature du bot.';
  }

  async function list(guildId?: string): Promise<FeatureEntry[]> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: FeatureEntry[] }>(`/api/features${qs}`);
    return res.data;
  }

  async function get(name: string, guildId?: string): Promise<{ name: string } & FeatureState> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: { name: string } & FeatureState }>(
      `/api/features/${encodeURIComponent(name)}${qs}`
    );
    return res.data;
  }

  async function update(name: string, payload: { enabled?: boolean; config?: Record<string, any>; allowedRoles?: string[]; guildId?: string }): Promise<{ name: string } & FeatureState> {
    const body: Record<string, any> = { ...payload };
    if (!body.guildId && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('guild_id');
      if (stored) body.guildId = stored;
    }
    const res = await api.apiFetch<{ success: boolean; data: { name: string } & FeatureState }>(
      `/api/features/${encodeURIComponent(name)}`,
      { method: 'PATCH', body }
    );
    return res.data;
  }

  async function toggle(name: string, guildId?: string): Promise<{ name: string } & FeatureState> {
    const current = await get(name, guildId);
    return update(name, { enabled: !current.enabled, guildId });
  }

  return { list, get, update, toggle, label, emoji, description };
}
