import { useDiscordApi } from './useDiscordApi';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalXp: number;
  level: number;
  messagesCount: number;
  voiceMinutes: number;
}

export interface LeaderboardResponse {
  success: boolean;
  data: {
    entries: LeaderboardEntry[];
    total: number;
    limit: number;
    offset: number;
    page: number;
    pages: number;
  };
}

export interface UserProfile {
  userId: string;
  username: string;
  totalXp: number;
  level: number;
  rank: number | string;
  messagesCount: number;
  voiceMinutes: number;
  progress: {
    currentLevel: number;
    totalXp: number;
    xpInCurrentLevel: number;
    xpNeededForNext: number;
    progressPercent: number;
  };
}

export const useXp = () => {
  const api = useDiscordApi();

  async function getLeaderboard(limit = 25, offset = 0): Promise<LeaderboardResponse['data']> {
    const res = await api.apiFetch<LeaderboardResponse>(`/api/xp/leaderboard?limit=${limit}&offset=${offset}`);
    return res.data;
  }

  async function getUserProfile(userId: string): Promise<UserProfile> {
    const res = await api.apiFetch<{ success: boolean; data: UserProfile }>(`/api/xp/user/${userId}`);
    return res.data;
  }

  async function getConfig(): Promise<any> {
    const res = await api.apiFetch<{ success: boolean; data: any }>('/api/xp/config');
    return res.data;
  }

  async function updateConfig(patch: any): Promise<any> {
    const res = await api.apiFetch<{ success: boolean; data: any }>('/api/xp/config', {
      method: 'PUT',
      body: patch
    });
    return res.data;
  }

  async function adjustXp(userId: string, delta: number, reason?: string): Promise<any> {
    const res = await api.apiFetch<{ success: boolean; data: any }>('/api/xp/adjust', {
      method: 'POST',
      body: { userId, delta, reason: reason || '' }
    });
    return res.data;
  }

  async function resetXp(userId: string): Promise<any> {
    const res = await api.apiFetch<{ success: boolean; data: any }>('/api/xp/reset', {
      method: 'POST',
      body: { userId }
    });
    return res.data;
  }

  return { getLeaderboard, getUserProfile, getConfig, updateConfig, adjustXp, resetXp };
};
