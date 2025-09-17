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