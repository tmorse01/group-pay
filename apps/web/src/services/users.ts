import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// Types
export interface UpdateUserRequest {
  name?: string;
  photoUrl?: string | null;
  venmoHandle?: string | null;
  paypalLink?: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  photoUrl?: string | null;
  venmoHandle?: string | null;
  paypalLink?: string | null;
  createdAt: string;
}

interface UpdateUserResponse {
  user: User;
}

// API functions
const usersApi = {
  updateProfile: (data: UpdateUserRequest): Promise<UpdateUserResponse> =>
    api.put('/api/users/profile', data),
};

// React Query hooks
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: (data) => {
      // Update the cached user data
      queryClient.setQueryData(['auth', 'me'], data.user);

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
