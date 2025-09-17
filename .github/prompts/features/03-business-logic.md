# Feature: Business Logic - Debt Netting & Advanced Utilities

**Priority**: HIGH | **Estimated Time**: 3-4 hours | **Dependencies**: Shared Types

## 🎯 Objective

Implement the core debt netting algorithm and advanced business logic utilities that handle complex expense splitting and balance calculations.

## 📋 Requirements

### Debt Netting Algorithm

The core feature of any expense tracker is calculating "who owes whom" with minimal transactions. Implement a greedy algorithm to reduce the number of required settlements.

#### Balance Calculation

```typescript
// packages/shared/src/utils/balances.ts
import type { Expense, ExpenseParticipant } from '../schemas/expense';

export interface UserBalance {
  userId: string;
  netBalance: number; // Positive = owed money, Negative = owes money
  totalPaid: number;
  totalOwed: number;
}

export interface NettedEdge {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
}

/**
 * Calculate net balances for all users in a group
 */
export function calculateUserBalances(
  expenses: Expense[],
  participants: ExpenseParticipant[]
): UserBalance[] {
  const balanceMap = new Map<string, UserBalance>();

  // Initialize all users from participants
  const allUserIds = new Set([
    ...expenses.map((e) => e.payerId),
    ...participants.map((p) => p.userId),
  ]);

  for (const userId of allUserIds) {
    balanceMap.set(userId, {
      userId,
      netBalance: 0,
      totalPaid: 0,
      totalOwed: 0,
    });
  }

  // Calculate what each user paid
  for (const expense of expenses) {
    const balance = balanceMap.get(expense.payerId)!;
    balance.totalPaid += expense.amountCents;
    balance.netBalance += expense.amountCents;
  }

  // Calculate what each user owes
  for (const participant of participants) {
    const balance = balanceMap.get(participant.userId)!;
    balance.totalOwed += participant.shareCents;
    balance.netBalance -= participant.shareCents;
  }

  return Array.from(balanceMap.values());
}

/**
 * Convert user balances into minimal settlement edges using greedy algorithm
 */
export function computeNetBalances(
  expenses: Expense[],
  participants: ExpenseParticipant[]
): NettedEdge[] {
  const userBalances = calculateUserBalances(expenses, participants);

  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors = userBalances
    .filter((b) => b.netBalance > 0)
    .map((b) => ({ userId: b.userId, amount: b.netBalance }))
    .sort((a, b) => b.amount - a.amount); // Largest first

  const debtors = userBalances
    .filter((b) => b.netBalance < 0)
    .map((b) => ({ userId: b.userId, amount: -b.netBalance }))
    .sort((a, b) => b.amount - a.amount); // Largest first

  const settlements: NettedEdge[] = [];

  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settlementAmount = Math.min(creditor.amount, debtor.amount);

    if (settlementAmount > 0) {
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amountCents: settlementAmount,
      });
    }

    creditor.amount -= settlementAmount;
    debtor.amount -= settlementAmount;

    if (creditor.amount === 0) i++;
    if (debtor.amount === 0) j++;
  }

  return settlements;
}

/**
 * Calculate total group spending
 */
export function calculateGroupTotal(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amountCents, 0);
}

/**
 * Calculate individual user statistics
 */
export interface UserStats {
  userId: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
  expenseCount: number;
  avgExpenseAmount: number;
}

export function calculateUserStats(
  userId: string,
  expenses: Expense[],
  participants: ExpenseParticipant[]
): UserStats {
  const userExpenses = expenses.filter((e) => e.payerId === userId);
  const userParticipations = participants.filter((p) => p.userId === userId);

  const totalPaid = userExpenses.reduce((sum, e) => sum + e.amountCents, 0);
  const totalOwed = userParticipations.reduce(
    (sum, p) => sum + p.shareCents,
    0
  );

  return {
    userId,
    totalPaid,
    totalOwed,
    netBalance: totalPaid - totalOwed,
    expenseCount: userExpenses.length,
    avgExpenseAmount:
      userExpenses.length > 0 ? totalPaid / userExpenses.length : 0,
  };
}
```

### Advanced Split Utilities

#### Smart Split Suggestions

```typescript
// packages/shared/src/utils/smartSplits.ts
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
```

#### Split Validation & Reconciliation

```typescript
// packages/shared/src/utils/validation.ts
import { validateSplitTotal } from './currency';
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
    }
  }

  return result;
}
```

### Receipt Processing Utilities

```typescript
// packages/shared/src/utils/receipts.ts

export interface ReceiptMetadata {
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface ParsedReceiptData {
  merchantName?: string;
  totalAmount?: number;
  date?: Date;
  items?: Array<{
    description: string;
    amount: number;
  }>;
  confidence: number; // 0-1 score of parsing confidence
}

/**
 * Validate uploaded receipt file
 */
export function validateReceiptFile(file: {
  name: string;
  size: number;
  type: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File size must be less than 10MB');
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ];

  if (!allowedTypes.includes(file.type)) {
    errors.push('File must be an image (JPEG, PNG, GIF, WebP) or PDF');
  }

  // Check filename
  if (!file.name || file.name.length > 255) {
    errors.push('Filename must be provided and less than 255 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a secure filename for storage
 */
export function generateSecureFilename(
  originalName: string,
  userId: string
): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  const random = Math.random().toString(36).substring(2, 8);

  return `${userId}_${timestamp}_${random}.${extension}`;
}
```

