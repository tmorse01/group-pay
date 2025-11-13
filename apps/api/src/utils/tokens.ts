import crypto from 'crypto';

/**
 * Generate a cryptographically secure verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}

/**
 * Calculate expiration date for verification token
 * @param hours Number of hours until expiration (default: 24)
 */
export function calculateTokenExpiration(hours: number = 24): Date {
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + hours);
  return expirationDate;
}

