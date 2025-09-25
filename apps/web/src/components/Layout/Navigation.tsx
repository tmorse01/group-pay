import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

const navigationItems = [
  { label: 'Dashboard', to: '/', icon: '📊' },
  { label: 'Groups', to: '/groups', icon: '👥' },
  { label: 'Expenses', to: '/expenses', icon: '💰' },
  { label: 'Settings', to: '/settings', icon: '⚙️' },
];

export function Navigation() {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-neutral-200 dark-mode:border-neutral-700 p-4 bg-white dark-mode:bg-neutral-900 hidden sm:block">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-green-600">Group Pay</h1>
      </div>
      <nav className="space-y-2">
        {navigationItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-neutral-100 dark-mode:hover:bg-neutral-800',
              location.pathname === item.to
                ? 'bg-neutral-100 text-neutral-900 dark-mode:bg-neutral-800 dark-mode:text-neutral-50'
                : 'text-neutral-600 dark-mode:text-neutral-400'
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
