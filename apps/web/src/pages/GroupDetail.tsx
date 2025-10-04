import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../components/base/buttons/button';
import { useGroup, useUpdateGroup, useDeleteGroup } from '../services/groups';
import { LoadingSpinner } from '../components/application/LoadingSpinner';
import { ErrorState } from '../components/application/ErrorState';
import { AddExpenseModal } from '../components/application/modals/AddExpenseModal';
import { AddMemberModal } from '../components/application/modals/AddMemberModal';
import { formatCurrency } from '../utils/currency';
import { formatDistanceToNow, format } from 'date-fns';

export function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    'expenses' | 'members' | 'settings'
  >('expenses');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const { data: group, isLoading, error, refetch } = useGroup(id!);
  const updateGroupMutation = useUpdateGroup();
  const deleteGroupMutation = useDeleteGroup();

  const handleUpdateName = async () => {
    if (!id || !editName.trim()) return;

    try {
      await updateGroupMutation.mutateAsync({
        id,
        data: { name: editName.trim() },
      });
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to update group name:', error);
    }
  };

  const handleDeleteGroup = async () => {
    if (!id) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this group? This action cannot be undone.'
    );

    if (confirmed) {
      try {
        await deleteGroupMutation.mutateAsync(id);
        navigate('/groups');
      } catch (error) {
        console.error('Failed to delete group:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="text-neutral-600 dark:text-neutral-400 ml-3">
          Loading group details...
        </p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <ErrorState
        title="Failed to load group"
        description={error instanceof Error ? error.message : 'Group not found'}
        action={<Button onClick={() => refetch()}>Try Again</Button>}
      />
    );
  }

  const groupData = group.group;
  const totalExpenses = groupData.expenses.reduce(
    (sum, exp) => sum + exp.amountCents,
    0
  );
  const currentUser = groupData.members.find((m) => m.role === 'OWNER'); // Simplified for demo
  const isOwnerOrAdmin =
    currentUser && ['OWNER', 'ADMIN'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-b-2 border-green-500 focus:outline-none text-neutral-900 dark:text-neutral-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateName();
                    if (e.key === 'Escape') {
                      setIsEditingName(false);
                      setEditName(groupData.name);
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="primary"
                    onClick={handleUpdateName}
                    isLoading={updateGroupMutation.isPending}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    color="tertiary"
                    onClick={() => {
                      setIsEditingName(false);
                      setEditName(groupData.name);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                  {groupData.name}
                </h1>
                {isOwnerOrAdmin && (
                  <Button
                    size="sm"
                    color="tertiary"
                    onClick={() => {
                      setEditName(groupData.name);
                      setIsEditingName(true);
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              <span>{groupData.currency}</span>
              <span>•</span>
              <span>
                {groupData.members.length} member
                {groupData.members.length !== 1 ? 's' : ''}
              </span>
              <span>•</span>
              <span>
                Created{' '}
                {formatDistanceToNow(new Date(groupData.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              color="primary"
              size="sm"
              onClick={() => setIsAddExpenseModalOpen(true)}
            >
              Add Expense
            </Button>
            {isOwnerOrAdmin && (
              <Button
                color="primary-destructive"
                size="sm"
                onClick={handleDeleteGroup}
                isLoading={deleteGroupMutation.isPending}
              >
                Delete Group
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              {formatCurrency(totalExpenses, groupData.currency)}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Total Spent
            </div>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              {groupData.expenses.length}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Expenses
            </div>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              {groupData.members.length}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Members
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div className="border-b border-neutral-200 dark:border-neutral-700">
          <nav className="flex space-x-8 px-6">
            {(['expenses', 'members', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  activeTab === tab
                    ? 'py-4 px-1 border-b-2 border-green-500 text-green-600 dark:text-green-400 font-medium text-sm transition-colors'
                    : 'py-4 px-1 border-b-2 border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300 font-medium text-sm transition-colors'
                }
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              {groupData.expenses.length > 0 ? (
                <div className="space-y-3">
                  {groupData.expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                          {expense.payer.photoUrl ? (
                            <img
                              src={expense.payer.photoUrl}
                              alt={expense.payer.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              {expense.payer.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-50">
                            {expense.description}
                          </div>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            Paid by {expense.payer.name} •{' '}
                            {format(new Date(expense.date), 'MMM d, yyyy')}
                          </div>
                          {expense.category && (
                            <div className="text-xs text-neutral-500 dark:text-neutral-400">
                              {expense.category}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-50">
                          {formatCurrency(
                            expense.amountCents,
                            expense.currency
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {expense.participants.length} participant
                          {expense.participants.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-6 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="text-6xl mb-4 opacity-60">💸</div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                    No expenses yet
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
                    Start tracking expenses by adding your first one!
                  </p>
                  <div className="flex justify-center">
                    <Button
                      color="primary"
                      onClick={() => setIsAddExpenseModalOpen(true)}
                    >
                      Add First Expense
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  Members ({groupData.members.length})
                </h3>
                {isOwnerOrAdmin && (
                  <Button
                    color="secondary"
                    size="sm"
                    onClick={() => setIsAddMemberModalOpen(true)}
                  >
                    Add Member
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {groupData.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-600 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                        {member.user.photoUrl ? (
                          <img
                            src={member.user.photoUrl}
                            alt={member.user.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {member.user.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-neutral-50">
                          {member.user.name}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          {member.user.email}
                        </div>
                        {member.user.venmoHandle && (
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            Venmo: @{member.user.venmoHandle}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          member.role === 'OWNER'
                            ? 'px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : member.role === 'ADMIN'
                              ? 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
                        }
                      >
                        {member.role.toLowerCase()}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        Joined{' '}
                        {formatDistanceToNow(new Date(member.joinedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
                  Group Settings
                </h3>

                <div className="space-y-4">
                  <div className="p-4 border border-neutral-200 dark:border-neutral-600 rounded-lg">
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                      Group Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          Name:
                        </span>
                        <span className="text-neutral-900 dark:text-neutral-50">
                          {groupData.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          Currency:
                        </span>
                        <span className="text-neutral-900 dark:text-neutral-50">
                          {groupData.currency}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          Created:
                        </span>
                        <span className="text-neutral-900 dark:text-neutral-50">
                          {format(new Date(groupData.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          Group ID:
                        </span>
                        <span className="text-neutral-900 dark:text-neutral-50 font-mono text-xs">
                          {groupData.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isOwnerOrAdmin && (
                    <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950">
                      <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                        Danger Zone
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                        Deleting this group will permanently remove all expenses
                        and member data. This action cannot be undone.
                      </p>
                      <Button
                        color="primary-destructive"
                        size="sm"
                        onClick={handleDeleteGroup}
                        isLoading={deleteGroupMutation.isPending}
                      >
                        Delete Group
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        groupId={id!}
        groupMembers={groupData.members}
        groupCurrency={groupData.currency}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        groupId={id!}
        groupName={groupData.name}
      />
    </div>
  );
}
