import { useDiscordApi } from './useDiscordApi';

export interface GamePlayer {
  user_id?: string;
  username?: string;
  score: number;
}

export interface GameState {
  current_number?: number;
  is_trap_active?: number;
  last_user_id?: string;
  error_count?: number;
}

export interface GameStats {
  counter: {
    configured: boolean;
    channelId: string | null;
    state: GameState | null;
    topPlayers: GamePlayer[];
  };
  countdown: {
    configured: boolean;
    channelId: string | null;
    state: GameState | null;
    topPlayers: GamePlayer[];
  };
  enabled: {
    counter: boolean;
    countdown: boolean;
  };
}

export const useGamesStats = () => {
  const api = useDiscordApi();

  async function getStats(guildId?: string): Promise<GameStats> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: GameStats }>(`/api/games/stats${qs}`);
    return res.data;
  }

  async function getCounter(guildId?: string): Promise<any> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: any }>(`/api/games/counter${qs}`);
    return res.data;
  }

  async function getCountdown(guildId?: string): Promise<any> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: any }>(`/api/games/countdown${qs}`);
    return res.data;
  }

  return { getStats, getCounter, getCountdown };
};
