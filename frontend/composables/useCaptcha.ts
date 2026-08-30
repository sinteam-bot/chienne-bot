import { useDiscordApi } from './useDiscordApi.ts';
import { useConfigFeature } from './useConfigFeature.ts';

export interface CaptchaEntry {
  id: string;
  userId: string;
  username: string;
  question: string;
  answer: string;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'verified' | 'failed' | 'expired';
  isVerified: boolean;
  channelId: string;
  channelName: string | null;
  channelDeletedAt: string | null;
  isChannelDeleted: boolean;
  createdAt: string;
  expiresAt: string;
  verifiedAt: string | null;
}

export interface CaptchaStats {
  total: number;
  verifiedCount: number;
  pendingCount: number;
  failedCount: number;
  successRate: number;
}

export interface CaptchaConfig {
  enabled: boolean;
  verified_role_id: string;
  captcha_channel_name: string;
  captcha_timeout: number;
  max_attempts: number;
}

export interface CaptchaFullData {
  stats: CaptchaStats;
  config: CaptchaConfig;
  captchas: CaptchaEntry[];
  logs: any[];
}

export const useCaptcha = () => {
  const api = useDiscordApi();
  const featureConfig = useConfigFeature<CaptchaConfig>('captcha', {
    defaultConfig: {
      enabled: true,
      verified_role_id: '',
      captcha_channel_name: 'captcha-{username}',
      captcha_timeout: 10,
      max_attempts: 3
    }
  });

  /**
   * Récupère l'état complet du feature captcha (stats + config + captchas + logs).
   * Endpoint : GET /api/captcha/logs
   */
  async function getFullData(): Promise<CaptchaFullData> {
    const res = await api.apiFetch<{ success: boolean; data: CaptchaFullData }>(
      '/api/captcha/logs'
    );
    return res.data || {
      stats: { total: 0, verifiedCount: 0, pendingCount: 0, failedCount: 0, successRate: 0 },
      config: { enabled: false, captcha_timeout: 10, max_attempts: 3, verified_role_id: '', captcha_channel_name: '' },
      captchas: [],
      logs: []
    };
  }

  return {
    getFullData,
    getModuleConfig: (guildId?: string) => featureConfig.getFeatureConfig('captcha', guildId),
    updateConfig: (guildId?: string, patch?: any) => featureConfig.saveFeatureConfig('captcha', patch, guildId),
    getGuildId: () => featureConfig.resolveGuildId(),
    featureConfig
  };
};
