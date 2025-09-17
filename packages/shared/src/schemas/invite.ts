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