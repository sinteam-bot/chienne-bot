import { useDiscordApi } from './useDiscordApi';

export interface BirthdaySettings {
  guildId: string;
  mode: 'public' | 'private';
  announceChannelId: string | null;
  announceHour: number;
  announceTimezone: string;
  pingRoleId: string | null;
  messageTemplate: string;
  tempRoleId: string | null;
  enabled: boolean;
}

export interface BirthdayUser {
  userId: string;
  username: string;
  birthdate: string;
  visibility?: boolean;
}

export interface UpcomingBirthday {
  userId: string;
  username: string;
  birthdate: string;
  age: number;
  days_until: number;
}

export interface BirthdayHistoryEntry {
  id: string;
  guildId: string;
  userId: string;
  username: string;
  age: number | null;
  messageId: string | null;
  giftsGiven: string[];
  announcedAt: number;
}

export const useBirthdays = () => {
  const api = useDiscordApi();

  async function getSettings(guildId?: string): Promise<BirthdaySettings> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: BirthdaySettings }>(`/api/birthdays/settings${qs}`);
    return res.data;
  }

  async function updateSettings(patch: Partial<BirthdaySettings> & { guildId: string }): Promise<BirthdaySettings> {
    const res = await api.apiFetch<{ success: boolean; data: BirthdaySettings }>('/api/birthdays/settings', {
      method: 'PUT',
      body: patch
    });
    return res.data;
  }

  async function getToday(guildId?: string): Promise<BirthdayUser[]> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: BirthdayUser[] }>(`/api/birthdays/today${qs}`);
    return res.data;
  }

  async function getUpcoming(guildId?: string, days = 7): Promise<UpcomingBirthday[]> {
    const params = new URLSearchParams();
    if (guildId) params.set('guild_id', guildId);
    params.set('days', String(days));
    const res = await api.apiFetch<{ success: boolean; data: UpcomingBirthday[] }>(`/api/birthdays/upcoming?${params.toString()}`);
    return res.data;
  }

  async function getUser(userId: string, guildId?: string): Promise<BirthdayUser> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: BirthdayUser }>(`/api/birthdays/user/${userId}${qs}`);
    return res.data;
  }

  async function setBirthday(payload: { userId: string; username: string; guildId: string; birthdate: string }): Promise<{ success: boolean; data: any; error?: string; nextChangeAt?: number }> {
    const res = await api.apiFetch<{ success: boolean; data: any; error?: string; nextChangeAt?: number }>(
      `/api/birthdays/user/${payload.userId}`,
      { method: 'PUT', body: { username: payload.username, guildId: payload.guildId, birthdate: payload.birthdate } }
    );
    return res;
  }

  async function deleteBirthday(userId: string, guildId?: string): Promise<{ success: boolean }> {
    const body: any = {};
    if (guildId) body.guildId = guildId;
    const res = await api.apiFetch<{ success: boolean }>(`/api/birthdays/user/${userId}`, {
      method: 'DELETE',
      body
    });
    return res;
  }

  async function setVisibility(userId: string, guildId: string, enabled: boolean): Promise<{ success: boolean }> {
    const res = await api.apiFetch<{ success: boolean }>(`/api/birthdays/user/${userId}/visibility`, {
      method: 'POST',
      body: { guildId, enabled }
    });
    return res;
  }

  async function getHistory(guildId?: string, userId?: string, limit = 50): Promise<BirthdayHistoryEntry[]> {
    const params = new URLSearchParams();
    if (guildId) params.set('guild_id', guildId);
    if (userId) params.set('user_id', userId);
    params.set('limit', String(limit));
    const res = await api.apiFetch<{ success: boolean; data: BirthdayHistoryEntry[] }>(`/api/birthdays/history?${params.toString()}`);
    return res.data;
  }

  return {
    getSettings, updateSettings, getToday, getUpcoming, getUser,
    setBirthday, deleteBirthday, setVisibility, getHistory
  };
};
