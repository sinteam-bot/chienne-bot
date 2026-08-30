import { useDiscordApi } from './useDiscordApi.ts';
import { useConfigFeature } from './useConfigFeature.ts';

export interface TempVoiceConfig {
  guildId?: string;
  categoryId: string | null;
  format: string;
  deleteDelaySeconds: number;
  maxPerGuild: number;
  lockedRoleId?: string | null;
  joinChannels: string[];
  enabled: boolean;
  updatedAt?: number;
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
  const featureConfig = useConfigFeature<TempVoiceConfig>('temp_voice', {
    defaultConfig: {
      enabled: true,
      joinChannels: [],
      categoryId: null,
      format: "{user}'s game",
      deleteDelaySeconds: 5,
      maxPerGuild: 0
    }
  });

  async function getConfig(guildId?: string): Promise<TempVoiceConfig> {
    return (await featureConfig.getFeatureConfig('temp_voice', guildId)) as TempVoiceConfig;
  }

  async function updateConfig(payload: Partial<TempVoiceConfig> & { guildId?: string }): Promise<any> {
    return featureConfig.saveFeatureConfig('temp_voice', payload, payload.guildId);
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

  return { getConfig, updateConfig, listActive, count, featureConfig };
};
