import { Button } from '../components/base/buttons/button';

export function Groups() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark-mode:text-neutral-50">
          Groups
        </h1>
        <Button color="primary">Create Group</Button>
      </div>

      <div className="bg-white dark-mode:bg-neutral-800 rounded-lg border border-neutral-200 dark-mode:border-neutral-700">
        <div className="p-6 border-b border-neutral-200 dark-mode:border-neutral-700">
          <input
            type="text"
            placeholder="Search groups..."
            className="w-full px-4 py-2 border border-neutral-300 dark-mode:border-neutral-600 rounded-lg bg-white dark-mode:bg-neutral-900 text-neutral-900 dark-mode:text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="p-6">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-neutral-900 dark-mode:text-neutral-50 mb-2">
              No groups yet
            </h3>
            <p className="text-neutral-600 dark-mode:text-neutral-400 mb-6">
              Create your first group to start tracking expenses with friends or
              colleagues.
            </p>
            <Button color="primary">Create Your First Group</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
