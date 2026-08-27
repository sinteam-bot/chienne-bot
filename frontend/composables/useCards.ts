import { useDiscordApi } from './useDiscordApi';

export interface CardPayload {
  template: 'welcome' | 'join' | 'leave' | 'level_up' | 'giveaway' | 'generic';
  username?: string;
  server?: string;
  memberCount?: number;
  level?: number;
  totalXp?: number;
  progressPercent?: number;
  prize?: string;
  host?: string;
  winnersCount?: number;
  endsAt?: string;
  description?: string;
  avatarUrl?: string;
  title?: string;
  subtitle?: string;
  stayDuration?: string;
  color1?: string;
  color2?: string;
  width?: number;
  height?: number;
  guild_id?: string;
  user_id?: string;
}

export const useCards = () => {
  const api = useDiscordApi();

  async function listTemplates(): Promise<string[]> {
    const res = await api.apiFetch<{ success: boolean; data: string[] }>('/api/cards/templates');
    return res.data;
  }

  /**
   * Demande le rendu d'une carte (utilise le cache serveur)
   * Retourne le SVG sous forme de string.
   */
  async function render(payload: CardPayload): Promise<string> {
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    const res = await api.apiFetch<{ success: boolean; data: { template: string; svg: string; format: string } }>(
      `/api/cards/render?${params.toString()}`
    );
    return res.data.svg;
  }

  /**
   * URL directe vers le SVG (utilisable dans <img src=...>)
   */
  function svgUrl(payload: CardPayload, apiKey?: string): string {
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    if (apiKey) params.set('api_key', apiKey);
    return `/api/cards/svg?${params.toString()}`;
  }

  async function clearCache(payload: { guild_id?: string; user_id?: string; template?: string } = {}): Promise<{ deleted: number }> {
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const res = await api.apiFetch<{ success: boolean; data: { deleted: number } }>(
      `/api/cards/cache?${params.toString()}`,
      { method: 'DELETE' }
    );
    return res.data;
  }

  return { listTemplates, render, svgUrl, clearCache };
};
