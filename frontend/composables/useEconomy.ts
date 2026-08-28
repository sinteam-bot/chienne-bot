import { useDiscordApi } from './useDiscordApi';

export interface EconomyBalance {
  userId: string;
  guildId: string;
  balance: number;
  bankBalance: number;
  totalEarned: number;
  totalSpent: number;
  lastDailyClaimAt: number | null;
}

export interface ShopItem {
  id: string;
  guildId: string;
  name: string;
  description: string | null;
  emoji: string | null;
  price: number;
  roleRewardId: string | null;
  xpReward: number | null;
  isTradeable: boolean;
  isDroppable: boolean;
  maxPerUser: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface InventoryEntry {
  userId: string;
  guildId: string;
  itemId: string;
  quantity: number;
  acquiredAt: number;
  itemName?: string;
  itemEmoji?: string;
  itemDescription?: string;
}

export interface EconomyTransaction {
  id: string;
  guildId: string;
  userId: string;
  amount: number;
  type: string;
  counterpartyId: string | null;
  reason: string | null;
  metadata: any;
  createdAt: number;
}

export const useEconomy = () => {
  const api = useDiscordApi();

  async function getBalance(userId: string, guildId?: string): Promise<EconomyBalance | null> {
    if (!userId) return null;
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    try {
      const res = await api.apiFetch<{ success: boolean; data: EconomyBalance }>(`/api/economy/balance/${userId}${qs}`);
      return res?.data || null;
    } catch {
      return null;
    }
  }

  async function claimDaily(payload: { guildId?: string; userId: string }): Promise<{ success: boolean; data?: any; error?: string }> {
    const res = await api.apiFetch<{ success: boolean; data: any; error?: string }>('/api/economy/daily', {
      method: 'POST',
      body: payload
    });
    return res;
  }

  async function pay(payload: { guildId?: string; fromUserId: string; toUserId: string; amount: number }): Promise<{ success: boolean; data?: any; error?: string }> {
    const res = await api.apiFetch<{ success: boolean; data?: any; error?: string }>('/api/economy/pay', {
      method: 'POST',
      body: payload
    });
    return res;
  }

  async function getLeaderboard(guildId?: string, limit = 50): Promise<EconomyBalance[]> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}&limit=${limit}` : `?limit=${limit}`;
    try {
      const res = await api.apiFetch<{ success: boolean; data: EconomyBalance[] }>(`/api/economy/leaderboard${qs}`);
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  async function getTransactions(userId: string, guildId?: string): Promise<EconomyTransaction[]> {
    if (!userId) return [];
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    try {
      const res = await api.apiFetch<{ success: boolean; data: EconomyTransaction[] }>(`/api/economy/transactions/${userId}${qs}`);
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  // Shop
  async function listShop(guildId?: string): Promise<ShopItem[]> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    try {
      const res = await api.apiFetch<{ success: boolean; data: ShopItem[] }>(`/api/shop${qs}`);
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  async function createShopItem(payload: Partial<ShopItem> & { guildId?: string; name: string; price: number }): Promise<{ success: boolean; data?: ShopItem; error?: string }> {
    const res = await api.apiFetch<{ success: boolean; data?: ShopItem; error?: string }>('/api/shop', { method: 'POST', body: payload });
    return res;
  }

  async function updateShopItem(id: string, patch: Partial<ShopItem>): Promise<ShopItem | null> {
    try {
      const res = await api.apiFetch<{ success: boolean; data: ShopItem }>(`/api/shop/${id}`, { method: 'PATCH', body: patch });
      return res?.data || null;
    } catch {
      return null;
    }
  }

  async function deleteShopItem(id: string): Promise<{ success: boolean }> {
    const res = await api.apiFetch<{ success: boolean }>(`/api/shop/${id}`, { method: 'DELETE' });
    return res;
  }

  // Inventory
  async function getInventory(userId: string, guildId?: string): Promise<InventoryEntry[]> {
    if (!userId) return [];
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    try {
      const res = await api.apiFetch<{ success: boolean; data: InventoryEntry[] }>(`/api/inventory/${userId}${qs}`);
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  async function adminAddItem(payload: { guildId?: string; userId: string; itemId: string; quantity?: number }): Promise<{ success: boolean; data?: any; error?: string }> {
    const res = await api.apiFetch<{ success: boolean; data?: any; error?: string }>('/api/inventory/give', { method: 'POST', body: payload });
    return res;
  }

  async function resetInventory(payload: { guildId?: string; userId: string }): Promise<{ success: boolean }> {
    const res = await api.apiFetch<{ success: boolean }>('/api/inventory/reset', { method: 'POST', body: payload });
    return res;
  }

  return {
    getBalance, claimDaily, pay, getLeaderboard, getTransactions,
    listShop, createShopItem, updateShopItem, deleteShopItem,
    getInventory, adminAddItem, resetInventory
  };
};
