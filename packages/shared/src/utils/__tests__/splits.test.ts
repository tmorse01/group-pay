import { describe, it, expect } from 'vitest';
import {
  calculateEqualSplit,
  calculatePercentageSplit,
  calculateShareSplit,
  calculateSplit,
} from '../splits';
import type { CreateExpenseParticipantDto } from '../../schemas/expense';

describe('Split Calculations', () => {
  describe('calculateEqualSplit', () => {
    it('should divide amount equally with no remainder', () => {
      const result = calculateEqualSplit(1200, ['user1', 'user2', 'user3']);
      expect(result).toEqual([
        { userId: 'user1', shareCents: 400 },
        { userId: 'user2', shareCents: 400 },
        { userId: 'user3', shareCents: 400 },
      ]);
    });

    it('should handle remainder by distributing extra cents to first participants', () => {
      const result = calculateEqualSplit(1000, ['user1', 'user2', 'user3']);
      expect(result).toEqual([
        { userId: 'user1', shareCents: 334 },
        { userId: 'user2', shareCents: 333 },
        { userId: 'user3', shareCents: 333 },
      ]);
      
      // Verify total equals original amount
      const total = result.reduce((sum, r) => sum + r.shareCents, 0);
      expect(total).toBe(1000);
    });

    it('should handle single participant', () => {
      const result = calculateEqualSplit(500, ['user1']);
      expect(result).toEqual([
        { userId: 'user1', shareCents: 500 },
      ]);
    });
  });

  describe('calculatePercentageSplit', () => {
    it('should calculate percentage splits correctly', () => {
      const participants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', sharePercentage: 50 },
        { userId: 'user2', sharePercentage: 30 },
        { userId: 'user3', sharePercentage: 20 },
      ];
      
      const result = calculatePercentageSplit(1000, participants);
      expect(result).toEqual([
        { userId: 'user1', shareCents: 500 },
        { userId: 'user2', shareCents: 300 },
        { userId: 'user3', shareCents: 200 },
      ]);
    });

    it('should handle rounding by giving remainder to last participant', () => {
      const participants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', sharePercentage: 33.33 },
        { userId: 'user2', sharePercentage: 33.33 },
        { userId: 'user3', sharePercentage: 33.34 },
      ];
      
      const result = calculatePercentageSplit(1000, participants);
      
      // Verify total equals original amount
      const total = result.reduce((sum, r) => sum + r.shareCents, 0);
      expect(total).toBe(1000);
      
      // Last participant should get the remainder
      expect(result[2].shareCents).toBeGreaterThanOrEqual(result[0].shareCents);
    });

    it('should throw error if percentages do not sum to 100', () => {
      const participants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', sharePercentage: 50 },
        { userId: 'user2', sharePercentage: 30 },
      ];
      
      expect(() => calculatePercentageSplit(1000, participants))
        .toThrow('Percentages must sum to 100%');
    });
  });

  describe('calculateShareSplit', () => {
    it('should calculate share-based splits correctly', () => {
      const participants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', shareCount: 2 },
        { userId: 'user2', shareCount: 1 },
        { userId: 'user3', shareCount: 3 },
      ];
      
      const result = calculateShareSplit(1200, participants);
      expect(result).toEqual([
        { userId: 'user1', shareCents: 400 }, // 2/6 * 1200
        { userId: 'user2', shareCents: 200 }, // 1/6 * 1200
        { userId: 'user3', shareCents: 600 }, // 3/6 * 1200
      ]);
    });

    it('should handle default share count of 1', () => {
      const participants: CreateExpenseParticipantDto[] = [
        { userId: 'user1' }, // No shareCount specified
        { userId: 'user2', shareCount: 2 },
      ];
      
      const result = calculateShareSplit(900, participants);
      
      // Verify total equals original amount
      const total = result.reduce((sum, r) => sum + r.shareCents, 0);
      expect(total).toBe(900);
      
      // user1 should get 1/3, user2 should get 2/3
      expect(result[0].shareCents).toBe(300);
      expect(result[1].shareCents).toBe(600);
    });

    it('should handle rounding by giving remainder to last participant', () => {
      const participants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', shareCount: 1 },
        { userId: 'user2', shareCount: 1 },
        { userId: 'user3', shareCount: 1 },
      ];
      
      const result = calculateShareSplit(1000, participants);
      
      // Verify total equals original amount
      const total = result.reduce((sum, r) => sum + r.shareCents, 0);
      expect(total).toBe(1000);
    });
  });

  describe('calculateSplit', () => {
    it('should call correct split function based on type', () => {
      const participants: CreateExpenseParticipantDto[] = [
        { userId: 'user1' },
        { userId: 'user2' },
      ];

      // Test EQUAL
      const equalResult = calculateSplit(1000, 'EQUAL', participants);
      expect(equalResult).toEqual([
        { userId: 'user1', shareCents: 500 },
        { userId: 'user2', shareCents: 500 },
      ]);

      // Test PERCENTAGE
      const percentageParticipants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', sharePercentage: 60 },
        { userId: 'user2', sharePercentage: 40 },
      ];
      const percentageResult = calculateSplit(1000, 'PERCENTAGE', percentageParticipants);
      expect(percentageResult).toEqual([
        { userId: 'user1', shareCents: 600 },
        { userId: 'user2', shareCents: 400 },
      ]);

      // Test SHARES
      const shareParticipants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', shareCount: 3 },
        { userId: 'user2', shareCount: 1 },
      ];
      const shareResult = calculateSplit(1000, 'SHARES', shareParticipants);
      expect(shareResult).toEqual([
        { userId: 'user1', shareCents: 750 },
        { userId: 'user2', shareCents: 250 },
      ]);
    });

    it('should handle EXACT split type', () => {
      const participants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', shareCents: 600 },
        { userId: 'user2', shareCents: 400 },
      ];

      const result = calculateSplit(1000, 'EXACT', participants);
      expect(result).toEqual([
        { userId: 'user1', shareCents: 600 },
        { userId: 'user2', shareCents: 400 },
      ]);
    });

    it('should throw error for EXACT split if amounts do not equal total', () => {
      const participants: CreateExpenseParticipantDto[] = [
        { userId: 'user1', shareCents: 600 },
        { userId: 'user2', shareCents: 300 }, // Total is 900, not 1000
      ];

      expect(() => calculateSplit(1000, 'EXACT', participants))
        .toThrow('Exact split amounts must equal total expense amount');
    });

    it('should throw error for unknown split type', () => {
      const participants: CreateExpenseParticipantDto[] = [
        { userId: 'user1' },
      ];

      expect(() => calculateSplit(1000, 'UNKNOWN' as 'EQUAL', participants))
        .toThrow('Unknown split type: UNKNOWN');
    });
  });
});