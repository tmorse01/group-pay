# GroupPay React App - Coding Standards & Best Practices

This document outlines the coding standards, conventions, and best practices for the GroupPay React application to ensure consistency, maintainability, and code quality across the entire codebase.

## 🏗️ Project Architecture

### Monorepo Structure

- **`apps/web`** - React frontend application
- **`apps/api`** - Fastify backend API
- **`packages/shared`** - Shared types, schemas, and utilities
- **`packages/config`** - Shared configuration files (ESLint, etc.)

### Frontend Architecture Pattern

- Component-driven development with atomic design principles
- Clean separation of concerns: UI components, business logic, and data fetching
- Feature-based folder organization for scalability

## 📁 File Organization & Naming

### Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── base/            # Basic/atomic components (buttons, inputs, etc.)
│   ├── application/     # Complex/composite components
│   └── foundations/     # Icon components and design tokens
├── pages/               # Route-level components
├── services/            # API layer and data fetching
├── hooks/               # Custom React hooks
├── contexts/            # React Context providers
├── lib/                 # Third-party integrations and utilities
├── utils/               # Pure utility functions
└── assets/              # Static assets
```

### File Naming Conventions

- **Components**: PascalCase - `UserProfile.tsx`, `CreateGroupModal.tsx`
- **Hooks**: camelCase starting with "use" - `useAuth.ts`, `useGroups.ts`
- **Utilities**: camelCase - `formatCurrency.ts`, `validationHelpers.ts`
- **Services**: camelCase - `groups.ts`, `auth.ts`
- **Types/Interfaces**: PascalCase - `User.ts`, `GroupMember.ts`

## 🎨 Component Development

### Component Structure Template

```tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../base/buttons/button';
import { useGroups } from '../services/groups';
import { cx } from '../utils/cx';

// Types/Interfaces at the top
interface ComponentProps {
  id: string;
  name: string;
  onAction?: (id: string) => void;
  className?: string;
}

// Component implementation
export function ComponentName({
  id,
  name,
  onAction,
  className,
}: ComponentProps) {
  // Hooks first
  const [isLoading, setIsLoading] = useState(false);
  const { data, error } = useGroups();

  // Event handlers
  const handleAction = () => {
    onAction?.(id);
  };

  // Early returns for loading/error states
  if (error) {
    return <div className="error-state">Error occurred</div>;
  }

  // Main render
  return (
    <div className={cx('base-styles', className)}>
      <h2>{name}</h2>
      <Button onClick={handleAction} isLoading={isLoading}>
        Action
      </Button>
    </div>
  );
}
```

### Component Best Practices

#### 1. Use Proper TypeScript Interfaces

```tsx
// ✅ Good - Descriptive, specific interfaces
interface CreateGroupFormProps {
  initialValues?: Partial<GroupFormData>;
  onSubmit: (data: GroupFormData) => Promise<void>;
  isLoading?: boolean;
}

// ❌ Avoid - Generic, unclear types
interface Props {
  data: any;
  callback: Function;
}
```

#### 2. Prefer Function Components with Hooks

```tsx
// ✅ Good - Function component with hooks
export function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUser(userId);
  return <div>{user?.name}</div>;
}

// ❌ Avoid - Class components (unless absolutely necessary)
class UserProfile extends Component { ... }
```

#### 3. Component Composition Over Props

```tsx
// ✅ Good - Composable structure
<Modal>
  <Modal.Header>Create Group</Modal.Header>
  <Modal.Content>
    <CreateGroupForm />
  </Modal.Content>
  <Modal.Actions>
    <Button color="secondary">Cancel</Button>
    <Button color="primary">Create</Button>
  </Modal.Actions>
</Modal>

// ❌ Avoid - Too many props
<Modal
  title="Create Group"
  content={<CreateGroupForm />}
  cancelText="Cancel"
  submitText="Create"
  onCancel={handleCancel}
  onSubmit={handleSubmit}
