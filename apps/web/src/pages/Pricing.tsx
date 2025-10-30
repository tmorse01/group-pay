import { Link } from 'react-router-dom';
import { Button } from '../components/base/buttons/button';
import { CheckCircle, XClose } from '@untitledui/icons';

type PricingTier = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  color: 'primary' | 'secondary';
};

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for personal use and small groups',
    features: [
      'Up to 3 active groups',
      'Up to 10 members per group',
      'Basic expense tracking',
      'Equal split only',
      'Real-time balance updates',
      'Mobile responsive design',
    ],
    cta: 'Get Started',
    highlighted: false,
    color: 'secondary',
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: 'per month',
    description: 'For power users and larger groups',
    features: [
      'Unlimited groups',
      'Unlimited members per group',
      'Advanced expense tracking',
      'All split types (equal, percentage, share, exact)',
      'Expense categories & filtering',
      'Receipt upload & storage',
      'Export data (CSV, PDF)',
      'Priority email support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
    color: 'primary',
  },
  {
    name: 'Team',
    price: '$29.99',
    period: 'per month',
    description: 'Best for organizations and businesses',
    features: [
      'Everything in Pro',
      'Advanced debt netting',
      'Payment integration (Venmo, PayPal, Stripe)',
      'Multi-currency support',
      'Budget tracking & alerts',
      'Activity feed & audit logs',
      'Custom branding',
      'API access',
      'Dedicated account manager',
      '24/7 premium support',
    ],
    cta: 'Contact Sales',
    highlighted: false,
    color: 'secondary',
  },
];

