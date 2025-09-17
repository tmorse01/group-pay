# Feature: Database Setup & Environment Configuration

**Priority**: CRITICAL | **Estimated Time**: 2-3 hours | **Dependencies**: Prisma Schema

## 🎯 Objective

Set up PostgreSQL database, configure Prisma ORM, implement database migrations, and establish proper environment configuration for development, testing, and production environments.

## 📋 Requirements

### Database Installation & Setup

#### PostgreSQL Installation

```bash
# macOS with Homebrew
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Windows - Download from https://www.postgresql.org/download/windows/
# Or use Docker
docker run --name group-pay-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=group_pay \
  -p 5432:5432 \
  -d postgres:15
```

#### Database Creation

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create databases
CREATE DATABASE group_pay;
CREATE DATABASE group_pay_test;

-- Create user (optional but recommended)
CREATE USER group_pay_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE group_pay TO group_pay_user;
GRANT ALL PRIVILEGES ON DATABASE group_pay_test TO group_pay_user;

-- Exit psql
\q
```

### Environment Configuration

#### API Environment Variables

```bash
# apps/api/.env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/group_pay"
DATABASE_URL_TEST="postgresql://username:password@localhost:5432/group_pay_test"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key-minimum-32-characters-long"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

# Logging
LOG_LEVEL="info"

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# Email Configuration (for future use)
EMAIL_FROM="noreply@group-pay.com"
EMAIL_SERVICE="sendgrid"
SENDGRID_API_KEY=""

# File Upload (for future use)
MAX_FILE_SIZE=5242880
UPLOAD_DEST="uploads/"

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET="another-super-secure-secret-for-sessions"

# External APIs (for future integrations)
VENMO_CLIENT_ID=""
VENMO_CLIENT_SECRET=""
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
```

#### Environment Validation Schema

```typescript
// apps/api/src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_URL_TEST: z.string().url().optional(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Server
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  SESSION_SECRET: z.string().min(32).optional(),

  // File Upload
  MAX_FILE_SIZE: z.coerce.number().default(5242880), // 5MB
  UPLOAD_DEST: z.string().default('uploads/'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment configuration:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

// Export validated config
export const env = validateEnv();
```

### Prisma Configuration

#### Enhanced Prisma Schema

```prisma
// apps/api/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String
  photoUrl     String?  @map("photo_url")
  venmoHandle  String?  @map("venmo_handle")
  paypalLink   String?  @map("paypal_link")

  // Timestamps
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  groupMemberships GroupMember[]
  expensesPaid     Expense[]     @relation("ExpensePaidBy")
  expenseSplits    ExpenseSplit[]
  paymentsFrom     Payment[]     @relation("PaymentFrom")
  paymentsTo       Payment[]     @relation("PaymentTo")

  @@map("users")
}

model Group {
  id          String   @id @default(cuid())
  name        String
  description String?
  currency    String   @default("USD")

  // Soft delete
  deletedAt DateTime? @map("deleted_at")

  // Timestamps
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  members  GroupMember[]
  expenses Expense[]
  payments Payment[]

  @@map("groups")
}

model GroupMember {
  id       String          @id @default(cuid())
  groupId  String          @map("group_id")
  userId   String          @map("user_id")
  role     GroupMemberRole @default(MEMBER)
  joinedAt DateTime        @default(now()) @map("joined_at")

  // Relations
  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
  @@map("group_members")
}

model Expense {
  id          String     @id @default(cuid())
  groupId     String     @map("group_id")
  description String
  amount      Decimal    @db.Decimal(10, 2)
  paidById    String     @map("paid_by_id")
  category    String     @default("OTHER")
  date        DateTime   @default(now())
  splitType   SplitType  @default(EQUAL) @map("split_type")

  // Soft delete
  deletedAt DateTime? @map("deleted_at")

  // Timestamps
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  group  Group          @relation(fields: [groupId], references: [id], onDelete: Cascade)
  paidBy User           @relation("ExpensePaidBy", fields: [paidById], references: [id])
  splits ExpenseSplit[]

  @@map("expenses")
}

