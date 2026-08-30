import { useDiscordApi } from './useDiscordApi';

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
  isEnabled: boolean;
  timeoutMinutes: number;
  maxAttempts: number;
  verifiedRoleId: string | null;
  channelId: string | null;
}

export interface CaptchaFullData {
  stats: CaptchaStats;
  config: CaptchaConfig;
  captchas: CaptchaEntry[];
  logs: any[];
}

export const useCaptcha = () => {
  const api = useDiscordApi();
  let cachedGuildId: string | null = null;

  /**
   * Récupère le guild_id (URL > localStorage > /api/guild > default).
   */
  async function getGuildId(): Promise<string> {
    if (typeof window === 'undefined') return 'default';
    if (cachedGuildId) return cachedGuildId;

    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('guild_id') || params.get('guildId');
    if (fromUrl) {
      cachedGuildId = fromUrl;
      window.localStorage.setItem('guild_id', fromUrl);
      return fromUrl;
    }

    const fromStorage = window.localStorage.getItem('guild_id');
    if (fromStorage && fromStorage.trim() !== '') {
      cachedGuildId = fromStorage;
      return fromStorage;
    }

    try {
      const res = await api.apiFetch<{ success: boolean; data: any }>('/api/guild');
      const gid = res.data?.id;
      if (gid) {
        cachedGuildId = gid;
        window.localStorage.setItem('guild_id', gid);
        return gid;
      }
    } catch {
      // ignore
    }

    return 'default';
  }

  /**
   * Récupère l'état complet du feature captcha (stats + config + captchas + logs).
   * Endpoint : GET /api/captcha/logs
   */
  async function getFullData(): Promise<CaptchaFullData> {
    const res = await api.apiFetch<{ success: boolean; data: CaptchaFullData }>(
      '/api/captcha/logs'
    );
    return res.data || { stats: { total: 0, verifiedCount: 0, pendingCount: 0, failedCount: 0, successRate: 0 }, config: { isEnabled: false, timeoutMinutes: 10, maxAttempts: 3, verifiedRoleId: null, channelId: null }, captchas: [], logs: [] };
  }

  /**
   * Récupère la configuration du feature captcha pour une guilde donnée.
   * Endpoint : GET /api/config/{guildId}/captcha
   */
  async function getModuleConfig(guildId?: string): Promise<any> {
    const gid = guildId || await getGuildId();
    const targetGuild = gid && gid.trim() !== '' ? gid : 'default';
    const res = await api.apiFetch<{ success: boolean; data: any }>(
      `/api/config/${encodeURIComponent(targetGuild)}/captcha`
    );
    return res.data;
  }

  /**
   * Met à jour la configuration du captcha pour une guilde donnée.
   * Endpoint : PATCH /api/config/{guildId}/captcha
   * Écrit dans data/{guildId}/captcha.config.yml.
   */
  async function updateConfig(guildId?: string, patch?: any): Promise<any> {
    const gid = guildId || await getGuildId();
    const targetGuild = gid && gid.trim() !== '' ? gid : 'default';
    const res = await api.apiFetch<{ success: boolean; data: any }>(
      `/api/config/${encodeURIComponent(targetGuild)}/captcha`,
      {
        method: 'PATCH',
        body: patch
      }
    );
    return res.data;
  }

  return { getFullData, getModuleConfig, updateConfig, getGuildId };
};
