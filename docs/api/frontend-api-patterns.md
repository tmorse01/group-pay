# API Request Guidelines for Group Pay Frontend

This document outlines the established patterns and best practices for making API requests in the Group Pay React application.

## Overview

We use **React Query (TanStack Query)** for all API requests combined with a custom API utility layer. This provides:

- Automatic caching and background refetching
- Optimistic updates and cache invalidation
- Built-in loading states and error handling
- Automatic retry logic with smart auth error handling
- TypeScript support throughout

## Core Architecture

### 1. API Utility Layer (`lib/api.ts`)

The base API utility handles:

- Base URL configuration (`http://localhost:3001`)
- Automatic JWT token inclusion
- Error handling with custom `ApiError` class
- Request/response interceptors

```typescript
import { api } from '../lib/api';

// GET request
const user = await api.get<User>('/api/auth/me');

// POST request
const newGroup = await api.post<Group>('/api/groups', { name: 'My Group' });

// PUT/PATCH/DELETE
await api.put<Group>(`/api/groups/${id}`, updateData);
await api.delete(`/api/groups/${id}`);
```

### 2. Service Layer (`services/*.ts`)

Create service files for each domain (auth, groups, expenses, etc.) that contain:

- TypeScript interfaces
- API functions
- React Query hooks

## Creating New API Services

### Step 1: Define Types

```typescript
// services/expenses.ts
interface Expense {
  id: string;
  amount: number;
  description: string;
  groupId: string;
  createdBy: string;
  createdAt: string;
}

interface CreateExpenseRequest {
  amount: number;
  description: string;
  groupId: string;
}
```

### Step 2: Create API Functions

```typescript
// Raw API functions (used internally by hooks)
const expensesApi = {
  getExpenses: (groupId: string): Promise<Expense[]> =>
    api.get(`/api/groups/${groupId}/expenses`),

  createExpense: (data: CreateExpenseRequest): Promise<Expense> =>
    api.post('/api/expenses', data),

  updateExpense: (
    id: string,
    data: Partial<CreateExpenseRequest>
  ): Promise<Expense> => api.put(`/api/expenses/${id}`, data),

  deleteExpense: (id: string): Promise<void> =>
    api.delete(`/api/expenses/${id}`),
};
```

### Step 3: Create React Query Hooks

#### Query Hooks (GET requests)

