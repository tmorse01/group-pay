import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/base/buttons/button';
import { useExpenses } from '../services/expenses';
import { LoadingSpinner } from '../components/application/LoadingSpinner';
import { ErrorState } from '../components/application/ErrorState';
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
  pluralize,
  formatInitials,
} from '../utils';

export function Expenses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { data: expenses, isLoading, error, refetch } = useExpenses();

  // Filter expenses based on search query and category
  const filteredExpenses = expenses?.filter((expense) => {
    // Check if payer exists and has a name
    const payerName =
      expense.payer && 'name' in expense.payer ? expense.payer.name : null;

    const matchesSearch =
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payerName &&
        payerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'all' ||
      expense.category?.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = Array.from(
    new Set(
      expenses?.map((e) => e.category).filter((c): c is string => c != null)
    )
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="text-neutral-600 dark:text-neutral-400 ml-3">
          Loading expenses...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load expenses"
        description={
          error instanceof Error ? error.message : 'An unknown error occurred'
        }
        action={<Button onClick={() => refetch()}>Try Again</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Expenses
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {expenses?.length
              ? `${expenses.length} ${pluralize(expenses.length, 'expense')} across all groups`
              : 'View and manage all your expenses'}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search expenses by description or payer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              color={categoryFilter === 'all' ? 'primary' : 'tertiary'}
              size="sm"
              onClick={() => setCategoryFilter('all')}
            >
              All ({expenses?.length || 0})
            </Button>
            {categories.map((category) => {
              const count =
                expenses?.filter((e) => e.category === category).length || 0;
              return (
                <Button
                  key={category}
                  color={categoryFilter === category ? 'primary' : 'tertiary'}
                  size="sm"
                  onClick={() => setCategoryFilter(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)} (
                  {count})
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-4">
        {filteredExpenses && filteredExpenses.length > 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="p-6 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-150"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left Side - Description and Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                          {expense.description}
                        </h3>
                        {expense.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {expense.category}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">Paid by:</span>
                          <div className="flex items-center gap-1.5">
                            {expense.payer &&
                            'photoUrl' in expense.payer &&
                            expense.payer.photoUrl ? (
                              <img
                                src={expense.payer.photoUrl}
                                alt={expense.payer?.name || 'Unknown'}
                                className="w-5 h-5 rounded-full"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium">
                                {formatInitials(
                                  expense.payer &&
                                    'name' in expense.payer &&
                                    expense.payer.name
                                    ? expense.payer.name
                                    : '',
                                  1
                                )}
                              </div>
                            )}
                            <span>
                              {expense.payer &&
                              'name' in expense.payer &&
                              expense.payer.name
                                ? expense.payer.name
                                : 'Unknown'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">Split with:</span>
                          <span>
                            {expense.participants?.length || 0}{' '}
                            {pluralize(
                              expense.participants?.length || 0,
                              'person',
                              'people'
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">Date:</span>
                          <span>{formatDate(expense.date, 'MMM D, YYYY')}</span>
                        </div>

                        {expense.createdAt && (
                          <div className="text-xs">
                            {formatRelativeDate(expense.createdAt)}
                          </div>
                        )}
                      </div>

                      {expense.notes && (
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                          {expense.notes}
                        </p>
                      )}
                    </div>

                    {/* Right Side - Amount */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                        {formatCurrency(expense.amountCents, expense.currency)}
                      </div>
                      <Link to={`/groups/${expense.groupId}`}>
                        <Button color="secondary" size="sm">
                          View Group
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Participants List */}
                  <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex flex-wrap gap-3">
                      {expense.participants?.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-700 rounded-lg"
                        >
                          {participant.user &&
                          'photoUrl' in participant.user &&
                          participant.user.photoUrl ? (
                            <img
                              src={participant.user.photoUrl}
                              alt={participant.user?.name || 'Unknown'}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium">
                              {formatInitials(
                                participant.user &&
                                  'name' in participant.user &&
                                  participant.user.name
                                  ? participant.user.name
                                  : '',
                                1
                              )}
                            </div>
                          )}
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {participant.user &&
                            'name' in participant.user &&
                            participant.user.name
                              ? participant.user.name
                              : 'Unknown'}
                          </span>
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {formatCurrency(
                              participant.shareCents || 0,
                              expense.currency
                            )}
                          </span>
                          {participant.isSettled && (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              ✓ Settled
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 px-6 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="text-6xl mb-4 opacity-60">💰</div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              {expenses?.length === 0
                ? 'No expenses yet'
                : 'No matching expenses'}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
              {expenses?.length === 0
                ? 'Create a group and start adding expenses to track shared costs.'
                : "Try adjusting your search or filter to find the expenses you're looking for."}
            </p>
            {expenses?.length === 0 && (
              <div className="flex justify-center">
                <Link to="/groups">
                  <Button color="primary">Go to Groups</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {expenses && expenses.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
            Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                {expenses.length}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Total Expenses
              </div>
            </div>
            <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  expenses.reduce((sum, e) => sum + e.amountCents, 0),
                  expenses[0]?.currency || 'USD'
                )}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Total Amount
              </div>
            </div>
            <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {categories.length}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Categories
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
