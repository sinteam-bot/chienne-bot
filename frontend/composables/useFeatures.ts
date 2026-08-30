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

export interface FeatureMeta {
  label: string;
  emoji: string;
  description: string;
  category: string;
  configRoute: string;
}

const FEATURE_LABELS: Record<string, FeatureMeta> = {
  xp: {
    label: 'Système XP & Niveaux',
    emoji: '⭐',
    description: 'Gains d\'expérience en discutant et en vocal, niveaux, multiplicateurs et annonces.',
    category: 'Engagement',
    configRoute: 'xp'
  },
  welcome: {
    label: 'Message de Bienvenue',
    emoji: '👋',
    description: 'Accueil public avec carte Canvas, DM privé, rôles automatiques et paliers de membres.',
    category: 'Communauté',
    configRoute: 'welcome'
  },
  daily_message: {
    label: 'Message du Jour (Pensée)',
    emoji: '🌅',
    description: 'Génération et publication automatique d\'une pensée philosophique quotidienne par IA.',
    category: 'Modules IA',
    configRoute: 'daily_message'
  },
  counter: {
    label: 'Route de l\'Infini',
    emoji: '🔢',
    description: 'Mini-jeu de comptage collaboratif en temps réel avec détection d\'erreurs et classement.',
    category: 'Jeux',
    configRoute: 'general'
  },
  countdown: {
    label: 'Compte à Rebours (900)',
    emoji: '⏳',
    description: 'Mini-jeu de décompte avec pièges aléatoires, réinitialisations et stats joueurs.',
    category: 'Jeux',
    configRoute: 'general'
  },
  bump_reminder: {
    label: 'Rappels de Bump',
    emoji: '⏰',
    description: 'Rappels automatiques toutes les 2h après chaque bump Disboard avec embed riche.',
    category: 'Engagement',
    configRoute: 'bump_reminder'
  },
  captcha: {
    label: 'Captcha Anti-Raid',
    emoji: '🔒',
    description: 'Vérification mathématique, image ou web anti-bot pour sécuriser l\'accès au serveur.',
    category: 'Sécurité',
    configRoute: 'captcha'
  },
  automod: {
    label: 'Modération Automatique',
    emoji: '🛡️',
    description: 'Filtres anti-spam, mentions de masse, liens suspects et sanctions progressives.',
    category: 'Sécurité',
    configRoute: 'automod'
  },
  tickets: {
    label: 'Tickets de Support',
    emoji: '🎫',
    description: 'Système de tickets avec salons privés, boutons, catégories et transcription HTML.',
    category: 'Utilitaires',
    configRoute: 'tickets'
  },
  logs: {
    label: 'Logs Détaillés',
    emoji: '📜',
    description: 'Journalisation paramétrable de tous les événements Discord et modération.',
    category: 'Sécurité',
    configRoute: 'logs'
  },
  giveaways: {
    label: 'Giveaways & Concours',
    emoji: '🎉',
    description: 'Création de concours, tirage au sort automatique et boutons de participation.',
    category: 'Communauté',
    configRoute: 'giveaways'
  },
  polls: {
    label: 'Sondages & Votes',
    emoji: '📊',
    description: 'Sondages à choix multiples avec dépouillement et graphiques en direct.',
    category: 'Communauté',
    configRoute: 'polls'
  },
  birthdays: {
    label: 'Anniversaires',
    emoji: '🎂',
    description: 'Célébration quotidienne, attribution d\'un rôle festif 24h et cadeaux XP.',
    category: 'Communauté',
    configRoute: 'birthdays'
  },
  'reaction-roles': {
    label: 'Rôles à Réaction',
    emoji: '🎭',
    description: 'Attribution automatique de rôles via réactions ou boutons sur un message.',
    category: 'Communauté',
    configRoute: 'reaction_roles'
  },
  reaction_roles: {
    label: 'Rôles à Réaction',
    emoji: '🎭',
    description: 'Attribution automatique de rôles via réactions ou boutons sur un message.',
    category: 'Communauté',
    configRoute: 'reaction_roles'
  },
  economy: {
    label: 'Économie & Boutique',
    emoji: '💰',
    description: 'Monnaie virtuelle, récompenses /daily, inventaire, drops et échanges entre membres.',
    category: 'Jeux',
    configRoute: 'economy'
  },
  'temp-voice': {
    label: 'Salons Vocaux Temporaires',
    emoji: '🔊',
    description: 'Création automatique de salons vocaux privés éphémères (Join-to-Create).',
    category: 'Utilitaires',
    configRoute: 'temp_voice'
  },
  temp_voice: {
    label: 'Salons Vocaux Temporaires',
    emoji: '🔊',
    description: 'Création automatique de salons vocaux privés éphémères (Join-to-Create).',
    category: 'Utilitaires',
    configRoute: 'temp_voice'
  },
  'sticky-roles': {
    label: 'Rôles Sticky',
    emoji: '🎭',
    description: 'Restauration automatique des rôles des membres lorsqu\'ils reviennent sur le serveur.',
    category: 'Sécurité',
    configRoute: 'sticky_roles'
  },
  sticky_roles: {
    label: 'Rôles Sticky',
    emoji: '🎭',
    description: 'Restauration automatique des rôles des membres lorsqu\'ils reviennent sur le serveur.',
    category: 'Sécurité',
    configRoute: 'sticky_roles'
  },
  invites: {
    label: 'Suivi des Invitations',
    emoji: '🎟️',
    description: 'Traçage des invitations, classement des inviteurs et détection des faux comptes.',
    category: 'Sécurité',
    configRoute: 'invites'
  },
  reports: {
    label: 'Signalements Communautaires',
    emoji: '🚩',
    description: 'File d\'attente des signalements par bouton ou menu contextuel Discord.',
    category: 'Sécurité',
    configRoute: 'reports'
  },
  startup_notifier: {
    label: 'Startup Notifier',
    emoji: '🚀',
    description: 'Notification Discord au démarrage avec historique des derniers commits Git.',
    category: 'Système',
    configRoute: 'startup_notifier'
  },
  'startup-notifier': {
    label: 'Startup Notifier',
    emoji: '🚀',
    description: 'Notification Discord au démarrage avec historique des derniers commits Git.',
    category: 'Système',
    configRoute: 'startup_notifier'
  },
  cards: {
    label: 'Cartes & Canvas SVG',
    emoji: '🃏',
    description: 'Générateur et aperçu live des cartes de profil et bannières graphiques.',
    category: 'Engagement',
    configRoute: 'cards'
  },
  engagement_advanced: {
    label: 'Engagement Avancé',
    emoji: '📌',
    description: 'Rappels programmés, déclencheurs de mots clés et commandes personnalisées.',
    category: 'Engagement',
    configRoute: 'engagement_advanced'
  },
  'engagement-advanced': {
    label: 'Engagement Avancé',
    emoji: '📌',
    description: 'Rappels programmés, déclencheurs de mots clés et commandes personnalisées.',
    category: 'Engagement',
    configRoute: 'engagement_advanced'
  },
  suggestions: {
    label: 'Boîte à Suggestions',
    emoji: '💡',
    description: 'Gestion des propositions des membres avec votes et modération.',
    category: 'Communauté',
    configRoute: 'suggestions'
  },
  scheduler: {
    label: 'Planificateur Scheduler',
    emoji: '⏰',
    description: 'Gestion des tâches automatisées crons et synchronisation fuseau horaire.',
    category: 'Système',
    configRoute: 'scheduler'
  },
  web: {
    label: 'Sécurité API & Web',
    emoji: '🛡️',
    description: 'Authentification par clé API secrète, protection statique et CORS.',
    category: 'Système',
    configRoute: 'web'
  },
  openrouter: {
    label: 'OpenRouter & Modèles IA',
    emoji: '🤖',
    description: 'Modèle LLM principal, tokens, température et politique de secours Polly.',
    category: 'Modules IA',
    configRoute: 'openrouter'
  },
  general: {
    label: 'Général & Discord',
    emoji: '🤖',
    description: 'Identifiants du bot, guild ID, couleur par défaut et préfixe textuel.',
    category: 'Système',
    configRoute: 'general'
  }
};

export function useFeatures() {
  const api = useDiscordApi();

  function getMeta(name: string): FeatureMeta {
    const cleanName = name.replace(/-/g, '_');
    return FEATURE_LABELS[name] || FEATURE_LABELS[cleanName] || {
      label: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      emoji: '⚙️',
      description: 'Fonctionnalité modulaire du bot Discord.',
      category: 'Général',
      configRoute: cleanName
    };
  }

  function label(name: string) {
    return getMeta(name).label;
  }

  function emoji(name: string) {
    return getMeta(name).emoji;
  }

  function description(name: string) {
    return getMeta(name).description;
  }

  function category(name: string) {
    return getMeta(name).category;
  }

  function configRoute(name: string) {
    return getMeta(name).configRoute;
  }

  async function list(guildId?: string): Promise<FeatureEntry[]> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: FeatureEntry[] }>(`/api/features${qs}`);
    return res.data || [];
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
      if (stored && stored !== ':guild()' && stored !== ':guild') {
        body.guildId = stored;
      }
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

  return { list, get, update, toggle, label, emoji, description, category, configRoute, getMeta };
}
