import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVerifyEmail } from '@/services/verification';
import { Button } from '@/components/base/buttons/button';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const verifyEmailMutation = useVerifyEmail();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No verification token provided');
      return;
    }

    // Automatically verify email on mount
    verifyEmailMutation.mutate(
      { token },
      {
        onSuccess: () => {
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        },
        onError: (err: any) => {
          setError(
            err?.message || 'Failed to verify email. The token may be invalid or expired.'
          );
        },
      }
    );
  }, [token, navigate, verifyEmailMutation]);

  if (verifyEmailMutation.isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md p-8 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 dark:border-brand-400 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-50">Verifying Email</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Please wait while we verify your email address...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verifyEmailMutation.isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md p-8 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-green-500"
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
            </div>
            <h1 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-50">Email Verified!</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Your email has been successfully verified. Redirecting to dashboard...
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full" color="primary">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-50">Verification Failed</h1>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            {!token
              ? 'No verification token was provided in the URL.'
              : 'The verification link may be invalid or expired. Please request a new verification email.'}
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => navigate('/login')}
              color="secondary"
              className="w-full"
            >
              Go to Login
            </Button>
            <Button
              onClick={() => navigate('/settings')}
              color="primary"
              className="w-full"
            >
              Request New Verification Email
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

