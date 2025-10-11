# Groups Page Documentation

## Overview

The Groups page (`/groups`) serves as the main dashboard for managing expense groups in the Group Pay application. It provides users with a comprehensive view of all their groups, search functionality, and the ability to create new groups.

## Component Location

- **File**: `apps/web/src/pages/Groups.tsx`
- **Route**: `/groups`
- **Component Name**: `Groups`

## Features

### 1. Group Listing

- **Grid Layout**: Displays groups in a responsive grid (1 column on mobile, 2 on tablet, 3 on desktop)
- **Group Cards**: Each group is displayed as a card showing key information
- **Responsive Design**: Adapts to different screen sizes with Tailwind CSS breakpoints

### 2. Search Functionality

- **Real-time Search**: Filters groups as you type
- **Case-insensitive**: Searches group names regardless of case
- **Debounced Input**: Smooth user experience with instant filtering

### 3. Group Creation

- **One-click Creation**: Create new groups with default settings
- **Auto-naming**: Groups are automatically named with timestamp for uniqueness
- **Loading States**: Shows loading indicator during creation process

### 4. Group Information Display

Each group card displays:

- **Group Name**: The name of the group
- **Currency**: The default currency for the group
- **Creation Date**: When the group was created (relative time)
- **Member Count**: Number of members in the group
- **Expense Count**: Number of expenses in the group
- **Last Activity**: When the group was last active (relative time)

### 5. Error Handling

- **Loading States**: Spinner with descriptive text during data fetching
- **Error States**: User-friendly error messages with retry functionality
- **Empty States**: Helpful messaging when no groups exist or no search results

## Data Flow

### API Integration

The component uses React Query hooks from the groups service:

```typescript
const { data: groups, isLoading, error, refetch } = useGroups();
const createGroupMutation = useCreateGroup();
```

### Data Types

- **GroupListItem**: Interface for group data in the listing
  - `id: string`
  - `name: string`
  - `currency: string`
  - `createdAt: string`
  - `memberCount: number`
  - `expenseCount: number`
  - `lastActivity: string`

### State Management

- **Local State**: Search query managed with `useState`
- **Server State**: Groups data managed with React Query
- **Mutations**: Group creation handled with optimistic updates

## User Experience

### Loading States

1. **Initial Load**: Full-page spinner with "Loading groups..." message
2. **Group Creation**: Button shows loading spinner and becomes disabled
3. **Search**: Instant filtering without loading states

### Empty States

1. **No Groups**: Welcome message with call-to-action to create first group
2. **No Search Results**: Helpful message suggesting to adjust search query
3. **Error State**: Clear error message with retry button

### Visual Design

- **Cards**: Clean white cards with subtle hover effects
- **Dark Mode**: Full dark mode support with proper contrast
- **Icons**: Emoji icons for visual appeal (👥 for empty state)
- **Typography**: Clear hierarchy with proper font weights and sizes

## Accessibility

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Proper tab order through the interface
- Enter key support for buttons

### Screen Readers

- Proper heading hierarchy (h1 for page title, h3 for group names)
- Descriptive alt text and labels
- Semantic HTML structure

### Visual Accessibility

- High contrast colors in both light and dark modes
- Consistent focus indicators
- Readable font sizes and line heights

## Performance Optimizations

### React Query Benefits

- **Caching**: Groups data is cached and shared across components
- **Background Updates**: Data stays fresh with automatic refetching
- **Optimistic Updates**: Group creation feels instant with optimistic cache updates

### Code Splitting

- Component is part of the main router bundle
- Heavy dayjs functions are tree-shaken to only include used functions

### Rendering Optimizations

- Filtered groups are memoized through React Query's built-in optimizations
- Only re-renders when groups data or search query changes

## Error Handling

### Network Errors

- API failures show user-friendly error messages
- Retry functionality allows users to recover from temporary issues
- Graceful degradation when offline

### Validation Errors

- Group creation errors are caught and logged
- User is notified of creation failures
- Form remains in usable state after errors

### Edge Cases

- Handles empty group names gracefully
- Manages undefined/null data from API
- Prevents duplicate group creation during loading

## Dependencies

### Core Dependencies

- **React**: Component framework
- **React Router**: Navigation (`Link` component)
- **React Query**: Server state management

### UI Dependencies

- **Custom Components**:
  - `Button`: Reusable button component with variants
  - `LoadingSpinner`: Loading indicator
  - `ErrorState`: Error display component

### Utility Dependencies

- **dayjs**: Date formatting and relative time calculations
- **Tailwind CSS**: Styling and responsive design

## Testing Considerations

### Unit Testing

- Test search functionality with various inputs
- Verify group creation flow
- Test error state handling
- Test empty state displays

### Integration Testing

- Test API integration with mock data
- Verify navigation to group detail pages
- Test responsive design at different breakpoints

### Accessibility Testing

- Verify keyboard navigation works correctly
- Test screen reader compatibility
- Check color contrast ratios

## Future Enhancements

### Potential Improvements

1. **Sorting Options**: Allow sorting by name, date, or activity
2. **Filtering**: Filter by currency, member count, or date range
3. **Bulk Actions**: Select multiple groups for bulk operations
4. **Group Templates**: Create groups from predefined templates
5. **Advanced Search**: Search within group descriptions or member names

### Performance Improvements

1. **Virtual Scrolling**: For users with many groups
2. **Infinite Scrolling**: Pagination for large group lists
3. **Search Debouncing**: Optimize search performance
4. **Image Lazy Loading**: If group avatars are added

## Related Documentation

- [Group Detail Page](./group-detail-page.md)
- [Groups Service API](../api/groups-service.md)
- [Component Architecture](../architecture/components.md)
- [State Management](../architecture/state-management.md)
