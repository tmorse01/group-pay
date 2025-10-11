# Formatter Utilities

A comprehensive set of formatting utilities for the application.

## Usage

All formatters can be imported from the `utils` directory:

```typescript
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
  formatNumber,
  formatPercentage,
  pluralize,
  formatInitials,
  // ... and more
} from '../utils';
```

## Available Formatters

### Currency

#### `formatCurrency(amountCents: number, currency?: string): string`

Formats an amount in cents to a currency string.

```typescript
formatCurrency(1234, 'USD'); // "$12.34"
formatCurrency(5000, 'EUR'); // "€50.00"
```

#### `parseCurrency(currencyString: string): number`

Parses a currency string and returns the amount in cents.

```typescript
parseCurrency('$12.34'); // 1234
parseCurrency('€50.00'); // 5000
```

#### `getCurrencySymbol(currency?: string): string`

Returns the currency symbol for a given currency code.

```typescript
getCurrencySymbol('USD'); // "$"
getCurrencySymbol('EUR'); // "€"
```

### Dates

#### `formatDate(date: Date | string | null | undefined, formatStr: string, fallback?: string): string`

Safely formats a date with a given format string (using dayjs). Returns fallback if date is invalid.

**Common format strings:**

- `'MMM D, YYYY'` - "Oct 10, 2025"
- `'YYYY-MM-DD'` - "2025-10-10"
- `'MM/DD/YYYY'` - "10/10/2025"
- `'MMMM D, YYYY'` - "October 10, 2025"
- `'h:mm A'` - "3:45 PM"

See [dayjs format docs](https://day.js.org/docs/en/display/format) for more options.

```typescript
formatDate(new Date(), 'MMM D, YYYY'); // "Oct 10, 2025"
formatDate(null, 'YYYY-MM-DD'); // "N/A"
formatDate(undefined, 'YYYY-MM-DD', 'Unknown'); // "Unknown"
```

#### `formatRelativeDate(date: Date | string | null | undefined, fallback?: string): string`

Formats a date as a relative time string (e.g., "2 hours ago") using dayjs.

```typescript
formatRelativeDate(new Date()); // "a few seconds ago"
formatRelativeDate(new Date(Date.now() - 3600000)); // "an hour ago"
formatRelativeDate(null); // ""
```

### Numbers

#### `formatNumber(value: number, decimals?: number): string`

Formats a number with thousand separators.

```typescript
formatNumber(1234567); // "1,234,567"
formatNumber(1234.5678, 2); // "1,234.57"
```

#### `formatPercentage(value: number, decimals?: number): string`

Formats a decimal value as a percentage.

```typescript
formatPercentage(0.25); // "25%"
formatPercentage(0.3333, 2); // "33.33%"
```

### Text

#### `pluralize(count: number, singular: string, plural?: string): string`

Pluralizes a word based on count.

```typescript
pluralize(1, 'expense'); // "expense"
pluralize(5, 'expense'); // "expenses"
pluralize(1, 'person', 'people'); // "person"
pluralize(5, 'person', 'people'); // "people"
```

#### `truncate(str: string, maxLength: number, suffix?: string): string`

Truncates a string to a specified length with ellipsis.

```typescript
truncate('This is a long string', 10); // "This is..."
truncate('Short', 10); // "Short"
```

#### `formatInitials(name: string, maxInitials?: number): string`

Formats initials from a name.

```typescript
formatInitials('John Doe'); // "JD"
formatInitials('John Michael Doe', 2); // "JM"
formatInitials('John', 1); // "J"
formatInitials(''); // "?"
```

### File Utilities

#### `formatFileSize(bytes: number, decimals?: number): string`

Formats a file size in bytes to a human-readable format.

```typescript
formatFileSize(1024); // "1 KB"
formatFileSize(1536, 2); // "1.50 KB"
formatFileSize(1048576); // "1 MB"
```

### Phone Numbers

#### `formatPhoneNumber(phoneNumber: string): string`

Formats a phone number to a standard format.

```typescript
formatPhoneNumber('1234567890'); // "(123) 456-7890"
formatPhoneNumber('11234567890'); // "+1 (123) 456-7890"
```

## Examples

### Using in a Component

```typescript
import { formatCurrency, formatDate, pluralize } from '../utils';

function ExpenseCard({ expense }) {
  return (
    <div>
      <h3>{expense.description}</h3>
      <p>{formatCurrency(expense.amountCents, expense.currency)}</p>
      <p>{formatDate(expense.date, 'MMM D, YYYY')}</p>
      <p>
        Split with {expense.participants.length}{' '}
        {pluralize(expense.participants.length, 'person', 'people')}
      </p>
    </div>
  );
}
```

### Using Multiple Formatters

```typescript
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
  formatNumber,
} from '../utils';

function SummaryCard({ expenses }) {
  const total = expenses.reduce((sum, e) => sum + e.amountCents, 0);
  const latest = expenses[0]?.createdAt;

  return (
    <div>
      <p>Total: {formatCurrency(total, 'USD')}</p>
      <p>Count: {formatNumber(expenses.length)}</p>
      <p>Last updated: {formatRelativeDate(latest)}</p>
    </div>
  );
}
```
