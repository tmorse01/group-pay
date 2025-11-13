import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Receipt } from '@group-pay/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API functions
const receiptsApi = {
  uploadReceipt: async (
    expenseId: string,
    file: File
  ): Promise<{ receipt: Receipt }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${API_BASE_URL}/api/expenses/${expenseId}/receipts`,
      {
        method: 'POST',
        credentials: 'include',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },

  getReceipts: async (expenseId: string): Promise<{ receipts: Receipt[] }> => {
    return api.get(`/api/expenses/${expenseId}/receipts`);
  },

  getReceipt: async (receiptId: string): Promise<{ receipt: Receipt }> => {
    return api.get(`/api/receipts/${receiptId}`);
  },

  deleteReceipt: async (receiptId: string): Promise<{ success: boolean }> => {
    return api.delete(`/api/receipts/${receiptId}`);
  },
};

// React Query hooks
export function useReceipts(expenseId: string) {
  return useQuery({
    queryKey: ['receipts', expenseId],
    queryFn: () => receiptsApi.getReceipts(expenseId),
    enabled: !!expenseId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useReceipt(receiptId: string) {
  return useQuery({
    queryKey: ['receipts', receiptId],
    queryFn: () => receiptsApi.getReceipt(receiptId),
    enabled: !!receiptId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useUploadReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expenseId, file }: { expenseId: string; file: File }) =>
      receiptsApi.uploadReceipt(expenseId, file),
    onSuccess: (response, variables) => {
      const newReceipt = response.receipt;

      // Update the receipts list cache
      queryClient.setQueryData<{ receipts: Receipt[] }>(
        ['receipts', variables.expenseId],
        (old) => ({
          receipts: old ? [newReceipt, ...old.receipts] : [newReceipt],
        })
      );

      // Invalidate expense cache to include receipts
      queryClient.invalidateQueries({
        queryKey: ['expenses', variables.expenseId],
      });
    },
  });
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: receiptsApi.deleteReceipt,
    onSuccess: (_, receiptId) => {
      // Remove from individual receipt cache
      queryClient.removeQueries({ queryKey: ['receipts', receiptId] });

      // Invalidate all receipt lists (they'll refetch with updated data)
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });
}
