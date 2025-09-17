# Feature: React Frontend Application

**Priority**: HIGH | **Estimated Time**: 6-8 hours | **Dependencies**: Core API, Authentication, Shared Types

## 🎯 Objective

Build a modern React application with Mantine UI, TanStack Query for data management, React Router for navigation, and comprehensive state management for the Group Pay expense tracking application.

## 📋 Requirements

### Application Structure

#### App Router Setup

```typescript
// apps/web/src/App.tsx
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Router } from './Router';
import { theme } from './theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        if (error?.status === 401) return false;
        return failureCount < 3;
      },
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <ModalsProvider>
          <Notifications />
          <BrowserRouter>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}
```

#### Theme Configuration

```typescript
// apps/web/src/theme.ts
import { createTheme, MantineColorsTuple } from '@mantine/core';

const brand: MantineColorsTuple = [
  '#e8f5e8',
  '#d2e8d2',
  '#a6d0a6',
  '#77b777',
  '#50a150',
  '#369436',
  '#2a7e2a',
  '#1f6b1f',
  '#165c16',
  '#0c4f0c',
];

export const theme = createTheme({
  primaryColor: 'brand',
  colors: { brand },
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
  headings: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    fontWeight: '600',
  },
  radius: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  breakpoints: {
    xs: '30em',
    sm: '48em',
    md: '64em',
    lg: '74em',
    xl: '90em',
  },
});
```

### Authentication Context

#### Auth Context & Provider

```typescript
// apps/web/src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@group-pay/shared';
import { authApi } from '../services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    setUser(response.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await authApi.register(email, password, name);
    setUser(response.user);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.me();
      setUser(response.user);
    } catch (error) {
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await authApi.me();
        setUser(response.user);
      } catch (error) {
        // User not authenticated
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

### API Services

#### Base API Service

```typescript
// apps/web/src/services/api.ts
class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private baseUrl = '/api';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.code || 'UNKNOWN_ERROR',
        errorData.message || 'An error occurred',
        errorData.details
      );
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiService();
export { ApiError };
```

#### Authentication API

```typescript
// apps/web/src/services/auth.ts
import { User, CreateUserData, LoginData } from '@group-pay/shared';
import { api } from './api';

interface AuthResponse {
  user: User;
}

export const authApi = {
  async register(
    email: string,
    password: string,
    name: string
  ): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/register', { email, password, name });
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', { email, password });
  },

  async logout(): Promise<{ success: boolean }> {
    return api.post('/auth/logout');
  },

  async me(): Promise<AuthResponse> {
    return api.get<AuthResponse>('/auth/me');
  },

  async refresh(): Promise<{ success: boolean }> {
    return api.post('/auth/refresh');
  },
};
```

#### Groups API

```typescript
// apps/web/src/services/groups.ts
import { Group, CreateGroupData, UpdateGroupData } from '@group-pay/shared';
import { api } from './api';

interface GroupsResponse {
  groups: Group[];
}

interface GroupResponse {
  group: Group;
}

interface MemberResponse {
  member: {
    id: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      photoUrl?: string;
    };
  };
}

export const groupsApi = {
  async getGroups(): Promise<GroupsResponse> {
    return api.get<GroupsResponse>('/groups');
  },

  async getGroup(groupId: string): Promise<GroupResponse> {
    return api.get<GroupResponse>(`/groups/${groupId}`);
  },

  async createGroup(data: CreateGroupData): Promise<GroupResponse> {
    return api.post<GroupResponse>('/groups', data);
  },

  async updateGroup(
    groupId: string,
    data: UpdateGroupData
  ): Promise<GroupResponse> {
    return api.put<GroupResponse>(`/groups/${groupId}`, data);
  },

  async deleteGroup(groupId: string): Promise<{ success: boolean }> {
    return api.delete(`/groups/${groupId}`);
  },

  async addMember(groupId: string, email: string): Promise<MemberResponse> {
    return api.post<MemberResponse>(`/groups/${groupId}/members`, { email });
  },

  async removeMember(
    groupId: string,
    memberId: string
  ): Promise<{ success: boolean }> {
    return api.delete(`/groups/${groupId}/members/${memberId}`);
  },
};
```

### React Query Hooks

#### Groups Hooks

```typescript
// apps/web/src/hooks/useGroups.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../services/groups';
import { CreateGroupData, UpdateGroupData } from '@group-pay/shared';
import { notifications } from '@mantine/notifications';

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.getGroups(),
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ['groups', groupId],
    queryFn: () => groupsApi.getGroup(groupId),
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupData) => groupsApi.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      notifications.show({
        title: 'Success',
        message: 'Group created successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to create group',
        color: 'red',
      });
    },
  });
}

