import { Button } from '../../base/buttons/button';
import { Modal, ModalOverlay, Dialog } from './modal';
import { useDeleteExpense } from '../../../services/expenses';
import { formatCurrency } from '../../../utils/currency';

interface DeleteExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: {
    id: string;
    description: string;
    amountCents: number;
    currency: string;
    payer: {
      name: string;
    };
  } | null;
}

export function DeleteExpenseModal({
  isOpen,
  onClose,
  expense,
}: DeleteExpenseModalProps) {
  const deleteExpenseMutation = useDeleteExpense();

  const handleDelete = async () => {
    if (!expense) return;

    try {
      await deleteExpenseMutation.mutateAsync(expense.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  if (!expense) return null;

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onClose}>
      <Modal>
        <Dialog>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
                  Delete Expense
                </h2>
                <Button
                  onClick={onClose}
                  color="tertiary"
                  size="sm"
                  aria-label="Close"
                  iconLeading={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <div className="mb-4">
                <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                  Are you sure you want to delete this expense? This action
                  cannot be undone.
                </p>

                {/* Expense details */}
                <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-neutral-900 dark:text-neutral-50">
                        {expense.description}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Paid by {expense.payer.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-50">
                        {formatCurrency(expense.amountCents, expense.currency)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  color="tertiary"
                  onClick={onClose}
                  isDisabled={deleteExpenseMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  color="primary-destructive"
                  onClick={handleDelete}
                  isLoading={deleteExpenseMutation.isPending}
                >
                  Delete Expense
                </Button>
              </div>
            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
