import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

// Types
export interface GroupBalance {
  groupId: string;
  groupName: string;
  totalOwed: number;
  totalLent: number;
  netBalance: number;
  currency: string;
}

interface BalancesResponse {
  balances: GroupBalance[];
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  method: 'VENMO' | 'PAYPAL' | 'ZELLE' | 'STRIPE_LINK' | 'MARK_ONLY';
  externalRef?: string;
  status: 'PENDING' | 'CONFIRMED';
  createdAt: string;
  fromUser: {
    id: string;
    name: string;
    photoUrl?: string;
  };
  toUser: {
    id: string;
    name: string;
    photoUrl?: string;
  };
  group: {
    id: string;
    name: string;
  };
}

interface SettlementsResponse {
  settlements: Settlement[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// API functions
const dashboardApi = {
  getBalances: async (): Promise<GroupBalance[]> => {
    const response = await api.get<BalancesResponse>('/api/users/balances');
    return response.balances;
  },

  getRecentSettlements: async (limit: number = 5): Promise<Settlement[]> => {
    const response = await api.get<SettlementsResponse>(
      `/api/settlements/user?limit=${limit}&offset=0`
    );
    return response.settlements;
  },
};

// React Query hooks
export function useBalances() {
  return useQuery({
    queryKey: ['dashboard', 'balances'],
    queryFn: dashboardApi.getBalances,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useRecentSettlements(limit: number = 5) {
  return useQuery({
    queryKey: ['dashboard', 'settlements', limit],
    queryFn: () => dashboardApi.getRecentSettlements(limit),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
