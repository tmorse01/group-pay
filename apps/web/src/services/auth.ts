import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// Types
interface User {
  id: string;
  email: string;
  name: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// API functions
const authApi = {
  login: (credentials: LoginRequest): Promise<LoginResponse> =>
    api.post('/api/auth/login', credentials, { requiresAuth: false }),

  register: (data: RegisterRequest): Promise<LoginResponse> =>
    api.post('/api/auth/register', data, { requiresAuth: false }),

  me: async (): Promise<User> => {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = (await api.get('/api/auth/me', {
        signal: controller.signal,
      })) as { user: User };
      clearTimeout(timeoutId);
      return response.user;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error; // api.ts will have already converted AbortError to ApiError
    }
  },

  logout: (): Promise<void> => api.post('/api/auth/logout'),
};

// React Query hooks
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Cache user data (token is now in httpOnly cookie)
      queryClient.setQueryData(['auth', 'me'], data.user);

      // Invalidate and refetch any queries that depend on auth
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: () => {
      // Clear any stale auth data
      queryClient.removeQueries({ queryKey: ['auth'] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      // Cache user data (token is now in httpOnly cookie)
      queryClient.setQueryData(['auth', 'me'], data.user);

      // Invalidate and refetch any queries that depend on auth
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear all cached data (cookies are cleared server-side)
      queryClient.clear();
    },
    onError: () => {
      // Even if logout fails on server, clear local data
      queryClient.clear();
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    retry: (failureCount, error) => {
      // Don't retry on 401/403 errors (unauthorized)
      if (error instanceof Error && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status === 401 || status === 403) return false;
        // Don't retry on timeout errors (status 0)
        if (status === 0) return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    // Fetch in background without blocking UI, especially for unauthenticated users
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
