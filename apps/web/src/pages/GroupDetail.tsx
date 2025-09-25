import { useParams } from 'react-router-dom';

export function GroupDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark-mode:text-neutral-50">
          Group Details
        </h1>
      </div>

      <div className="bg-white dark-mode:bg-neutral-800 rounded-lg border border-neutral-200 dark-mode:border-neutral-700 p-6">
        <p className="text-neutral-600 dark-mode:text-neutral-400">
          Group ID: {id}
        </p>
        <p className="text-neutral-600 dark-mode:text-neutral-400 mt-2">
          This is a placeholder for the group detail page.
        </p>
      </div>
    </div>
  );
}
