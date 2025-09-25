# Feature: React Frontend Application (Untitled UI)

**Priority**: HIGH \| **Estimated Time**: 6--8 hours \|
**Dependencies**: Core API, Authentication, Shared Types

## 🎯 Objective

Build a modern React application with **Untitled UI React**
(Tailwind-based components), **TanStack Query** for data, **React
Router** for navigation, and a lightweight theme system for the Group
Pay expense tracking app.

## 📋 Requirements

### Tooling & Setup

#### Install & Initialize

```bash
cd apps/web

# Core libs
pnpm add react-router-dom @tanstack/react-query
pnpm add -D @tanstack/react-query-devtools

# Untitled UI React (CLI will add Tailwind config, tokens, etc.)
npx untitledui@latest init

# Pull in the components we’ll use
npx untitledui@latest add button card input table tabs modal toast dropdown avatar
```

#### Project Structure

    apps/web/
      src/
        App.tsx
        theme.css
        Router.tsx
        contexts/
          AuthContext.tsx
        components/
          Layout/
            AppShell.tsx
            Navigation.tsx
          Forms/
            CreateGroupForm.tsx
          ErrorBoundary.tsx
        pages/
          Dashboard.tsx
          Groups.tsx
          GroupDetail.tsx

### Application Shell

```tsx
// apps/web/src/App.tsx
import '@/theme.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Router } from './Router';
import { Toaster } from '@/components/ui/toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
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
      <BrowserRouter>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Theme

```css
/* apps/web/src/theme.css */
:root {
  --color-brand: #76bd22;
  --radius-md: 0.75rem;
  --spacing-md: 1rem;
  --font-sans: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
}

[data-theme='dark'] {
  --color-bg: #111;
  --color-text: #f5f5f5;
}
```

### Layout Components

#### AppShell

```tsx
// apps/web/src/components/Layout/AppShell.tsx
import { ReactNode } from 'react';
import { Sidebar } from './Navigation';
import { Avatar, DropdownMenu } from '@/components/ui';

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-neutral-900">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <header className="h-14 border-b flex items-center justify-between px-4">
          <h1 className="text-lg font-semibold">Group Pay</h1>
          <DropdownMenu>
            <DropdownMenu.Trigger>
              <Avatar initials="U" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item>Profile</DropdownMenu.Item>
              <DropdownMenu.Item>Settings</DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item>Logout</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </header>
        <main className="p-4 flex-1">{children}</main>
      </div>
    </div>
  );
}
```

#### Navigation

```tsx
// apps/web/src/components/Layout/Navigation.tsx
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const items = [
  { label: 'Dashboard', to: '/' },
  { label: 'Groups', to: '/groups' },
  { label: 'Expenses', to: '/expenses' },
  { label: 'Settings', to: '/settings' },
];

export function Sidebar() {
  const location = useLocation();
  return (
    <aside className="w-64 border-r p-4 hidden sm:block">
      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'block rounded px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800',
              location.pathname === item.to &&
                'bg-neutral-200 dark:bg-neutral-700'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

### Pages

#### Dashboard

```tsx
// apps/web/src/pages/Dashboard.tsx
import { Button, Card } from '@/components/ui';

export function Dashboard() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <Button>Create Group</Button>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>Groups</Card>
        <Card>Members</Card>
        <Card>Expenses</Card>
      </div>
    </div>
  );
}
```

#### Groups

```tsx
// apps/web/src/pages/Groups.tsx
import { Button, Card, Input } from '@/components/ui';

export function Groups() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Groups</h2>
        <Button>New Group</Button>
      </div>
      <Input placeholder="Search groups..." />
      <Card>No groups yet. Create one to start tracking expenses.</Card>
    </div>
  );
}
```

### Forms & Modals

```tsx
// apps/web/src/components/Forms/CreateGroupForm.tsx
import { useState } from 'react';
import { Modal, Button, Input, Textarea, Select } from '@/components/ui';

export function CreateGroupForm() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Create Group</Button>
      <Modal open={open} onOpenChange={setOpen} title="Create Group">
        <form className="space-y-4">
          <Input label="Group Name" required />
          <Textarea label="Description" />
          <Select
            label="Currency"
            options={[
              { value: 'USD', label: 'USD - US Dollar' },
              { value: 'EUR', label: 'EUR - Euro' },
            ]}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
```

### ✅ Acceptance Criteria

- [ ] Modern React app with TypeScript
- [ ] Untitled UI React components throughout
- [ ] TanStack Query for data management
- [ ] React Router for navigation
- [ ] Authentication context and protection
- [ ] Responsive layout for mobile/desktop
- [ ] Error handling and loading states
- [ ] Form validation with proper UX
- [ ] API integration with proper error handling
- [ ] Theme customization and branding

### 🧪 Testing

```tsx
// apps/web/src/components/__tests__/Dashboard.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../../pages/Dashboard';

test('renders dashboard title', () => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});
```
