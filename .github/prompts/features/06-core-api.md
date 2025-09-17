# Feature: Core API Routes

**Priority**: HIGH | **Estimated Time**: 4-5 hours | **Dependencies**: Authentication, Prisma Schema

## 🎯 Objective

Implement all core API routes for groups, expenses, payments, and user management with proper validation, error handling, and comprehensive testing.

## 📋 Requirements

### Groups API Routes

#### Group Routes Handler

```typescript
// apps/api/src/routes/groups.ts
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  CreateGroupSchema,
  UpdateGroupSchema,
  AddMemberSchema,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@group-pay/shared';

const prisma = new PrismaClient();

export default async function groupRoutes(fastify: FastifyInstance) {
  // Create new group
  fastify.post(
    '/',
    {
      schema: {
        body: CreateGroupSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              group: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
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
    async (request) => {
      const { name, description, currency } = request.body;
      const userId = request.user!.userId;

      const group = await prisma.group.create({
        data: {
          name,
          description,
          currency,
          members: {
            create: {
              userId,
              role: 'ADMIN',
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

      return {
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          currency: group.currency,
          createdAt: group.createdAt.toISOString(),
          memberCount: group._count.members,
        },
      };
    }
  );

  // Get user's groups
  fastify.get('/', async (request) => {
    const userId = request.user!.userId;

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
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        currency: group.currency,
        memberCount: group._count.members,
        expenseCount: group._count.expenses,
        lastActivity:
          group.expenses[0]?.createdAt?.toISOString() ||
          group.createdAt.toISOString(),
        createdAt: group.createdAt.toISOString(),
      })),
    };
  });

  // Get group by ID
  fastify.get('/:groupId', async (request) => {
    const { groupId } = request.params as { groupId: string };
    const userId = request.user!.userId;

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
          where: { deletedAt: null },
          include: {
            paidBy: {
              select: {
                id: true,
                name: true,
                photoUrl: true,
              },
            },
            splits: {
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
      throw new NotFoundError('Group not found');
    }

    return {
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
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
          amount: expense.amount,
          category: expense.category,
          date: expense.date.toISOString(),
          paidBy: expense.paidBy,
          splits: expense.splits,
          createdAt: expense.createdAt.toISOString(),
        })),
      },
    };
  });

  // Update group
  fastify.put(
    '/:groupId',
    {
      schema: {
        body: UpdateGroupSchema,
      },
    },
    async (request) => {
      const { groupId } = request.params as { groupId: string };
      const userId = request.user!.userId;
      const updates = request.body;

      // Check if user is admin of the group
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
          role: 'ADMIN',
        },
      });

      if (!membership) {
        throw new ForbiddenError('Only group admins can update group settings');
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
        body: AddMemberSchema,
      },
    },
    async (request) => {
      const { groupId } = request.params as { groupId: string };
      const { email } = request.body;
      const userId = request.user!.userId;

      // Check if current user is admin
      const isAdmin = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
          role: 'ADMIN',
        },
      });

      if (!isAdmin) {
        throw new ForbiddenError('Only group admins can add members');
      }

      // Find user by email
      const userToAdd = await prisma.user.findUnique({
        where: { email },
      });

      if (!userToAdd) {
        throw new NotFoundError('User with this email not found');
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
  fastify.delete('/:groupId/members/:memberId', async (request) => {
    const { groupId, memberId } = request.params as {
      groupId: string;
      memberId: string;
    };
    const userId = request.user!.userId;

    // Get membership to remove
    const membershipToRemove = await prisma.groupMember.findUnique({
      where: { id: memberId },
    });

    if (!membershipToRemove || membershipToRemove.groupId !== groupId) {
      throw new NotFoundError('Member not found in this group');
    }

    // Check permissions - admin can remove anyone, user can remove themselves
    const currentUserMembership = await prisma.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!currentUserMembership) {
      throw new ForbiddenError('You are not a member of this group');
    }

    const canRemove =
      currentUserMembership.role === 'ADMIN' ||
      membershipToRemove.userId === userId;

    if (!canRemove) {
      throw new ForbiddenError(
        'You can only remove yourself unless you are an admin'
      );
    }

    // Check if this is the last admin
    if (membershipToRemove.role === 'ADMIN') {
      const adminCount = await prisma.groupMember.count({
        where: {
          groupId,
          role: 'ADMIN',
        },
      });

      if (adminCount === 1) {
        throw new ValidationError(
          'Cannot remove the last admin from the group'
        );
      }
    }

    await prisma.groupMember.delete({
      where: { id: memberId },
    });

    return { success: true };
  });

  // Delete group (admin only)
  fastify.delete('/:groupId', async (request) => {
    const { groupId } = request.params as { groupId: string };
    const userId = request.user!.userId;

    // Check if user is admin
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        role: 'ADMIN',
      },
    });

    if (!membership) {
      throw new ForbiddenError('Only group admins can delete groups');
    }

    // Soft delete - mark as deleted but keep data for audit
    await prisma.group.update({
      where: { id: groupId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  });
}
```

