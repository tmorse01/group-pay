import { z } from 'zod';

// Placeholder schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
});

export const GroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.string(),
});