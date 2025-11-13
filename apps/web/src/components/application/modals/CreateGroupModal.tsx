import { useState } from 'react';
import { X } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { Select } from '@/components/base/select/select';
import type { SelectItemType } from '@/components/base/select/select';
import { Modal, ModalOverlay, Dialog } from './modal';
import { useCreateGroup } from '@/services/groups';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  currency: string;
}

const CURRENCIES: SelectItemType[] = [
  { id: 'USD', label: 'USD', supportingText: 'US Dollar ($)' },
  { id: 'EUR', label: 'EUR', supportingText: 'Euro (€)' },
  { id: 'GBP', label: 'GBP', supportingText: 'British Pound (£)' },
  { id: 'JPY', label: 'JPY', supportingText: 'Japanese Yen (¥)' },
  { id: 'CAD', label: 'CAD', supportingText: 'Canadian Dollar ($)' },
  { id: 'AUD', label: 'AUD', supportingText: 'Australian Dollar ($)' },
];

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    currency: 'USD',
  });
  const [nameError, setNameError] = useState<string | undefined>();
  const createGroupMutation = useCreateGroup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.name.trim()) {
      setNameError('Group name is required');
      return;
    } else if (formData.name.length > 100) {
      setNameError('Group name must be less than 100 characters');
      return;
    }

    setNameError(undefined);

    try {
      await createGroupMutation.mutateAsync({
        name: formData.name.trim(),
        currency: formData.currency,
      });

      // Reset form and close modal
      setFormData({ name: '', currency: 'USD' });
      setNameError(undefined);
      onClose();
    } catch (error) {
      console.error('Failed to create group:', error);
      // Handle error - could show a toast or error message
    }
  };

  const handleClose = () => {
    setFormData({ name: '', currency: 'USD' });
    setNameError(undefined);
    onClose();
  };

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={handleClose}>
      <Modal>
        <Dialog>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  Create New Group
                </h2>
                <Button
                  color="tertiary"
                  size="sm"
                  onClick={handleClose}
                  aria-label="Close"
                  iconLeading={X}
                />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <Input
                label="Group Name"
                value={formData.name}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, name: value }));
                  if (nameError) setNameError(undefined);
                }}
                placeholder="Enter group name..."
                isRequired
                isInvalid={!!nameError}
                hint={nameError}
              />

              <Select
                label="Currency"
                selectedKey={formData.currency}
                onSelectionChange={(key) => {
                  setFormData((prev) => ({
                    ...prev,
                    currency: key as string,
                  }));
                }}
                items={CURRENCIES}
                placeholder="Select currency"
              >
                {(item) => (
                  <Select.Item
                    id={item.id}
                    label={item.label}
                    supportingText={item.supportingText}
                  />
                )}
              </Select>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3">
              <Button
                color="tertiary"
                onClick={handleClose}
                isDisabled={createGroupMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onClick={handleSubmit}
                isLoading={createGroupMutation.isPending}
              >
                Create Group
              </Button>
            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
