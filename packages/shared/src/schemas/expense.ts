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