export function Pricing() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-6xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-6 text-lg leading-8 text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Choose the perfect plan for your needs. All plans include a 14-day
              free trial with no credit card required.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl ${
                tier.highlighted
                  ? 'bg-brand-600 ring-2 ring-brand-600'
                  : 'bg-white dark:bg-neutral-800 ring-1 ring-neutral-200 dark:ring-neutral-700'
              } p-8 shadow-lg`}
            >
              {tier.highlighted && (
                <div className="absolute top-0 right-6 -translate-y-1/2">
                  <span className="inline-flex rounded-full bg-brand-500 px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="flex flex-col h-full">
                <div className="flex-grow">
                  <h3
                    className={`text-2xl font-bold ${
                      tier.highlighted
                        ? 'text-white'
                        : 'text-neutral-900 dark:text-neutral-50'
                    }`}
                  >
                    {tier.name}
                  </h3>
                  <p
                    className={`mt-2 text-sm ${
                      tier.highlighted
                        ? 'text-brand-100'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {tier.description}
                  </p>
                  <div className="mt-6 flex items-baseline gap-x-2">
                    <span
                      className={`text-5xl font-bold tracking-tight ${
                        tier.highlighted
                          ? 'text-white'
                          : 'text-neutral-900 dark:text-neutral-50'
                      }`}
                    >
                      {tier.price}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        tier.highlighted
                          ? 'text-brand-100'
                          : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {tier.period}
                    </span>
                  </div>
                  <ul className="mt-8 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <CheckCircle
                          className={`h-6 w-6 flex-none ${
                            tier.highlighted
                              ? 'text-brand-200'
                              : 'text-brand-600 dark:text-brand-400'
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            tier.highlighted
                              ? 'text-white'
                              : 'text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8">
                  <Link to="/login">
                    <Button
                      color={tier.color}
                      size="lg"
                      className={`w-full ${
                        tier.highlighted
                          ? 'bg-white text-brand-600 hover:bg-neutral-50'
                          : ''
                      }`}
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-neutral-800 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              Compare Plans
            </h2>
            <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
              See all features side by side
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="py-4 px-6 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    Feature
                  </th>
                  <th className="py-4 px-6 text-center text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    Free
                  </th>
                  <th className="py-4 px-6 text-center text-sm font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20">
                    Pro
                  </th>
                  <th className="py-4 px-6 text-center text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    Team
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                <tr>
                  <td className="py-4 px-6 text-sm text-neutral-600 dark:text-neutral-400">
                    Active groups
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50">
                    3
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50 bg-brand-50 dark:bg-brand-900/20">
                    Unlimited
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50">
                    Unlimited
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm text-neutral-600 dark:text-neutral-400">
                    Members per group
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50">
                    10
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50 bg-brand-50 dark:bg-brand-900/20">
                    Unlimited
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50">
                    Unlimited
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm text-neutral-600 dark:text-neutral-400">
                    Split types
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50">
                    Equal only
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50 bg-brand-50 dark:bg-brand-900/20">
                    All types
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50">
                    All types
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm text-neutral-600 dark:text-neutral-400">
                    Receipt upload
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50">
                    <XClose className="h-5 w-5 text-neutral-400 dark:text-neutral-600 mx-auto" aria-label="Not available" />
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50 bg-brand-50 dark:bg-brand-900/20">
                    <CheckCircle className="h-5 w-5 text-brand-600 dark:text-brand-400 mx-auto" aria-label="Available" />
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50">
                    <CheckCircle className="h-5 w-5 text-brand-600 dark:text-brand-400 mx-auto" aria-label="Available" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm text-neutral-600 dark:text-neutral-400">
                    Export data
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50">
                    <XClose className="h-5 w-5 text-neutral-400 dark:text-neutral-600 mx-auto" aria-label="Not available" />
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50 bg-brand-50 dark:bg-brand-900/20">
                    <CheckCircle className="h-5 w-5 text-brand-600 dark:text-brand-400 mx-auto" aria-label="Available" />
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50">
                    <CheckCircle className="h-5 w-5 text-brand-600 dark:text-brand-400 mx-auto" aria-label="Available" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm text-neutral-600 dark:text-neutral-400">
                    Payment integration
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50">
                    <XClose className="h-5 w-5 text-neutral-400 dark:text-neutral-600 mx-auto" aria-label="Not available" />
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50 bg-brand-50 dark:bg-brand-900/20">
                    <XClose className="h-5 w-5 text-neutral-400 dark:text-neutral-600 mx-auto" aria-label="Not available" />
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50">
                    <CheckCircle className="h-5 w-5 text-brand-600 dark:text-brand-400 mx-auto" aria-label="Available" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm text-neutral-600 dark:text-neutral-400">
                    Multi-currency
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50">
                    <XClose className="h-5 w-5 text-neutral-400 dark:text-neutral-600 mx-auto" aria-label="Not available" />
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50 bg-brand-50 dark:bg-brand-900/20">
                    <XClose className="h-5 w-5 text-neutral-400 dark:text-neutral-600 mx-auto" aria-label="Not available" />
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50">
                    <CheckCircle className="h-5 w-5 text-brand-600 dark:text-brand-400 mx-auto" aria-label="Available" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm text-neutral-600 dark:text-neutral-400">
                    Support
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50">
                    Community
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50 bg-brand-50 dark:bg-brand-900/20">
                    Email
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-neutral-900 dark:text-neutral-50">
                    24/7 Premium
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Frequently Asked Questions
          </h2>
        </div>
        <dl className="space-y-8">
          <div>
            <dt className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Can I switch plans at any time?
            </dt>
            <dd className="mt-2 text-base text-neutral-600 dark:text-neutral-400">
              Yes! You can upgrade or downgrade your plan at any time. Changes
              will be prorated and reflected in your next billing cycle.
            </dd>
          </div>
          <div>
            <dt className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              What payment methods do you accept?
            </dt>
            <dd className="mt-2 text-base text-neutral-600 dark:text-neutral-400">
              We accept all major credit cards (Visa, Mastercard, American
              Express) and PayPal for subscription payments.
            </dd>
          </div>
          <div>
            <dt className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Is there a discount for annual billing?
            </dt>
            <dd className="mt-2 text-base text-neutral-600 dark:text-neutral-400">
              Yes! Annual subscriptions receive a 20% discount. Contact us for
              more details.
            </dd>
          </div>
          <div>
            <dt className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              What happens to my data if I cancel?
            </dt>
            <dd className="mt-2 text-base text-neutral-600 dark:text-neutral-400">
              Your data is retained for 30 days after cancellation, giving you
              time to export it or reactivate your account. After 30 days, all
              data is permanently deleted.
            </dd>
          </div>
        </dl>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-900 dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <p className="text-center text-sm leading-5 text-neutral-400">
            &copy; {new Date().getFullYear()} GroupPay. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
