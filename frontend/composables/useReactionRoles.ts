import { useDiscordApi } from './useDiscordApi';

export interface ReactionRole {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string;
  emoji: string;
  roleId: string;
  description: string | null;
  mode: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateReactionRolePayload {
  guildId: string;
  channelId: string;
  messageId: string;
  emoji: string;
  roleId: string;
  description?: string;
  mode?: string;
}

export const useReactionRoles = () => {
  const api = useDiscordApi();

  async function list(params: { guild_id?: string; message_id?: string; limit?: number; offset?: number } = {}): Promise<ReactionRole[]> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    const res = await api.apiFetch<{ success: boolean; data: ReactionRole[] }>(`/api/reaction-roles${qs.toString() ? '?' + qs.toString() : ''}`);
    return res.data;
  }

  async function create(payload: CreateReactionRolePayload): Promise<{ success: boolean; data?: ReactionRole; error?: string }> {
    const res = await api.apiFetch<{ success: boolean; data: ReactionRole; error?: string }>('/api/reaction-roles', {
      method: 'POST',
      body: payload
    });
    return res;
  }

  async function update(id: string, patch: { description?: string; mode?: string }): Promise<ReactionRole> {
    const res = await api.apiFetch<{ success: boolean; data: ReactionRole }>(`/api/reaction-roles/${id}`, {
      method: 'PATCH',
      body: patch
    });
    return res.data;
  }

  async function remove(id: string): Promise<{ success: boolean }> {
    const res = await api.apiFetch<{ success: boolean }>(`/api/reaction-roles/${id}`, { method: 'DELETE' });
    return res;
  }

  async function removeBulk(guildId: string, messageId: string): Promise<{ success: boolean }> {
    const res = await api.apiFetch<{ success: boolean }>('/api/reaction-roles/bulk', {
      method: 'POST',
      body: { guildId, messageId }
    });
    return res;
  }

  return { list, create, update, remove, removeBulk };
};