### Expenses API Routes

#### Expense Routes Handler

```typescript
// apps/api/src/routes/expenses.ts
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  CreateExpenseSchema,
  UpdateExpenseSchema,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@group-pay/shared';
import {
  calculateEqualSplit,
  calculatePercentageSplit,
  calculateExactSplit,
} from '@group-pay/shared/utils';

const prisma = new PrismaClient();

export default async function expenseRoutes(fastify: FastifyInstance) {
  // Create new expense
  fastify.post(
    '/',
    {
      schema: {
        body: CreateExpenseSchema,
      },
    },
    async (request) => {
      const {
        groupId,
        description,
        amount,
        paidById,
        category,
        date,
        splitType,
        splits,
      } = request.body;
      const userId = request.user!.userId;

      // Verify user is member of the group
      const membership = await prisma.groupMember.findFirst({
        where: { groupId, userId },
      });

      if (!membership) {
        throw new ForbiddenError('You are not a member of this group');
      }

      // Verify paidBy user is in the group
      const paidByMembership = await prisma.groupMember.findFirst({
        where: { groupId, userId: paidById },
      });

      if (!paidByMembership) {
        throw new ValidationError('The payer must be a member of the group');
      }

      // Calculate splits based on type
      let calculatedSplits;

      switch (splitType) {
        case 'EQUAL':
          const memberIds = splits.map((s) => s.userId);
          calculatedSplits = calculateEqualSplit(amount, memberIds);
          break;
        case 'PERCENTAGE':
          calculatedSplits = calculatePercentageSplit(amount, splits);
          break;
        case 'EXACT':
          calculatedSplits = calculateExactSplit(amount, splits);
          break;
        default:
          throw new ValidationError('Invalid split type');
      }

      // Create expense with splits
      const expense = await prisma.expense.create({
        data: {
          groupId,
          description,
          amount,
          paidById,
          category,
          date: new Date(date),
          splitType,
          splits: {
            create: calculatedSplits.map((split) => ({
              userId: split.userId,
              amount: split.amount,
              percentage: split.percentage,
            })),
          },
        },
        include: {
          paidBy: {
            select: {
              id: true,
              name: true,
              photoUrl: true,
            },
          },
          splits: {
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

      return { expense };
    }
  );

  // Get expense by ID
  fastify.get('/:expenseId', async (request) => {
    const { expenseId } = request.params as { expenseId: string };
    const userId = request.user!.userId;

    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        deletedAt: null,
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
        paidBy: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          },
        },
        splits: {
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
      throw new NotFoundError('Expense not found');
    }

    return { expense };
  });

  // Update expense
  fastify.put(
    '/:expenseId',
    {
      schema: {
        body: UpdateExpenseSchema,
      },
    },
    async (request) => {
      const { expenseId } = request.params as { expenseId: string };
      const userId = request.user!.userId;
      const updates = request.body;

      // Check if expense exists and user has access
      const expense = await prisma.expense.findFirst({
        where: {
          id: expenseId,
          deletedAt: null,
          group: {
            members: {
              some: { userId },
            },
          },
        },
      });

      if (!expense) {
        throw new NotFoundError('Expense not found');
      }

      // Only the person who created the expense can edit it
      if (expense.paidById !== userId) {
        throw new ForbiddenError(
          'Only the person who paid can edit this expense'
        );
      }

      // If splits are being updated, recalculate them
      let updateData = { ...updates };

      if (updates.splits && updates.splitType) {
        let calculatedSplits;

        switch (updates.splitType) {
          case 'EQUAL':
            const memberIds = updates.splits.map((s) => s.userId);
            calculatedSplits = calculateEqualSplit(
              updates.amount || expense.amount,
              memberIds
            );
            break;
          case 'PERCENTAGE':
            calculatedSplits = calculatePercentageSplit(
              updates.amount || expense.amount,
              updates.splits
            );
            break;
          case 'EXACT':
            calculatedSplits = calculateExactSplit(
              updates.amount || expense.amount,
              updates.splits
            );
            break;
        }

        // Delete existing splits and create new ones
        await prisma.expenseSplit.deleteMany({
          where: { expenseId },
        });

        updateData = {
          ...updateData,
          splits: {
            create: calculatedSplits.map((split) => ({
              userId: split.userId,
              amount: split.amount,
              percentage: split.percentage,
            })),
          },
        };
      }

      const updatedExpense = await prisma.expense.update({
        where: { id: expenseId },
        data: updateData,
        include: {
          paidBy: {
            select: {
              id: true,
              name: true,
              photoUrl: true,
            },
          },
          splits: {
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

      return { expense: updatedExpense };
    }
  );

  // Delete expense
  fastify.delete('/:expenseId', async (request) => {
    const { expenseId } = request.params as { expenseId: string };
    const userId = request.user!.userId;

    // Check if expense exists and user has access
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        deletedAt: null,
        group: {
          members: {
            some: { userId },
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Only the person who created the expense can delete it
    if (expense.paidById !== userId) {
      throw new ForbiddenError(
        'Only the person who paid can delete this expense'
      );
    }

    // Soft delete
    await prisma.expense.update({
      where: { id: expenseId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  });
}
```