export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateGroupData) => groupsApi.updateGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
      notifications.show({
        title: 'Success',
        message: 'Group updated successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update group',
        color: 'red',
      });
    },
  });
}

export function useAddMember(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => groupsApi.addMember(groupId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
      notifications.show({
        title: 'Success',
        message: 'Member added successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to add member',
        color: 'red',
      });
    },
  });
}
```

### Component Library

#### Layout Components

```typescript
// apps/web/src/components/Layout/AppShell.tsx
import { ReactNode } from 'react';
import {
  AppShell as MantineAppShell,
  Burger,
  Group,
  Title,
  UnstyledButton,
  Avatar,
  Text,
  Menu,
  rem,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLogout, IconSettings, IconUser } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigation } from './Navigation';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const { user, logout } = useAuth();

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
            />
            <Burger
              opened={desktopOpened}
              onClick={toggleDesktop}
              visibleFrom="sm"
              size="sm"
            />
            <Title order={3}>Group Pay</Title>
          </Group>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <UnstyledButton>
                <Group gap="sm">
                  <Avatar size="sm" radius="xl">
                    {user?.name.charAt(0)}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>
                      {user?.name}
                    </Text>
                  </div>
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Account</Menu.Label>
              <Menu.Item leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}>
                Profile
              </Menu.Item>
              <Menu.Item leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}>
                Settings
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
                onClick={logout}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="md">
        <Navigation />
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  );
}
```

#### Navigation Component

```typescript
// apps/web/src/components/Layout/Navigation.tsx
import { NavLink, Stack, Group, Text, Badge } from '@mantine/core';
import { IconHome, IconUsers, IconReceipt, IconSettings } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups';

const navigationItems = [
  { icon: IconHome, label: 'Dashboard', to: '/' },
  { icon: IconUsers, label: 'Groups', to: '/groups' },
  { icon: IconReceipt, label: 'Expenses', to: '/expenses' },
  { icon: IconSettings, label: 'Settings', to: '/settings' },
];

export function Navigation() {
  const location = useLocation();
  const { data: groupsData } = useGroups();

  return (
    <Stack gap="xs">
      {navigationItems.map((item) => (
        <NavLink
          key={item.to}
          component={Link}
          to={item.to}
          label={
            <Group justify="space-between">
              <Text>{item.label}</Text>
              {item.to === '/groups' && groupsData?.groups && (
                <Badge size="sm" variant="light">
                  {groupsData.groups.length}
                </Badge>
              )}
            </Group>
          }
          leftSection={<item.icon size="1rem" />}
          active={location.pathname === item.to}
        />
      ))}
    </Stack>
  );
}
```

### Page Components

#### Dashboard Page

```typescript
// apps/web/src/pages/Dashboard.tsx
import {
  Grid,
  Card,
  Text,
  Title,
  Stack,
  Group,
  ActionIcon,
  Badge,
  SimpleGrid,
  LoadingOverlay,
  Center,
  Button,
} from '@mantine/core';
import { IconPlus, IconUsers, IconReceipt, IconTrendingUp } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';

