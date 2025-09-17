# Feature: Shared Types & Zod Schemas

**Priority**: HIGH | **Estimated Time**: 2-3 hours | **Dependencies**: Prisma Schema

## 🎯 Objective

Create comprehensive Zod schemas, TypeScript types, and DTOs in the shared package that will be used by both the API and web applications.

## 📋 Requirements

### Core Entity Schemas

Create Zod schemas for all database entities in `packages/shared/src/schemas/`:

#### User Schemas

```typescript
// packages/shared/src/schemas/user.ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  photoUrl: z.string().url().nullable(),
  venmoHandle: z.string().max(50).nullable(),
  paypalLink: z.string().url().nullable(),
  createdAt: z.date(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  photoUrl: z.string().url().nullable().optional(),
  venmoHandle: z.string().max(50).nullable().optional(),
  paypalLink: z.string().url().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
```

#### Group Schemas

```typescript
// packages/shared/src/schemas/group.ts
import { z } from 'zod';

export const GroupMemberRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER']);

export const GroupSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string().min(1).max(100),
  currency: z.string().length(3), // ISO 4217
  createdAt: z.date(),
});

export const GroupMemberSchema = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
  role: GroupMemberRoleSchema,
  joinedAt: z.date(),
});

export const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100),
  currency: z.string().length(3).default('USD'),
});

export const UpdateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currency: z.string().length(3).optional(),
});

export type Group = z.infer<typeof GroupSchema>;
export type GroupMember = z.infer<typeof GroupMemberSchema>;
export type GroupMemberRole = z.infer<typeof GroupMemberRoleSchema>;
export type CreateGroupDto = z.infer<typeof CreateGroupSchema>;
export type UpdateGroupDto = z.infer<typeof UpdateGroupSchema>;
```

#### Expense Schemas

```typescript
// packages/shared/src/schemas/expense.ts
import { z } from 'zod';

export const ExpenseSplitTypeSchema = z.enum([
  'EQUAL',
  'PERCENTAGE',
  'SHARES',
  'EXACT',
]);

export const ExpenseParticipantSchema = z.object({
  id: z.string().uuid(),
  expenseId: z.string().uuid(),
  userId: z.string().uuid(),
  shareCents: z.number().int().min(0),
});

export const ExpenseSchema = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  payerId: z.string().uuid(),
  description: z.string().min(1).max(200),
  amountCents: z.number().int().min(1),
  currency: z.string().length(3),
  date: z.date(),
  category: z.string().max(50).nullable(),
  notes: z.string().max(500).nullable(),
  createdAt: z.date(),
});

export const CreateExpenseParticipantSchema = z.object({
  userId: z.string().uuid(),
  shareCents: z.number().int().min(0).optional(), // Optional for equal splits
  sharePercentage: z.number().min(0).max(100).optional(), // For percentage splits
  shareCount: z.number().int().min(1).optional(), // For share-based splits
});

export const CreateExpenseSchema = z.object({
  description: z.string().min(1).max(200),
  amountCents: z.number().int().min(1),
  currency: z.string().length(3).default('USD'),
  date: z.date().default(() => new Date()),
  category: z.string().max(50).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  payerId: z.string().uuid(),
  splitType: ExpenseSplitTypeSchema,
  participants: z.array(CreateExpenseParticipantSchema).min(1),
});

export const UpdateExpenseSchema = z.object({
  description: z.string().min(1).max(200).optional(),
  amountCents: z.number().int().min(1).optional(),
  date: z.date().optional(),
  category: z.string().max(50).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export type Expense = z.infer<typeof ExpenseSchema>;
export type ExpenseParticipant = z.infer<typeof ExpenseParticipantSchema>;
export type ExpenseSplitType = z.infer<typeof ExpenseSplitTypeSchema>;
export type CreateExpenseDto = z.infer<typeof CreateExpenseSchema>;
export type CreateExpenseParticipantDto = z.infer<
  typeof CreateExpenseParticipantSchema
>;
export type UpdateExpenseDto = z.infer<typeof UpdateExpenseSchema>;
```

#### Settlement Schemas

```typescript
// packages/shared/src/schemas/settlement.ts
import { z } from 'zod';

export const SettlementMethodSchema = z.enum([
  'VENMO',
  'PAYPAL',
  'ZELLE',
  'STRIPE_LINK',
  'MARK_ONLY',
]);
export const SettlementStatusSchema = z.enum(['PENDING', 'CONFIRMED']);

export const SettlementSchema = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  fromUserId: z.string().uuid(),
  toUserId: z.string().uuid(),
  amountCents: z.number().int().min(1),
  method: SettlementMethodSchema,
  externalRef: z.string().nullable(),
  status: SettlementStatusSchema,
  createdAt: z.date(),
});

export const CreateSettlementSchema = z.object({
  fromUserId: z.string().uuid(),
  toUserId: z.string().uuid(),
  amountCents: z.number().int().min(1),
  method: SettlementMethodSchema,
  externalRef: z.string().optional(),
});

export type Settlement = z.infer<typeof SettlementSchema>;
export type SettlementMethod = z.infer<typeof SettlementMethodSchema>;
export type SettlementStatus = z.infer<typeof SettlementStatusSchema>;
export type CreateSettlementDto = z.infer<typeof CreateSettlementSchema>;
```

