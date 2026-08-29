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
    const res = await api.apiFetch<{ success: boolean; data: any }>(
      `/api/config?guild_id=${encodeURIComponent(guildId)}`
    );
    return res.data?.invites || null;
  }

  return { getUserStats, getLeaderboard, getBlacklist, getConfig };
};
