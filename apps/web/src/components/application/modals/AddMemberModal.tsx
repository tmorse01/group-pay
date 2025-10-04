import { Button } from '../../base/buttons/button';
import { Modal, ModalOverlay, Dialog } from './modal';
import { useAddMember } from '../../../services/groups';
import { useAppForm, UiForm, InputField } from '../../../forms';

type AddMemberFormValues = {
  email: string;
};

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

export function AddMemberModal({
  isOpen,
  onClose,
  groupId,
  groupName,
}: AddMemberModalProps) {
  const addMemberMutation = useAddMember();

  const { form } = useAppForm<AddMemberFormValues>({
    defaultValues: {
      email: '',
    },
    onSubmit: async (values) => {
      try {
        await addMemberMutation.mutateAsync({
          groupId,
          data: { email: values.email.trim().toLowerCase() },
        });

        handleClose();
      } catch (error) {
        console.error('Failed to add member:', error);
        // Error will be handled by the mutation's error state
      }
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={handleClose}>
      <Modal>
        <Dialog>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Add Member to {groupName}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Enter the email address of the person you want to add to this
                group.
              </p>
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
                    <Button color="tertiary" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      type="submit"
                      isLoading={addMemberMutation.isPending}
                      isDisabled={!form.state.isValid}
                    >
                      Add Member
                    </Button>
                  </div>
                }
              >
                <form.Field
                  name="email"
                  validators={{
                    onBlur: ({ value }) => {
                      if (!value) return 'Email is required';
                      if (!/\S+@\S+\.\S+/.test(value))
                        return 'Please enter a valid email address';
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <InputField
                      field={field}
                      label="Email Address"
                      type="email"
                      placeholder="user@example.com"
                      required
                      description="The person must have an account with this email address."
                    />
                  )}
                </form.Field>

                {/* Error Display */}
                {addMemberMutation.error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {addMemberMutation.error instanceof Error
                        ? addMemberMutation.error.message
                        : 'Failed to add member. Please try again.'}
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {addMemberMutation.isSuccess && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Member added successfully!
                    </p>
                  </div>
                )}
              </UiForm>
            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
