import type { CreateExpenseParticipantDto } from '../schemas/expense';

export interface SplitSuggestion {
  type: 'EQUAL' | 'WEIGHTED' | 'CUSTOM';
  description: string;
  participants: CreateExpenseParticipantDto[];
}

/**
 * Generate smart split suggestions based on group history
 */
export function generateSplitSuggestions(
  totalCents: number,
  availableUserIds: string[],
  expenseCategory?: string,
  historicalData?: {
    categoryPatterns: Record<string, string[]>; // category -> usual participants
    userFrequency: Record<string, number>; // userId -> participation frequency
  }
): SplitSuggestion[] {
  const suggestions: SplitSuggestion[] = [];

  // Always include equal split
  suggestions.push({
    type: 'EQUAL',
    description: 'Split equally among all members',
    participants: availableUserIds.map((userId) => ({ userId })),
  });

  // Category-based suggestions
  if (expenseCategory && historicalData?.categoryPatterns[expenseCategory]) {
    const frequentParticipants =
      historicalData.categoryPatterns[expenseCategory];
    const relevantUsers = availableUserIds.filter((id) =>
      frequentParticipants.includes(id)
    );

    if (
      relevantUsers.length > 0 &&
      relevantUsers.length < availableUserIds.length
    ) {
      suggestions.push({
        type: 'CUSTOM',
        description: `Split among usual ${expenseCategory} participants`,
        participants: relevantUsers.map((userId) => ({ userId })),
      });
    }
  }

  // Frequency-based weighted split
  if (historicalData?.userFrequency) {
    const totalFrequency = Object.values(historicalData.userFrequency).reduce(
      (sum, freq) => sum + freq,
      0
    );

    if (totalFrequency > 0) {
      suggestions.push({
        type: 'WEIGHTED',
        description: 'Weight by participation frequency',
        participants: availableUserIds.map((userId) => {
          const frequency = historicalData.userFrequency[userId] || 0;
          const percentage = (frequency / totalFrequency) * 100;
          return {
            userId,
            sharePercentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
          };
        }),
      });
    }
  }

  return suggestions;
}