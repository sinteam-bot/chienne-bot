import { useDiscordApi } from './useDiscordApi';

export interface TempVoiceConfig {
  guildId: string;
  categoryId: string | null;
  format: string;
  deleteDelaySeconds: number;
  maxPerGuild: number;
  lockedRoleId: string | null;
  joinChannels: string[];
  enabled: boolean;
  updatedAt: number;
}

export interface TempVoiceChannel {
  channelId: string;
  guildId: string;
  creatorId: string | null;
  lastEmptyAt: number;
  createdAt: number;
}

export const useTempVoice = () => {
  const api = useDiscordApi();

  async function getConfig(guildId?: string): Promise<TempVoiceConfig> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: TempVoiceConfig }>(`/api/temp-voice/config${qs}`);
    return res.data;
  }

  async function updateConfig(payload: Partial<TempVoiceConfig> & { guildId: string }): Promise<TempVoiceConfig> {
    const res = await api.apiFetch<{ success: boolean; data: TempVoiceConfig }>('/api/temp-voice/config', {
      method: 'PATCH', body: payload
    });
    return res.data;
  }

  async function listActive(guildId?: string): Promise<TempVoiceChannel[]> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: TempVoiceChannel[] }>(`/api/temp-voice/active${qs}`);
    return res.data;
  }

  async function count(guildId?: string): Promise<number> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: { count: number } }>(`/api/temp-voice/count${qs}`);
    return res.data.count;
  }

  return { getConfig, updateConfig, listActive, count };
};
