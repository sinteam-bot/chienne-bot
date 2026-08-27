import { useDiscordApi } from './useDiscordApi';

export interface LogEntry {
  id: string;
  guild_id: string;
  event_type: string;
  actor_id: string | null;
  target_id: string | null;
  channel_id: string | null;
  metadata: string | null;
  summary: string | null;
  created_at: number;
}

export interface LogListResponse {
  success: boolean;
  data: {
    logs: LogEntry[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const useLogs = () => {
  const api = useDiscordApi();

  async function list(params: { event_type?: string; actor_id?: string; target_id?: string; channel_id?: string; page?: number; limit?: number } = {}): Promise<LogListResponse['data']> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    const url = `/api/logs${qs.toString() ? '?' + qs.toString() : ''}`;
    const res = await api.apiFetch<LogListResponse>(url);
    return res.data;
  }

  async function getTypes(): Promise<{ event_type: string; count: number }[]> {
    const res = await api.apiFetch<{ success: boolean; data: { event_type: string; count: number }[] }>('/api/logs/types');
    return res.data;
  }

  async function getOverview(): Promise<any> {
    const res = await api.apiFetch<{ success: boolean; data: any }>('/api/stats/overview');
    return res.data;
  }

  async function getMessagesByDay(days = 7): Promise<{ day: string; count: number }[]> {
    const res = await api.apiFetch<{ success: boolean; data: any[] }>(`/api/stats/messages?days=${days}`);
    return res.data;
  }

  async function getMemberGrowth(days = 30): Promise<{ day: string; count: number }[]> {
    const res = await api.apiFetch<{ success: boolean; data: any[] }>(`/api/stats/members?days=${days}`);
    return res.data;
  }

  async function getModerationStats(weeks = 4): Promise<{ action: string; count: number }[]> {
    const res = await api.apiFetch<{ success: boolean; data: any[] }>(`/api/stats/moderation?weeks=${weeks}`);
    return res.data;
  }

  return { list, getTypes, getOverview, getMessagesByDay, getMemberGrowth, getModerationStats };
};
