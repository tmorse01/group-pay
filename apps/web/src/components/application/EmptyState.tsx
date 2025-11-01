import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon = '📄',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cx(
        'text-center py-12 px-6 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700',
        className
      )}
    >
      <div className="text-6xl mb-4 opacity-60">{icon}</div>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
        {title}
      </h3>
      <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
