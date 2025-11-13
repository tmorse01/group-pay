import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile } from '@/services/users';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/base/input/input';
import { Button } from '@/components/base/buttons/button';
import { Avatar } from '@/components/base/avatar/avatar';
import { ResendVerification } from '@/components/application/ResendVerification';
import { cx } from '@/utils/cx';
import { User01, Moon01, Sun, Monitor01, Mail01 } from '@untitledui/icons';

export function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const updateProfile = useUpdateProfile();

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    photoUrl: user?.photoUrl || '',
    venmoHandle: user?.venmoHandle || '',
    paypalLink: user?.paypalLink || '',
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfile.mutateAsync({
        name: formData.name || undefined,
        photoUrl: formData.photoUrl || null,
        venmoHandle: formData.venmoHandle || null,
        paypalLink: formData.paypalLink || null,
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleReset = () => {
    setFormData({
      name: user?.name || '',
      photoUrl: user?.photoUrl || '',
      venmoHandle: user?.venmoHandle || '',
      paypalLink: user?.paypalLink || '',
    });
    setHasChanges(false);
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon01 },
    { value: 'system', label: 'System', icon: Monitor01 },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          Settings
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <User01 className="size-5 text-neutral-900 dark:text-neutral-50" />
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Profile
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Update your personal information
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <Avatar
              src={formData.photoUrl}
              alt={formData.name}
              size="lg"
              className="ring-2 ring-neutral-200 dark:ring-neutral-700"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                Profile Photo
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Enter a URL to your profile photo
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(value) => handleInputChange('name', value)}
                isRequired
              />

              <Input
                label="Email"
                type="email"
                value={user.email}
                isDisabled
                hint="Email cannot be changed"
              />
            </div>

            <Input
              label="Photo URL"
              placeholder="https://example.com/photo.jpg"
              type="url"
              value={formData.photoUrl}
              onChange={(value) => handleInputChange('photoUrl', value)}
              hint="Enter a URL to your profile photo"
            />

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
                Payment Information
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                Add your payment handles to make it easier for others to pay you
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Venmo Handle"
                  placeholder="@username"
                  value={formData.venmoHandle}
                  onChange={(value) => handleInputChange('venmoHandle', value)}
                  hint="Your Venmo username"
                />

                <Input
                  label="PayPal Link"
                  placeholder="https://paypal.me/username"
                  type="url"
                  value={formData.paypalLink}
                  onChange={(value) => handleInputChange('paypalLink', value)}
                  hint="Your PayPal.me link"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          {hasChanges && (
            <div className="flex items-center gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <Button
                type="submit"
                color="primary"
                isLoading={updateProfile.isPending}
              >
                Save Changes
              </Button>
              <Button
                type="button"
                color="secondary"
                onClick={handleReset}
                isDisabled={updateProfile.isPending}
              >
                Cancel
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Appearance Section */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <Moon01 className="size-5 text-neutral-900 dark:text-neutral-50" />
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Appearance
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Customize how GroupPay looks on your device
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-3 block">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = theme === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setTheme(option.value as 'light' | 'dark' | 'system')
                      }
                      className={cx(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                        'hover:border-brand-300 dark:hover:border-brand-500',
                        isActive
                          ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
                      )}
                    >
                      <Icon
                        className={cx(
                          'size-6',
                          isActive
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-neutral-600 dark:text-neutral-400'
                        )}
                      />
                      <span
                        className={cx(
                          'text-sm font-medium',
                          isActive
                            ? 'text-brand-700 dark:text-brand-300'
                            : 'text-neutral-900 dark:text-neutral-50'
                        )}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-3">
                System theme will automatically switch between light and dark
                based on your device settings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Verification Section */}
      {!user.emailVerified && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <Mail01 className="size-5 text-neutral-900 dark:text-neutral-50" />
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  Email Verification
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Verify your email address to access all features
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <p className="text-sm text-neutral-900 dark:text-neutral-50">
                  Your email address ({user.email}) is not verified
                </p>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Please check your email and click the verification link, or
                request a new verification email below.
              </p>
              <ResendVerification />
            </div>
          </div>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Account Information
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center py-2">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                User ID
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {user.id}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center py-2 border-t border-neutral-200 dark:border-neutral-700">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                Email
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {user.email}
                </p>
                {user.emailVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                    <svg
                      className="h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {user.emailVerified && user.emailVerifiedAt && (
            <div className="flex justify-between items-center py-2 border-t border-neutral-200 dark:border-neutral-700">
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  Verified At
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {new Date(user.emailVerifiedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
