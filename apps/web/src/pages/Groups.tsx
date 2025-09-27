import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/base/buttons/button';
import { useGroups, useCreateGroup } from '../services/groups';
import { LoadingSpinner } from '../components/application/LoadingSpinner';
import { ErrorState } from '../components/application/ErrorState';
import { formatDistanceToNow } from 'date-fns';

export function Groups() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: groups, isLoading, error, refetch } = useGroups();
  const createGroupMutation = useCreateGroup();
  console.log('groups:', groups);
  const filteredGroups = groups?.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGroup = async () => {
    try {
      await createGroupMutation.mutateAsync({
        name: 'New Group ' + Date.now(),
        currency: 'USD',
      });
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="text-neutral-600 dark:text-neutral-400 ml-3">
          Loading groups...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load groups"
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
            Groups
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {groups?.length
              ? `${groups.length} group${groups.length === 1 ? '' : 's'}`
              : 'Manage your expense groups'}
          </p>
        </div>
        <Button
          color="primary"
          onClick={handleCreateGroup}
          isLoading={createGroupMutation.isPending}
        >
          Create Group
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <Button color="tertiary" size="sm">
              All Groups ({groups?.length || 0})
            </Button>
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="space-y-4">
        {filteredGroups && filteredGroups.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-md transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-600"
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                      <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                        {group.memberCount}
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
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
                    {formatDistanceToNow(new Date(group.lastActivity), {
                      addSuffix: true,
                    })}
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
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="text-6xl mb-4 opacity-60">👥</div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              {groups?.length === 0 ? 'No groups yet' : 'No matching groups'}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
              {groups?.length === 0
                ? 'Create your first group to start tracking expenses with friends or colleagues.'
                : "Try adjusting your search query to find the group you're looking for."}
            </p>
            {groups?.length === 0 && (
              <div className="flex justify-center">
                <Button
                  color="primary"
                  onClick={handleCreateGroup}
                  isLoading={createGroupMutation.isPending}
                >
                  Create Your First Group
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
