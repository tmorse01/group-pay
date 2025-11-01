import type { ReactNode } from 'react';
import { Navigation } from '@/components/Layout/Navigation';
import { Header } from '@/components/Layout/Header';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="p-6 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