### Payments API Routes

#### Payment Routes Handler

```typescript
// apps/api/src/routes/payments.ts
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  CreatePaymentSchema,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@group-pay/shared';

const prisma = new PrismaClient();

export default async function paymentRoutes(fastify: FastifyInstance) {
  // Record a payment
  fastify.post(
    '/',
    {
      schema: {
        body: CreatePaymentSchema,
      },
    },
    async (request) => {
      const { fromUserId, toUserId, amount, groupId, description } =
        request.body;
      const userId = request.user!.userId;

      // Verify user is involved in the payment (either sender or receiver)
      if (userId !== fromUserId && userId !== toUserId) {
        throw new ForbiddenError(
          'You can only record payments that involve you'
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

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          fromUserId,
          toUserId,
          amount,
          groupId,
          description,
          paidAt: new Date(),
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

      return { payment };
    }
  );

  // Get payments for a group
  fastify.get('/group/:groupId', async (request) => {
    const { groupId } = request.params as { groupId: string };
    const userId = request.user!.userId;

    // Verify user is member of the group
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership) {
      throw new ForbiddenError('You are not a member of this group');
    }

    const payments = await prisma.payment.findMany({
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
      orderBy: { paidAt: 'desc' },
    });

    return { payments };
  });

  // Get user's payment history
  fastify.get('/user', async (request) => {
    const userId = request.user!.userId;

    const payments = await prisma.payment.findMany({
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
      orderBy: { paidAt: 'desc' },
    });

    return { payments };
  });
}
```

### User Routes

#### User Routes Handler

```typescript
// apps/api/src/routes/users.ts
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { UpdateUserSchema } from '@group-pay/shared';

const prisma = new PrismaClient();

export default async function userRoutes(fastify: FastifyInstance) {
  // Update user profile
  fastify.put(
    '/profile',
    {
      schema: {
        body: UpdateUserSchema,
      },
    },
    async (request) => {
      const userId = request.user!.userId;
      const updates = request.body;

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
          updatedAt: true,
        },
      });

      return { user };
    }
  );

  // Search users by email (for adding to groups)
  fastify.get('/search', async (request) => {
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
  });
}
```

