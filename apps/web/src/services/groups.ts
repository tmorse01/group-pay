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

interface CreateGroupResponse {
  id: string;
  name: string;
  currency: string;
  createdAt: string;
  memberCount: number;
}

interface GroupMember {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string;
    venmoHandle?: string;
    paypalLink?: string;
  };
}

interface GroupExpense {
  id: string;
  description: string;
  amountCents: number;
  currency: string;
  category?: string;
  date: string;
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
  }>;
  createdAt: string;
}

interface GroupDetail {
  id: string;
  name: string;
  currency: string;
  createdAt: string;
  members: GroupMember[];
  expenses: GroupExpense[];
}

interface GroupListItem {
  id: string;
  name: string;
  currency: string;
  memberCount: number;
  expenseCount: number;
  lastActivity: string;
  createdAt: string;
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
  getGroups: async (): Promise<GroupListItem[]> => {
    const response = await api.get<{ groups: GroupListItem[] }>('/api/groups');
    return response.groups;
  },

  getGroup: (id: string): Promise<{ group: GroupDetail }> =>
    api.get(`/api/groups/${id}`),

  createGroup: async (
    data: CreateGroupRequest
  ): Promise<{ group: CreateGroupResponse }> => {
    const response = await api.post<{ group: CreateGroupResponse }>(
      '/api/groups',
      data
    );
    return response;
  },

  updateGroup: async (
    id: string,
    data: UpdateGroupRequest
  ): Promise<{ group: Group }> => {
    const response = await api.put<{ group: Group }>(`/api/groups/${id}`, data);
    return response;
  },

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
    onSuccess: (response) => {
      const newGroup = response.group;

      // Convert Group to GroupListItem for the list cache
      const groupListItem: GroupListItem = {
        id: newGroup.id,
        name: newGroup.name,
        currency: newGroup.currency,
        createdAt: newGroup.createdAt,
        memberCount: 1, // New group starts with just the creator
        expenseCount: 0,
        lastActivity: newGroup.createdAt,
      };

      // Update the groups list cache
      queryClient.setQueryData<GroupListItem[]>(['groups'], (old) =>
        old ? [...old, groupListItem] : [groupListItem]
      );

      // Cache the new group individually (convert to GroupDetail format)
      const groupDetail: GroupDetail = {
        id: newGroup.id,
        name: newGroup.name,
        currency: newGroup.currency,
        createdAt: newGroup.createdAt,
        members: [],
        expenses: [],
      };
      queryClient.setQueryData(['groups', newGroup.id], { group: groupDetail });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupRequest }) =>
      groupsApi.updateGroup(id, data),
    onSuccess: (response, { id }) => {
      const updatedGroup = response.group;

      // Update the specific group cache
      queryClient.setQueryData(
        ['groups', id],
        (old: { group: GroupDetail } | undefined) => {
          if (!old) return old;
          return {
            group: {
              ...old.group,
              ...updatedGroup,
            },
          };
        }
      );

      // Update the group in the groups list
      queryClient.setQueryData<GroupListItem[]>(['groups'], (old) => {
        if (!old) return old;
        return old.map((group) =>
          group.id === id
            ? {
                ...group,
                name: updatedGroup.name,
                currency: updatedGroup.currency,
              }
            : group
        );
      });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: groupsApi.deleteGroup,
    onSuccess: (_, deletedId) => {
      // Remove from groups list
      queryClient.setQueryData<GroupListItem[]>(['groups'], (old) =>
        old?.filter((group) => group.id !== deletedId)
      );

      // Remove individual group cache
      queryClient.removeQueries({ queryKey: ['groups', deletedId] });
    },
  });
}