export function Dashboard() {
  const { data: groupsData, isLoading } = useGroups();

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  const groups = groupsData?.groups || [];
  const totalGroups = groups.length;
  const totalMembers = groups.reduce((sum, group) => sum + (group.memberCount || 0), 0);
  const totalExpenses = groups.reduce((sum, group) => sum + (group.expenseCount || 0), 0);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={1}>Dashboard</Title>
        <Button component={Link} to="/groups/new" leftSection={<IconPlus size="1rem" />}>
          New Group
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between">
            <div>
              <Text c="dimmed" size="sm" fw={700} tt="uppercase">
                Groups
              </Text>
              <Text fw={700} size="xl">
                {totalGroups}
              </Text>
            </div>
            <IconUsers size="2rem" color="var(--mantine-color-blue-6)" />
          </Group>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between">
            <div>
              <Text c="dimmed" size="sm" fw={700} tt="uppercase">
                Total Members
              </Text>
              <Text fw={700} size="xl">
                {totalMembers}
              </Text>
            </div>
            <IconUsers size="2rem" color="var(--mantine-color-green-6)" />
          </Group>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between">
            <div>
              <Text c="dimmed" size="sm" fw={700} tt="uppercase">
                Total Expenses
              </Text>
              <Text fw={700} size="xl">
                {totalExpenses}
              </Text>
            </div>
            <IconReceipt size="2rem" color="var(--mantine-color-orange-6)" />
          </Group>
        </Card>
      </SimpleGrid>

      <Card withBorder padding="lg" radius="md">
        <Group justify="space-between" mb="md">
          <Title order={3}>Recent Groups</Title>
          <Button variant="light" component={Link} to="/groups">
            View All
          </Button>
        </Group>

        {groups.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <IconUsers size="3rem" color="var(--mantine-color-gray-5)" />
              <div>
                <Text fw={500} size="lg" mb={5}>
                  No groups yet
                </Text>
                <Text size="sm" c="dimmed">
                  Create your first group to start tracking expenses
                </Text>
              </div>
              <Button component={Link} to="/groups/new">
                Create Group
              </Button>
            </Stack>
          </Center>
        ) : (
          <Stack gap="sm">
            {groups.slice(0, 5).map((group) => (
              <Card key={group.id} withBorder padding="md" radius="md" component={Link} to={`/groups/${group.id}`}>
                <Group justify="space-between">
                  <div>
                    <Text fw={500}>{group.name}</Text>
                    <Text size="sm" c="dimmed">
                      {group.memberCount} members • {group.expenseCount} expenses
                    </Text>
                  </div>
                  <Badge variant="light">{group.currency}</Badge>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Card>
    </Stack>
  );
}
```

#### Groups List Page

```typescript
// apps/web/src/pages/Groups.tsx
import { useState } from 'react';
import {
  Title,
  Button,
  Stack,
  Group,
  Card,
  Text,
  Grid,
  LoadingOverlay,
  Center,
  TextInput,
  ActionIcon,
  Badge,
  Menu,
  rem,
} from '@mantine/core';
import { IconPlus, IconSearch, IconDots, IconEdit, IconTrash, IconUsers } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { Link } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';

export function Groups() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(searchQuery, 200);
  const { data: groupsData, isLoading } = useGroups();

  const groups = groupsData?.groups || [];
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={1}>Groups</Title>
        <Button component={Link} to="/groups/new" leftSection={<IconPlus size="1rem" />}>
          New Group
        </Button>
      </Group>

      <TextInput
        placeholder="Search groups..."
        leftSection={<IconSearch size="1rem" />}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.currentTarget.value)}
      />

      {filteredGroups.length === 0 ? (
        <Center py="xl">
          <Stack align="center" gap="md">
            <IconUsers size="3rem" color="var(--mantine-color-gray-5)" />
            <div>
              <Text fw={500} size="lg" mb={5}>
                {groups.length === 0 ? 'No groups yet' : 'No groups found'}
              </Text>
              <Text size="sm" c="dimmed">
                {groups.length === 0
                  ? 'Create your first group to start tracking expenses'
                  : 'Try adjusting your search terms'
                }
              </Text>
            </div>
            {groups.length === 0 && (
              <Button component={Link} to="/groups/new">
                Create Group
              </Button>
            )}
          </Stack>
        </Center>
      ) : (
        <Grid>
          {filteredGroups.map((group) => (
            <Grid.Col key={group.id} span={{ base: 12, sm: 6, md: 4 }}>
              <Card withBorder padding="lg" radius="md" h="100%">
                <Stack justify="space-between" h="100%">
                  <div>
                    <Group justify="space-between" mb="sm">
                      <Text fw={500} size="lg" lineClamp={1}>
                        {group.name}
                      </Text>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <IconDots style={{ width: rem(16), height: rem(16) }} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit style={{ width: rem(14), height: rem(14) }} />}
                            component={Link}
                            to={`/groups/${group.id}/edit`}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
                            color="red"
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>

                    {group.description && (
                      <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
                        {group.description}
                      </Text>
                    )}

                    <Group justify="space-between" mb="md">
                      <Group gap="xs">
                        <IconUsers size="1rem" color="var(--mantine-color-gray-6)" />
                        <Text size="sm">{group.memberCount} members</Text>
                      </Group>
                      <Badge variant="light">{group.currency}</Badge>
                    </Group>

                    <Text size="sm" c="dimmed">
                      {group.expenseCount} expenses
                    </Text>
                  </div>

                  <Button
                    variant="light"
                    fullWidth
                    mt="md"
                    component={Link}
                    to={`/groups/${group.id}`}
                  >
                    View Group
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
```

### Forms & Modals

#### Create Group Form

```typescript
// apps/web/src/components/Forms/CreateGroupForm.tsx
import { useState } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Stack,
  Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { CreateGroupData } from '@group-pay/shared';
import { useCreateGroup } from '../../hooks/useGroups';

interface CreateGroupFormProps {
  opened: boolean;
  onClose: () => void;
}

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
];

export function CreateGroupForm({ opened, onClose }: CreateGroupFormProps) {
  const createGroup = useCreateGroup();

  const form = useForm<CreateGroupData>({
    initialValues: {
      name: '',
      description: '',
      currency: 'USD',
    },
    validate: {
      name: (value) => (!value?.trim() ? 'Group name is required' : null),
      currency: (value) => (!value ? 'Currency is required' : null),
    },
  });

  const handleSubmit = async (values: CreateGroupData) => {
    try {
      await createGroup.mutateAsync(values);
      form.reset();
      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create New Group" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Group Name"
            placeholder="Enter group name"
            required
            {...form.getInputProps('name')}
          />

          <Textarea
            label="Description"
            placeholder="What's this group for?"
            rows={3}
            {...form.getInputProps('description')}
          />

          <Select
            label="Currency"
            placeholder="Select currency"
            data={currencies}
            required
            {...form.getInputProps('currency')}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createGroup.isPending}>
              Create Group
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
```

## 🔧 Implementation Steps

### 1. Install Additional Dependencies

```bash
cd apps/web
pnpm add @mantine/dates @mantine/modals @mantine/notifications @mantine/form @mantine/hooks @tabler/icons-react dayjs
```

### 2. Update Vite Configuration

```typescript
// apps/web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

### 3. Set Up Routing

```typescript
// apps/web/src/Router.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AppShell } from './components/Layout/AppShell';
import { AuthPages } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Groups } from './pages/Groups';
import { GroupDetail } from './pages/GroupDetail';
import { LoadingOverlay } from '@mantine/core';

export function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay visible />;
  }

  if (!user) {
    return <AuthPages />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:groupId" element={<GroupDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
```

### 4. Add Error Boundaries

```typescript
// apps/web/src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { Container, Title, Text, Button, Stack } from '@mantine/core';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container size="sm" py="xl">
          <Stack align="center" gap="lg">
            <Title order={1}>Something went wrong</Title>
            <Text c="dimmed" ta="center">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </Text>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </Stack>
        </Container>
      );
    }

    return this.props.children;
  }
}
```

## ✅ Acceptance Criteria

- [ ] Modern React app with TypeScript
- [ ] Mantine UI components throughout
- [ ] TanStack Query for data management
- [ ] React Router for navigation
- [ ] Authentication context and protection
- [ ] Responsive design for mobile/desktop
- [ ] Error handling and loading states
- [ ] Form validation with proper UX
- [ ] API integration with proper error handling
- [ ] Theme customization and branding

## 🧪 Testing

### Component Testing

```typescript
// apps/web/src/components/__tests__/Dashboard.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Dashboard } from '../Dashboard';

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <MemoryRouter>
          {component}
        </MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>
  );
};

test('renders dashboard title', () => {
  renderWithProviders(<Dashboard />);
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});
```

## 📚 Next Steps

After completing this feature:

1. **[Authentication UI](./09-auth-ui.md)** - Login/register forms
2. **[Expense Management](./10-expense-ui.md)** - Expense creation and management
3. **[Real-time Updates](./11-real-time.md)** - WebSocket integration

## 🎨 Design System

The application uses a consistent design system with:

- **Brand Colors**: Green-based palette for financial/money theme
- **Typography**: Inter font family for modern, clean look
- **Spacing**: Consistent spacing scale throughout
- **Components**: Reusable components with proper props
- **Responsive**: Mobile-first responsive design
- **Accessibility**: ARIA labels and keyboard navigation support
