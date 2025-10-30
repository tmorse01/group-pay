import { Link } from 'react-router-dom';
import { Button } from '../components/base/buttons/button';
import {
  Users01,
  CurrencyDollar,
  BarChart03,
  CheckCircle,
  Moon01,
  Phone01,
} from '@untitledui/icons';

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
                  <Users01 className="h-6 w-6 text-white" />
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
                  <CurrencyDollar className="h-6 w-6 text-white" />
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
                  <BarChart03 className="h-6 w-6 text-white" />
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
                  <CheckCircle className="h-6 w-6 text-white" />
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
                  <Moon01 className="h-6 w-6 text-white" />
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
                  <Phone01 className="h-6 w-6 text-white" />
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
