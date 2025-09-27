# Groups Service API Documentation

## Overview

The Groups service provides React Query hooks and API functions for managing expense groups in the Group Pay application. It handles all group-related operations including CRUD operations, caching, and optimistic updates.

## File Location

- **Frontend Service**: `apps/web/src/services/groups.ts`
- **Backend Routes**: `apps/api/src/routes/groups.ts`

## Type Definitions

### Core Interfaces

#### Group

Complete group object with all fields:

```typescript
interface Group {
  id: string;
  name: string;
  description?: string;
  currency: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

#### CreateGroupResponse

Response from group creation API:

```typescript
interface CreateGroupResponse {
  id: string;
  name: string;
  currency: string;
  createdAt: string;
  memberCount: number;
}
```

#### GroupListItem

Optimized group data for list displays:

```typescript
interface GroupListItem {
  id: string;
  name: string;
  currency: string;
  createdAt: string;
  memberCount: number;
  expenseCount: number;
  lastActivity: string;
}
```

#### GroupDetail

Extended group data with members and expenses:

```typescript
interface GroupDetail {
  id: string;
  name: string;
  description?: string;
  currency: string;
  createdAt: string;
  members: GroupMember[];
  expenses: GroupExpense[];
}
```

#### GroupMember

Member information within a group:

```typescript
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
```

#### GroupExpense

Expense information within a group:

```typescript
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
    amountCents: number;
    isSettled: boolean;
  }>;
}
```

### Request Interfaces

#### CreateGroupRequest

Data required to create a new group:

```typescript
interface CreateGroupRequest {
  name: string;
  description?: string;
  currency: string;
}
```

#### UpdateGroupRequest

Data for updating an existing group:

```typescript
interface UpdateGroupRequest {
  name?: string;
  description?: string;
  currency?: string;
}
```

## API Functions

### Core API Operations

#### `getGroups()`

Fetches all groups for the current user.

- **Returns**: `Promise<GroupListItem[]>`
- **Endpoint**: `GET /api/groups`
- **Response**: `{ groups: GroupListItem[] }`

#### `getGroup(id: string)`

Fetches detailed information for a specific group.

- **Parameters**:
  - `id`: Group ID
- **Returns**: `Promise<{ group: GroupDetail }>`
- **Endpoint**: `GET /api/groups/:id`

#### `createGroup(data: CreateGroupRequest)`

Creates a new group.

- **Parameters**:
  - `data`: Group creation data
- **Returns**: `Promise<{ group: CreateGroupResponse }>`
- **Endpoint**: `POST /api/groups`
- **Response**: `{ group: CreateGroupResponse }`

#### `updateGroup(id: string, data: UpdateGroupRequest)`

Updates an existing group.

- **Parameters**:
  - `id`: Group ID
  - `data`: Update data
- **Returns**: `Promise<{ group: Group }>`
- **Endpoint**: `PUT /api/groups/:id`

#### `deleteGroup(id: string)`

Deletes a group.

- **Parameters**:
  - `id`: Group ID
- **Returns**: `Promise<void>`
- **Endpoint**: `DELETE /api/groups/:id`

## React Query Hooks

### `useGroups()`

Hook for fetching and managing groups list.

```typescript
const {
  data: groups, // GroupListItem[] | undefined
  isLoading, // boolean
  error, // Error | null
  refetch, // Function to refetch data
  isStale, // boolean
  isFetching, // boolean
} = useGroups();
```

**Features**:

- Automatic caching with 5-minute stale time
- Background refetching
- Error handling
- Loading states

### `useGroup(id: string)`

Hook for fetching detailed group information.

```typescript
const {
  data: group, // { group: GroupDetail } | undefined
  isLoading, // boolean
  error, // Error | null
  refetch, // Function to refetch data
} = useGroup(groupId);
```

**Features**:

- Automatic caching
- Dependent on group ID
- Error handling
- Loading states

### `useCreateGroup()`

Mutation hook for creating new groups.

```typescript
const createGroupMutation = useCreateGroup();

