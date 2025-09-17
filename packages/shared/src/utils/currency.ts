/**
 * Convert dollars to cents (avoiding floating point precision issues)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars for display
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format cents as currency string
 */
export function formatCurrency(cents: number, currency = 'USD'): string {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars);
}

/**
 * Sum an array of cent amounts safely
 */
export function sumCents(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}

/**
 * Validate that split amounts equal the total expense amount
 */
export function validateSplitTotal(
  totalCents: number,
  splitCents: number[]
): boolean {
  const splitSum = sumCents(splitCents);
  return splitSum === totalCents;
}