model ExpenseSplit {
  id         String  @id @default(cuid())
  expenseId  String  @map("expense_id")
  userId     String  @map("user_id")
  amount     Decimal @db.Decimal(10, 2)
  percentage Decimal? @db.Decimal(5, 2)

  // Relations
  expense Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([expenseId, userId])
  @@map("expense_splits")
}

model Payment {
  id          String   @id @default(cuid())
  fromUserId  String   @map("from_user_id")
  toUserId    String   @map("to_user_id")
  groupId     String   @map("group_id")
  amount      Decimal  @db.Decimal(10, 2)
  description String?
  paidAt      DateTime @default(now()) @map("paid_at")

  // Timestamps
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  fromUser User  @relation("PaymentFrom", fields: [fromUserId], references: [id])
  toUser   User  @relation("PaymentTo", fields: [toUserId], references: [id])
  group    Group @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@map("payments")
}

// Enums
enum GroupMemberRole {
  ADMIN
  MEMBER
}

enum SplitType {
  EQUAL
  PERCENTAGE
  EXACT
}
```

#### Prisma Client Configuration

```typescript
// apps/api/src/lib/prisma.ts
import { PrismaClient } from '../generated/prisma';
import { env } from '../config/env.js';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log:
      env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
```

### Database Migrations

#### Initial Migration

```sql
-- apps/api/prisma/migrations/001_initial/migration.sql
-- CreateEnum
CREATE TYPE "GroupMemberRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "SplitType" AS ENUM ('EQUAL', 'PERCENTAGE', 'EXACT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photo_url" TEXT,
    "venmo_handle" TEXT,
    "paypal_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "GroupMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paid_by_id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "split_type" "SplitType" NOT NULL DEFAULT 'EQUAL',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_splits" (
    "id" TEXT NOT NULL,
    "expense_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "percentage" DECIMAL(5,2),

    CONSTRAINT "expense_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_user_id_key" ON "group_members"("group_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_splits_expense_id_user_id_key" ON "expense_splits"("expense_id", "user_id");

-- CreateIndex
CREATE INDEX "groups_deleted_at_idx" ON "groups"("deleted_at");

-- CreateIndex
CREATE INDEX "expenses_group_id_idx" ON "expenses"("group_id");

-- CreateIndex
CREATE INDEX "expenses_deleted_at_idx" ON "expenses"("deleted_at");

-- CreateIndex
CREATE INDEX "payments_group_id_idx" ON "payments"("group_id");

-- CreateIndex
CREATE INDEX "payments_from_user_id_idx" ON "payments"("from_user_id");

-- CreateIndex
CREATE INDEX "payments_to_user_id_idx" ON "payments"("to_user_id");

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paid_by_id_fkey" FOREIGN KEY ("paid_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

#### Database Seeding

```typescript
// apps/api/prisma/seed.ts
import { PrismaClient } from '../src/generated/prisma';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test users
  const passwordHash = await argon2.hash('password123');

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      passwordHash,
      name: 'Alice Johnson',
      venmoHandle: '@alice-j',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      passwordHash,
      name: 'Bob Smith',
      paypalLink: 'https://paypal.me/bobsmith',
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      email: 'charlie@example.com',
      passwordHash,
      name: 'Charlie Brown',
    },
  });

  // Create test group
  const group = await prisma.group.upsert({
    where: { id: 'test-group-1' },
    update: {},
    create: {
      id: 'test-group-1',
      name: 'Weekend Trip',
      description: 'Our awesome weekend getaway',
      currency: 'USD',
      members: {
        create: [
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'MEMBER' },
          { userId: charlie.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Create test expenses
  const expense1 = await prisma.expense.create({
    data: {
      groupId: group.id,
      description: 'Hotel booking',
      amount: 300,
      paidById: alice.id,
      category: 'ACCOMMODATION',
      splitType: 'EQUAL',
      splits: {
        create: [
          { userId: alice.id, amount: 100 },
          { userId: bob.id, amount: 100 },
          { userId: charlie.id, amount: 100 },
        ],
      },
    },
  });

  const expense2 = await prisma.expense.create({
    data: {
      groupId: group.id,
      description: 'Dinner at restaurant',
      amount: 120,
      paidById: bob.id,
      category: 'FOOD',
      splitType: 'EXACT',
      splits: {
        create: [
          { userId: alice.id, amount: 45 },
          { userId: bob.id, amount: 35 },
          { userId: charlie.id, amount: 40 },
        ],
      },
    },
  });

  // Create test payment
  await prisma.payment.create({
    data: {
      fromUserId: bob.id,
      toUserId: alice.id,
      groupId: group.id,
      amount: 100,
      description: 'Hotel share payment',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log({
    users: [alice, bob, charlie],
    group,
    expenses: [expense1, expense2],
  });
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Database Management Scripts

#### Package.json Scripts

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset --force",
    "db:push": "prisma db push",
    "db:pull": "prisma db pull",
    "db:validate": "prisma validate",
    "db:format": "prisma format"
  }
}
```

#### Database Health Check

```typescript
// apps/api/src/routes/health.ts
import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    const startTime = Date.now();

    try {
      // Check database connectivity
      await prisma.$queryRaw`SELECT 1`;
      const dbTime = Date.now() - startTime;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: 'connected',
          responseTime: `${dbTime}ms`,
        },
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  });

  fastify.get('/health/db', async () => {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          version() as version,
          current_database() as database,
          current_user as user,
          inet_server_addr() as host,
          inet_server_port() as port
      `;

      const stats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes
        FROM pg_stat_user_tables
        ORDER BY schemaname, tablename
      `;

      return {
        connection: result,
        statistics: stats,
      };
    } catch (error) {
      throw new Error(`Database health check failed: ${error}`);
    }
  });
}
```

## 🔧 Implementation Steps

### 1. Database Setup

```bash
# Install PostgreSQL (choose your method)
# macOS
brew install postgresql
brew services start postgresql

# Create databases
createdb group_pay
createdb group_pay_test
```

### 2. Environment Configuration

```bash
cd apps/api
cp .env.example .env
# Edit .env with your database credentials and secrets
```

### 3. Prisma Setup

```bash
cd apps/api
pnpm add prisma @prisma/client
pnpm add -D tsx

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed
```

### 4. Verify Setup

```bash
# Check database connection
pnpm db:studio

# Run health check endpoint
curl http://localhost:3001/health
```

## ✅ Acceptance Criteria

- [ ] PostgreSQL database installed and running
- [ ] Development and test databases created
- [ ] Environment variables properly configured
- [ ] Prisma schema matches requirements
- [ ] Database migrations run successfully
- [ ] Seed data creates test records
- [ ] Database health checks work
- [ ] Prisma Studio accessible
- [ ] Database indexes optimize queries
- [ ] Backup strategy documented

## 🧪 Testing Database Setup

### Database Connection Test

```typescript
// apps/api/src/test/database.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma.js';

describe('Database Connection', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should connect to database', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    expect(result).toBeDefined();
  });

  test('should create and read user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test-db@example.com',
        passwordHash: 'hash',
        name: 'Test User',
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('test-db@example.com');

    // Cleanup
    await prisma.user.delete({
      where: { id: user.id },
    });
  });
});
```

## 📚 Next Steps

After completing this feature:

1. **[Prisma Schema Implementation](./01-prisma-schema.md)** - Apply the complete schema
2. **[Authentication Setup](./05-authentication.md)** - Implement auth with database
3. **[API Testing](./07-api-testing.md)** - Test with real database

## 🔐 Security Considerations

### Database Security

- Use strong passwords for database users
- Configure PostgreSQL authentication properly
- Enable SSL in production
- Regular database backups
- Monitor database access logs

### Environment Security

- Never commit `.env` files
- Use different secrets for each environment
- Rotate JWT secrets regularly
- Use secure password hashing (argon2)

## 🚀 Production Database Setup

### Environment Variables for Production

```bash
# Production environment
DATABASE_URL="postgresql://user:password@hostname:5432/group_pay_prod"
JWT_SECRET="production-secret-minimum-32-characters"
NODE_ENV="production"
LOG_LEVEL="warn"
```

### Database Migration in Production

```bash
# Deploy migrations (no prompts)
pnpm db:migrate:prod

# Verify deployment
curl https://api.group-pay.com/health/db
```