// Usage
await createGroupMutation.mutateAsync({
  name: 'My New Group',
  currency: 'USD',
  description: 'Optional description',
});

// Properties
createGroupMutation.isPending; // boolean
createGroupMutation.error; // Error | null
createGroupMutation.data; // CreateGroupResponse | undefined
```

**Features**:

- Optimistic updates to cache
- Automatic cache invalidation
- Error handling
- Loading states

### `useUpdateGroup()`

Mutation hook for updating existing groups.

```typescript
const updateGroupMutation = useUpdateGroup();

// Usage
await updateGroupMutation.mutateAsync({
  id: 'group-id',
  data: { name: 'Updated Name' },
});
```

**Features**:

- Optimistic updates
- Cache synchronization
- Error handling

### `useDeleteGroup()`

Mutation hook for deleting groups.

```typescript
const deleteGroupMutation = useDeleteGroup();

// Usage
await deleteGroupMutation.mutateAsync('group-id');
```

**Features**:

- Cache cleanup
- Optimistic removal
- Error handling

## Caching Strategy

### Cache Keys

- Groups list: `['groups']`
- Individual group: `['groups', groupId]`

### Cache Updates

#### Optimistic Updates

When creating a group:

1. Immediately add to groups list cache
2. Cache individual group data
3. Convert between data formats as needed

#### Cache Invalidation

- Groups list invalidated after successful mutations
- Individual group cache updated directly
- Stale data refetched in background

### Stale Time Configuration

- Groups list: 5 minutes
- Individual groups: 5 minutes
- Background refetching enabled

## Error Handling

### Network Errors

- Automatic retries with exponential backoff
- User-friendly error messages
- Graceful degradation

### Validation Errors

- Server-side validation errors surfaced to UI
- Form validation feedback
- Proper error types and codes

### Cache Errors

- Fallback to server data on cache errors
- Error boundaries for critical failures
- Recovery mechanisms

## Performance Optimizations

### Query Optimization

- Selective data fetching (list vs detail views)
- Efficient cache key strategies
- Minimal re-renders through React Query

### Network Optimization

- Request deduplication
- Background prefetching
- Optimistic updates for better UX

### Memory Management

- Automatic garbage collection of unused cache
- Configurable cache sizes
- Memory-efficient data structures

## Backend API Reference

### Authentication

All endpoints require authentication via JWT token in Authorization header:

```
Authorization: Bearer <jwt-token>
```

### Response Format

All responses follow consistent format:

```typescript
// Success responses
{
  group: GroupData,
  // or
  groups: GroupData[]
}

// Error responses
{
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Testing

### Unit Tests

```typescript
// Test hook functionality
it('should fetch groups successfully', async () => {
  const { result } = renderHook(() => useGroups());
  await waitFor(() => expect(result.current.data).toBeDefined());
});

// Test mutations
it('should create group with optimistic update', async () => {
  const { result } = renderHook(() => useCreateGroup());
  await act(async () => {
    await result.current.mutateAsync({
      name: 'Test Group',
      currency: 'USD',
    });
  });
});
```

### Integration Tests

```typescript
// Test API integration
it('should handle API errors gracefully', async () => {
  mockApi.get('/api/groups').mockRejectedValue(new Error('Network error'));
  const { result } = renderHook(() => useGroups());
  await waitFor(() => expect(result.current.error).toBeDefined());
});
```

## Migration Notes

### Version Changes

- v1.0: Initial implementation with basic CRUD
- v1.1: Added optimistic updates and better caching
- v1.2: Improved error handling and loading states

### Breaking Changes

- `CreateGroupResponse` interface added to handle API response format
- Cache key structure updated for better invalidation

### Upgrade Path

When upgrading from older versions:

1. Update type imports
2. Check cache key usage
3. Verify optimistic update logic
4. Test error handling flows

## Related Documentation

- [Groups Page Component](../components/groups-page.md)
- [Group Detail Component](../components/group-detail-page.md)
- [API Authentication](../api/authentication.md)
- [React Query Configuration](../architecture/react-query.md)
