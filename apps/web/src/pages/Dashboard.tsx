import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/base/buttons/button';
import { DashboardStats } from '@/components/application/DashboardStats';
import { BalanceSummary } from '@/components/application/BalanceSummary';
import { RecentActivity } from '@/components/application/RecentActivity';
import { CreateGroupModal } from '@/components/application/modals/CreateGroupModal';
import { useGroups } from '@/services/groups';
import { LoadingSpinner } from '@/components/application/LoadingSpinner';
import { ErrorState } from '@/components/application/ErrorState';

export function Dashboard() {
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const {
    data: groups,
    isLoading: groupsLoading,
    error: groupsError,
    refetch: refetchGroups,
  } = useGroups();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Dashboard
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Overview of your groups, expenses, and balances
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            color="primary"
            onClick={() => setIsCreateGroupModalOpen(true)}
          >
            Create Group
          </Button>
          {groups && groups.length > 0 && (
            <Link to="/groups">
              <Button color="secondary">View All Groups</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Error State */}
      {groupsError && (
        <ErrorState
          title="Failed to load dashboard data"
          description={
            groupsError instanceof Error
              ? groupsError.message
              : 'An unknown error occurred'
          }
          action={<Button onClick={() => refetchGroups()}>Try Again</Button>}
        />
      )}

      {/* Loading State */}
      {groupsLoading && !groupsError && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <p className="text-neutral-600 dark:text-neutral-400 ml-3">
            Loading dashboard...
          </p>
        </div>
      )}

      {/* Dashboard Content */}
      {!groupsLoading && !groupsError && (
        <>
          {/* Statistics Cards */}
          <DashboardStats />

          {/* Balance Summary and Recent Activity */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <BalanceSummary />
            <RecentActivity />
          </div>
        </>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      />
    </div>
  );
}