## 🔧 Implementation Steps

### 1. Create Utility Files

Create all the utility files as outlined above in `packages/shared/src/utils/`.

### 2. Add Comprehensive Tests

```typescript
// packages/shared/src/utils/__tests__/balances.test.ts
import { describe, it, expect } from 'vitest';
import { computeNetBalances, calculateUserBalances } from '../balances';
import type { Expense, ExpenseParticipant } from '../../schemas/expense';

describe('Balance Calculations', () => {
  const mockExpenses: Expense[] = [
    {
      id: '1',
      groupId: 'group1',
      payerId: 'alice',
      description: 'Dinner',
      amountCents: 6000, // $60
      currency: 'USD',
      date: new Date('2024-01-01'),
      category: 'food',
      notes: null,
      createdAt: new Date(),
    },
    {
      id: '2',
      groupId: 'group1',
      payerId: 'bob',
      description: 'Movie tickets',
      amountCents: 3000, // $30
      currency: 'USD',
      date: new Date('2024-01-02'),
      category: 'entertainment',
      notes: null,
      createdAt: new Date(),
    },
  ];

  const mockParticipants: ExpenseParticipant[] = [
    // Dinner split equally: Alice, Bob, Charlie ($20 each)
    { id: '1', expenseId: '1', userId: 'alice', shareCents: 2000 },
    { id: '2', expenseId: '1', userId: 'bob', shareCents: 2000 },
    { id: '3', expenseId: '1', userId: 'charlie', shareCents: 2000 },

    // Movies split equally: Alice, Bob ($15 each)
    { id: '4', expenseId: '2', userId: 'alice', shareCents: 1500 },
    { id: '5', expenseId: '2', userId: 'bob', shareCents: 1500 },
  ];

  it('should calculate correct user balances', () => {
    const balances = calculateUserBalances(mockExpenses, mockParticipants);

    // Alice: paid $60, owes $35, net +$25
    const alice = balances.find((b) => b.userId === 'alice')!;
    expect(alice.totalPaid).toBe(6000);
    expect(alice.totalOwed).toBe(3500);
    expect(alice.netBalance).toBe(2500);

    // Bob: paid $30, owes $35, net -$5
    const bob = balances.find((b) => b.userId === 'bob')!;
    expect(bob.totalPaid).toBe(3000);
    expect(bob.totalOwed).toBe(3500);
    expect(bob.netBalance).toBe(-500);

    // Charlie: paid $0, owes $20, net -$20
    const charlie = balances.find((b) => b.userId === 'charlie')!;
    expect(charlie.totalPaid).toBe(0);
    expect(charlie.totalOwed).toBe(2000);
    expect(charlie.netBalance).toBe(-2000);
  });

  it('should compute minimal settlement edges', () => {
    const settlements = computeNetBalances(mockExpenses, mockParticipants);

    // Should have 2 settlements:
    // Charlie owes Alice $20
    // Bob owes Alice $5
    expect(settlements).toHaveLength(2);

    const charlieToAlice = settlements.find(
      (s) => s.fromUserId === 'charlie' && s.toUserId === 'alice'
    );
    expect(charlieToAlice?.amountCents).toBe(2000);

    const bobToAlice = settlements.find(
      (s) => s.fromUserId === 'bob' && s.toUserId === 'alice'
    );
    expect(bobToAlice?.amountCents).toBe(500);
  });
});
```

### 3. Update Package Exports

```typescript
// packages/shared/src/index.ts - Add to existing exports
export * from './utils/balances';
export * from './utils/smartSplits';
export * from './utils/validation';
export * from './utils/receipts';
```

## ✅ Acceptance Criteria

- [ ] Debt netting algorithm produces minimal settlement edges
- [ ] Balance calculations are mathematically correct
- [ ] Split validation handles all edge cases
- [ ] Smart split suggestions work with historical data
- [ ] Receipt validation covers security requirements
- [ ] All utilities have comprehensive unit tests
- [ ] Performance is acceptable for groups up to 50 members
- [ ] Currency arithmetic uses integer cents throughout

## 🧪 Testing

### Performance Testing

```typescript
// Test with larger datasets to ensure algorithm scales
const generateLargeDataset = (userCount: number, expenseCount: number) => {
  // Generate test data and measure performance
};
```

### Edge Case Testing

```typescript
// Test edge cases like:
// - Single user expenses
// - Zero-amount expenses
// - Circular debt patterns
// - Very small amounts (1 cent)
// - Very large amounts
```

## 📚 Next Steps

After completing this feature:

1. **[Database Setup](./04-database-setup.md)** - Create realistic seed data
2. **[Core API Routes](./06-core-api.md)** - Use balance calculations in API
3. **[Advanced Features](./11-advanced-features.md)** - Build balance UI components