/>
```

## 🎯 State Management

### Local State with useState

```tsx
// ✅ Good - Simple, focused state
const [searchQuery, setSearchQuery] = useState('');
const [selectedItems, setSelectedItems] = useState<string[]>([]);

// Group related state logically
const [formData, setFormData] = useState({
  name: '',
  currency: 'USD',
  description: '',
});
```

### Server State with React Query

```tsx
// ✅ Good - Consistent query patterns
export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.getGroups,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: groupsApi.createGroup,
    onSuccess: (newGroup) => {
      // Update cache optimistically
      queryClient.setQueryData<Group[]>(['groups'], (old) =>
        old ? [...old, newGroup] : [newGroup]
      );
    },
  });
}
```

### Context for Shared Application State

```tsx
// ✅ Good - Focused context with clear purpose
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## 🛣️ Navigation & Routing

### Prefer Link Components Over Programmatic Navigation

```tsx
// ✅ Good - Declarative navigation with Link
<Link
  to={`/groups/${group.id}`}
  className="btn btn-tertiary"
>
  View Details
</Link>

// ❌ Avoid - Buttons with onClick navigation
<Button onClick={() => navigate(`/groups/${group.id}`)}>
  View Details
</Button>
```

### Route Organization

```tsx
// ✅ Good - Clear route structure with protected routes
<Routes>
  <Route path="/login" element={<Login />} />
  <Route
    path="/"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />
  <Route
    path="/groups"
    element={
      <ProtectedRoute>
        <Groups />
      </ProtectedRoute>
    }
  />
  <Route
    path="/groups/:id"
    element={
      <ProtectedRoute>
        <GroupDetail />
      </ProtectedRoute>
    }
  />
</Routes>
```

## 🎨 Styling Guidelines

### Tailwind CSS Conventions

```tsx
// ✅ Good - Logical class ordering and cx utility
<div className={cx(
  // Layout
  'flex items-center justify-between',
  // Spacing
  'p-6 mb-4',
  // Background & borders
  'bg-white border border-neutral-200',
  // Typography
  'text-neutral-900 font-medium',
  // Responsive
  'sm:p-8 lg:p-12',
  // Interactive states
  'hover:bg-neutral-50 focus:outline-none focus:ring-2',
  // Dark mode
  'dark-mode:bg-neutral-800 dark-mode:border-neutral-700',
  // Conditional classes
  isActive && 'bg-green-50 border-green-200',
  className
)}>
```

### Component-Specific Styling

```tsx
// ✅ Good - Reusable style objects with sortCx
const buttonStyles = sortCx({
  base: 'inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors',
  variants: {
    primary: 'bg-green-600 text-white hover:bg-green-700',
    secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300',
  },
  sizes: {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  },
});
```

### Dark Mode Support

```tsx
// ✅ Good - Consistent dark mode classes
<div className="bg-white text-neutral-900 dark-mode:bg-neutral-800 dark-mode:text-neutral-100">
  <p className="text-neutral-600 dark-mode:text-neutral-400">Secondary text</p>
</div>
```

## 🔌 API Integration

### Service Layer Pattern

```tsx
// services/groups.ts
interface Group {
  id: string;
  name: string;
  currency: string;
  memberCount: number;
  createdAt: string;
}

const groupsApi = {
  getGroups: async (): Promise<Group[]> => {
    const response = await api.get<{ groups: Group[] }>('/api/groups');
    return response.groups;
  },

  createGroup: (data: CreateGroupRequest): Promise<Group> =>
    api.post('/api/groups', data),

  updateGroup: (id: string, data: UpdateGroupRequest): Promise<Group> =>
    api.put(`/api/groups/${id}`, data),
};
```

### Error Handling

