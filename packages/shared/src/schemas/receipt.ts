import { z } from 'zod';

export const ReceiptSchema = z.object({
  id: z.string().uuid(),
  expenseId: z.string().uuid(),
  fileUrl: z.string(), // Can be URL or path
  mimeType: z.string(),
  filename: z.string().nullable(),
  fileSize: z.number().int().nullable(),
  createdAt: z.coerce.date(), // Accepts both string and Date
});

export type Receipt = z.infer<typeof ReceiptSchema>;
