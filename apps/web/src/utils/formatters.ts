import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

/**
 * Format an amount in cents to a currency string
 * @param amountCents - Amount in cents
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amountCents: number,
  currency: string = 'USD'
): string {
  const amount = amountCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Safely format a date with a given format string
 * @param date - Date object, string, or null/undefined
 * @param formatStr - Format string for dayjs format function (e.g., 'MMM D, YYYY', 'YYYY-MM-DD')
 * @param fallback - Fallback string if date is invalid (default: 'N/A')
 * @returns Formatted date string or fallback
 */
export function formatDate(
  date: Date | string | null | undefined,
  formatStr: string,
  fallback: string = 'N/A'
): string {
  if (!date) return fallback;
  try {
    const dayjsDate = dayjs(date);
    if (!dayjsDate.isValid()) return fallback;
    return dayjsDate.format(formatStr);
  } catch {
    return fallback;
  }
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago")
 * @param date - Date object, string, or null/undefined
 * @param fallback - Fallback string if date is invalid (default: '')
 * @returns Relative time string or fallback
 */
export function formatRelativeDate(
  date: Date | string | null | undefined,
  fallback: string = ''
): string {
  if (!date) return fallback;
  try {
    const dayjsDate = dayjs(date);
    if (!dayjsDate.isValid()) return fallback;
    return dayjsDate.fromNow();
  } catch {
    return fallback;
  }
}

/**
 * Format a phone number to a standard format
 * @param phoneNumber - Raw phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Format with country code +X (XXX) XXX-XXXX
  if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Return as-is if it doesn't match expected formats
  return phoneNumber;
}

/**
 * Format a number with thousand separators
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a percentage value
 * @param value - Decimal value (e.g., 0.25 for 25%)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Pluralize a word based on count
 * @param count - Number to check
 * @param singular - Singular form of the word
 * @param plural - Plural form of the word (optional, defaults to singular + 's')
 * @returns Pluralized word
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  return count === 1 ? singular : plural || `${singular}s`;
}

/**
 * Format a file size in bytes to a human-readable format
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Truncate a string to a specified length with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated string
 */
export function truncate(
  str: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Format initials from a name
 * @param name - Full name
 * @param maxInitials - Maximum number of initials (default: 2)
 * @returns Formatted initials
 */
export function formatInitials(name: string, maxInitials: number = 2): string {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/);
  const initials = parts
    .slice(0, maxInitials)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || '?';
}
