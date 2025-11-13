import { z } from 'zod';

export const VerifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const ResendVerificationSchema = z.object({
  email: z.string().email().optional(), // Optional if user is authenticated
});

export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;
export type ResendVerificationDto = z.infer<typeof ResendVerificationSchema>;

