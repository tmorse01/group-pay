import { useGroups } from '@/services/groups';
import { useExpenses } from '@/services/expenses';
import { formatCurrency } from '@/utils';
import { LoadingSpinner } from './LoadingSpinner';

export function DashboardStats() {
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();

  const isLoading = groupsLoading || expensesLoading;

  // Calculate stats
  const totalGroups = groups?.length ?? 0;

  // Sum memberCount from all groups (approximation - may count users in multiple groups)
  const activeMembers =
    groups?.reduce((sum, group) => sum + group.memberCount, 0) ?? 0;

  // Sum all expense amounts
  const totalExpenses =
    expenses?.reduce((sum, expense) => sum + expense.amountCents, 0) ?? 0;

  if (isLoading) {
    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6"
          >
            <div className="flex items-center justify-center h-16">
              <LoadingSpinner size="md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
          Total Groups
        </h3>
        <div className="text-3xl font-bold text-green-600 dark:text-green-500">
          {totalGroups}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
          Active Members
        </h3>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">
          {activeMembers}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
          Total Expenses
        </h3>
        <div className="text-3xl font-bold text-purple-600 dark:text-purple-500">
          {formatCurrency(totalExpenses)}
        </div>
      </div>
    </div>
  );
}
