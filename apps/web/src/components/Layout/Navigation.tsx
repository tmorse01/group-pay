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
    <aside className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 hidden sm:block">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-green-600">Group Pay</h1>
      </div>
      <nav className="space-y-2">
        {navigationItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
              location.pathname === item.to
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50'
                : 'text-gray-600 dark:text-gray-400'
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
