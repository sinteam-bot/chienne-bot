import { useDiscordApi } from './useDiscordApi';

export interface InviteStats {
  stats: {
    real: number;
    bonus: number;
    leaves: number;
    fake: number;
    total: number;
  };
  invited: Array<{
    invitedId: string;
    invitedUsername: string;
    joinedAt: number;
    leftAt: number | null;
    isFake: boolean;
  }>;
  bonuses: Array<{
    id: string;
    amount: number;
    reason: string | null;
    moderatorId: string | null;
    createdAt: number;
  }>;
  blacklisted: boolean;
}

export interface InviteLeaderboardEntry {
  inviterId: string;
  inviterUsername: string;
  real: number;
  bonus: number;
  total: number;
}

export interface BlacklistEntry {
  guildId: string;
  targetId: string;
  targetType: 'user' | 'role';
  reason: string | null;
  moderatorId: string | null;
  createdAt: number;
}

export interface InviteFeatureConfig {
  enabled: boolean;
  join_log_channel_id: string | null;
  leave_log_channel_id: string | null;
  join_message: string;
  leave_message: string;
  embed_color: string;
  show_account_age: boolean;
  track_bots: boolean;
  fake_account_threshold_days: number;
  fake_no_avatar: boolean;
  leaderboard: {
    enabled: boolean;
    page_size: number;
    show_avatars: boolean;
  };
}

export const useInvites = () => {
  const api = useDiscordApi();
  let cachedDefaultGuild: string | null = null;

  /**
   * Récupère le guild_id depuis, par ordre de priorité :
   *   1. Query string de l'URL (?guild_id=...)
   *   2. localStorage (sélection UI)
   *   3. /api/config → discord.guild_id (fallback depuis le bot)
   *
   * Le cache évite de re-fetcher la config à chaque appel.
   */
  async function getGuildId(): Promise<string> {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('guild_id');
    if (fromUrl) return fromUrl;
    const fromStorage = window.localStorage.getItem('guild_id');
    if (fromStorage) return fromStorage;
    if (cachedDefaultGuild) return cachedDefaultGuild;
    try {
      const res = await api.apiFetch<{ success: boolean; data: any }>('/api/config');
      const gid = res.data?.discord?.guild_id;
      if (gid) {
        cachedDefaultGuild = gid;
        return gid;
      }
    } catch {
      // ignore
    }
    return '';
  }

  /** Version synchrone : localStorage + URL uniquement (pas d'API). */
  function getGuildIdSync(): string {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('guild_id');
    if (fromUrl) return fromUrl;
    return window.localStorage.getItem('guild_id') || '';
  }

  async function getUserStats(guildId: string, userId: string): Promise<InviteStats> {
    const res = await api.apiFetch<{ success: boolean; data: InviteStats }>(
      `/api/invites/${encodeURIComponent(guildId)}/${encodeURIComponent(userId)}`
    );
    return res.data;
  }

  async function getLeaderboard(guildId: string, limit = 25): Promise<InviteLeaderboardEntry[]> {
    const qs = new URLSearchParams({ limit: String(limit) });
    const res = await api.apiFetch<{ success: boolean; data: InviteLeaderboardEntry[] }>(
      `/api/invites/${encodeURIComponent(guildId)}/leaderboard?${qs.toString()}`
    );
    return res.data || [];
  }

  async function getBlacklist(guildId: string): Promise<BlacklistEntry[]> {
    const res = await api.apiFetch<{ success: boolean; data: BlacklistEntry[] }>(
      `/api/invites/${encodeURIComponent(guildId)}/blacklist`
    );
    return res.data || [];
  }

  async function getConfig(guildId: string): Promise<InviteFeatureConfig | null> {
    // /api/features/invites passe par featureRegistry.get() qui consulte
    // la DB en priorité (donc reflète les modifs faites par PATCH).
    // À la différence de /api/config qui ne lit que config.yml.
    const res = await api.apiFetch<{ success: boolean; data: any }>(
      `/api/features/invites?guild_id=${encodeURIComponent(guildId)}`
    );
    const f = res.data;
    if (!f) return null;
    return {
      enabled: !!f.enabled,
      join_log_channel_id: f.config?.join_log_channel_id ?? null,
      leave_log_channel_id: f.config?.leave_log_channel_id ?? null,
      join_message: f.config?.join_message ?? '',
      leave_message: f.config?.leave_message ?? '',
      embed_color: f.config?.embed_color ?? '#2F3136',
      show_account_age: f.config?.show_account_age ?? true,
      track_bots: f.config?.track_bots ?? false,
      fake_account_threshold_days: f.config?.fake_account_threshold_days ?? 7,
      fake_no_avatar: f.config?.fake_no_avatar ?? true,
      leaderboard: {
        enabled: f.config?.leaderboard?.enabled ?? true,
        page_size: f.config?.leaderboard?.page_size ?? 25,
        show_avatars: f.config?.leaderboard?.show_avatars ?? true
      }
    };
  }

  /**
   * Met à jour la configuration du feature invites via PATCH /api/features/invites.
   * Accepte un patch partiel (les champs non fournis sont préservés par le backend).
   */
  async function updateConfig(guildId: string, patch: Partial<InviteFeatureConfig> & { enabled?: boolean }): Promise<void> {
    await api.apiFetch<{ success: boolean; data: any }>(
      `/api/features/invites`,
      {
        method: 'PATCH',
        body: { guildId, ...patch }
      }
    );
  }

  return { getUserStats, getLeaderboard, getBlacklist, getConfig, getGuildId, getGuildIdSync, updateConfig };
};
