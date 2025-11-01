import { useEffect, useState, useCallback } from 'react';
import { X, AlertTriangle } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { Modal, ModalOverlay, Dialog } from './modal';
import { Tabs } from '@/components/application/tabs/tabs';
import { useCreateExpense, useUpdateExpense } from '@/services/expenses';
import {
  useAppForm,
  UiForm,
  InputField,
  SelectField,
  TextareaField,
  CurrencyInputField,
} from '@/forms';
import { Select } from '@/components/base/select/select';
import { InputGroup } from '@/components/base/input/input-group';
import { InputBase } from '@/components/base/input/input';
import { formatCurrency } from '@/utils/currency';
import type { ExpenseSplitType, UpdateExpenseDto } from '@group-pay/shared';

interface BaseExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
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

interface CreateExpenseModalProps extends BaseExpenseModalProps {
  mode: 'create';
  groupId: string;
}

interface EditExpenseModalProps extends BaseExpenseModalProps {
  mode: 'edit';
  expense: {
    id: string;
    description: string;
    amountCents: number;
    currency: string;
    date: string;
    category?: string;
    payer: {
      id: string;
      name: string;
      photoUrl?: string;
    };
    participants: Array<{
      id: string;
      shareCents: number;
      user: {
        id: string;
        name: string;
        photoUrl?: string;
      };
    }>;
  } | null;
}

type ExpenseModalProps = CreateExpenseModalProps | EditExpenseModalProps;

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

