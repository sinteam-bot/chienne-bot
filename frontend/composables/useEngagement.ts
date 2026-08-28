import { useDiscordApi } from './useDiscordApi';

export interface Giveaway {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string | null;
  hostId: string;
  prize: string;
  description: string | null;
  winnersCount: number;
  requiredRoleId: string | null;
  startsAt: number;
  endsAt: number;
  status: 'active' | 'ended' | 'cancelled';
  winners: string[];
  color: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Poll {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string | null;
  question: string;
  options: string[];
  multiChoice: boolean;
  anonymous: boolean;
  endsAt: number | null;
  status: 'active' | 'ended';
  createdBy: string;
  createdAt: number;
}

export interface PollTally {
  total: number;
  perOption: { index: number; label: string; count: number }[];
}

export const useEngagement = () => {
  const api = useDiscordApi();

  // =================== GIVEAWAYS ===================

  async function listGiveaways(params: { status?: string; guild_id?: string; limit?: number } = {}): Promise<Giveaway[]> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, String(v));
    });
    try {
      const res = await api.apiFetch<{ success: boolean; data: Giveaway[] }>(`/api/giveaways${qs.toString() ? '?' + qs.toString() : ''}`);
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  async function getGiveaway(id: string): Promise<Giveaway | null> {
    const res = await api.apiFetch<{ success: boolean; data: Giveaway }>(`/api/giveaways/${id}`);
    return res?.data || null;
  }

  async function listEntries(id: string): Promise<string[]> {
    try {
      const res = await api.apiFetch<{ success: boolean; data: string[] }>(`/api/giveaways/${id}/entries`);
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  async function endGiveaway(id: string): Promise<Giveaway> {
    const res = await api.apiFetch<{ success: boolean; data: Giveaway }>(`/api/giveaways/${id}/end`, { method: 'POST' });
    return res.data;
  }

  async function cancelGiveaway(id: string): Promise<Giveaway> {
    const res = await api.apiFetch<{ success: boolean; data: Giveaway }>(`/api/giveaways/${id}/cancel`, { method: 'POST' });
    return res.data;
  }

  // =================== POLLS ===================

  async function listPolls(params: { status?: string; guild_id?: string; limit?: number } = {}): Promise<Poll[]> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, String(v));
    });
    try {
      const res = await api.apiFetch<{ success: boolean; data: Poll[] }>(`/api/polls${qs.toString() ? '?' + qs.toString() : ''}`);
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  async function getPoll(id: string): Promise<Poll & { tally: PollTally }> {
    const res = await api.apiFetch<{ success: boolean; data: Poll & { tally: PollTally } }>(`/api/polls/${id}`);
    return res.data;
  }

  async function endPoll(id: string): Promise<Poll> {
    const res = await api.apiFetch<{ success: boolean; data: Poll }>(`/api/polls/${id}/end`, { method: 'POST' });
    return res.data;
  }

  async function getPollResults(id: string): Promise<PollTally> {
    const res = await api.apiFetch<{ success: boolean; data: PollTally }>(`/api/polls/${id}/results`);
    return res.data;
  }

  return {
    listGiveaways, getGiveaway, listEntries, endGiveaway, cancelGiveaway,
    listPolls, getPoll, endPoll, getPollResults
  };
};
