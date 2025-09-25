import { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  CreateSettlementDto,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  UnauthorizedError,
} from '@group-pay/shared';

const prisma = new PrismaClient();

// Helper to ensure user is authenticated
function requireAuth(request: FastifyRequest) {
  if (!request.authUser?.userId) {
    throw new UnauthorizedError('Authentication required');
  }
  return request.authUser.userId as string;
}

export default async function settlementRoutes(fastify: FastifyInstance) {
  // Record a settlement/payment
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Settlements'],
        summary: 'Record a settlement payment',
        querystring: {
          type: 'object',
          properties: {
            groupId: { type: 'string', format: 'uuid' },
          },
          required: ['groupId'],
        },
        body: {
          type: 'object',
          properties: {
            fromUserId: { type: 'string', format: 'uuid' },
            toUserId: { type: 'string', format: 'uuid' },
            amountCents: { type: 'number', minimum: 1 },
            method: {
              type: 'string',
              enum: ['VENMO', 'PAYPAL', 'ZELLE', 'STRIPE_LINK', 'MARK_ONLY'],
            },
            externalRef: { type: 'string' },
          },
          required: ['fromUserId', 'toUserId', 'amountCents', 'method'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              settlement: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  fromUserId: { type: 'string' },
                  toUserId: { type: 'string' },
                  amountCents: { type: 'number' },
                  method: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = requireAuth(request);
      const { groupId } = request.query as { groupId: string };
      const { fromUserId, toUserId, amountCents, method, externalRef } =
        request.body as CreateSettlementDto;

      // Verify user is involved in the settlement (either sender or receiver)
      if (userId !== fromUserId && userId !== toUserId) {
        throw new ForbiddenError(
          'You can only record settlements that involve you'
        );
      }

      // Verify both users are in the group
      const memberships = await prisma.groupMember.findMany({
        where: {
          groupId,
          userId: { in: [fromUserId, toUserId] },
        },
      });

      if (memberships.length !== 2) {
        throw new ValidationError('Both users must be members of the group');
      }

      // Create settlement record
      const settlement = await prisma.settlement.create({
        data: {
          groupId,
          fromUserId,
          toUserId,
          amountCents,
          method,
          externalRef,
          status: 'PENDING',
          createdAt: new Date(),
        },
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              photoUrl: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
              photoUrl: true,
            },
          },
        },
      });

      reply.status(201).send({ settlement });
    }
  );

  // Get settlements for a group
  fastify.get(
    '/group/:groupId',
    {
      schema: {
        tags: ['Settlements'],
        summary: 'Get all settlements for a group',
        params: {
          type: 'object',
          properties: {
            groupId: { type: 'string', format: 'uuid' },
          },
          required: ['groupId'],
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', minimum: 1, maximum: 100 },
            offset: { type: 'number', minimum: 0 },
          },
        },
      },
    },
    async (request) => {
      const userId = requireAuth(request);
      const { groupId } = request.params as { groupId: string };
      const { limit = 20, offset = 0 } = request.query as {
        limit?: number;
        offset?: number;
      };

      // Verify user is member of the group
      const membership = await prisma.groupMember.findFirst({
        where: { groupId, userId },
      });

      if (!membership) {
        throw new ForbiddenError('You are not a member of this group');
      }

      const settlements = await prisma.settlement.findMany({
        where: { groupId },
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              photoUrl: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
              photoUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await prisma.settlement.count({
        where: { groupId },
      });

      return {
        settlements,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }
  );

  // Get user's settlement history
  fastify.get(
    '/user',
    {
      schema: {
        tags: ['Settlements'],
        summary: 'Get current user settlement history',
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', minimum: 1, maximum: 100 },
            offset: { type: 'number', minimum: 0 },
          },
        },
      },
    },
    async (request) => {
      const userId = requireAuth(request);
      const { limit = 20, offset = 0 } = request.query as {
        limit?: number;
        offset?: number;
      };

      const settlements = await prisma.settlement.findMany({
        where: {
          OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              photoUrl: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
              photoUrl: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await prisma.settlement.count({
        where: {
          OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
      });

      return {
        settlements,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }
  );

  // Confirm a settlement (mark as paid)
  fastify.put(
    '/:settlementId/confirm',
    {
      schema: {
        tags: ['Settlements'],
        summary: 'Confirm a settlement as paid',
        params: {
          type: 'object',
          properties: {
            settlementId: { type: 'string', format: 'uuid' },
          },
          required: ['settlementId'],
        },
      },
    },
    async (request) => {
      const userId = requireAuth(request);
      const { settlementId } = request.params as { settlementId: string };

      // Get the settlement
      const settlement = await prisma.settlement.findUnique({
        where: { id: settlementId },
        include: {
          group: {
            include: {
              members: {
                where: { userId },
              },
            },
          },
        },
      });

      if (!settlement) {
        throw new NotFoundError('Settlement');
      }

      // Check if user is involved or is a group admin
      const isInvolved =
        settlement.fromUserId === userId || settlement.toUserId === userId;
      const isAdmin =
        settlement.group.members.length > 0 &&
        ['OWNER', 'ADMIN'].includes(settlement.group.members[0].role);

      if (!isInvolved && !isAdmin) {
        throw new ForbiddenError(
          'You can only confirm settlements you are involved in'
        );
      }

      const updatedSettlement = await prisma.settlement.update({
        where: { id: settlementId },
        data: { status: 'CONFIRMED' },
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              photoUrl: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
              photoUrl: true,
            },
          },
        },
      });

      return { settlement: updatedSettlement };
    }
  );

  // Delete a settlement (only if pending)
  fastify.delete(
    '/:settlementId',
    {
      schema: {
        tags: ['Settlements'],
        summary: 'Delete a pending settlement',
        params: {
          type: 'object',
          properties: {
            settlementId: { type: 'string', format: 'uuid' },
          },
          required: ['settlementId'],
        },
      },
    },
    async (request) => {
      const userId = requireAuth(request);
      const { settlementId } = request.params as { settlementId: string };

      // Get the settlement
      const settlement = await prisma.settlement.findUnique({
        where: { id: settlementId },
      });

      if (!settlement) {
        throw new NotFoundError('Settlement');
      }

      // Only the person who created the settlement can delete it, and only if it's pending
      if (settlement.fromUserId !== userId) {
        throw new ForbiddenError('You can only delete settlements you created');
      }

      if (settlement.status !== 'PENDING') {
        throw new ValidationError('Only pending settlements can be deleted');
      }

      await prisma.settlement.delete({
        where: { id: settlementId },
      });

      return { success: true };
    }
  );
}