export function ExpenseModal(props: ExpenseModalProps) {
  const { isOpen, onClose, groupMembers, groupCurrency, mode } = props;

  const [splitType, setSplitType] = useState<ExpenseSplitType>('EQUAL');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantError, setParticipantError] = useState<string | null>(null);

  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();

  // Get initial values based on mode
  const getInitialValues = (): ExpenseFormValues => {
    if (mode === 'edit' && props.expense) {
      const expense = props.expense;
      return {
        description: expense.description,
        amount: (expense.amountCents / 100).toFixed(2),
        date: expense.date.split('T')[0],
        category: expense.category || '',
        notes: '', // GroupExpense doesn't include notes
        payerId: expense.payer.id,
      };
    }

    return {
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      notes: '',
      payerId: '',
    };
  };

  const { form } = useAppForm<ExpenseFormValues>({
    defaultValues: getInitialValues(),
    onSubmit: async (values) => {
      const amountValue = parseFloat(values.amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        setParticipantError('Amount must be greater than 0');
        return;
      }
      const amountCents = Math.round(amountValue * 100);

      try {
        if (mode === 'create') {
          // Validate participants for create mode
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
          if (Math.abs(totalSplitCents - amountCents) > 1) {
            setParticipantError(
              'Split amounts must equal the total expense amount'
            );
            return;
          }

          await createExpenseMutation.mutateAsync({
            description: values.description.trim(),
            amountCents,
            currency: groupCurrency,
            date: new Date(values.date),
            category: values.category || undefined,
            notes: values.notes || undefined,
            payerId: values.payerId,
            groupId: props.groupId,
            splitType,
            participants: selectedParticipants.map((p) => ({
              userId: p.userId,
              shareCents: p.shareCents,
            })),
          });
        } else {
          // Edit mode - update expense including participants
          if (!props.expense) return;

          // Validate participants for edit mode
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

          if (Math.abs(totalSplitCents - amountCents) > 1) {
            const errorMsg = `Split amounts must equal the total expense amount. Current splits: ${(totalSplitCents / 100).toFixed(2)}, Expected: ${(amountCents / 100).toFixed(2)}`;
            setParticipantError(errorMsg);
            return;
          }

          const updateData: UpdateExpenseDto = {
            description: values.description.trim(),
            amountCents,
            date: new Date(values.date),
            category: values.category || null,
            notes: values.notes || null,
            payerId: values.payerId,
            splitType,
            participants: selectedParticipants.map((p) => ({
              userId: p.userId,
              shareCents: p.shareCents,
            })),
          };

          await updateExpenseMutation.mutateAsync({
            id: props.expense.id,
            data: updateData,
          });
        }

        handleClose();
      } catch (error) {
        console.error(`Failed to ${mode} expense:`, error);
      }
    },
  });

  // Initialize participants
  useEffect(() => {
    if (mode === 'create') {
      setParticipants(
        groupMembers.map((member) => ({
          userId: member.user.id,
          isSelected: true,
          shareCents: 0,
        }))
      );
    } else {
      // For edit mode, initialize with current expense data
      if (props.expense) {
        const expenseParticipantMap = new Map(
          props.expense.participants.map((p) => [p.user.id, p.shareCents])
        );
        setParticipants(
          groupMembers.map((member) => ({
            userId: member.user.id,
            isSelected: expenseParticipantMap.has(member.user.id),
            shareCents: expenseParticipantMap.get(member.user.id) || 0,
          }))
        );
        // Set current split type from expense (defaulting to EQUAL if not available)
        setSplitType('EQUAL');
      }
    }
  }, [groupMembers, mode, props]);

  // Helper function to recalculate equal splits
  const recalculateEqualSplits = useCallback(() => {
    if (splitType !== 'EQUAL') return;

    const currentAmount = form.getFieldValue('amount');
    if (!currentAmount) return;

    const amountCents = Math.round(parseFloat(String(currentAmount)) * 100);
    if (isNaN(amountCents) || amountCents <= 0) return;

    setParticipants((prev) => {
      const selectedParticipants = prev.filter((p) => p.isSelected);
      if (selectedParticipants.length === 0) return prev;

      const sharePerPerson = Math.floor(
        amountCents / selectedParticipants.length
      );
      const remainder = amountCents % selectedParticipants.length;

      return prev.map((participant) => {
        if (!participant.isSelected) {
          return { ...participant, shareCents: 0 };
        }
        const selectedIndex = selectedParticipants.findIndex(
          (p) => p.userId === participant.userId
        );
        const shareCents = sharePerPerson + (selectedIndex < remainder ? 1 : 0);
        return { ...participant, shareCents };
      });
    });

    // Clear any participant errors when splits are recalculated
    setParticipantError(null);
  }, [splitType, form, setParticipants]);

  // Watch for amount changes and auto-recalculate splits in EQUAL mode
  useEffect(() => {
    if (splitType !== 'EQUAL') return;

    const unsubscribe = form.store.subscribe(() => {
      const state = form.store.state;
      const amount = state.values.amount;

      if (amount && amount !== '') {
        recalculateEqualSplits();
      }
    });

    return unsubscribe;
  }, [splitType, form.store, recalculateEqualSplits]);

  const handleClose = () => {
    form.reset();
    if (mode === 'create') {
      setParticipants(
        groupMembers.map((member) => ({
          userId: member.user.id,
          isSelected: true,
          shareCents: 0,
        }))
      );
      setSplitType('EQUAL');
    }
    setParticipantError(null);
    onClose();
  };

  const handleParticipantToggle = (userId: string) => {
    setParticipants((prev) => {
      const updated = prev.map((p) =>
        p.userId === userId ? { ...p, isSelected: !p.isSelected } : p
      );

      // Recalculate splits if in EQUAL mode
      if (splitType === 'EQUAL') {
        const currentAmount = form.getFieldValue('amount');
        if (currentAmount) {
          const amountCents = Math.round(
            parseFloat(String(currentAmount)) * 100
          );
          const selectedParticipants = updated.filter((p) => p.isSelected);
          if (selectedParticipants.length === 0) return updated;

          const sharePerPerson = Math.floor(
            amountCents / selectedParticipants.length
          );
          const remainder = amountCents % selectedParticipants.length;

          return updated.map((participant) => {
            if (!participant.isSelected) {
              return { ...participant, shareCents: 0 };
            }
            const selectedIndex = selectedParticipants.findIndex(
              (p) => p.userId === participant.userId
            );
            const shareCents =
              sharePerPerson + (selectedIndex < remainder ? 1 : 0);
            return { ...participant, shareCents };
          });
        }
      }

      return updated;
    });
    setParticipantError(null);
  };

  const handleCustomSplitChange = (userId: string, amount: string) => {
    const numericValue = parseFloat(amount);
    const shareCents =
      isNaN(numericValue) || amount === '' ? 0 : Math.round(numericValue * 100);

    setParticipants((prev) => {
      const updated = prev.map((p) =>
        p.userId === userId ? { ...p, shareCents } : p
      );
      return updated;
    });
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

  const isLoading =
    mode === 'create'
      ? createExpenseMutation.isPending
      : updateExpenseMutation.isPending;

  // Don't render if we're in edit mode but don't have an expense
  if (mode === 'edit' && !props.expense) {
    return null;
  }

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={handleClose}>
      <Modal>
        <Dialog>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  {mode === 'create' ? 'Add New Expense' : 'Edit Expense'}
                </h2>
                <Button
                  onClick={handleClose}
                  color="tertiary"
                  size="sm"
                  aria-label="Close"
                  iconLeading={<X className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Form */}
            <div className="overflow-y-auto flex-1">
              <UiForm
                onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit();
                }}
                footer={
                  <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
                    {participantError && (
                      <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                            {participantError}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-3">
                      <Button
                        color="tertiary"
                        onClick={handleClose}
                        isDisabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        color="primary"
                        type="submit"
                        isLoading={isLoading}
                      >
                        {mode === 'create' ? 'Add Expense' : 'Update Expense'}
                      </Button>
                    </div>
                  </div>
                }
              >
                <Tabs>
                  <Tabs.List
                    items={[
                      { id: 'basic', label: 'Basic Info' },
                      { id: 'participants', label: 'Participants' },
                    ]}
                    type="underline"
                    className="mt-4 px-6 border-b border-neutral-200 dark:border-neutral-700"
                  />

                  {/* Basic Info Tab */}
                  <Tabs.Panel id="basic" className="px-6 py-4 space-y-4">
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
                          <CurrencyInputField
                            field={field}
                            label="Amount"
                            placeholder="0.00"
                            currency={groupCurrency}
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
                  </Tabs.Panel>

                  {/* Participants Tab */}
                  <Tabs.Panel id="participants" className="px-6 py-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Split Method
                      </label>

                      <div className="flex gap-2 mb-4">
                        <Button
                          type="button"
                          onClick={() => {
                            setSplitType('EQUAL');
                            setTimeout(() => recalculateEqualSplits(), 0);
                          }}
                          color={splitType === 'EQUAL' ? 'primary' : 'tertiary'}
                          size="sm"
                        >
                          Equal Split
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setSplitType('EXACT')}
                          color={splitType === 'EXACT' ? 'primary' : 'tertiary'}
                          size="sm"
                        >
                          Custom Split
                        </Button>
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
                                {formatCurrency(
                                  expectedAmountCents,
                                  groupCurrency
                                )}
                              </span>
                              {splitDifference > 1 && (
                                <span className="text-red-600 dark:text-red-400 ml-2">
                                  (Difference:{' '}
                                  {formatCurrency(
                                    splitDifference,
                                    groupCurrency
                                  )}
                                  )
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
                                    <div className="w-36">
                                      <InputGroup
                                        size="sm"
                                        leadingAddon={
                                          <InputGroup.Prefix size="sm">
                                            {groupCurrency}
                                          </InputGroup.Prefix>
                                        }
                                        inputMode="decimal"
                                        value={
                                          participant.shareCents > 0
                                            ? String(
                                                participant.shareCents / 100
                                              )
                                            : ''
                                        }
                                        onChange={(val: string) => {
                                          handleCustomSplitChange(
                                            member.user.id,
                                            val
                                          );
                                        }}
                                      >
                                        <InputBase
                                          key={`custom-split-${member.user.id}`}
                                          type="number"
                                          placeholder="0.00"
                                          size="sm"
                                        />
                                      </InputGroup>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Tabs.Panel>
                </Tabs>
              </UiForm>
            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

// Convenience wrapper components for easier usage
export function AddExpenseModal(props: Omit<CreateExpenseModalProps, 'mode'>) {
  return <ExpenseModal {...props} mode="create" />;
}

export function EditExpenseModal(props: Omit<EditExpenseModalProps, 'mode'>) {
  return <ExpenseModal {...props} mode="edit" />;
}
