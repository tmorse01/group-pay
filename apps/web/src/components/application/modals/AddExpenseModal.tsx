import { useEffect, useState } from 'react';
import { Button } from '../../base/buttons/button';
import { Modal, ModalOverlay, Dialog } from './modal';
import { useCreateExpense } from '../../../services/expenses';
import {
  useAppForm,
  UiForm,
  InputField,
  SelectField,
  TextareaField,
} from '../../../forms';
import { Select } from '@/components/base/select/select';
import { formatCurrency } from '../../../utils/currency';
import { cx } from '../../../utils/cx';
import type { ExpenseSplitType } from '@group-pay/shared';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupMembers: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      photoUrl?: string;
    };
  }>;
  groupCurrency: string;
}

// Form types
type ExpenseFormValues = {
  description: string;
  amount: string;
  date: string;
  category?: string;
  notes?: string;
  payerId: string;
};

// Participant management state (separate from form)
interface Participant {
  userId: string;
  isSelected: boolean;
  shareCents: number;
}

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Accommodation',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Healthcare',
  'Travel',
  'Other',
];

export function AddExpenseModal({
  isOpen,
  onClose,
  groupId,
  groupMembers,
  groupCurrency,
}: AddExpenseModalProps) {
  const [splitType, setSplitType] = useState<ExpenseSplitType>('EQUAL');
  const [participants, setParticipants] = useState<Participant[]>(() =>
    groupMembers.map((member) => ({
      userId: member.user.id,
      isSelected: true,
      shareCents: 0,
    }))
  );
  const [participantError, setParticipantError] = useState<string | null>(null);

  const createExpenseMutation = useCreateExpense();

  const { form } = useAppForm<ExpenseFormValues>({
    defaultValues: {
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      notes: '',
      payerId: '',
    },
    onSubmit: async (values) => {
      // Validate participants
      const selectedParticipants = participants.filter((p) => p.isSelected);
      if (selectedParticipants.length === 0) {
        setParticipantError('At least one participant is required');
        return;
      }

      // Validate splits sum to total amount
      const totalSplitCents = selectedParticipants.reduce(
        (sum, p) => sum + p.shareCents,
        0
      );
      // Convert amount string to cents for validation
      const amountValue = parseFloat(values.amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        setParticipantError('Amount must be greater than 0');
        return;
      }
      const expectedAmountCents = Math.round(amountValue * 100);
      if (Math.abs(totalSplitCents - expectedAmountCents) > 1) {
        setParticipantError(
          'Split amounts must equal the total expense amount'
        );
        return;
      }

      try {
        await createExpenseMutation.mutateAsync({
          description: values.description.trim(),
          amountCents: expectedAmountCents,
          currency: groupCurrency,
          date: new Date(values.date),
          category: values.category || undefined,
          notes: values.notes || undefined,
          payerId: values.payerId,
          groupId,
          splitType,
          participants: selectedParticipants.map((p) => ({
            userId: p.userId,
            shareCents: p.shareCents,
          })),
        });

        handleClose();
      } catch (error) {
        console.error('Failed to create expense:', error);
      }
    },
  });

  // Update participants when group members change
  useEffect(() => {
    setParticipants((prev) =>
      groupMembers.map((member) => {
        const existing = prev.find((p) => p.userId === member.user.id);
        return (
          existing || {
            userId: member.user.id,
            isSelected: true,
            shareCents: 0,
          }
        );
      })
    );
  }, [groupMembers]);

  // Auto-calculate splits when amount or participants change
  useEffect(() => {
    const currentAmount = form.getFieldValue('amount');
    if (splitType === 'EQUAL' && currentAmount) {
      const amountCents = Math.round(parseFloat(String(currentAmount)) * 100);
      const selectedParticipants = participants.filter((p) => p.isSelected);
      if (selectedParticipants.length > 0) {
        const sharePerPerson = Math.floor(
          amountCents / selectedParticipants.length
        );
        const remainder = amountCents % selectedParticipants.length;

        setParticipants((prev) =>
          prev.map((participant) => {
            if (!participant.isSelected) {
              return { ...participant, shareCents: 0 };
            }
            const selectedIndex = selectedParticipants.findIndex(
              (p) => p.userId === participant.userId
            );
            // Give remainder to first participants
            const shareCents =
              sharePerPerson + (selectedIndex < remainder ? 1 : 0);
            return { ...participant, shareCents };
          })
        );
      }
    }
  }, [form, splitType, participants]);

  const handleClose = () => {
    form.reset();
    setParticipants(
      groupMembers.map((member) => ({
        userId: member.user.id,
        isSelected: true,
        shareCents: 0,
      }))
    );
    setSplitType('EQUAL');
    setParticipantError(null);
    onClose();
  };

  const handleParticipantToggle = (userId: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.userId === userId ? { ...p, isSelected: !p.isSelected } : p
      )
    );
    setParticipantError(null);
  };

  const handleCustomSplitChange = (userId: string, amount: string) => {
    const shareCents = Math.round(parseFloat(amount || '0') * 100);
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, shareCents } : p))
    );
    setParticipantError(null);
  };

  const selectedParticipants = participants.filter((p) => p.isSelected);
  const totalSplitCents = selectedParticipants.reduce(
    (sum, p) => sum + p.shareCents,
    0
  );
  const expectedAmountCents = form.getFieldValue('amount')
    ? Math.round(parseFloat(String(form.getFieldValue('amount'))) * 100)
    : 0;
  const splitDifference = Math.abs(totalSplitCents - expectedAmountCents);

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={handleClose}>
      <Modal>
        <Dialog>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  Add New Expense
                </h2>
                <button
                  onClick={handleClose}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  aria-label="Close"
                >
                  <svg
                    className="w-6 h-6"
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
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-4">
              <UiForm
                onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit();
                }}
                footer={
                  <div className="flex justify-end gap-3">
                    <Button
                      color="tertiary"
                      onClick={handleClose}
                      isDisabled={createExpenseMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      type="submit"
                      isLoading={createExpenseMutation.isPending}
                    >
                      Add Expense
                    </Button>
                  </div>
                }
              >
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <form.Field name="description">
                      {(field) => (
                        <InputField
                          field={field}
                          label="Description"
                          placeholder="What was this expense for?"
                          required
                        />
                      )}
                    </form.Field>
                  </div>

                  <form.Field name="amount">
                    {(field) => (
                      <InputField
                        field={field}
                        label="Amount"
                        type="number"
                        step={0.01}
                        min={0}
                        placeholder="0.00"
                        required
                      />
                    )}
                  </form.Field>

                  <form.Field name="date">
                    {(field) => (
                      <InputField field={field} label="Date" type="date" />
                    )}
                  </form.Field>

                  <form.Field name="category">
                    {(field) => (
                      <SelectField
                        field={field}
                        label="Category"
                        placeholder="Select category..."
                      >
                        {EXPENSE_CATEGORIES.map((category) => (
                          <Select.Item
                            key={category}
                            id={category}
                            label={category}
                          >
                            {category}
                          </Select.Item>
                        ))}
                      </SelectField>
                    )}
                  </form.Field>

                  <form.Field name="payerId">
                    {(field) => (
                      <SelectField
                        field={field}
                        label="Paid by"
                        placeholder="Select who paid..."
                        required
                      >
                        {groupMembers.map((member) => (
                          <Select.Item
                            key={member.user.id}
                            id={member.user.id}
                            label={member.user.name}
                          >
                            {member.user.name}
                          </Select.Item>
                        ))}
                      </SelectField>
                    )}
                  </form.Field>
                </div>

                {/* Notes */}
                <form.Field name="notes">
                  {(field) => (
                    <TextareaField
                      field={field}
                      label="Notes (optional)"
                      placeholder="Additional notes about this expense..."
                      rows={2}
                    />
                  )}
                </form.Field>

                {/* Split Configuration */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Split Method
                  </label>
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setSplitType('EQUAL')}
                      className={cx(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        splitType === 'EQUAL'
                          ? 'bg-green-500 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                      )}
                    >
                      Equal Split
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitType('EXACT')}
                      className={cx(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        splitType === 'EXACT'
                          ? 'bg-green-500 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                      )}
                    >
                      Custom Split
                    </button>
                  </div>

                  {/* Participants */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Who owes money for this expense?
                      </h4>
                      {splitType === 'EXACT' && expectedAmountCents > 0 && (
                        <div className="text-sm">
                          <span className="text-neutral-600 dark:text-neutral-400">
                            Total:{' '}
                            {formatCurrency(totalSplitCents, groupCurrency)}{' '}
                            /{' '}
                          </span>
                          <span className="text-neutral-900 dark:text-neutral-50">
                            {formatCurrency(expectedAmountCents, groupCurrency)}
                          </span>
                          {splitDifference > 1 && (
                            <span className="text-red-600 dark:text-red-400 ml-2">
                              (Difference:{' '}
                              {formatCurrency(splitDifference, groupCurrency)})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {groupMembers.map((member) => {
                      const participant = participants.find(
                        (p) => p.userId === member.user.id
                      );
                      if (!participant) return null;

                      return (
                        <div
                          key={member.user.id}
                          className="flex items-center gap-3 p-3 border border-neutral-200 dark:border-neutral-600 rounded-lg"
                        >
                          <label className="flex items-center gap-3 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={participant.isSelected}
                              onChange={() =>
                                handleParticipantToggle(member.user.id)
                              }
                              className="w-4 h-4 text-green-500 border-neutral-300 dark:border-neutral-600 rounded focus:ring-green-500"
                            />
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                                {member.user.photoUrl ? (
                                  <img
                                    src={member.user.photoUrl}
                                    alt={member.user.name}
                                    className="w-8 h-8 rounded-full"
                                  />
                                ) : (
                                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                    {member.user.name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                {member.user.name}
                              </span>
                            </div>
                          </label>

                          {participant.isSelected && (
                            <div className="flex items-center gap-2">
                              {splitType === 'EQUAL' ? (
                                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                  {formatCurrency(
                                    participant.shareCents,
                                    groupCurrency
                                  )}
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={
                                    participant.shareCents > 0
                                      ? (participant.shareCents / 100).toFixed(
                                          2
                                        )
                                      : ''
                                  }
                                  onChange={(e) =>
                                    handleCustomSplitChange(
                                      member.user.id,
                                      e.target.value
                                    )
                                  }
                                  placeholder="0.00"
                                  className="w-20 px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {participantError && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {participantError}
                    </p>
                  )}
                </div>
              </UiForm>
            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
