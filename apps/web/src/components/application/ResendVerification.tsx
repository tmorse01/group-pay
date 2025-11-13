import { useState } from 'react';
import { useResendVerification } from '@/services/verification';
import { Button } from '@/components/base/buttons/button';

interface ResendVerificationProps {
  onSuccess?: () => void;
}

export function ResendVerification({ onSuccess }: ResendVerificationProps) {
  const [email, setEmail] = useState('');
  const resendMutation = useResendVerification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resendMutation.mutate(
      { email: email || undefined },
      {
        onSuccess: () => {
          if (onSuccess) {
            onSuccess();
          }
        },
      }
    );
  };

  if (resendMutation.isSuccess) {
    return (
      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm text-green-800 dark:text-green-200">
            Verification email sent! Please check your inbox.
          </span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional if logged in)"
          className="flex-1 px-3 py-2 border rounded-md text-sm"
          disabled={resendMutation.isPending}
        />
        <Button
          type="submit"
          size="sm"
          disabled={resendMutation.isPending}
        >
          {resendMutation.isPending ? 'Sending...' : 'Send'}
        </Button>
      </div>
      {resendMutation.isError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200">
            {resendMutation.error instanceof Error
              ? resendMutation.error.message
              : 'Failed to send verification email'}
          </p>
        </div>
      )}
    </form>
  );
}

