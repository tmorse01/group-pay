import { describe, it, expect } from 'vitest';
import { generateSplitSuggestions } from '../smartSplits';

describe('Smart Split Suggestions', () => {
  const mockUserIds = ['alice', 'bob', 'charlie', 'david'];

  it('should always include an equal split suggestion', () => {
    const suggestions = generateSplitSuggestions(10000, mockUserIds);

    const equalSplit = suggestions.find(s => s.type === 'EQUAL');
    expect(equalSplit).toBeDefined();
    expect(equalSplit!.description).toBe('Split equally among all members');
    expect(equalSplit!.participants).toHaveLength(4);
    expect(equalSplit!.participants.every(p => mockUserIds.includes(p.userId))).toBe(true);
  });

  it('should suggest category-based splits when historical data is available', () => {
    const historicalData = {
      categoryPatterns: {
        'food': ['alice', 'bob'],
        'entertainment': ['alice', 'bob', 'charlie'],
      },
      userFrequency: {
        'alice': 10,
        'bob': 8,
        'charlie': 5,
        'david': 2,
      },
    };

    const suggestions = generateSplitSuggestions(
      10000,
      mockUserIds,
      'food',
      historicalData
    );

    const categorySplit = suggestions.find(s => s.type === 'CUSTOM');
    expect(categorySplit).toBeDefined();
    expect(categorySplit!.description).toBe('Split among usual food participants');
    expect(categorySplit!.participants).toHaveLength(2);
    expect(categorySplit!.participants.map(p => p.userId)).toEqual(['alice', 'bob']);
  });

  it('should not suggest category splits if no historical pattern exists', () => {
    const historicalData = {
      categoryPatterns: {
        'transportation': ['alice', 'bob'],
      },
      userFrequency: {},
    };

    const suggestions = generateSplitSuggestions(
      10000,
      mockUserIds,
      'food', // Different category
      historicalData
    );

    const categorySplit = suggestions.find(s => s.type === 'CUSTOM');
    expect(categorySplit).toBeUndefined();
  });

  it('should not suggest category splits if it includes all users', () => {
    const historicalData = {
      categoryPatterns: {
        'food': ['alice', 'bob', 'charlie', 'david'], // All users
      },
      userFrequency: {},
    };

    const suggestions = generateSplitSuggestions(
      10000,
      mockUserIds,
      'food',
      historicalData
    );

    const categorySplit = suggestions.find(s => s.type === 'CUSTOM');
    expect(categorySplit).toBeUndefined();
  });

  it('should suggest weighted splits based on participation frequency', () => {
    const historicalData = {
      categoryPatterns: {},
      userFrequency: {
        'alice': 10,
        'bob': 5,
        'charlie': 3,
        'david': 2,
      },
    };

    const suggestions = generateSplitSuggestions(
      10000,
      mockUserIds,
      undefined,
      historicalData
    );

    const weightedSplit = suggestions.find(s => s.type === 'WEIGHTED');
    expect(weightedSplit).toBeDefined();
    expect(weightedSplit!.description).toBe('Weight by participation frequency');
    expect(weightedSplit!.participants).toHaveLength(4);

    // Check that Alice (highest frequency) gets the highest percentage
    const aliceParticipant = weightedSplit!.participants.find(p => p.userId === 'alice');
    const bobParticipant = weightedSplit!.participants.find(p => p.userId === 'bob');
    
    expect(aliceParticipant!.sharePercentage).toBeGreaterThan(bobParticipant!.sharePercentage!);

    // Check that percentages sum to approximately 100%
    const totalPercentage = weightedSplit!.participants.reduce(
      (sum, p) => sum + (p.sharePercentage || 0),
      0
    );
    expect(Math.abs(totalPercentage - 100)).toBeLessThan(1);
  });

  it('should handle zero frequency users in weighted splits', () => {
    const historicalData = {
      categoryPatterns: {},
      userFrequency: {
        'alice': 10,
        'bob': 0, // Zero frequency
        // charlie and david not in frequency map
      },
    };

    const suggestions = generateSplitSuggestions(
      10000,
      mockUserIds,
      undefined,
      historicalData
    );

    const weightedSplit = suggestions.find(s => s.type === 'WEIGHTED');
    expect(weightedSplit).toBeDefined();
    
    // Users with no frequency data should get 0%
    const bobParticipant = weightedSplit!.participants.find(p => p.userId === 'bob');
    const charlieParticipant = weightedSplit!.participants.find(p => p.userId === 'charlie');
    
    expect(bobParticipant!.sharePercentage).toBe(0);
    expect(charlieParticipant!.sharePercentage).toBe(0);
  });

  it('should not suggest weighted splits if total frequency is zero', () => {
    const historicalData = {
      categoryPatterns: {},
      userFrequency: {
        'alice': 0,
        'bob': 0,
        'charlie': 0,
        'david': 0,
      },
    };

    const suggestions = generateSplitSuggestions(
      10000,
      mockUserIds,
      undefined,
      historicalData
    );

    const weightedSplit = suggestions.find(s => s.type === 'WEIGHTED');
    expect(weightedSplit).toBeUndefined();
  });

  it('should work without historical data', () => {
    const suggestions = generateSplitSuggestions(10000, mockUserIds);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].type).toBe('EQUAL');
  });

  it('should handle empty user list', () => {
    const suggestions = generateSplitSuggestions(10000, []);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].type).toBe('EQUAL');
    expect(suggestions[0].participants).toHaveLength(0);
  });

  it('should provide multiple suggestions when all conditions are met', () => {
    const historicalData = {
      categoryPatterns: {
        'food': ['alice', 'bob'],
      },
      userFrequency: {
        'alice': 10,
        'bob': 5,
        'charlie': 3,
        'david': 2,
      },
    };

    const suggestions = generateSplitSuggestions(
      10000,
      mockUserIds,
      'food',
      historicalData
    );

    expect(suggestions).toHaveLength(3);
    expect(suggestions.map(s => s.type)).toEqual(['EQUAL', 'CUSTOM', 'WEIGHTED']);
  });
});