```typescript
export function useExpenses(groupId: string) {
  return useQuery({
    queryKey: ['expenses', groupId],
    queryFn: () => expensesApi.getExpenses(groupId),
    enabled: !!groupId, // Only fetch if groupId exists
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: () => expensesApi.getExpense(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

#### Mutation Hooks (POST/PUT/DELETE requests)

```typescript
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expensesApi.createExpense,
    onSuccess: (newExpense) => {
      // Update related query caches
      queryClient.setQueryData<Expense[]>(
        ['expenses', newExpense.groupId],
        (old) => (old ? [...old, newExpense] : [newExpense])
      );

      // Invalidate group data that might show expense totals
      queryClient.invalidateQueries({
        queryKey: ['groups', newExpense.groupId],
      });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateExpenseRequest>;
    }) => expensesApi.updateExpense(id, data),
    onSuccess: (updatedExpense) => {
      // Update individual expense cache
      queryClient.setQueryData(['expenses', updatedExpense.id], updatedExpense);

      // Update expense in list cache
      queryClient.setQueryData<Expense[]>(
        ['expenses', updatedExpense.groupId],
        (old) =>
          old?.map((exp) =>
            exp.id === updatedExpense.id ? updatedExpense : exp
          )
      );
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expensesApi.deleteExpense,
    onSuccess: (_, deletedId, context) => {
      // Remove from all relevant caches
      queryClient.removeQueries({ queryKey: ['expenses', deletedId] });

      // Remove from list cache (you'll need to track groupId)
      const groupId = context?.groupId; // Pass this in the mutation call
      if (groupId) {
        queryClient.setQueryData<Expense[]>(['expenses', groupId], (old) =>
          old?.filter((exp) => exp.id !== deletedId)
        );
      }
    },
  });
}
```

## Using Hooks in Components

### Query Hooks

```typescript
function ExpensesList({ groupId }: { groupId: string }) {
  const { data: expenses, isLoading, error } = useExpenses(groupId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {expenses?.map(expense => (
        <ExpenseCard key={expense.id} expense={expense} />
      ))}
    </div>
  );
}
```

### Mutation Hooks

```typescript
function CreateExpenseForm({ groupId }: { groupId: string }) {
  const createExpense = useCreateExpense();

  const handleSubmit = async (data: CreateExpenseRequest) => {
    try {
      await createExpense.mutateAsync(data);
      // Success! UI automatically updates via cache
    } catch (error) {
      // Handle error (show toast, etc.)
      console.error('Failed to create expense:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button
        type="submit"
        disabled={createExpense.isPending}
      >
        {createExpense.isPending ? 'Creating...' : 'Create Expense'}
      </button>
    </form>
  );
}
```

## Query Key Conventions

Use consistent, hierarchical query keys:

```typescript
// ✅ Good
['users'][('users', userId)][('users', userId, 'profile')]['groups'][ // All users // Specific user // User's profile // All groups
  ('groups', groupId)
][('groups', groupId, 'expenses')][('expenses', expenseId)][ // Specific group // Group's expenses // Specific expense
  // ❌ Avoid
  'getAllUsers'
]['user-123']['groupExpenses'];
```

## Error Handling

### Global Error Handling

Auth errors (401/403) are handled globally in `App.tsx` and won't retry automatically.

### Component-Level Error Handling

```typescript
function MyComponent() {
  const { data, error, isError } = useQuery({...});

  if (isError) {
    // Handle specific error types
    if (error instanceof ApiError && error.status === 404) {
      return <NotFoundMessage />;
    }

    return <ErrorMessage message={error.message} />;
  }

  // ... rest of component
}
```

### Mutation Error Handling

```typescript
function MyForm() {
  const mutation = useMutation({...});

  const handleSubmit = async (data) => {
    try {
      await mutation.mutateAsync(data);
      // Success handling
    } catch (error) {
      if (error instanceof ApiError) {
        // Show specific error message
        showToast(error.message);
      } else {
        // Show generic error
        showToast('Something went wrong');
      }
    }
  };
}
```

## Loading States

### Query Loading

```typescript
const { data, isLoading, isFetching } = useQuery({...});

// isLoading: true on initial load
// isFetching: true during background refetch
```

### Mutation Loading

```typescript
const mutation = useMutation({...});

// mutation.isPending: true during mutation
// mutation.isSuccess: true after successful mutation
// mutation.isError: true after failed mutation
```

## Cache Management

### Invalidating Queries

```typescript
// Invalidate all groups queries
queryClient.invalidateQueries({ queryKey: ['groups'] });

// Invalidate specific group
queryClient.invalidateQueries({ queryKey: ['groups', groupId] });

// Invalidate multiple related queries
queryClient.invalidateQueries({ queryKey: ['groups'] });
queryClient.invalidateQueries({ queryKey: ['expenses'] });
```

### Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: updateExpense,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['expenses', id] });

    // Snapshot previous value
    const previousExpense = queryClient.getQueryData(['expenses', id]);

    // Optimistically update
    queryClient.setQueryData(['expenses', id], newData);

    // Return context for rollback
    return { previousExpense };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['expenses', id], context.previousExpense);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['expenses', id] });
  },
});
```

## File Organization

```
src/
├── lib/
│   └── api.ts              # Core API utilities
├── services/
│   ├── auth.ts             # Authentication API & hooks
│   ├── groups.ts           # Groups API & hooks
│   ├── expenses.ts         # Expenses API & hooks
│   └── users.ts            # Users API & hooks
├── hooks/
│   └── useAuth.ts          # Auth context hook
└── components/
    └── ...
```

## Best Practices

1. **Always use TypeScript** - Define interfaces for requests and responses
2. **Consistent query keys** - Use hierarchical, predictable patterns
3. **Handle loading states** - Show appropriate UI during requests
4. **Handle errors gracefully** - Provide meaningful error messages
5. **Optimize cache updates** - Use optimistic updates for better UX
6. **Invalidate related data** - Update all affected caches after mutations
7. **Use enabled conditions** - Prevent unnecessary requests
8. **Set appropriate stale times** - Balance freshness with performance

## Authentication

All requests automatically include the JWT token from localStorage. The `requiresAuth: false` option can be used for public endpoints:

```typescript
// Public endpoint
const publicData = await api.get('/api/public/health', { requiresAuth: false });

// Protected endpoint (default)
const userData = await api.get('/api/auth/me');
```

## Environment Configuration

Update the base URL in `lib/api.ts` for different environments:

```typescript
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';
```

---

Following these patterns ensures consistent, maintainable, and efficient API integration throughout the application.