## 🔧 Implementation Steps

### 1. Register Routes in App

```typescript
// apps/api/src/app.ts
import groupRoutes from './routes/groups.js';
import expenseRoutes from './routes/expenses.js';
import paymentRoutes from './routes/payments.js';
import userRoutes from './routes/users.js';

// Register routes with authentication
await app.register(groupRoutes, { prefix: '/groups' });
await app.register(expenseRoutes, { prefix: '/expenses' });
await app.register(paymentRoutes, { prefix: '/payments' });
await app.register(userRoutes, { prefix: '/users' });
```

### 2. Add API Documentation

```typescript
// apps/api/src/plugins/swagger.ts
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(require('@fastify/swagger'), {
    swagger: {
      info: {
        title: 'Group Pay API',
        description: 'API for managing shared expenses',
        version: '1.0.0',
      },
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },
    },
  });

  await fastify.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
  });
}

export default fp(swaggerPlugin);
```

### 3. Add Rate Limiting

```typescript
// apps/api/src/plugins/rateLimit.ts
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(require('@fastify/rate-limit'), {
    max: 100, // 100 requests
    timeWindow: '1 minute',
    errorResponseBuilder: (request, context) => ({
      code: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`,
      retryAfter: Math.round(context.ttl / 1000),
    }),
  });
}

export default fp(rateLimitPlugin);
```

## ✅ Acceptance Criteria

- [ ] All CRUD operations work for groups, expenses, payments
- [ ] Proper authentication on all routes
- [ ] Input validation using Zod schemas
- [ ] Comprehensive error handling
- [ ] Rate limiting implemented
- [ ] API documentation available
- [ ] Permission checks for all operations
- [ ] Soft deletes for audit trail
- [ ] Integration tests cover all endpoints

## 🧪 Testing

### API Integration Tests

```typescript
// apps/api/src/routes/__tests__/groups.test.ts
import { test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import app from '../../app.js';

const prisma = new PrismaClient();

let authCookies: string;
let testUserId: string;

beforeAll(async () => {
  await app.ready();

  // Create test user and get auth cookies
  const response = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    },
  });

  authCookies = response.cookies.map((c) => `${c.name}=${c.value}`).join('; ');

  testUserId = JSON.parse(response.body).user.id;
});

beforeEach(async () => {
  // Clean up test data
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
});

test('POST /groups - should create new group', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/groups',
    headers: { cookie: authCookies },
    payload: {
      name: 'Test Group',
      description: 'A test group',
      currency: 'USD',
    },
  });

  expect(response.statusCode).toBe(201);
  const body = JSON.parse(response.body);
  expect(body.group.name).toBe('Test Group');
  expect(body.group.memberCount).toBe(1);
});

test('GET /groups - should return user groups', async () => {
  // Create a group first
  await app.inject({
    method: 'POST',
    url: '/groups',
    headers: { cookie: authCookies },
    payload: {
      name: 'Test Group',
      description: 'A test group',
      currency: 'USD',
    },
  });

  const response = await app.inject({
    method: 'GET',
    url: '/groups',
    headers: { cookie: authCookies },
  });

  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body.groups).toHaveLength(1);
  expect(body.groups[0].name).toBe('Test Group');
});
```

## 📚 Next Steps

After completing this feature:

1. **[API Testing](./07-api-testing.md)** - Comprehensive test suite
2. **[React Frontend](./08-react-frontend.md)** - Connect frontend to API
3. **[Real-time Updates](./10-real-time.md)** - WebSocket notifications

## 🔍 Frontend Integration

Frontend services should handle API calls like this:

```typescript
// Frontend API service
const apiService = {
  async createGroup(data: CreateGroupData) {
    const response = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  },

  async getGroups() {
    const response = await fetch('/api/groups', {
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Failed to fetch groups');
    return response.json();
  },
};
```