#### Invite Schemas

```typescript
// packages/shared/src/schemas/invite.ts
import { z } from 'zod';

export const InviteStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'CANCELLED']);

export const InviteSchema = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  code: z.string().min(6).max(20),
  createdBy: z.string().uuid(),
  status: InviteStatusSchema,
  expiresAt: z.date(),
  createdAt: z.date(),
});

export const CreateInviteSchema = z.object({
  expiresAt: z
    .date()
    .optional()
    .default(() => {
      const date = new Date();
      date.setDate(date.getDate() + 7); // Default 7 days
      return date;
    }),
});

export type Invite = z.infer<typeof InviteSchema>;
export type InviteStatus = z.infer<typeof InviteStatusSchema>;
export type CreateInviteDto = z.infer<typeof CreateInviteSchema>;
```

### Business Logic Utilities

#### Currency Utilities

```typescript
// packages/shared/src/utils/currency.ts

/**
 * Convert dollars to cents (avoiding floating point precision issues)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars for display
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format cents as currency string
 */
export function formatCurrency(cents: number, currency = 'USD'): string {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars);
}

/**
 * Sum an array of cent amounts safely
 */
export function sumCents(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}

/**
 * Validate that split amounts equal the total expense amount
 */
export function validateSplitTotal(
  totalCents: number,
  splitCents: number[]
): boolean {
  const splitSum = sumCents(splitCents);
  return splitSum === totalCents;
}
```

#### Split Calculation Utilities

```typescript
// packages/shared/src/utils/splits.ts
import type {
  CreateExpenseParticipantDto,
  ExpenseSplitType,
} from '../schemas/expense';

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
    case 'EXACT':
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
    default:
      throw new Error(`Unknown split type: ${splitType}`);
  }
}
```

### Error Types

```typescript
// packages/shared/src/types/errors.ts

export interface AppError extends Error {
  code: string;
  httpStatus: number;
  details?: Record<string, unknown>;
}

export class ValidationError extends Error implements AppError {
  code = 'VALIDATION_ERROR';
  httpStatus = 400;

  constructor(
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error implements AppError {
  code = 'NOT_FOUND';
  httpStatus = 404;

  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error implements AppError {
  code = 'UNAUTHORIZED';
  httpStatus = 401;

  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error implements AppError {
  code = 'FORBIDDEN';
  httpStatus = 403;

  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
```

## 🔧 Implementation Steps

### 1. Create Schema Files

Create the directory structure and schema files as outlined above.

### 2. Update Package Exports

```typescript
// packages/shared/src/index.ts
export * from './schemas/user';
export * from './schemas/group';
export * from './schemas/expense';
export * from './schemas/settlement';
export * from './schemas/invite';

export * from './utils/currency';
export * from './utils/splits';

export * from './types/errors';
```

### 3. Add Unit Tests

```typescript
// packages/shared/src/utils/__tests__/splits.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateEqualSplit,
  calculatePercentageSplit,
  validateSplitTotal,
} from '../splits';

describe('Split Calculations', () => {
  describe('calculateEqualSplit', () => {
    it('should divide amount equally', () => {
      const result = calculateEqualSplit(1000, ['user1', 'user2', 'user3']);
      expect(result).toEqual([
        { userId: 'user1', shareCents: 334 },
        { userId: 'user2', shareCents: 333 },
        { userId: 'user3', shareCents: 333 },
      ]);
    });
  });

  // Add more tests...
});
```

## ✅ Acceptance Criteria

- [ ] All entity schemas are defined with proper validation
- [ ] DTOs are created for API requests/responses
- [ ] Currency utilities handle cent-based arithmetic correctly
- [ ] Split calculation utilities work for all split types
- [ ] Error types are properly structured
- [ ] Unit tests cover all utility functions
- [ ] Package exports are properly configured
- [ ] TypeScript types are generated correctly

## 🧪 Testing

Run the shared package tests:

```bash
cd packages/shared
pnpm test
```

## 📚 Next Steps

After completing this feature:

1. **[Business Logic](./03-business-logic.md)** - Debt netting algorithms
2. **[Core API Routes](./06-core-api.md)** - Use schemas for validation
3. **[React Setup](./08-react-setup.md)** - Import types in frontend
