export function formatCurrency(amountCents: number, currency = 'USD'): string {
  const amount = amountCents / 100;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function parseCurrency(currencyString: string): number {
  // Remove currency symbols and convert to cents
  const numericValue = parseFloat(currencyString.replace(/[^0-9.-]/g, ''));
  return Math.round(numericValue * 100);
}

export function getCurrencySymbol(currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(0)
    .replace(/\d/g, '')
    .trim();
}
