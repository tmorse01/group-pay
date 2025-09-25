import { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  CreateGroupDto,
  UpdateGroupDto,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  UnauthorizedError,
} from '@group-pay/shared';

const prisma = new PrismaClient();

// Schema for adding members
const AddMemberSchema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
  },
  required: ['email'],
} as const;

// Helper to ensure user is authenticated
function requireAuth(request: FastifyRequest) {
  if (!request.authUser?.userId) {
    throw new UnauthorizedError('Authentication required');
  }
  return request.authUser.userId as string;
}

export default async function groupRoutes(fastify: FastifyInstance) {
  // Create new group
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Groups'],
        summary: 'Create a new group',
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            currency: {
              type: 'string',
              minLength: 3,
              maxLength: 3,
              default: 'USD',
            },
          },
          required: ['name'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              group: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  currency: { type: 'string' },
                  createdAt: { type: 'string' },
                  memberCount: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = requireAuth(request);
      const { name, currency } = request.body as CreateGroupDto;

      const group = await prisma.group.create({
        data: {
          name,
          currency: currency || 'USD',
          ownerId: userId,
          members: {
            create: {
              userId,
              role: 'OWNER',
              joinedAt: new Date(),
            },
          },
        },
        include: {
          _count: {
            select: { members: true },
          },
        },
      });

      reply.status(201).send({
        group: {
          id: group.id,
          name: group.name,
          currency: group.currency,
          createdAt: group.createdAt.toISOString(),
          memberCount: group._count.members,
        },
      });
    }
  );

  // Get user's groups
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Groups'],
        summary: 'Get all groups for current user',
        response: {
          200: {
            type: 'object',
            properties: {
              groups: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    currency: { type: 'string' },
                    memberCount: { type: 'number' },
                    expenseCount: { type: 'number' },
                    lastActivity: { type: 'string' },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request) => {
      const userId = requireAuth(request);

      const groups = await prisma.group.findMany({
        where: {
          members: {
            some: { userId },
          },
        },
        include: {
          _count: {
            select: {
              members: true,
              expenses: true,
            },
          },
          expenses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        groups: groups.map((group) => ({
          id: group.id,
          name: group.name,
          currency: group.currency,
          memberCount: group._count.members,
          expenseCount: group._count.expenses,
          lastActivity:
            group.expenses[0]?.createdAt?.toISOString() ||
            group.createdAt.toISOString(),
          createdAt: group.createdAt.toISOString(),
        })),
      };
    }
  );

  // Get group by ID
  fastify.get(
    '/:groupId',
    {
      schema: {
        tags: ['Groups'],
        summary: 'Get group details',
        params: {
          type: 'object',
          properties: {
            groupId: { type: 'string', format: 'uuid' },
          },
          required: ['groupId'],
        },
      },
    },
    async (request) => {
      const { groupId } = request.params as { groupId: string };
      const userId = requireAuth(request);

      const group = await prisma.group.findFirst({
        where: {
          id: groupId,
          members: {
            some: { userId },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  photoUrl: true,
                  venmoHandle: true,
                  paypalLink: true,
                },
              },
            },
          },
          expenses: {
            include: {
              payer: {
                select: {
                  id: true,
                  name: true,
                  photoUrl: true,
                },
              },
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      photoUrl: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!group) {
        throw new NotFoundError('Group');
      }

      return {
        group: {
          id: group.id,
          name: group.name,
          currency: group.currency,
          createdAt: group.createdAt.toISOString(),
          members: group.members.map((member) => ({
            id: member.id,
            role: member.role,
            joinedAt: member.joinedAt.toISOString(),
            user: member.user,
          })),
          expenses: group.expenses.map((expense) => ({
            id: expense.id,
            description: expense.description,
            amountCents: expense.amountCents,
            currency: expense.currency,
            category: expense.category,
            date: expense.date.toISOString(),
            payer: expense.payer,
            participants: expense.participants,
            createdAt: expense.createdAt.toISOString(),
          })),
        },
      };
    }
  );

  // Update group
  fastify.put(
    '/:groupId',
    {
      schema: {
        tags: ['Groups'],
        summary: 'Update group details',
        params: {
          type: 'object',
          properties: {
            groupId: { type: 'string', format: 'uuid' },
          },
          required: ['groupId'],
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            currency: { type: 'string', minLength: 3, maxLength: 3 },
          },
        },
      },
    },
    async (request) => {
      const { groupId } = request.params as { groupId: string };
      const userId = requireAuth(request);
      const updates = request.body as UpdateGroupDto;

      // Check if user is admin or owner of the group
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!membership) {
        throw new ForbiddenError(
          'Only group owners and admins can update group settings'
        );
      }

      const group = await prisma.group.update({
        where: { id: groupId },
        data: updates,
      });

      return { group };
    }
  );

  // Add member to group
  fastify.post(
    '/:groupId/members',
    {
      schema: {
        tags: ['Groups'],
        summary: 'Add member to group',
        params: {
          type: 'object',
          properties: {
            groupId: { type: 'string', format: 'uuid' },
          },
          required: ['groupId'],
        },
        body: AddMemberSchema,
      },
    },
    async (request) => {
      const { groupId } = request.params as { groupId: string };
      const { email } = request.body as { email: string };
      const userId = requireAuth(request);

      // Check if current user is owner or admin
      const isAuthorized = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!isAuthorized) {
        throw new ForbiddenError(
          'Only group owners and admins can add members'
        );
      }

      // Find user by email
      const userToAdd = await prisma.user.findUnique({
        where: { email },
      });

      if (!userToAdd) {
        throw new NotFoundError('User with this email');
      }

      // Check if user is already a member
      const existingMembership = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId: userToAdd.id,
        },
      });

      if (existingMembership) {
        throw new ValidationError('User is already a member of this group');
      }

      // Add user to group
      const membership = await prisma.groupMember.create({
        data: {
          groupId,
          userId: userToAdd.id,
          role: 'MEMBER',
          joinedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              photoUrl: true,
            },
          },
        },
      });

      return {
        member: {
          id: membership.id,
          role: membership.role,
          joinedAt: membership.joinedAt.toISOString(),
          user: membership.user,
        },
      };
    }
  );

  // Remove member from group
  fastify.delete(
    '/:groupId/members/:memberId',
    {
      schema: {
        tags: ['Groups'],
        summary: 'Remove member from group',
        params: {
          type: 'object',
          properties: {
            groupId: { type: 'string', format: 'uuid' },
            memberId: { type: 'string', format: 'uuid' },
          },
          required: ['groupId', 'memberId'],
        },
      },
    },
    async (request) => {
      const { groupId, memberId } = request.params as {
        groupId: string;
        memberId: string;
      };
      const userId = requireAuth(request);

      // Get membership to remove
      const membershipToRemove = await prisma.groupMember.findUnique({
        where: { id: memberId },
      });

      if (!membershipToRemove || membershipToRemove.groupId !== groupId) {
        throw new NotFoundError('Member not found in this group');
      }

      // Get current user membership
      const currentUserMembership = await prisma.groupMember.findFirst({
        where: { groupId, userId },
      });

      if (!currentUserMembership) {
        throw new ForbiddenError('You are not a member of this group');
      }

      // Check permissions - owner/admin can remove anyone, user can remove themselves
      const canRemove =
        ['OWNER', 'ADMIN'].includes(currentUserMembership.role) ||
        membershipToRemove.userId === userId;

      if (!canRemove) {
        throw new ForbiddenError(
          'You can only remove yourself unless you are an admin'
        );
      }

      // Check if this is the last owner
      if (membershipToRemove.role === 'OWNER') {
        const ownerCount = await prisma.groupMember.count({
          where: {
            groupId,
            role: 'OWNER',
          },
        });

        if (ownerCount === 1) {
          throw new ValidationError(
            'Cannot remove the last owner from the group'
          );
        }
      }

      await prisma.groupMember.delete({
        where: { id: memberId },
      });

      return { success: true };
    }
  );

  // Delete group (owner only)
  fastify.delete(
    '/:groupId',
    {
      schema: {
        tags: ['Groups'],
        summary: 'Delete group',
        params: {
          type: 'object',
          properties: {
            groupId: { type: 'string', format: 'uuid' },
          },
          required: ['groupId'],
        },
      },
    },
    async (request) => {
      const { groupId } = request.params as { groupId: string };
      const userId = requireAuth(request);

      // Check if user is owner
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
          role: 'OWNER',
        },
      });

      if (!membership) {
        throw new ForbiddenError('Only group owners can delete groups');
      }

      // Delete group (cascade will handle related records)
      await prisma.group.delete({
        where: { id: groupId },
      });

      return { success: true };
    }
  );
}
