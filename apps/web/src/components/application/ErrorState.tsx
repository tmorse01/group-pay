import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';

interface ErrorStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title,
  description,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cx(
        'text-center py-12 px-6 bg-white dark:bg-neutral-800 rounded-lg border border-red-200 dark:border-red-800',
        className
      )}
    >
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
        {title}
      </h3>
      <p className="text-red-600 dark:text-red-400 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
