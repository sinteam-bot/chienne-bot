import { useDiscordApi } from './useDiscordApi';

export interface ServerInfo {
  id: string;
  name: string;
  memberCount: number;
  ownerId: string;
  createdAt: string | null;
  iconURL: string | null;
  bannerURL: string | null;
  channels: number;
  roles: number;
  emojis: number;
  features: string[];
}

export interface UserInfo {
  id: string;
  username: string;
  globalName: string | null;
  bot: boolean;
  avatarURL: string | null;
  createdTimestamp: number;
  joinedTimestamp: number | null;
  nick: string | null;
  roles: string[];
}

export const useInfo = () => {
  const api = useDiscordApi();

  async function getServer(guildId?: string): Promise<ServerInfo> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: ServerInfo }>(`/api/info/server${qs}`);
    return res.data;
  }

  async function getUser(userId: string, guildId?: string): Promise<UserInfo> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: UserInfo }>(`/api/info/user/${userId}${qs}`);
    return res.data;
  }

  async function getAvatarUrl(userId: string): Promise<string> {
    const res = await api.apiFetch<{ success: boolean; data: { url: string } }>(`/api/info/avatar/${userId}`);
    return res.data.url;
  }

  return { getServer, getUser, getAvatarUrl };
};
