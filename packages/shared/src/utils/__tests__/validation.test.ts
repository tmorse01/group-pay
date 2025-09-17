import { describe, it, expect } from 'vitest';
import { validateAndFixSplit } from '../validation';
import type { CreateExpenseParticipantDto } from '../../schemas/expense';

describe('Split Validation', () => {
  describe('validateAndFixSplit', () => {
    it('should validate equal splits as always valid', () => {
      const participants: CreateExpenseParticipantDto[] = [
        { userId: 'user1' },
        { userId: 'user2' },
        { userId: 'user3' },
      ];

      const result = validateAndFixSplit(3000, 'EQUAL', participants);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should require at least one participant', () => {
      const result = validateAndFixSplit(1000, 'EQUAL', []);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one participant is required');
    });

    it('should validate percentage splits', () => {
      const validParticipants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', sharePercentage: 50 },
        { userId: 'user2', sharePercentage: 30 },
        { userId: 'user3', sharePercentage: 20 },
      ];

      const result = validateAndFixSplit(10000, 'PERCENTAGE', validParticipants);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid percentage splits', () => {
      const invalidParticipants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', sharePercentage: 60 },
        { userId: 'user2', sharePercentage: 30 },
        { userId: 'user3', sharePercentage: 20 },
      ];

      const result = validateAndFixSplit(10000, 'PERCENTAGE', invalidParticipants);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Percentages sum to 110%, must equal 100%');
    });

    it('should auto-fix percentage splits when requested', () => {
      const invalidParticipants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', sharePercentage: 60 },
        { userId: 'user2', sharePercentage: 30 },
        { userId: 'user3', sharePercentage: 20 },
      ];

      const result = validateAndFixSplit(10000, 'PERCENTAGE', invalidParticipants, true);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Percentages auto-adjusted to sum to 100%');
      expect(result.adjustedParticipants).toBeDefined();

      // Check that adjusted percentages sum to 100
      const totalAdjusted = result.adjustedParticipants!.reduce(
        (sum, p) => sum + (p.sharePercentage || 0),
        0
      );
      expect(Math.abs(totalAdjusted - 100)).toBeLessThan(0.01);
    });

    it('should validate share splits', () => {
      const validParticipants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', shareCount: 2 },
        { userId: 'user2', shareCount: 1 },
        { userId: 'user3', shareCount: 3 },
      ];

      const result = validateAndFixSplit(6000, 'SHARES', validParticipants);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid share counts', () => {
      const invalidParticipants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', shareCount: 2 },
        { userId: 'user2', shareCount: 0 },
        { userId: 'user3', shareCount: -1 },
      ];

      const result = validateAndFixSplit(6000, 'SHARES', invalidParticipants);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('All participants must have a positive share count');
    });

    it('should auto-fix invalid share counts when requested', () => {
      const invalidParticipants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', shareCount: 2 },
        { userId: 'user2', shareCount: 0 },
        { userId: 'user3' }, // Missing shareCount
      ];

      const result = validateAndFixSplit(6000, 'SHARES', invalidParticipants, true);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Invalid share counts set to 1');
      expect(result.adjustedParticipants).toBeDefined();

      // Check that all participants have valid share counts
      result.adjustedParticipants!.forEach(p => {
        expect(p.shareCount).toBeGreaterThan(0);
      });
    });

    it('should validate exact splits', () => {
      const validParticipants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', shareCents: 4000 },
        { userId: 'user2', shareCents: 3000 },
        { userId: 'user3', shareCents: 3000 },
      ];

      const result = validateAndFixSplit(10000, 'EXACT', validParticipants);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject exact splits that don\'t sum to total', () => {
      const invalidParticipants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', shareCents: 4000 },
        { userId: 'user2', shareCents: 3000 },
        { userId: 'user3', shareCents: 2000 },
      ];

      const result = validateAndFixSplit(10000, 'EXACT', invalidParticipants);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Split amounts sum to 90, must equal 100');
    });

    it('should auto-fix exact splits when requested', () => {
      const invalidParticipants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', shareCents: 4000 },
        { userId: 'user2', shareCents: 3000 },
        { userId: 'user3', shareCents: 2000 },
      ];

      const result = validateAndFixSplit(10000, 'EXACT', invalidParticipants, true);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Split amounts auto-adjusted to match total');
      expect(result.adjustedParticipants).toBeDefined();

      // Check that adjusted amounts sum to total
      const totalAdjusted = result.adjustedParticipants!.reduce(
        (sum, p) => sum + (p.shareCents || 0),
        0
      );
      expect(totalAdjusted).toBe(10000);
    });

    it('should handle unknown split types', () => {
      const participants: CreateExpenseParticipantDto[] = [
        { userId: 'user1' },
      ];

      // @ts-expect-error Testing invalid split type
      const result = validateAndFixSplit(1000, 'INVALID', participants);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unknown split type: INVALID');
    });

    it('should handle edge case with very small percentage differences', () => {
      const participants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', sharePercentage: 33.33 },
        { userId: 'user2', sharePercentage: 33.33 },
        { userId: 'user3', sharePercentage: 33.34 },
      ];

      const result = validateAndFixSplit(9999, 'PERCENTAGE', participants);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});