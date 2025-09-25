import { useState } from 'react';
import { Button } from '../components/base/buttons/button';
import { useGroups, useCreateGroup } from '../services/groups';

export function Groups() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: groups, isLoading, error } = useGroups();
  const createGroupMutation = useCreateGroup();

  const filteredGroups = groups?.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGroup = async () => {
    try {
      await createGroupMutation.mutateAsync({
        name: 'New Group',
        description: 'A new group for expenses',
        currency: 'USD',
      });
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-neutral-600 dark-mode:text-neutral-400">
            Loading groups...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">Failed to load groups</p>
          <p className="text-sm text-neutral-600 dark-mode:text-neutral-400">
            {error instanceof Error
              ? error.message
              : 'An unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark-mode:text-neutral-50">
          Groups
        </h1>
        <Button
          color="primary"
          onClick={handleCreateGroup}
          isLoading={createGroupMutation.isPending}
        >
          Create Group
        </Button>
      </div>

      <div className="bg-white dark-mode:bg-neutral-800 rounded-lg border border-neutral-200 dark-mode:border-neutral-700">
        <div className="p-6 border-b border-neutral-200 dark-mode:border-neutral-700">
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 dark-mode:border-neutral-600 rounded-lg bg-white dark-mode:bg-neutral-900 text-neutral-900 dark-mode:text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="p-6">
          {filteredGroups && filteredGroups.length > 0 ? (
            <div className="grid gap-4">
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 border border-neutral-200 dark-mode:border-neutral-600 rounded-lg hover:bg-neutral-50 dark-mode:hover:bg-neutral-700 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark-mode:text-neutral-50">
                        {group.name}
                      </h3>
                      {group.description && (
                        <p className="text-sm text-neutral-600 dark-mode:text-neutral-400 mt-1">
                          {group.description}
                        </p>
                      )}
                      <p className="text-xs text-neutral-500 dark-mode:text-neutral-400 mt-2">
                        Currency: {group.currency}
                      </p>
                    </div>
                    <Button color="tertiary" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-neutral-900 dark-mode:text-neutral-50 mb-2">
                {groups?.length === 0 ? 'No groups yet' : 'No matching groups'}
              </h3>
              <p className="text-neutral-600 dark-mode:text-neutral-400 mb-6">
                {groups?.length === 0
                  ? 'Create your first group to start tracking expenses with friends or colleagues.'
                  : 'Try adjusting your search query.'}
              </p>
              {groups?.length === 0 && (
                <Button
                  color="primary"
                  onClick={handleCreateGroup}
                  isLoading={createGroupMutation.isPending}
                >
                  Create Your First Group
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
