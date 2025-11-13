import { Link } from 'react-router-dom';
import { CurrencyDollar, Users01, ArrowRight } from '@untitledui/icons';
import { useExpenses } from '@/services/expenses';
import { useRecentSettlements } from '@/services/dashboard';
import { useGroups } from '@/services/groups';
import { formatCurrency, formatRelativeDate, formatInitials } from '@/utils';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';

interface ActivityItem {
  id: string;
  type: 'expense' | 'settlement' | 'group';
  timestamp: string;
  description: string;
  amountCents?: number;
  currency?: string;
  groupId: string;
  groupName?: string;
  user?: {
    name: string;
    photoUrl?: string;
  };
}

export function RecentActivity() {
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: settlements, isLoading: settlementsLoading } =
    useRecentSettlements(5);
  const { data: groups, isLoading: groupsLoading } = useGroups();

  const isLoading = expensesLoading || settlementsLoading || groupsLoading;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
          Recent Activity
        </h3>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Build activity items from different sources
  const activities: ActivityItem[] = [];

  // Add expenses
  if (expenses) {
    expenses.slice(0, 5).forEach((expense) => {
      const group = groups?.find((g) => g.id === expense.groupId);
      // Handle createdAt as Date or string
      const timestamp =
        expense.createdAt instanceof Date
          ? expense.createdAt.toISOString()
          : typeof expense.createdAt === 'string'
            ? expense.createdAt
            : new Date().toISOString();
      activities.push({
        id: expense.id,
        type: 'expense',
        timestamp,
        description: expense.description,
        amountCents: expense.amountCents,
        currency: expense.currency,
        groupId: expense.groupId,
        groupName: group?.name,
        user: expense.payer,
      });
    });
  }

  // Add settlements
  if (settlements) {
    settlements.forEach((settlement) => {
      activities.push({
        id: settlement.id,
        type: 'settlement',
        timestamp: settlement.createdAt,
        description: `${settlement.fromUser.name} paid ${settlement.toUser.name}`,
        amountCents: settlement.amountCents,
        currency: 'USD', // Settlements don't have currency in the type, defaulting to USD
        groupId: settlement.groupId,
        groupName: settlement.group.name,
        user: settlement.fromUser,
      });
    });
  }

  // Add group creation activities
  if (groups) {
    groups.slice(0, 3).forEach((group) => {
      activities.push({
        id: `group-${group.id}`,
        type: 'group',
        timestamp: group.createdAt,
        description: `Group "${group.name}" was created`,
        groupId: group.id,
        groupName: group.name,
      });
    });
  }

  // Sort by timestamp (most recent first)
  activities.sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return dateB - dateA;
  });

  // Take top 10 most recent
  const recentActivities = activities.slice(0, 10);

  if (recentActivities.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
          Recent Activity
        </h3>
        <EmptyState
          title="No recent activity"
          description="Start creating groups and adding expenses to see activity here."
        />
      </div>
    );
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'expense':
        return CurrencyDollar;
      case 'settlement':
        return ArrowRight;
      case 'group':
        return Users01;
      default:
        return CurrencyDollar;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'expense':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400';
      case 'settlement':
        return 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      case 'group':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
      default:
        return 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400';
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
        Recent Activity
      </h3>
      <div className="space-y-3">
        {recentActivities.map((activity) => {
          const IconComponent = getActivityIcon(activity.type);
          return (
            <Link
              key={activity.id}
              to={`/groups/${activity.groupId}`}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(
                  activity.type
                )}`}
              >
                <IconComponent className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {activity.description}
                    </p>
                    {activity.groupName && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {activity.groupName}
                      </p>
                    )}
                  </div>
                  {activity.amountCents && (
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                        {formatCurrency(
                          activity.amountCents,
                          activity.currency || 'USD'
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {activity.user && (
                    <div className="flex items-center gap-1.5">
                      {activity.user.photoUrl ? (
                        <img
                          src={activity.user.photoUrl}
                          alt={activity.user.name}
                          className="w-4 h-4 rounded-full"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                          {formatInitials(activity.user.name, 1)}
                        </div>
                      )}
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {activity.user.name}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">
                    {formatRelativeDate(activity.timestamp)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
