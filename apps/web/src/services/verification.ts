import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// Types
interface VerifyEmailRequest {
  token: string;
}

interface VerifyEmailResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    emailVerifiedAt: string | null;
  };
}

interface ResendVerificationRequest {
  email?: string;
}

interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

interface VerificationStatusResponse {
  emailVerified: boolean;
  emailVerifiedAt: string | null;
}

// API functions
const verificationApi = {
  verifyEmail: (data: VerifyEmailRequest): Promise<VerifyEmailResponse> =>
    api.post('/api/auth/verify-email', data, { requiresAuth: false }),

  resendVerification: (
    data?: ResendVerificationRequest
  ): Promise<ResendVerificationResponse> =>
    api.post('/api/auth/resend-verification', data || {}),

  getVerificationStatus: (): Promise<VerificationStatusResponse> =>
    api.get('/api/auth/verification-status'),
};

// React Query hooks
export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verificationApi.verifyEmail,
    onSuccess: (data) => {
      // Update user data in cache
      queryClient.setQueryData(['auth', 'me'], (old: any) => {
        if (!old) return data.user;
        return { ...old, ...data.user };
      });

      // Invalidate auth queries to refetch
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: verificationApi.resendVerification,
  });
}

export function useVerificationStatus() {
  return useQuery({
    queryKey: ['auth', 'verification-status'],
    queryFn: verificationApi.getVerificationStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

