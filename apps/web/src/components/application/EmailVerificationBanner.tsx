import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/base/buttons/button';
import { ResendVerification } from './ResendVerification';
import { useState } from 'react';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [showResend, setShowResend] = useState(false);

  if (!user || user.emailVerified) {
    return null;
  }

  if (showResend) {
    return (
      <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold mb-1 text-neutral-900 dark:text-neutral-50">Verify Your Email</h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              Please verify your email address to access all features.
            </p>
            <ResendVerification onSuccess={() => setShowResend(false)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-semibold mb-1 text-neutral-900 dark:text-neutral-50">Verify Your Email</h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Please check your email ({user.email}) and click the verification link.
            Didn't receive it?
          </p>
        </div>
        <Button
          color="secondary"
          size="sm"
          onClick={() => setShowResend(true)}
          className="ml-4"
        >
          Resend Email
        </Button>
      </div>
    </div>
  );
}

