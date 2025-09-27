import { useState } from 'react';
import { Button } from '../../base/buttons/button';
import { Modal, ModalOverlay, Dialog } from './modal';
import { useCreateGroup } from '../../../services/groups';
import { cx } from '../../../utils/cx';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  currency: string;
}

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
];

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    currency: 'USD',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const createGroupMutation = useCreateGroup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: Partial<FormData> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Group name must be less than 100 characters';
    }

    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createGroupMutation.mutateAsync({
        name: formData.name.trim(),
        currency: formData.currency,
      });

      // Reset form and close modal
      setFormData({ name: '', currency: 'USD' });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to create group:', error);
      // Handle error - could show a toast or error message
    }
  };

  const handleClose = () => {
    setFormData({ name: '', currency: 'USD' });
    setErrors({});
    onClose();
  };

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={handleClose}>
      <Modal>
        <Dialog>
          <div className="bg-white dark-mode:bg-neutral-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 dark-mode:border-neutral-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-neutral-900 dark-mode:text-neutral-50">
                  Create New Group
                </h2>
                <button
                  onClick={handleClose}
                  className="text-neutral-400 hover:text-neutral-600 dark-mode:hover:text-neutral-300 transition-colors"
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
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark-mode:text-neutral-300 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    if (errors.name)
                      setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Enter group name..."
                  className={cx(
                    'w-full px-3 py-2 border rounded-lg bg-white dark-mode:bg-neutral-900 text-neutral-900 dark-mode:text-neutral-50',
                    'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors',
                    'placeholder-neutral-500 dark-mode:placeholder-neutral-400',
                    errors.name
                      ? 'border-red-300 dark-mode:border-red-600'
                      : 'border-neutral-300 dark-mode:border-neutral-600'
                  )}
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark-mode:text-red-400">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark-mode:text-neutral-300 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      currency: e.target.value,
                    }));
                    if (errors.currency)
                      setErrors((prev) => ({ ...prev, currency: undefined }));
                  }}
                  className={cx(
                    'w-full px-3 py-2 border rounded-lg bg-white dark-mode:bg-neutral-900 text-neutral-900 dark-mode:text-neutral-50',
                    'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors',
                    errors.currency
                      ? 'border-red-300 dark-mode:border-red-600'
                      : 'border-neutral-300 dark-mode:border-neutral-600'
                  )}
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
                {errors.currency && (
                  <p className="mt-1 text-sm text-red-600 dark-mode:text-red-400">
                    {errors.currency}
                  </p>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 dark-mode:border-neutral-700 flex justify-end gap-3">
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
