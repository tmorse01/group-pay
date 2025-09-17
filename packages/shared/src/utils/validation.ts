import type {
  CreateExpenseParticipantDto,
  ExpenseSplitType,
} from '../schemas/expense';

export interface SplitValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  adjustedParticipants?: CreateExpenseParticipantDto[];
}

/**
 * Validate and optionally fix split calculations
 */
export function validateAndFixSplit(
  totalCents: number,
  splitType: ExpenseSplitType,
  participants: CreateExpenseParticipantDto[],
  autoFix = false
): SplitValidationResult {
  const result: SplitValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (participants.length === 0) {
    result.isValid = false;
    result.errors.push('At least one participant is required');
    return result;
  }

  switch (splitType) {
    case 'PERCENTAGE':
      return validatePercentageSplit(totalCents, participants, autoFix);
    case 'SHARES':
      return validateShareSplit(totalCents, participants, autoFix);
    case 'EXACT':
      return validateExactSplit(totalCents, participants, autoFix);
    case 'EQUAL':
      // Equal splits are always valid
      return result;
    default:
      result.isValid = false;
      result.errors.push(`Unknown split type: ${splitType}`);
      return result;
  }
}

function validatePercentageSplit(
  totalCents: number,
  participants: CreateExpenseParticipantDto[],
  autoFix: boolean
): SplitValidationResult {
  const result: SplitValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  const totalPercentage = participants.reduce(
    (sum, p) => sum + (p.sharePercentage || 0),
    0
  );

  const tolerance = 0.01;
  const difference = Math.abs(totalPercentage - 100);

  if (difference > tolerance) {
    result.isValid = false;
    result.errors.push(
      `Percentages sum to ${totalPercentage}%, must equal 100%`
    );

    if (autoFix) {
      // Distribute the difference among participants
      const adjustment = (100 - totalPercentage) / participants.length;
      result.adjustedParticipants = participants.map((p) => ({
        ...p,
        sharePercentage: (p.sharePercentage || 0) + adjustment,
      }));
      result.warnings.push('Percentages auto-adjusted to sum to 100%');
      result.isValid = true;
    }
  }

  return result;
}

function validateShareSplit(
  totalCents: number,
  participants: CreateExpenseParticipantDto[],
  autoFix: boolean
): SplitValidationResult {
  const result: SplitValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  const hasInvalidShares = participants.some(
    (p) => !p.shareCount || p.shareCount <= 0
  );

  if (hasInvalidShares) {
    result.isValid = false;
    result.errors.push('All participants must have a positive share count');

    if (autoFix) {
      result.adjustedParticipants = participants.map((p) => ({
        ...p,
        shareCount: p.shareCount && p.shareCount > 0 ? p.shareCount : 1,
      }));
      result.warnings.push('Invalid share counts set to 1');
      result.isValid = true;
    }
  }

  return result;
}

function validateExactSplit(
  totalCents: number,
  participants: CreateExpenseParticipantDto[],
  autoFix: boolean
): SplitValidationResult {
  const result: SplitValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  const totalShares = participants.reduce(
    (sum, p) => sum + (p.shareCents || 0),
    0
  );

  const difference = totalCents - totalShares;

  if (difference !== 0) {
    result.isValid = false;
    result.errors.push(
      `Split amounts sum to ${totalShares / 100}, must equal ${totalCents / 100}`
    );

    if (autoFix) {
      // Add difference to the first participant
      result.adjustedParticipants = participants.map((p, index) => ({
        ...p,
        shareCents: (p.shareCents || 0) + (index === 0 ? difference : 0),
      }));
      result.warnings.push('Split amounts auto-adjusted to match total');
      result.isValid = true;
    }
  }

  return result;
}