import type {
  CreateExpenseParticipantDto,
  ExpenseSplitType,
} from '../schemas/expense';
import { validateSplitTotal } from './currency';

export interface SplitResult {
  userId: string;
  shareCents: number;
}

/**
 * Calculate equal splits among participants
 */
export function calculateEqualSplit(
  totalCents: number,
  participantIds: string[]
): SplitResult[] {
  const baseAmount = Math.floor(totalCents / participantIds.length);
  const remainder = totalCents % participantIds.length;

  return participantIds.map((userId, index) => ({
    userId,
    shareCents: baseAmount + (index < remainder ? 1 : 0),
  }));
}

/**
 * Calculate percentage-based splits
 */
export function calculatePercentageSplit(
  totalCents: number,
  participants: CreateExpenseParticipantDto[]
): SplitResult[] {
  const totalPercentage = participants.reduce(
    (sum, p) => sum + (p.sharePercentage || 0),
    0
  );

  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error('Percentages must sum to 100%');
  }

  let allocatedCents = 0;
  const results = participants.map((participant, index) => {
    const percentage = participant.sharePercentage || 0;
    let shareCents: number;

    if (index === participants.length - 1) {
      // Last participant gets remaining amount to handle rounding
      shareCents = totalCents - allocatedCents;
    } else {
      shareCents = Math.round(totalCents * (percentage / 100));
      allocatedCents += shareCents;
    }

    return {
      userId: participant.userId,
      shareCents,
    };
  });

  return results;
}

/**
 * Calculate share-based splits (e.g., 2 shares, 1 share, 3 shares)
 */
export function calculateShareSplit(
  totalCents: number,
  participants: CreateExpenseParticipantDto[]
): SplitResult[] {
  const totalShares = participants.reduce(
    (sum, p) => sum + (p.shareCount || 1),
    0
  );

  const centsPerShare = totalCents / totalShares;
  let allocatedCents = 0;

  const results = participants.map((participant, index) => {
    const shares = participant.shareCount || 1;
    let shareCents: number;

    if (index === participants.length - 1) {
      // Last participant gets remaining amount to handle rounding
      shareCents = totalCents - allocatedCents;
    } else {
      shareCents = Math.round(centsPerShare * shares);
      allocatedCents += shareCents;
    }

    return {
      userId: participant.userId,
      shareCents,
    };
  });

  return results;
}

/**
 * Main split calculation function
 */
export function calculateSplit(
  totalCents: number,
  splitType: ExpenseSplitType,
  participants: CreateExpenseParticipantDto[]
): SplitResult[] {
  switch (splitType) {
    case 'EQUAL':
      return calculateEqualSplit(
        totalCents,
        participants.map((p) => p.userId)
      );
    case 'PERCENTAGE':
      return calculatePercentageSplit(totalCents, participants);
    case 'SHARES':
      return calculateShareSplit(totalCents, participants);
    case 'EXACT': {
      // For exact splits, shareCents should already be specified
      const results = participants.map((p) => ({
        userId: p.userId,
        shareCents: p.shareCents || 0,
      }));

      if (
        !validateSplitTotal(
          totalCents,
          results.map((r) => r.shareCents)
        )
      ) {
        throw new Error('Exact split amounts must equal total expense amount');
      }

      return results;
    }
    default:
      throw new Error(`Unknown split type: ${splitType}`);
  }
}