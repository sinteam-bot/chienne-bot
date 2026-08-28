import { useDiscordApi } from './useDiscordApi';

export interface Reminder {
  id: string;
  guildId: string | null;
  channelId: string | null;
  userId: string;
  reminderText: string;
  fireAt: number;
  createdAt: number;
  status: string;
  sourceMessageId: string | null;
}

export interface WordTrigger {
  id: string;
  guildId: string;
  triggerText: string;
  matchType: 'exact' | 'contains' | 'regex';
  responseText: string | null;
  responseEmbed: any;
  excludeChannelIds: string[];
  excludeRoleIds: string[];
  cooldownSeconds: number;
  createdBy: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CustomCommand {
  id: string;
  guildId: string;
  name: string;
  responseText: string | null;
  responseEmbed: any;
  restrictChannelIds: string[];
  restrictRoleIds: string[];
  cooldownSeconds: number;
  createdBy: string | null;
  createdAt: number;
  updatedAt: number;
}

export const useEngagementAdvanced = () => {
  const api = useDiscordApi();

  // =================== REMINDERS ===================

  async function listReminders(userId?: string, guildId?: string): Promise<Reminder[]> {
    if (!userId) return [];
    const qs = guildId ? `?user_id=${userId}&guild_id=${encodeURIComponent(guildId)}` : `?user_id=${userId}`;
    try {
      const res = await api.apiFetch<{ success: boolean; data: Reminder[] }>(`/api/engagement-advanced/reminders${qs}`);
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  async function createReminder(payload: { userId: string; guildId?: string; channelId?: string; text: string; fireAt: number }): Promise<{ success: boolean; data?: Reminder; error?: string }> {
    const res = await api.apiFetch<{ success: boolean; data?: Reminder; error?: string }>('/api/engagement-advanced/reminders', {
      method: 'POST', body: payload
    });
    return res;
  }

  async function cancelReminder(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const res = await api.apiFetch<{ success: boolean; error?: string }>(`/api/engagement-advanced/reminders/${id}`, {
      method: 'DELETE', body: { userId }
    });
    return res;
  }

  // =================== TRIGGERS ===================

  async function listTriggers(guildId?: string): Promise<WordTrigger[]> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    try {
      const res = await api.apiFetch<{ success: boolean; data: WordTrigger[] }>(`/api/engagement-advanced/triggers${qs}`);
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  async function createTrigger(payload: { guildId?: string; triggerText: string; matchType?: 'exact' | 'contains'; responseText: string; cooldown?: number; createdBy: string }): Promise<{ success: boolean; data?: WordTrigger; error?: string }> {
    const res = await api.apiFetch<{ success: boolean; data?: WordTrigger; error?: string }>('/api/engagement-advanced/triggers', {
      method: 'POST', body: { ...payload, matchType: payload.matchType || 'exact' }
    });
    return res;
  }

  async function deleteTrigger(id: string): Promise<{ success: boolean }> {
    const res = await api.apiFetch<{ success: boolean }>(`/api/engagement-advanced/triggers/${id}`, { method: 'DELETE' });
    return res;
  }

  // =================== CUSTOM COMMANDS ===================

  async function listCustomCommands(guildId?: string): Promise<CustomCommand[]> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    try {
      const res = await api.apiFetch<{ success: boolean; data: CustomCommand[] }>(`/api/engagement-advanced/commands${qs}`);
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  async function createCustomCommand(payload: { guildId?: string; name: string; responseText: string; createdBy: string }): Promise<{ success: boolean; data?: CustomCommand; error?: string }> {
    const res = await api.apiFetch<{ success: boolean; data?: CustomCommand; error?: string }>('/api/engagement-advanced/commands', {
      method: 'POST', body: payload
    });
    return res;
  }

  async function deleteCustomCommand(id: string): Promise<{ success: boolean }> {
    const res = await api.apiFetch<{ success: boolean }>(`/api/engagement-advanced/commands/${id}`, { method: 'DELETE' });
    return res;
  }

  return {
    listReminders, createReminder, cancelReminder,
    listTriggers, createTrigger, deleteTrigger,
    listCustomCommands, createCustomCommand, deleteCustomCommand
  };
};
