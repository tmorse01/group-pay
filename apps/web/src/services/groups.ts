import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// Types
interface Group {
  id: string;
  name: string;
  description?: string;
  currency: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateGroupRequest {
  name: string;
  description?: string;
  currency: string;
}

interface UpdateGroupRequest {
  name?: string;
  description?: string;
  currency?: string;
}

// API functions
const groupsApi = {
  getGroups: (): Promise<Group[]> => api.get('/api/groups'),

  getGroup: (id: string): Promise<Group> => api.get(`/api/groups/${id}`),

  createGroup: (data: CreateGroupRequest): Promise<Group> =>
    api.post('/api/groups', data),

  updateGroup: (id: string, data: UpdateGroupRequest): Promise<Group> =>
    api.put(`/api/groups/${id}`, data),

  deleteGroup: (id: string): Promise<void> => api.delete(`/api/groups/${id}`),
};

// React Query hooks
export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.getGroups,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: ['groups', id],
    queryFn: () => groupsApi.getGroup(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: groupsApi.createGroup,
    onSuccess: (newGroup) => {
      // Update the groups list cache
      queryClient.setQueryData<Group[]>(['groups'], (old) =>
        old ? [...old, newGroup] : [newGroup]
      );

      // Cache the new group individually
      queryClient.setQueryData(['groups', newGroup.id], newGroup);
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupRequest }) =>
      groupsApi.updateGroup(id, data),
    onSuccess: (updatedGroup) => {
      // Update the specific group cache
      queryClient.setQueryData(['groups', updatedGroup.id], updatedGroup);

      // Update the group in the groups list
      queryClient.setQueryData<Group[]>(['groups'], (old) =>
        old?.map((group) =>
          group.id === updatedGroup.id ? updatedGroup : group
        )
      );
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: groupsApi.deleteGroup,
    onSuccess: (_, deletedId) => {
      // Remove from groups list
      queryClient.setQueryData<Group[]>(['groups'], (old) =>
        old?.filter((group) => group.id !== deletedId)
      );

      // Remove individual group cache
      queryClient.removeQueries({ queryKey: ['groups', deletedId] });
    },
  });
}
