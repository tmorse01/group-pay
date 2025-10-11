import { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  UnauthorizedError,
  calculateSplit,
} from '@group-pay/shared';
import { expenseSchemas } from '../schemas/expenses';

const prisma = new PrismaClient();

// Helper to ensure user is authenticated
function requireAuth(request: FastifyRequest) {
  if (!request.authUser?.userId) {
    throw new UnauthorizedError('Authentication required');
  }
  return request.authUser.userId as string;
}

export default async function expenseRoutes(fastify: FastifyInstance) {
  // Get all expenses for the authenticated user across all their groups
  fastify.get(
    '/',
    { schema: expenseSchemas.getAllExpenses },
    async (request) => {
      const userId = requireAuth(request);
      const { limit = 50, offset = 0 } = request.query as {
        limit?: number;
        offset?: number;
      };

      // Get all expenses from groups the user is a member of
      const expenses = await prisma.expense.findMany({
        where: {
          group: {
            members: {
              some: { userId },
            },
          },
        },
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
        take: limit,
        skip: offset,
      });

      const total = await prisma.expense.count({
        where: {
          group: {
            members: {
              some: { userId },
            },
          },
        },
      });

      return {
        expenses,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }
  );

  // Create new expense
  fastify.post(
    '/',
    { schema: expenseSchemas.createExpense },
    async (request, reply) => {
      const userId = requireAuth(request);
      const { groupId } = request.query as { groupId: string };
      const {
        description,
        amountCents,
        currency,
        date,
        category,
        notes,
        payerId,
        splitType,
        participants,
      } = request.body as CreateExpenseDto;

      // Verify user is member of the group
      const membership = await prisma.groupMember.findFirst({
        where: { groupId, userId },
      });

      if (!membership) {
        throw new ForbiddenError('You are not a member of this group');
      }

      // Verify payer is in the group
      const payerMembership = await prisma.groupMember.findFirst({
        where: { groupId, userId: payerId },
      });

      if (!payerMembership) {
        throw new ValidationError('The payer must be a member of the group');
      }

      // Verify all participants are in the group
      const participantIds = participants.map((p) => p.userId);
      const participantMemberships = await prisma.groupMember.findMany({
        where: {
          groupId,
          userId: { in: participantIds },
        },
      });

      if (participantMemberships.length !== participantIds.length) {
        throw new ValidationError(
          'All participants must be members of the group'
        );
      }

      // Calculate splits
      const calculatedSplits = calculateSplit(
        amountCents,
        splitType,
        participants
      );

      // Create expense with participants
      const expense = await prisma.expense.create({
        data: {
          groupId,
          description,
          amountCents,
          currency: currency || 'USD',
          date: date || new Date(),
          category,
          notes,
          payerId,
          participants: {
            create: calculatedSplits.map((split) => ({
              userId: split.userId,
              shareCents: split.shareCents,
            })),
          },
        },
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
      });

      reply.status(201).send({ expense });
    }
  );

  // Get expense by ID
  fastify.get(
    '/:expenseId',
    { schema: expenseSchemas.getExpenseById },
    async (request) => {
      const userId = requireAuth(request);
      const { expenseId } = request.params as { expenseId: string };

      const expense = await prisma.expense.findFirst({
        where: {
          id: expenseId,
          group: {
            members: {
              some: { userId },
            },
          },
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              currency: true,
            },
          },
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
      });

      if (!expense) {
        throw new NotFoundError('Expense');
      }

      return { expense };
    }
  );

  // Get expenses for a group
  fastify.get(
    '/group/:groupId',
    { schema: expenseSchemas.getGroupExpenses },
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

      const expenses = await prisma.expense.findMany({
        where: { groupId },
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
        take: limit,
        skip: offset,
      });

      const total = await prisma.expense.count({
        where: { groupId },
      });

      return {
        expenses,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }
  );

  // Update expense
  fastify.put(
    '/:expenseId',
    { schema: expenseSchemas.updateExpense },
    async (request) => {
      const userId = requireAuth(request);
      const { expenseId } = request.params as { expenseId: string };
      const updates = request.body as UpdateExpenseDto & {
        payerId?: string;
        splitType?: string;
        participants?: Array<{ userId: string; shareCents?: number }>;
      };

      // Check if expense exists and user has access
      const expense = await prisma.expense.findFirst({
        where: {
          id: expenseId,
          group: {
            members: {
              some: { userId },
            },
          },
        },
      });

      if (!expense) {
        throw new NotFoundError('Expense');
      }

      // Only the person who created the expense can edit it, or group admins
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId: expense.groupId,
          userId,
        },
      });

      const canEdit =
        expense.payerId === userId ||
        ['OWNER', 'ADMIN'].includes(membership?.role || '');

      if (!canEdit) {
        throw new ForbiddenError(
          'Only the person who paid or group admins can edit this expense'
        );
      }

      const updatedExpense = await prisma.$transaction(async (tx) => {
        // Update basic expense fields
        const baseUpdates = {
          description: updates.description,
          amountCents: updates.amountCents,
          date: updates.date,
          category: updates.category,
          notes: updates.notes,
          payerId: updates.payerId,
          splitType: updates.splitType,
        };

        await tx.expense.update({
          where: { id: expenseId },
          data: baseUpdates,
        });

        // Update participants if provided
        if (updates.participants) {
          // Delete existing participants
          await tx.expenseParticipant.deleteMany({
            where: { expenseId },
          });

          // Create new participants
          await tx.expenseParticipant.createMany({
            data: updates.participants.map((p) => ({
              expenseId,
              userId: p.userId,
              shareCents: p.shareCents || 0,
            })),
          });
        }

        // Return updated expense with relations
        return await tx.expense.findUnique({
          where: { id: expenseId },
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
        });
      });

      return { expense: updatedExpense };
    }
  );

  // Delete expense
  fastify.delete(
    '/:expenseId',
    { schema: expenseSchemas.deleteExpense },
    async (request) => {
      const userId = requireAuth(request);
      const { expenseId } = request.params as { expenseId: string };

      // Check if expense exists and user has access
      const expense = await prisma.expense.findFirst({
        where: {
          id: expenseId,
          group: {
            members: {
              some: { userId },
            },
          },
        },
      });

      if (!expense) {
        throw new NotFoundError('Expense');
      }

      // Only the person who created the expense can delete it, or group admins
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId: expense.groupId,
          userId,
        },
      });

      const canDelete =
        expense.payerId === userId ||
        ['OWNER', 'ADMIN'].includes(membership?.role || '');

      if (!canDelete) {
        throw new ForbiddenError(
          'Only the person who paid or group admins can delete this expense'
        );
      }

      await prisma.expense.delete({
        where: { id: expenseId },
      });

      return { success: true };
    }
  );
}
