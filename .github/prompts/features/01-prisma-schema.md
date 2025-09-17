# Feature: Prisma Schema & Database Models

**Priority**: HIGH | **Estimated Time**: 2-3 hours | **Dependencies**: None

## 🎯 Objective

Create the complete Prisma schema with all database models, relations, and indices for the Group Pay expense tracker.

## 📋 Requirements

### Database Models

Create the following models in `apps/api/prisma/schema.prisma`:

#### User Model

```prisma
model User {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique
  passwordHash String
  name         String
  photoUrl     String?
  venmoHandle  String?
  paypalLink   String?
  createdAt    DateTime @default(now())

  // Relations
  ownedGroups     Group[]
  groupMemberships GroupMember[]
  paidExpenses    Expense[]
  expenseShares   ExpenseParticipant[]
  sentSettlements Settlement[] @relation("SettlementFrom")
  receivedSettlements Settlement[] @relation("SettlementTo")
  createdInvites  Invite[]
}
```

#### Group Model

```prisma
model Group {
  id        String   @id @default(uuid()) @db.Uuid
  ownerId   String   @db.Uuid
  name      String
  currency  String   @default("USD") // ISO 4217 currency codes
  createdAt DateTime @default(now())

  // Relations
  owner       User          @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  members     GroupMember[]
  expenses    Expense[]
  settlements Settlement[]
  invites     Invite[]

  @@index([ownerId])
}
```

#### GroupMember Model

```prisma
model GroupMember {
  id       String           @id @default(uuid()) @db.Uuid
  groupId  String           @db.Uuid
  userId   String           @db.Uuid
  role     GroupMemberRole  @default(MEMBER)
  joinedAt DateTime         @default(now())

  // Relations
  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
  @@index([groupId])
  @@index([userId])
}

enum GroupMemberRole {
  OWNER
  ADMIN
  MEMBER
}
```

#### Expense Model

```prisma
model Expense {
  id          String   @id @default(uuid()) @db.Uuid
  groupId     String   @db.Uuid
  payerId     String   @db.Uuid
  description String
  amountCents Int      // Store as cents to avoid decimal precision issues
  currency    String   @default("USD")
  date        DateTime @default(now())
  category    String?
  notes       String?
  createdAt   DateTime @default(now())

  // Relations
  group        Group                 @relation(fields: [groupId], references: [id], onDelete: Cascade)
  payer        User                  @relation(fields: [payerId], references: [id])
  participants ExpenseParticipant[]
  receipts     Receipt[]

  @@index([groupId])
  @@index([payerId])
  @@index([date])
}
```

#### ExpenseParticipant Model

```prisma
model ExpenseParticipant {
  id         String @id @default(uuid()) @db.Uuid
  expenseId  String @db.Uuid
  userId     String @db.Uuid
  shareCents Int    // Amount this user owes for this expense (in cents)

  // Relations
  expense Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id])

  @@unique([expenseId, userId])
  @@index([expenseId])
  @@index([userId])
}
```

#### Settlement Model

```prisma
model Settlement {
  id          String           @id @default(uuid()) @db.Uuid
  groupId     String           @db.Uuid
  fromUserId  String           @db.Uuid
  toUserId    String           @db.Uuid
  amountCents Int
  method      SettlementMethod
  externalRef String?          // Reference ID from payment provider
  status      SettlementStatus @default(PENDING)
  createdAt   DateTime         @default(now())

  // Relations
  group    Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  fromUser User  @relation("SettlementFrom", fields: [fromUserId], references: [id])
  toUser   User  @relation("SettlementTo", fields: [toUserId], references: [id])

  @@index([groupId])
  @@index([fromUserId])
  @@index([toUserId])
}

enum SettlementMethod {
  VENMO
  PAYPAL
  ZELLE
  STRIPE_LINK
  MARK_ONLY
}

enum SettlementStatus {
  PENDING
  CONFIRMED
}
```

#### Invite Model

```prisma
model Invite {
  id        String       @id @default(uuid()) @db.Uuid
  groupId   String       @db.Uuid
  code      String       @unique
  createdBy String       @db.Uuid
  status    InviteStatus @default(PENDING)
  expiresAt DateTime
  createdAt DateTime     @default(now())

  // Relations
  group   Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  creator User  @relation(fields: [createdBy], references: [id])

  @@index([code])
  @@index([groupId])
  @@index([expiresAt])
}

enum InviteStatus {
  PENDING
  ACCEPTED
  CANCELLED
}
```

#### Receipt Model

```prisma
model Receipt {
  id        String @id @default(uuid()) @db.Uuid
  expenseId String @db.Uuid
  fileUrl   String
  mimeType  String

  // Relations
  expense Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)

  @@index([expenseId])
}
```

## 🔧 Implementation Steps

### 1. Initialize Prisma

```bash
cd apps/api
pnpm prisma init
```

### 2. Configure Database Connection

Update `apps/api/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/grouppal"
```

### 3. Create Schema File

Create the complete schema in `apps/api/prisma/schema.prisma` with:

- Generator configuration for Prisma Client
- Database provider (PostgreSQL)
- All models above with proper relations and indices

### 4. Generate Initial Migration

```bash
pnpm prisma migrate dev --name init
```

### 5. Generate Prisma Client

```bash
pnpm prisma generate
```

## ✅ Acceptance Criteria

- [ ] All 8 models are defined with correct fields and types
- [ ] All relations are properly configured with foreign keys
- [ ] Appropriate indices are added for query performance
- [ ] Enums are defined for role, method, and status fields
- [ ] UUID fields use `@db.Uuid` for PostgreSQL optimization
- [ ] Money amounts are stored as integers (cents) to avoid decimal issues
- [ ] Cascade deletes are properly configured
- [ ] Unique constraints are in place where needed
- [ ] Migration runs successfully
- [ ] Prisma Client generates without errors

## 🧪 Testing

### Manual Verification

```bash
# Check schema compilation
pnpm prisma validate

# Verify database connection
pnpm prisma db push

# Open Prisma Studio to inspect tables
pnpm prisma studio
```

### Database Queries Test

Create a simple test script to verify the schema:

```typescript
// apps/api/src/test-db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSchema() {
  // Test creating a user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash: 'hash',
      name: 'Test User',
    },
  });

  console.log('User created:', user.id);

  // Clean up
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();
}

testSchema().catch(console.error);
```

## 📚 Next Steps

After completing this feature:

1. **[Shared Types & Schemas](./02-shared-types.md)** - Generate Zod schemas from Prisma
2. **[Database Setup](./04-database-setup.md)** - Create seed data
3. **[Core API Routes](./06-core-api.md)** - Implement CRUD operations

## 📖 Resources

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [Database Design Best Practices](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate)
