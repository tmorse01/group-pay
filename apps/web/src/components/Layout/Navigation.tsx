import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  BarChart03,
  Users01,
  CurrencyDollar,
  Settings01,
} from '@untitledui/icons';

const navigationItems = [
  { label: 'Dashboard', to: '/', icon: BarChart03 },
  { label: 'Groups', to: '/groups', icon: Users01 },
  { label: 'Expenses', to: '/expenses', icon: CurrencyDollar },
  { label: 'Settings', to: '/settings', icon: Settings01 },
];

export function Navigation() {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 hidden sm:block">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-brand-600">GroupPay</h1>
      </div>
      <nav className="space-y-2">
        {navigationItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
              location.pathname === item.to
                ? 'bg-brand-50 text-brand-900 dark:bg-brand-900 dark:text-brand-50'
                : 'text-gray-600 dark:text-gray-400 hover:text-brand-600'
            )}
          >
            <item.icon
              className={cn(
                'h-5 w-5 transition-colors',
                location.pathname === item.to
                  ? 'text-brand-600'
                  : 'text-gray-500 group-hover:text-brand-500'
              )}
            />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
