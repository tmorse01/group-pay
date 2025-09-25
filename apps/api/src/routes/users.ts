import { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { UpdateUserDto, UnauthorizedError } from '@group-pay/shared';

const prisma = new PrismaClient();

// Helper to ensure user is authenticated
function requireAuth(request: FastifyRequest) {
  if (!request.authUser?.userId) {
    throw new UnauthorizedError('Authentication required');
  }
  return request.authUser.userId as string;
}

export default async function userRoutes(fastify: FastifyInstance) {
  // Update user profile
  fastify.put(
    '/profile',
    {
      schema: {
        tags: ['Users'],
        summary: 'Update user profile',
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            photoUrl: { type: 'string', format: 'uri', nullable: true },
            venmoHandle: { type: 'string', maxLength: 50, nullable: true },
            paypalLink: { type: 'string', format: 'uri', nullable: true },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  photoUrl: { type: 'string', nullable: true },
                  venmoHandle: { type: 'string', nullable: true },
                  paypalLink: { type: 'string', nullable: true },
                  updatedAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request) => {
      const userId = requireAuth(request);
      const updates = request.body as UpdateUserDto;

      const user = await prisma.user.update({
        where: { id: userId },
        data: updates,
        select: {
          id: true,
          email: true,
          name: true,
          photoUrl: true,
          venmoHandle: true,
          paypalLink: true,
          createdAt: true,
        },
      });

      return { user };
    }
  );

  // Search users by email (for adding to groups)
  fastify.get(
    '/search',
    {
      schema: {
        tags: ['Users'],
        summary: 'Search users by email',
        querystring: {
          type: 'object',
          properties: {
            email: { type: 'string', minLength: 3 },
          },
          required: ['email'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              users: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    photoUrl: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request) => {
      requireAuth(request); // Ensure user is authenticated
      const { email } = request.query as { email: string };

      if (!email || email.length < 3) {
        return { users: [] };
      }

      const users = await prisma.user.findMany({
        where: {
          email: {
            contains: email,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          photoUrl: true,
        },
        take: 10,
      });

      return { users };
    }
  );

  // Get user balances across all groups
  fastify.get(
    '/balances',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get user balances across all groups',
        response: {
          200: {
            type: 'object',
            properties: {
              balances: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    groupId: { type: 'string' },
                    groupName: { type: 'string' },
                    totalOwed: { type: 'number' },
                    totalLent: { type: 'number' },
                    netBalance: { type: 'number' },
                    currency: { type: 'string' },
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

      // Get all groups the user is a member of
      const groups = await prisma.group.findMany({
        where: {
          members: {
            some: { userId },
          },
        },
        include: {
          expenses: {
            include: {
              participants: {
                where: { userId },
              },
            },
          },
        },
      });

      const balances = groups.map((group) => {
        let totalOwed = 0;
        let totalLent = 0;

        group.expenses.forEach((expense) => {
          if (expense.payerId === userId) {
            // User paid this expense, calculate how much others owe them
            totalLent += expense.amountCents;
            // Subtract their own share
            const userShare = expense.participants.find(
              (p) => p.userId === userId
            );
            if (userShare) {
              totalLent -= userShare.shareCents;
            }
          } else {
            // User owes money for this expense
            const userShare = expense.participants.find(
              (p) => p.userId === userId
            );
            if (userShare) {
              totalOwed += userShare.shareCents;
            }
          }
        });

        return {
          groupId: group.id,
          groupName: group.name,
          totalOwed,
          totalLent,
          netBalance: totalLent - totalOwed,
          currency: group.currency,
        };
      });

      return { balances };
    }
  );

  // Get current user profile
  fastify.get(
    '/me',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get current user profile',
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  photoUrl: { type: 'string', nullable: true },
                  venmoHandle: { type: 'string', nullable: true },
                  paypalLink: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request) => {
      const userId = requireAuth(request);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          photoUrl: true,
          venmoHandle: true,
          paypalLink: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      return { user };
    }
  );
}
