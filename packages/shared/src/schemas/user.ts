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