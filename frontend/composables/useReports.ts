import { useDiscordApi } from './useDiscordApi';

export interface Report {
  id: string;
  guildId: string;
  reporterId: string;
  reportedId: string;
  channelId: string | null;
  messageId: string | null;
  reason: string;
  category: string;
  status: 'open' | 'resolved' | 'dismissed';
  resolvedBy: string | null;
  resolvedAt: number | null;
  createdAt: number;
}

export interface ReportAction {
  id: string;
  reportId: string;
  staffId: string;
  action: string;
  notes: string | null;
  createdAt: number;
}

export interface ReportStats {
  open: number;
  resolved: number;
  dismissed: number;
  total: number;
}

export const useReports = () => {
  const api = useDiscordApi();

  async function list(params: { guild_id?: string; status?: string; reporter_id?: string; reported_id?: string; limit?: number; offset?: number } = {}): Promise<{ data: Report[]; total: number }> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    const res = await api.apiFetch<{ success: boolean; data: Report[]; total: number }>(`/api/reports${qs.toString() ? '?' + qs.toString() : ''}`);
    return { data: res.data, total: res.total };
  }

  async function get(id: string): Promise<Report> {
    const res = await api.apiFetch<{ success: boolean; data: Report }>(`/api/reports/${id}`);
    return res.data;
  }

  async function create(payload: {
    guildId: string;
    reporterId: string;
    reportedId: string;
    channelId?: string;
    messageId?: string;
    reason: string;
    category?: string;
  }): Promise<{ success: boolean; data?: Report; error?: string }> {
    const res = await api.apiFetch<{ success: boolean; data?: Report; error?: string }>('/api/reports', {
      method: 'POST', body: payload
    });
    return res;
  }

  async function resolve(id: string, staffId: string, action = 'custom', notes?: string): Promise<{ success: boolean; data?: Report; error?: string }> {
    const res = await api.apiFetch<{ success: boolean; data?: Report; error?: string }>(`/api/reports/${id}/resolve`, {
      method: 'POST', body: { staffId, action, notes }
    });
    return res;
  }

  async function dismiss(id: string, staffId: string, notes?: string): Promise<{ success: boolean; data?: Report; error?: string }> {
    const res = await api.apiFetch<{ success: boolean; data?: Report; error?: string }>(`/api/reports/${id}/dismiss`, {
      method: 'POST', body: { staffId, notes }
    });
    return res;
  }

  async function actions(id: string): Promise<ReportAction[]> {
    const res = await api.apiFetch<{ success: boolean; data: ReportAction[] }>(`/api/reports/${id}/actions`);
    return res.data;
  }

  async function stats(guildId?: string): Promise<ReportStats> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: ReportStats }>(`/api/reports/stats${qs}`);
    return res.data;
  }

  return { list, get, create, resolve, dismiss, actions, stats };
};
