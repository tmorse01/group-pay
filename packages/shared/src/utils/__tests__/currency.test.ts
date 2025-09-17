import { describe, it, expect } from 'vitest';
import {
  dollarsToCents,
  centsToDollars,
  formatCurrency,
  sumCents,
  validateSplitTotal,
} from '../currency';

describe('Currency Utilities', () => {
  describe('dollarsToCents', () => {
    it('should convert dollars to cents correctly', () => {
      expect(dollarsToCents(1.23)).toBe(123);
      expect(dollarsToCents(10.50)).toBe(1050);
      expect(dollarsToCents(0.01)).toBe(1);
      expect(dollarsToCents(0)).toBe(0);
    });

    it('should handle floating point precision issues', () => {
      expect(dollarsToCents(0.1 + 0.2)).toBe(30); // 0.1 + 0.2 = 0.30000000000000004
      expect(dollarsToCents(1.005)).toBe(100); // Should round properly (1.005 * 100 = 100.5, rounds to 100)
    });

    it('should handle large amounts', () => {
      expect(dollarsToCents(999.99)).toBe(99999);
      expect(dollarsToCents(1000.00)).toBe(100000);
    });
  });

  describe('centsToDollars', () => {
    it('should convert cents to dollars correctly', () => {
      expect(centsToDollars(123)).toBe(1.23);
      expect(centsToDollars(1050)).toBe(10.50);
      expect(centsToDollars(1)).toBe(0.01);
      expect(centsToDollars(0)).toBe(0);
    });

    it('should handle large amounts', () => {
      expect(centsToDollars(99999)).toBe(999.99);
      expect(centsToDollars(100000)).toBe(1000.00);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with default USD', () => {
      expect(formatCurrency(123)).toBe('$1.23');
      expect(formatCurrency(1050)).toBe('$10.50');
      expect(formatCurrency(1)).toBe('$0.01');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format currency with specified currency', () => {
      expect(formatCurrency(123, 'EUR')).toBe('€1.23');
      expect(formatCurrency(1050, 'GBP')).toBe('£10.50');
    });

    it('should handle large amounts', () => {
      expect(formatCurrency(123456)).toBe('$1,234.56');
      expect(formatCurrency(1000000)).toBe('$10,000.00');
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-123)).toBe('-$1.23');
      expect(formatCurrency(-1050)).toBe('-$10.50');
    });
  });

  describe('sumCents', () => {
    it('should sum an array of cent amounts', () => {
      expect(sumCents([100, 200, 300])).toBe(600);
      expect(sumCents([0, 0, 0])).toBe(0);
      expect(sumCents([1])).toBe(1);
    });

    it('should handle empty array', () => {
      expect(sumCents([])).toBe(0);
    });

    it('should handle negative amounts', () => {
      expect(sumCents([100, -50, 200])).toBe(250);
      expect(sumCents([-100, -200])).toBe(-300);
    });

    it('should handle large arrays', () => {
      const amounts = Array(1000).fill(100);
      expect(sumCents(amounts)).toBe(100000);
    });
  });

  describe('validateSplitTotal', () => {
    it('should return true when split amounts equal total', () => {
      expect(validateSplitTotal(1000, [500, 300, 200])).toBe(true);
      expect(validateSplitTotal(100, [100])).toBe(true);
      expect(validateSplitTotal(0, [])).toBe(true);
    });

    it('should return false when split amounts do not equal total', () => {
      expect(validateSplitTotal(1000, [500, 300, 100])).toBe(false);
      expect(validateSplitTotal(100, [50, 30])).toBe(false);
      expect(validateSplitTotal(1000, [600, 600])).toBe(false);
    });

    it('should handle negative amounts', () => {
      expect(validateSplitTotal(-100, [-50, -50])).toBe(true);
      expect(validateSplitTotal(100, [150, -50])).toBe(true);
      expect(validateSplitTotal(100, [200, -50])).toBe(false);
    });
  });

  describe('round-trip conversions', () => {
    it('should maintain precision in round-trip conversions', () => {
      const originalDollars = 123.45;
      const cents = dollarsToCents(originalDollars);
      const backToDollars = centsToDollars(cents);
      expect(backToDollars).toBe(originalDollars);
    });

    it('should handle edge cases in round-trip conversions', () => {
      const testValues = [0, 0.01, 1, 10.50, 999.99];
      
      for (const dollars of testValues) {
        const cents = dollarsToCents(dollars);
        const backToDollars = centsToDollars(cents);
        expect(backToDollars).toBe(dollars);
      }
    });
  });
});