```tsx
// ✅ Good - Consistent error handling patterns
export function Groups() {
  const { data: groups, isLoading, error } = useGroups();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load groups"
        description={error instanceof Error ? error.message : 'Unknown error'}
        action={<Button onClick={() => refetch()}>Try Again</Button>}
      />
    );
  }

  return <GroupsList groups={groups} />;
}
```

## 🧪 Testing Standards

### Component Testing

```tsx
// ✅ Good - Focus on user behavior, not implementation
describe('Groups', () => {
  it('displays groups when loaded', async () => {
    renderWithProviders(<Groups />);

    await waitFor(() => {
      expect(screen.getByText('My Group')).toBeInTheDocument();
    });
  });

  it('navigates to group detail when clicking view details', async () => {
    renderWithProviders(<Groups />);

    await user.click(screen.getByRole('link', { name: /view details/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/groups/123');
  });
});
```

## 🔧 Development Tools

### ESLint Configuration

- Extends recommended TypeScript and React configurations
- Custom rules for unused variables (allow underscore prefix)
- Warns on explicit `any` usage
- Enforces React Hooks rules

### Prettier Integration

- Consistent code formatting across the project
- Integrated with pre-commit hooks via lint-staged

### Import Organization

```tsx
// ✅ Good - Logical import ordering
// React & external libraries
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

// Internal components (base -> application -> pages)
import { Button } from '../components/base/buttons/button';
import { Modal } from '../components/application/modals/modal';

// Services & hooks
import { useGroups } from '../services/groups';
import { useAuth } from '../hooks/useAuth';

// Utils & types
import { cx } from '../utils/cx';
import type { Group } from '../types/group';
```

## 🚀 Performance Guidelines

### Code Splitting & Lazy Loading

```tsx
// ✅ Good - Route-level code splitting
const Groups = lazy(() => import('./pages/Groups'));
const GroupDetail = lazy(() => import('./pages/GroupDetail'));

<Route
  path="/groups"
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <Groups />
    </Suspense>
  }
/>;
```

### Memoization Best Practices

```tsx
// ✅ Good - Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]);

// ✅ Good - Memoize callback functions passed to children
const handleSubmit = useCallback(
  (formData: FormData) => {
    onSubmit(formData);
  },
  [onSubmit]
);
```

## 📝 Documentation Standards

### Component Documentation

```tsx
/**
 * GroupCard displays a summary of group information with actions.
 *
 * @param group - The group data to display
 * @param onAction - Callback fired when user performs an action
 * @param variant - Visual variant of the card
 */
interface GroupCardProps {
  group: Group;
  onAction?: (action: string, groupId: string) => void;
  variant?: 'default' | 'compact';
}
```

### README Guidelines

- Clear setup instructions for new developers
- Environment variable documentation
- Deployment procedures
- Troubleshooting common issues

## 🔒 Security Best Practices

### Input Validation

```tsx
// ✅ Good - Validate all user inputs
const createGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  currency: z.string().length(3, 'Invalid currency code'),
  description: z.string().optional(),
});

const handleSubmit = (data: unknown) => {
  const validatedData = createGroupSchema.parse(data);
  // Process validated data...
};
```

### Authentication Patterns

```tsx
// ✅ Good - Consistent auth checks
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

## 📋 Code Review Checklist

### Before Submitting PR

- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Components follow naming conventions
- [ ] Proper error handling implemented
- [ ] Responsive design tested
- [ ] Dark mode compatibility verified
- [ ] Performance impact considered
- [ ] Accessibility guidelines followed

### During Review

- [ ] Code follows established patterns
- [ ] No business logic in presentation components
- [ ] Proper separation of concerns
- [ ] Consistent styling approach
- [ ] Appropriate use of React patterns
- [ ] Clear variable and function naming
- [ ] Adequate error boundaries

---

## 🎯 Summary

This document serves as the foundation for maintaining high code quality and consistency across the GroupPay React application. All team members should familiarize themselves with these standards and refer to them regularly during development.

For questions or suggestions regarding these standards, please open a discussion in the project repository.
