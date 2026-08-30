import { useDiscordApi } from './useDiscordApi.ts';
import { useConfigFeature } from './useConfigFeature.ts';

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
  const featureConfig = useConfigFeature<InviteFeatureConfig>('invites', {
    defaultConfig: {
      enabled: true,
      join_log_channel_id: '',
      leave_log_channel_id: '',
      join_message: ':incoming_envelope: {member} a rejoint le serveur via l\'invitation de **{inviter}** ({invite_uses} utilisation{plural}).',
      leave_message: ':outbox_tray: {member} a quitté le serveur (était invité par **{inviter}**).',
      embed_color: '#2F3136',
      show_account_age: true,
      track_bots: false,
      fake_account_threshold_days: 7,
      fake_no_avatar: true,
      leaderboard: {
        enabled: true,
        page_size: 25,
        show_avatars: true
      }
    }
  });

  async function getGuildId(): Promise<string> {
    return featureConfig.resolveGuildId();
  }

  function getGuildIdSync(): string {
    if (typeof window === 'undefined') return 'default';
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('guild_id') || params.get('guildId');
    if (fromUrl) return fromUrl;
    return window.localStorage.getItem('guild_id') || 'default';
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

  async function getConfig(guildId?: string): Promise<InviteFeatureConfig | null> {
    return featureConfig.getFeatureConfig('invites', guildId);
  }

  async function updateConfig(guildId?: string, patch?: Partial<InviteFeatureConfig> & { enabled?: boolean }): Promise<void> {
    await featureConfig.saveFeatureConfig('invites', patch, guildId);
  }

  return {
    getUserStats,
    getLeaderboard,
    getBlacklist,
    getConfig,
    getGuildId,
    getGuildIdSync,
    updateConfig,
    featureConfig
  };
};
