import { useDiscordApi } from './useDiscordApi';

export interface Ticket {
  id: string;
  guild_id: string;
  channel_id: string;
  user_id: string;
  category: string;
  subject: string | null;
  status: 'open' | 'claimed' | 'closed';
  claimed_by: string | null;
  closed_by: string | null;
  closed_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  content: string | null;
  attachments: string | null;
  is_staff: number;
  created_at: number;
}

export const useTickets = () => {
  const api = useDiscordApi();

  async function list(params: { status?: string; user_id?: string; category?: string; page?: number; limit?: number } = {}): Promise<{ tickets: Ticket[]; total: number; page: number; limit: number; pages: number }> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    const url = `/api/tickets${qs.toString() ? '?' + qs.toString() : ''}`;
    const res = await api.apiFetch<{ success: boolean; data: any }>(url);
    return res.data;
  }

  async function get(id: string): Promise<{ ticket: Ticket; messages: TicketMessage[] }> {
    const res = await api.apiFetch<{ success: boolean; data: { ticket: Ticket; messages: TicketMessage[] } }>(`/api/tickets/${id}`);
    return res.data;
  }

  async function getTranscript(id: string): Promise<string> {
    const res = await api.apiFetch<{ success: boolean; data: { html: string } }>(`/api/tickets/${id}/transcript`);
    return res.data.html;
  }

  async function update(id: string, patch: { status?: string; claimedBy?: string | null; subject?: string }): Promise<Ticket> {
    const res = await api.apiFetch<{ success: boolean; data: Ticket }>(`/api/tickets/${id}`, { method: 'PUT', body: patch });
    return res.data;
  }

  async function close(id: string, closerId: string | null = null): Promise<Ticket> {
    const res = await api.apiFetch<{ success: boolean; data: Ticket }>(`/api/tickets/${id}/close`, { method: 'POST', body: { closerId } });
    return res.data;
  }

  return { list, get, getTranscript, update, close };
};
