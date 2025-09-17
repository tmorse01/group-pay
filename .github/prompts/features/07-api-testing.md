# Feature: API Testing Suite

**Priority**: HIGH | **Estimated Time**: 3-4 hours | **Dependencies**: Core API Routes, Authentication

## 🎯 Objective

Implement comprehensive testing for all API endpoints with proper test data setup, authentication handling, and coverage reporting. Ensure robust error handling and edge case coverage.

## 📋 Requirements

### Test Infrastructure Setup

#### Vitest Configuration

```typescript
// apps/api/vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

#### Test Setup File

```typescript
// apps/api/src/test/setup.ts
import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, beforeEach } from 'vitest';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.replace('group_pay', 'group_pay_test'),
    },
  },
});

beforeAll(async () => {
  // Ensure test database is clean
  await prisma.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE`;
  await prisma.$executeRaw`CREATE SCHEMA public`;

  // Run migrations
  await prisma.$executeRaw`
    -- Your schema here or run actual migrations
  `;
});

beforeEach(async () => {
  // Clean all tables but keep schema
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
```

### Test Utilities

#### Test Helpers

```typescript
// apps/api/src/test/helpers.ts
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import app from '../app.js';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  cookies: string;
}

export interface TestGroup {
  id: string;
  name: string;
  currency: string;
  adminId: string;
}

export class TestHelper {
  private app: FastifyInstance;
  private prisma: PrismaClient;

  constructor() {
    this.app = app;
    this.prisma = new PrismaClient();
  }

  async ready() {
    await this.app.ready();
  }

  async close() {
    await this.app.close();
  }

  async createTestUser(userData?: {
    email?: string;
    name?: string;
    password?: string;
  }): Promise<TestUser> {
    const email = userData?.email || `test-${Date.now()}@example.com`;
    const name = userData?.name || 'Test User';
    const password = userData?.password || 'password123';

    const response = await this.app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email, name, password },
    });

    if (response.statusCode !== 201) {
      throw new Error(`Failed to create test user: ${response.body}`);
    }

    const body = JSON.parse(response.body);
    const cookies = response.cookies
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    return {
      id: body.user.id,
      email: body.user.email,
      name: body.user.name,
      cookies,
    };
  }

  async createTestGroup(
    adminUser: TestUser,
    groupData?: {
      name?: string;
      description?: string;
      currency?: string;
    }
  ): Promise<TestGroup> {
    const name = groupData?.name || `Test Group ${Date.now()}`;
    const description = groupData?.description || 'Test description';
    const currency = groupData?.currency || 'USD';

    const response = await this.app.inject({
      method: 'POST',
      url: '/groups',
      headers: { cookie: adminUser.cookies },
      payload: { name, description, currency },
    });

    if (response.statusCode !== 201) {
      throw new Error(`Failed to create test group: ${response.body}`);
    }

    const body = JSON.parse(response.body);
    return {
      id: body.group.id,
      name: body.group.name,
      currency: body.group.currency,
      adminId: adminUser.id,
    };
  }

  async addUserToGroup(group: TestGroup, user: TestUser, adminUser: TestUser) {
    const response = await this.app.inject({
      method: 'POST',
      url: `/groups/${group.id}/members`,
      headers: { cookie: adminUser.cookies },
      payload: { email: user.email },
    });

    if (response.statusCode !== 200) {
      throw new Error(`Failed to add user to group: ${response.body}`);
    }

    return JSON.parse(response.body);
  }

  async createTestExpense(
    group: TestGroup,
    paidByUser: TestUser,
    expenseData?: {
      description?: string;
      amount?: number;
      category?: string;
      splits?: Array<{ userId: string; amount?: number; percentage?: number }>;
    }
  ) {
    const description = expenseData?.description || 'Test expense';
    const amount = expenseData?.amount || 100;
    const category = expenseData?.category || 'FOOD';
    const splits = expenseData?.splits || [{ userId: paidByUser.id }];

    const response = await this.app.inject({
      method: 'POST',
      url: '/expenses',
      headers: { cookie: paidByUser.cookies },
      payload: {
        groupId: group.id,
        description,
        amount,
        paidById: paidByUser.id,
        category,
        date: new Date().toISOString(),
        splitType: 'EQUAL',
        splits,
      },
    });

    if (response.statusCode !== 201) {
      throw new Error(`Failed to create test expense: ${response.body}`);
    }

    return JSON.parse(response.body);
  }

  // Assertion helpers
  async assertUserCanAccessGroup(user: TestUser, groupId: string) {
    const response = await this.app.inject({
      method: 'GET',
      url: `/groups/${groupId}`,
      headers: { cookie: user.cookies },
    });

    if (response.statusCode !== 200) {
      throw new Error(`User should have access to group ${groupId}`);
    }

    return JSON.parse(response.body);
  }

  async assertUserCannotAccessGroup(user: TestUser, groupId: string) {
    const response = await this.app.inject({
      method: 'GET',
      url: `/groups/${groupId}`,
      headers: { cookie: user.cookies },
    });

    if (response.statusCode === 200) {
      throw new Error(`User should not have access to group ${groupId}`);
    }
  }

  // Database cleanup helpers
  async cleanupTestData() {
    await this.prisma.payment.deleteMany();
    await this.prisma.expenseSplit.deleteMany();
    await this.prisma.expense.deleteMany();
    await this.prisma.groupMember.deleteMany();
    await this.prisma.group.deleteMany();
    await this.prisma.user.deleteMany();
  }
}

export const testHelper = new TestHelper();
```

### Authentication Tests

#### Auth Route Tests

```typescript
// apps/api/src/routes/__tests__/auth.test.ts
import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from 'vitest';
import { testHelper } from '../../test/helpers.js';

describe('Authentication Routes', () => {
  beforeAll(async () => {
    await testHelper.ready();
  });

  afterAll(async () => {
    await testHelper.close();
  });

  beforeEach(async () => {
    await testHelper.cleanupTestData();
  });

  describe('POST /auth/register', () => {
    test('should register new user with valid data', async () => {
      const user = await testHelper.createTestUser({
        email: 'newuser@example.com',
        name: 'New User',
        password: 'securepassword123',
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('newuser@example.com');
      expect(user.name).toBe('New User');
      expect(user.cookies).toContain('accessToken');
    });

    test('should reject registration with duplicate email', async () => {
      const email = 'duplicate@example.com';

      // Create first user
      await testHelper.createTestUser({ email });

      // Try to create second user with same email
      const app = testHelper['app'];
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email,
          name: 'Second User',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('already exists');
    });

    test('should reject registration with invalid email', async () => {
      const app = testHelper['app'];
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'invalid-email',
          name: 'Test User',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    test('should reject registration with weak password', async () => {
      const app = testHelper['app'];
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          name: 'Test User',
          password: '123', // Too short
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    test('should login with correct credentials', async () => {
      const email = 'login@example.com';
      const password = 'password123';

      // Create user first
      await testHelper.createTestUser({ email, password });

      // Login
      const app = testHelper['app'];
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.user.email).toBe(email);
      expect(response.cookies.some((c) => c.name === 'accessToken')).toBe(true);
    });

    test('should reject login with incorrect password', async () => {
      const email = 'test@example.com';
      await testHelper.createTestUser({ email, password: 'correctpassword' });

      const app = testHelper['app'];
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password: 'wrongpassword' },
      });

      expect(response.statusCode).toBe(401);
    });

    test('should reject login with non-existent email', async () => {
      const app = testHelper['app'];
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    test('should refresh access token with valid refresh token', async () => {
      const user = await testHelper.createTestUser();

      const app = testHelper['app'];
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: { cookie: user.cookies },
      });

      expect(response.statusCode).toBe(200);
      expect(response.cookies.some((c) => c.name === 'accessToken')).toBe(true);
    });

    test('should reject refresh with no token', async () => {
      const app = testHelper['app'];
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    test('should return current user data', async () => {
      const user = await testHelper.createTestUser();

      const app = testHelper['app'];
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { cookie: user.cookies },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.user.id).toBe(user.id);
      expect(body.user.email).toBe(user.email);
    });

    test('should reject unauthenticated request', async () => {
      const app = testHelper['app'];
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    test('should logout user and clear cookies', async () => {
      const user = await testHelper.createTestUser();

      const app = testHelper['app'];
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: { cookie: user.cookies },
      });

      expect(response.statusCode).toBe(200);

      // Check that cookies are cleared
      const clearedCookies = response.cookies.filter(
        (c) => c.name === 'accessToken' || c.name === 'refreshToken'
      );
      expect(clearedCookies.length).toBeGreaterThan(0);
      expect(clearedCookies.every((c) => c.value === '')).toBe(true);
    });
  });
});
```

### Groups API Tests

#### Groups Route Tests

```typescript
// apps/api/src/routes/__tests__/groups.test.ts
import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from 'vitest';
import { testHelper } from '../../test/helpers.js';

describe('Groups Routes', () => {
  beforeAll(async () => {
    await testHelper.ready();
  });

  afterAll(async () => {
    await testHelper.close();
  });

  beforeEach(async () => {
    await testHelper.cleanupTestData();
  });

  describe('POST /groups', () => {
    test('should create new group', async () => {
      const user = await testHelper.createTestUser();
      const group = await testHelper.createTestGroup(user, {
        name: 'Test Group',
        description: 'A test group',
        currency: 'USD',
      });

      expect(group.id).toBeDefined();
      expect(group.name).toBe('Test Group');
      expect(group.currency).toBe('USD');
    });

    test('should reject unauthenticated request', async () => {
      const app = testHelper['app'];
      const response = await app.inject({
        method: 'POST',
        url: '/groups',
        payload: {
          name: 'Test Group',
          description: 'Test',
          currency: 'USD',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    test('should validate required fields', async () => {
      const user = await testHelper.createTestUser();
      const app = testHelper['app'];

      const response = await app.inject({
        method: 'POST',
        url: '/groups',
        headers: { cookie: user.cookies },
        payload: {
          // Missing required fields
          description: 'Test',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /groups', () => {
    test('should return user groups', async () => {
      const user = await testHelper.createTestUser();
      const group1 = await testHelper.createTestGroup(user, {
        name: 'Group 1',
      });
      const group2 = await testHelper.createTestGroup(user, {
        name: 'Group 2',
      });

      const app = testHelper['app'];
      const response = await app.inject({
        method: 'GET',
        url: '/groups',
        headers: { cookie: user.cookies },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.groups).toHaveLength(2);
      expect(body.groups.map((g) => g.name)).toContain('Group 1');
      expect(body.groups.map((g) => g.name)).toContain('Group 2');
    });

    test('should only return groups user is member of', async () => {
      const user1 = await testHelper.createTestUser({
        email: 'user1@example.com',
      });
      const user2 = await testHelper.createTestUser({
        email: 'user2@example.com',
      });

      await testHelper.createTestGroup(user1, { name: 'User 1 Group' });
      await testHelper.createTestGroup(user2, { name: 'User 2 Group' });

      const app = testHelper['app'];
      const response = await app.inject({
        method: 'GET',
        url: '/groups',
        headers: { cookie: user1.cookies },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.groups).toHaveLength(1);
      expect(body.groups[0].name).toBe('User 1 Group');
    });
  });

  describe('GET /groups/:groupId', () => {
    test('should return group details for member', async () => {
      const user = await testHelper.createTestUser();
      const group = await testHelper.createTestGroup(user);

      const app = testHelper['app'];
      const response = await app.inject({
        method: 'GET',
        url: `/groups/${group.id}`,
        headers: { cookie: user.cookies },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.group.id).toBe(group.id);
      expect(body.group.members).toHaveLength(1);
      expect(body.group.members[0].user.id).toBe(user.id);
    });

    test('should reject access for non-member', async () => {
      const user1 = await testHelper.createTestUser({
        email: 'user1@example.com',
      });
      const user2 = await testHelper.createTestUser({
        email: 'user2@example.com',
      });
      const group = await testHelper.createTestGroup(user1);

      await testHelper.assertUserCannotAccessGroup(user2, group.id);
    });
  });

  describe('POST /groups/:groupId/members', () => {
    test('should add member to group by admin', async () => {
      const admin = await testHelper.createTestUser({
        email: 'admin@example.com',
      });
      const newUser = await testHelper.createTestUser({
        email: 'newuser@example.com',
      });
      const group = await testHelper.createTestGroup(admin);

      await testHelper.addUserToGroup(group, newUser, admin);

      // Verify new user can access the group
      await testHelper.assertUserCanAccessGroup(newUser, group.id);
    });

    test('should reject adding member by non-admin', async () => {
      const admin = await testHelper.createTestUser({
        email: 'admin@example.com',
      });
      const member = await testHelper.createTestUser({
        email: 'member@example.com',
      });
      const newUser = await testHelper.createTestUser({
        email: 'newuser@example.com',
      });
      const group = await testHelper.createTestGroup(admin);

      // Add member (not admin)
      await testHelper.addUserToGroup(group, member, admin);

      // Try to add another user as member (should fail)
      const app = testHelper['app'];
      const response = await app.inject({
        method: 'POST',
        url: `/groups/${group.id}/members`,
        headers: { cookie: member.cookies },
        payload: { email: newUser.email },
      });

      expect(response.statusCode).toBe(403);
    });
  });
});
```

### Performance Tests

#### Load Testing

```typescript
// apps/api/src/test/performance.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { testHelper } from './helpers.js';

describe('Performance Tests', () => {
  beforeAll(async () => {
    await testHelper.ready();
  });

  afterAll(async () => {
    await testHelper.close();
  });

  test('should handle multiple concurrent group creations', async () => {
    const users = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        testHelper.createTestUser({ email: `user${i}@example.com` })
      )
    );

    const startTime = Date.now();

    const promises = users.map((user) =>
      testHelper.createTestGroup(user, { name: `Group ${user.email}` })
    );

    const groups = await Promise.all(promises);
    const endTime = Date.now();

    expect(groups).toHaveLength(10);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
  });

  test('should handle large group with many expenses', async () => {
    const admin = await testHelper.createTestUser();
    const group = await testHelper.createTestGroup(admin);

    // Add 50 members to the group
    const members = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        testHelper.createTestUser({ email: `member${i}@example.com` })
      )
    );

    await Promise.all(
      members.map((member) => testHelper.addUserToGroup(group, member, admin))
    );

    // Create 100 expenses
    const startTime = Date.now();

    await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        testHelper.createTestExpense(group, admin, {
          description: `Expense ${i}`,
          amount: Math.floor(Math.random() * 1000) + 10,
        })
      )
    );

    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(10000); // Should complete in under 10 seconds

    // Verify group details load quickly
    const loadStartTime = Date.now();
    await testHelper.assertUserCanAccessGroup(admin, group.id);
    const loadEndTime = Date.now();

    expect(loadEndTime - loadStartTime).toBeLessThan(1000); // Should load in under 1 second
  });
});
```

## 🔧 Implementation Steps

### 1. Install Testing Dependencies

```bash
cd apps/api
pnpm add -D vitest @vitest/coverage-v8 supertest @types/supertest
```

### 2. Add Test Scripts

```json
// apps/api/package.json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ci": "vitest run --coverage"
  }
}
```

### 3. Configure Test Database

```bash
# Create test database
createdb group_pay_test

# Set test environment
export DATABASE_URL="postgresql://username:password@localhost:5432/group_pay_test"
```

### 4. Add to CI/CD Pipeline

```yaml
# .github/workflows/test.yml
- name: Run API Tests
  run: |
    cd apps/api
    pnpm test:ci
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/group_pay_test
```

## ✅ Acceptance Criteria

- [ ] All API endpoints have comprehensive tests
- [ ] Authentication tests cover all scenarios
- [ ] Permission tests verify access controls
- [ ] Error handling tests cover edge cases
- [ ] Performance tests validate response times
- [ ] Test coverage meets 80% threshold
- [ ] Tests run reliably in CI/CD
- [ ] Test data cleanup works properly
- [ ] Integration tests cover user workflows

## 🧪 Running Tests

### Local Development

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test auth.test.ts

# Run in watch mode
pnpm test:watch
```

### CI/CD Environment

```bash
# Run once with coverage
pnpm test:ci
```

## 📚 Next Steps

After completing this feature:

1. **[React Frontend](./08-react-frontend.md)** - Build the user interface
2. **[E2E Testing](./11-e2e-testing.md)** - End-to-end test coverage
3. **[Deployment](./12-deployment.md)** - Production deployment

## 📊 Test Coverage Reports

The test suite generates coverage reports in multiple formats:

- **Console**: Quick overview during development
- **HTML**: Detailed line-by-line coverage at `coverage/index.html`
- **JSON**: Machine-readable format for CI/CD integration

Review coverage reports to identify untested code paths and maintain quality standards.
