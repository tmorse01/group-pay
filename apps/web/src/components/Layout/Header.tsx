import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/base/buttons/button';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          Welcome back, {user?.name || user?.email}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Button color="secondary" onClick={logout} className="text-sm">
          Sign out
        </Button>
      </div>
    </header>
  );
}
