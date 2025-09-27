export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          Dashboard
        </h1>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
            Total Groups
          </h3>
          <div className="text-3xl font-bold text-green-600">0</div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
            Active Members
          </h3>
          <div className="text-3xl font-bold text-blue-600">0</div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
            Total Expenses
          </h3>
          <div className="text-3xl font-bold text-purple-600">$0.00</div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
          Recent Activity
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400">
          No recent activity to show.
        </p>
      </div>
    </div>
  );
}
