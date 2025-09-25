import { useAuth } from '../../hooks/useAuth';
import { Button } from '../base/buttons/button';
import { ThemeToggle } from '../ThemeToggle';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-neutral-200 dark-mode:border-neutral-700 flex items-center justify-between px-6 bg-white dark-mode:bg-neutral-900">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark-mode:text-neutral-50">
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
