import { Link } from 'react-router-dom';
import { useBalances } from '@/services/dashboard';
import { formatCurrency } from '@/utils';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

export function BalanceSummary() {
  const { data: balances, isLoading, error } = useBalances();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <p className="text-neutral-600 dark:text-neutral-400">
          Unable to load balance information.
        </p>
      </div>
    );
  }

  if (!balances || balances.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
          Balance Summary
        </h3>
        <EmptyState
          title="No balances"
          description="Join or create a group to start tracking expenses."
        />
      </div>
    );
  }

  // Calculate overall net balance
  const overallNetBalance = balances.reduce(
    (sum, balance) => sum + balance.netBalance,
    0
  );

  // Determine color based on balance
  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600 dark:text-green-500';
    if (balance < 0) return 'text-red-600 dark:text-red-500';
    return 'text-neutral-600 dark:text-neutral-400';
  };

  // Use currency from first balance (assuming all groups use same currency for now)
  const currency = balances[0]?.currency || 'USD';

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
        Balance Summary
      </h3>

      {/* Overall Net Balance */}
      <div className="mb-6 pb-6 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Net Balance (All Groups)
          </span>
          <span
            className={`text-2xl font-bold ${getBalanceColor(overallNetBalance)}`}
          >
            {formatCurrency(overallNetBalance, currency)}
          </span>
        </div>
        {overallNetBalance > 0 && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            You are owed money
          </p>
        )}
        {overallNetBalance < 0 && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            You owe money
          </p>
        )}
        {overallNetBalance === 0 && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            All settled up
          </p>
        )}
      </div>

      {/* Breakdown by Group */}
      {balances.length > 1 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            By Group
          </h4>
          <div className="space-y-2">
            {balances.map((balance) => (
              <Link
                key={balance.groupId}
                to={`/groups/${balance.groupId}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <span className="text-sm text-neutral-900 dark:text-neutral-50">
                  {balance.groupName}
                </span>
                <span
                  className={`text-sm font-medium ${getBalanceColor(
                    balance.netBalance
                  )}`}
                >
                  {formatCurrency(balance.netBalance, balance.currency)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Single Group - Show Details */}
      {balances.length === 1 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">
              You lent
            </span>
            <span className="text-neutral-900 dark:text-neutral-50 font-medium">
              {formatCurrency(balances[0].totalLent, balances[0].currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">
              You owe
            </span>
            <span className="text-neutral-900 dark:text-neutral-50 font-medium">
              {formatCurrency(balances[0].totalOwed, balances[0].currency)}
            </span>
          </div>
          <div className="pt-2">
            <Link
              to={`/groups/${balances[0].groupId}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View group details →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
