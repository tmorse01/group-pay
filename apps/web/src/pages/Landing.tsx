import { Link } from 'react-router-dom';
import { Button } from '../components/base/buttons/button';

export function Landing() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-6xl">
              Split Expenses with Ease
            </h1>
            <p className="mt-6 text-lg leading-8 text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              GroupPay makes it simple to track shared expenses, split bills
              fairly, and settle up with friends, roommates, and travel
              companions.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/login">
                <Button color="primary" size="lg">
                  Get Started
                </Button>
              </Link>
              <Link to="/login">
                <Button color="secondary" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-brand-600">
              Everything you need
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-4xl">
              Simplify group expense management
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-7xl sm:mt-20 lg:mt-24">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col items-start">
                <div className="rounded-lg bg-brand-600 p-2 ring-1 ring-brand-600">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  Group Management
                </h3>
                <p className="mt-2 text-base text-neutral-600 dark:text-neutral-400">
                  Create groups for trips, roommates, events, or any shared
                  expenses. Invite members easily with shareable links.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-start">
                <div className="rounded-lg bg-brand-600 p-2 ring-1 ring-brand-600">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  Flexible Splitting
                </h3>
                <p className="mt-2 text-base text-neutral-600 dark:text-neutral-400">
                  Split expenses equally, by percentage, by shares, or exact
                  amounts. Perfect for any situation.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-start">
                <div className="rounded-lg bg-brand-600 p-2 ring-1 ring-brand-600">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                    />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  Real-Time Balances
                </h3>
                <p className="mt-2 text-base text-neutral-600 dark:text-neutral-400">
                  Track who owes what in real-time. See balances automatically
                  calculated and updated with each expense.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col items-start">
                <div className="rounded-lg bg-brand-600 p-2 ring-1 ring-brand-600">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  Settlement Tracking
                </h3>
                <p className="mt-2 text-base text-neutral-600 dark:text-neutral-400">
                  Mark when members settle their debts. Keep a clear history of
                  all payments and settlements.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="flex flex-col items-start">
                <div className="rounded-lg bg-brand-600 p-2 ring-1 ring-brand-600">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                    />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  Dark Mode
                </h3>
                <p className="mt-2 text-base text-neutral-600 dark:text-neutral-400">
                  Built-in dark mode support with automatic system preference
                  detection for comfortable viewing anytime.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="flex flex-col items-start">
                <div className="rounded-lg bg-brand-600 p-2 ring-1 ring-brand-600">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                    />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  Mobile Friendly
                </h3>
                <p className="mt-2 text-base text-neutral-600 dark:text-neutral-400">
                  Fully responsive design that works beautifully on phones,
                  tablets, and desktops.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-brand-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-brand-100">
              Join thousands of users who trust GroupPay to manage their shared
              expenses. Sign up now and start splitting bills the smart way.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/login">
                <Button
                  color="secondary"
                  size="lg"
                  className="bg-white text-brand-600 hover:bg-neutral-50"
                >
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-900">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <p className="text-center text-sm leading-5 text-neutral-400">
            &copy; {new Date().getFullYear()} GroupPay. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
