import { Link } from 'react-router-dom';
import { Button } from '../base/buttons/button';
import { formatDistanceToNow } from 'date-fns';
import { cx } from '../../utils/cx';

interface Group {
  id: string;
  name: string;
  currency: string;
  memberCount: number;
  expenseCount: number;
  lastActivity: string;
  createdAt: string;
}

interface GroupCardProps {
  group: Group;
  className?: string;
}

export function GroupCard({ group, className }: GroupCardProps) {
  const lastActivityDate = new Date(group.lastActivity);

  return (
    <div
      className={cx(
        'bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-md transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-600',
        className
      )}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 truncate">
              {group.name}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {group.currency} • Created{' '}
              {formatDistanceToNow(new Date(group.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4\">
          \n{' '}
          <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
            <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-50\">
              {group.memberCount}
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400\">
              {group.memberCount === 1 ? 'Member' : 'Members'}
            </div>
          </div>
          <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
            <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              {group.expenseCount}
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              {group.expenseCount === 1 ? 'Expense' : 'Expenses'}
            </div>
          </div>
        </div>

        {/* Last Activity */}
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          Last activity:{' '}
          {formatDistanceToNow(lastActivityDate, { addSuffix: true })}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <Link to={`/groups/${group.id}`}>
            <Button color="secondary" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
