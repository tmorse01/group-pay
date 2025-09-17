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