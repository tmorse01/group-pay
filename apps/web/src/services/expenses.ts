import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  UpdateExpenseDto,
  Expense,
  ExpenseSplitType,
} from '@group-pay/shared';

// Extended interfaces for frontend use
interface ExpenseWithDetails extends Expense {
  payer: {
    id: string;
    name: string;
    photoUrl?: string;
  };
  participants: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      photoUrl?: string;
    };
    shareCents: number;
    isSettled: boolean;
  }>;
}

interface CreateExpenseRequest {
  description: string;
  amountCents: number;
  currency: string;
  date: Date;
  category?: string;
  notes?: string;
  payerId: string;
  groupId: string;
  splitType: ExpenseSplitType;
  participants: Array<{
    userId: string;
    shareCents?: number;
    sharePercentage?: number;
    shareCount?: number;
  }>;
}

interface CreateExpenseResponse {
  expense: ExpenseWithDetails;
}

// API functions
const expensesApi = {
  getExpenses: async (groupId?: string): Promise<ExpenseWithDetails[]> => {
    if (groupId) {
      const response = await api.get<{ expenses: ExpenseWithDetails[] }>(
        `/api/expenses/group/${groupId}`
      );
      return response.expenses;
    } else {
      const response = await api.get<{ expenses: ExpenseWithDetails[] }>(
        '/api/expenses'
      );
      return response.expenses;
    }
  },

  getExpense: (id: string): Promise<{ expense: ExpenseWithDetails }> =>
    api.get(`/api/expenses/${id}`),

  createExpense: async (
    data: CreateExpenseRequest
  ): Promise<CreateExpenseResponse> => {
    const { groupId, ...expenseData } = data;
    const response = await api.post<CreateExpenseResponse>(
      `/api/expenses?groupId=${groupId}`,
      expenseData
    );
    return response;
  },

  updateExpense: async (
    id: string,
    data: UpdateExpenseDto
  ): Promise<{ expense: ExpenseWithDetails }> => {
    const response = await api.put<{ expense: ExpenseWithDetails }>(
      `/api/expenses/${id}`,
      data
    );
    return response;
  },

  deleteExpense: (id: string): Promise<void> =>
    api.delete(`/api/expenses/${id}`),
};

// React Query hooks
export function useExpenses(groupId?: string) {
  return useQuery({
    queryKey: groupId ? ['expenses', 'group', groupId] : ['expenses'],
    queryFn: () => expensesApi.getExpenses(groupId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: () => expensesApi.getExpense(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expensesApi.createExpense,
    onSuccess: (response, variables) => {
      const newExpense = response.expense;

      // Update the group-specific expenses cache
      queryClient.setQueryData<ExpenseWithDetails[]>(
        ['expenses', 'group', variables.groupId],
        (old) => (old ? [newExpense, ...old] : [newExpense])
      );

      // Update the global expenses cache
      queryClient.setQueryData<ExpenseWithDetails[]>(['expenses'], (old) =>
        old ? [newExpense, ...old] : [newExpense]
      );

      // Update the specific group cache to include the new expense
      queryClient.setQueryData(
        ['groups', variables.groupId],
        (
          old:
            | { group: { expenses: unknown[]; [key: string]: unknown } }
            | undefined
        ) => {
          if (!old?.group) return old;

          const groupExpense = {
            id: newExpense.id,
            description: newExpense.description,
            amountCents: newExpense.amountCents,
            currency: newExpense.currency,
            category: newExpense.category,
            date: newExpense.date.toISOString(),
            payer: newExpense.payer,
            participants: newExpense.participants,
            createdAt: newExpense.createdAt.toISOString(),
          };

          return {
            group: {
              ...old.group,
              expenses: [groupExpense, ...old.group.expenses],
            },
          };
        }
      );

      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: ['groups', variables.groupId],
      });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseDto }) =>
      expensesApi.updateExpense(id, data),
    onSuccess: (response, { id }) => {
      const updatedExpense = response.expense;

      // Update the individual expense cache
      queryClient.setQueryData(['expenses', id], response);

      // Update the expenses list caches
      const updateExpenseInList = (old: ExpenseWithDetails[] | undefined) => {
        if (!old) return old;
        return old.map((expense) =>
          expense.id === id ? updatedExpense : expense
        );
      };

      queryClient.setQueryData(['expenses'], updateExpenseInList);

      // Update group-specific expense lists
      queryClient
        .getQueriesData({ queryKey: ['expenses', 'group'] })
        .forEach(([queryKey, data]) => {
          if (Array.isArray(data)) {
            queryClient.setQueryData(queryKey, updateExpenseInList(data));
          }
        });

      // Invalidate group cache to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['groups'],
        predicate: (query) => {
          const data = query.state.data as {
            group?: { expenses?: { id: string }[] };
          };
          return Boolean(data?.group?.expenses?.some((exp) => exp.id === id));
        },
      });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expensesApi.deleteExpense,
    onSuccess: (_, deletedId) => {
      // Remove from all expense caches
      const removeExpenseFromList = (old: ExpenseWithDetails[] | undefined) => {
        if (!old) return old;
        return old.filter((expense) => expense.id !== deletedId);
      };

      queryClient.setQueryData(['expenses'], removeExpenseFromList);

      // Remove from group-specific expense lists
      queryClient
        .getQueriesData({ queryKey: ['expenses', 'group'] })
        .forEach(([queryKey, data]) => {
          if (Array.isArray(data)) {
            queryClient.setQueryData(queryKey, removeExpenseFromList(data));
          }
        });

      // Remove individual expense cache
      queryClient.removeQueries({ queryKey: ['expenses', deletedId] });

      // Invalidate group caches to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export type { ExpenseWithDetails, CreateExpenseRequest, CreateExpenseResponse };
