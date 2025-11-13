import {
  PrismaClient,
  ExpenseSplitType,
  SettlementMethod,
  SettlementStatus,
  InviteStatus,
} from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

// Helper function to generate random invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper function to get date in the past
function getPastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

// Helper function to get date in the future
function getFutureDate(daysAhead: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Create password hash for all users
  const passwordHash = await argon2.hash('password123');

  // ============================================================================
  // 1. CREATE DIVERSE USERS (10-15 users)
  // ============================================================================
  console.log('📝 Creating users...');

  const users = {
    alice: await prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: {
        email: 'alice@example.com',
        passwordHash,
        name: 'Alice Johnson',
        venmoHandle: '@alice-j',
        photoUrl: 'https://i.pravatar.cc/150?img=1',
      },
    }),
    bob: await prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: {
        email: 'bob@example.com',
        passwordHash,
        name: 'Bob Smith',
        paypalLink: 'https://paypal.me/bobsmith',
      },
    }),
    charlie: await prisma.user.upsert({
      where: { email: 'charlie@example.com' },
      update: {},
      create: {
        email: 'charlie@example.com',
        passwordHash,
        name: 'Charlie Brown',
        venmoHandle: '@charlie-b',
        paypalLink: 'https://paypal.me/charlie',
      },
    }),
    david: await prisma.user.upsert({
      where: { email: 'david@example.com' },
      update: {},
      create: {
        email: 'david@example.com',
        passwordHash,
        name: 'David Williams',
        venmoHandle: '@david-w',
        photoUrl: 'https://i.pravatar.cc/150?img=4',
      },
    }),
    eve: await prisma.user.upsert({
      where: { email: 'eve@example.com' },
      update: {},
      create: {
        email: 'eve@example.com',
        passwordHash,
        name: 'Eve Martinez',
        paypalLink: 'https://paypal.me/evemartinez',
        photoUrl: 'https://i.pravatar.cc/150?img=5',
      },
    }),
    frank: await prisma.user.upsert({
      where: { email: 'frank@example.com' },
      update: {},
      create: {
        email: 'frank@example.com',
        passwordHash,
        name: 'Frank Anderson',
        venmoHandle: '@frank-a',
        paypalLink: 'https://paypal.me/frankanderson',
      },
    }),
    grace: await prisma.user.upsert({
      where: { email: 'grace@example.com' },
      update: {},
      create: {
        email: 'grace@example.com',
        passwordHash,
        name: 'Grace Lee',
        venmoHandle: '@grace-l',
      },
    }),
    henry: await prisma.user.upsert({
      where: { email: 'henry@example.com' },
      update: {},
      create: {
        email: 'henry@example.com',
        passwordHash,
        name: 'Henry Taylor',
        paypalLink: 'https://paypal.me/henrytaylor',
        photoUrl: 'https://i.pravatar.cc/150?img=8',
      },
    }),
    iris: await prisma.user.upsert({
      where: { email: 'iris@example.com' },
      update: {},
      create: {
        email: 'iris@example.com',
        passwordHash,
        name: 'Iris Chen',
        venmoHandle: '@iris-c',
        paypalLink: 'https://paypal.me/irischen',
      },
    }),
    jack: await prisma.user.upsert({
      where: { email: 'jack@example.com' },
      update: {},
      create: {
        email: 'jack@example.com',
        passwordHash,
        name: 'Jack Wilson',
        venmoHandle: '@jack-w',
      },
    }),
    kate: await prisma.user.upsert({
      where: { email: 'kate@example.com' },
      update: {},
      create: {
        email: 'kate@example.com',
        passwordHash,
        name: 'Kate Moore',
        paypalLink: 'https://paypal.me/katemoore',
        photoUrl: 'https://i.pravatar.cc/150?img=11',
      },
    }),
    liam: await prisma.user.upsert({
      where: { email: 'liam@example.com' },
      update: {},
      create: {
        email: 'liam@example.com',
        passwordHash,
        name: 'Liam Jackson',
        // No payment methods - testing edge case
      },
    }),
  };

  console.log(`✅ Created ${Object.keys(users).length} users`);

  // ============================================================================
  // 2. CREATE MULTIPLE GROUPS (5-8 groups)
  // ============================================================================
  console.log('👥 Creating groups...');

  // Group 1: Weekend Trip - 3 members, USD, active with expenses
  const weekendTrip = await prisma.group.create({
    data: {
      ownerId: users.alice.id,
      name: 'Weekend Trip',
      currency: 'USD',
      createdAt: getPastDate(30),
      members: {
        create: [
          { userId: users.alice.id, role: 'OWNER', joinedAt: getPastDate(30) },
          { userId: users.bob.id, role: 'MEMBER', joinedAt: getPastDate(29) },
          {
            userId: users.charlie.id,
            role: 'MEMBER',
            joinedAt: getPastDate(29),
          },
        ],
      },
    },
  });

  // Group 2: Office Lunch - 5 members, USD, regular expenses
  const officeLunch = await prisma.group.create({
    data: {
      ownerId: users.david.id,
      name: 'Office Lunch',
      currency: 'USD',
      createdAt: getPastDate(60),
      members: {
        create: [
          { userId: users.david.id, role: 'OWNER', joinedAt: getPastDate(60) },
          { userId: users.eve.id, role: 'ADMIN', joinedAt: getPastDate(59) },
          { userId: users.frank.id, role: 'MEMBER', joinedAt: getPastDate(58) },
          { userId: users.grace.id, role: 'MEMBER', joinedAt: getPastDate(57) },
          { userId: users.henry.id, role: 'MEMBER', joinedAt: getPastDate(56) },
        ],
      },
    },
  });

  // Group 3: European Vacation - 4 members, EUR, multiple expenses
  const europeVacation = await prisma.group.create({
    data: {
      ownerId: users.iris.id,
      name: 'European Vacation',
      currency: 'EUR',
      createdAt: getPastDate(90),
      members: {
        create: [
          { userId: users.iris.id, role: 'OWNER', joinedAt: getPastDate(90) },
          { userId: users.jack.id, role: 'MEMBER', joinedAt: getPastDate(89) },
          { userId: users.kate.id, role: 'MEMBER', joinedAt: getPastDate(88) },
          { userId: users.liam.id, role: 'MEMBER', joinedAt: getPastDate(87) },
        ],
      },
    },
  });

  // Group 4: Roommates - 2 members, USD, recurring expenses
  const roommates = await prisma.group.create({
    data: {
      ownerId: users.alice.id,
      name: 'Roommates',
      currency: 'USD',
      createdAt: getPastDate(180),
      members: {
        create: [
          { userId: users.alice.id, role: 'OWNER', joinedAt: getPastDate(180) },
          { userId: users.bob.id, role: 'MEMBER', joinedAt: getPastDate(180) },
        ],
      },
    },
  });

  // Group 5: Family Reunion - 8 members, USD, large expenses
  const familyReunion = await prisma.group.create({
    data: {
      ownerId: users.charlie.id,
      name: 'Family Reunion',
      currency: 'USD',
      createdAt: getPastDate(45),
      members: {
        create: [
          {
            userId: users.charlie.id,
            role: 'OWNER',
            joinedAt: getPastDate(45),
          },
          { userId: users.david.id, role: 'ADMIN', joinedAt: getPastDate(44) },
          { userId: users.eve.id, role: 'MEMBER', joinedAt: getPastDate(43) },
          { userId: users.frank.id, role: 'MEMBER', joinedAt: getPastDate(42) },
          { userId: users.grace.id, role: 'MEMBER', joinedAt: getPastDate(41) },
          { userId: users.henry.id, role: 'MEMBER', joinedAt: getPastDate(40) },
          { userId: users.iris.id, role: 'MEMBER', joinedAt: getPastDate(39) },
          { userId: users.jack.id, role: 'MEMBER', joinedAt: getPastDate(38) },
        ],
      },
    },
  });

  // Group 6: New Group - 3 members, USD, no expenses yet
  const newGroup = await prisma.group.create({
    data: {
      ownerId: users.kate.id,
      name: 'New Group',
      currency: 'USD',
      createdAt: getPastDate(5),
      members: {
        create: [
          { userId: users.kate.id, role: 'OWNER', joinedAt: getPastDate(5) },
          { userId: users.liam.id, role: 'MEMBER', joinedAt: getPastDate(4) },
          { userId: users.alice.id, role: 'MEMBER', joinedAt: getPastDate(3) },
        ],
      },
    },
  });

  // Group 7: Inactive Group - 4 members, USD, old expenses only
  const inactiveGroup = await prisma.group.create({
    data: {
      ownerId: users.frank.id,
      name: 'Inactive Group',
      currency: 'USD',
      createdAt: getPastDate(200),
      members: {
        create: [
          { userId: users.frank.id, role: 'OWNER', joinedAt: getPastDate(200) },
          {
            userId: users.grace.id,
            role: 'MEMBER',
            joinedAt: getPastDate(199),
          },
          {
            userId: users.henry.id,
            role: 'MEMBER',
            joinedAt: getPastDate(198),
          },
          { userId: users.iris.id, role: 'MEMBER', joinedAt: getPastDate(197) },
        ],
      },
    },
  });

  console.log('✅ Created 7 groups');

  // ============================================================================
  // 3. CREATE EXPENSES WITH ALL SPLIT TYPES
  // ============================================================================
  console.log('💰 Creating expenses...');

  // EQUAL Split Examples
  await prisma.expense.create({
    data: {
      groupId: weekendTrip.id,
      description: 'Hotel booking',
      amountCents: 30000, // $300.00
      payerId: users.alice.id,
      category: 'Accommodation',
      splitType: ExpenseSplitType.EQUAL,
      date: getPastDate(25),
      participants: {
        create: [
          { userId: users.alice.id, shareCents: 10000 }, // $100.00 each
          { userId: users.bob.id, shareCents: 10000 },
          { userId: users.charlie.id, shareCents: 10000 },
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      groupId: weekendTrip.id,
      description: 'Shared taxi to airport',
      amountCents: 4500, // $45.00
      payerId: users.bob.id,
      category: 'Transportation',
      splitType: ExpenseSplitType.EQUAL,
      date: getPastDate(24),
      participants: {
        create: [
          { userId: users.alice.id, shareCents: 1500 }, // $15.00 each
          { userId: users.bob.id, shareCents: 1500 },
          { userId: users.charlie.id, shareCents: 1500 },
        ],
      },
    },
  });

  // PERCENTAGE Split Examples
  await prisma.expense.create({
    data: {
      groupId: weekendTrip.id,
      description: 'Groceries for the weekend',
      amountCents: 50000, // $500.00
      payerId: users.alice.id,
      category: 'Food',
      splitType: ExpenseSplitType.PERCENTAGE,
      date: getPastDate(23),
      notes: 'Alice bought more items, so she pays 50%',
      participants: {
        create: [
          { userId: users.alice.id, shareCents: 25000 }, // 50% = $250.00
          { userId: users.bob.id, shareCents: 15000 }, // 30% = $150.00
          { userId: users.charlie.id, shareCents: 10000 }, // 20% = $100.00
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      groupId: officeLunch.id,
      description: 'Concert tickets',
      amountCents: 40000, // $400.00
      payerId: users.david.id,
      category: 'Entertainment',
      splitType: ExpenseSplitType.PERCENTAGE,
      date: getPastDate(50),
      participants: {
        create: [
          { userId: users.david.id, shareCents: 20000 }, // 50%
          { userId: users.eve.id, shareCents: 12000 }, // 30%
          { userId: users.frank.id, shareCents: 8000 }, // 20%
        ],
      },
    },
  });

  // SHARES Split Examples
  await prisma.expense.create({
    data: {
      groupId: roommates.id,
      description: 'Monthly rent',
      amountCents: 200000, // $2000.00
      payerId: users.alice.id,
      category: 'Housing',
      splitType: ExpenseSplitType.SHARES,
      date: getPastDate(10),
      notes: 'Alice has larger room (2 shares), Bob has smaller room (1 share)',
      participants: {
        create: [
          { userId: users.alice.id, shareCents: 133333 }, // 2 shares = $1333.33
          { userId: users.bob.id, shareCents: 66667 }, // 1 share = $666.67
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      groupId: roommates.id,
      description: 'Utilities (electricity, water, internet)',
      amountCents: 15000, // $150.00
      payerId: users.bob.id,
      category: 'Utilities',
      splitType: ExpenseSplitType.SHARES,
      date: getPastDate(5),
      participants: {
        create: [
          { userId: users.alice.id, shareCents: 10000 }, // 2 shares = $100.00
          { userId: users.bob.id, shareCents: 5000 }, // 1 share = $50.00
        ],
      },
    },
  });

  // EXACT Split Examples
  await prisma.expense.create({
    data: {
      groupId: weekendTrip.id,
      description: 'Individual purchases at market',
      amountCents: 15000, // $15.00 total
      payerId: users.charlie.id,
      category: 'Shopping',
      splitType: ExpenseSplitType.EXACT,
      date: getPastDate(22),
      notes: 'Each person bought different items',
      participants: {
        create: [
          { userId: users.alice.id, shareCents: 500 }, // $5.00
          { userId: users.bob.id, shareCents: 700 }, // $7.00
          { userId: users.charlie.id, shareCents: 300 }, // $3.00
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      groupId: officeLunch.id,
      description: 'Lunch at Italian restaurant',
      amountCents: 8500, // $85.00
      payerId: users.eve.id,
      category: 'Food',
      splitType: ExpenseSplitType.EXACT,
      date: getPastDate(2),
      participants: {
        create: [
          { userId: users.david.id, shareCents: 2500 }, // $25.00
          { userId: users.eve.id, shareCents: 2000 }, // $20.00
          { userId: users.frank.id, shareCents: 1800 }, // $18.00
          { userId: users.grace.id, shareCents: 1200 }, // $12.00
          { userId: users.henry.id, shareCents: 1000 }, // $10.00
        ],
      },
    },
  });

  // More expenses for European Vacation (EUR currency)
  await prisma.expense.create({
    data: {
      groupId: europeVacation.id,
      description: 'Hotel in Paris',
      amountCents: 25000, // €250.00
      payerId: users.iris.id,
      category: 'Accommodation',
      currency: 'EUR',
      splitType: ExpenseSplitType.EQUAL,
      date: getPastDate(80),
      participants: {
        create: [
          { userId: users.iris.id, shareCents: 6250 }, // €62.50 each
          { userId: users.jack.id, shareCents: 6250 },
          { userId: users.kate.id, shareCents: 6250 },
          { userId: users.liam.id, shareCents: 6250 },
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      groupId: europeVacation.id,
      description: 'Train tickets to Amsterdam',
      amountCents: 32000, // €320.00
      payerId: users.jack.id,
      category: 'Transportation',
      currency: 'EUR',
      splitType: ExpenseSplitType.EQUAL,
      date: getPastDate(75),
      participants: {
        create: [
          { userId: users.iris.id, shareCents: 8000 }, // €80.00 each
          { userId: users.jack.id, shareCents: 8000 },
          { userId: users.kate.id, shareCents: 8000 },
          { userId: users.liam.id, shareCents: 8000 },
        ],
      },
    },
  });

  // Large expense for Family Reunion
  await prisma.expense.create({
    data: {
      groupId: familyReunion.id,
      description: 'Reunion venue rental',
      amountCents: 500000, // $5000.00
      payerId: users.charlie.id,
      category: 'Venue',
      splitType: ExpenseSplitType.EQUAL,
      date: getPastDate(40),
      participants: {
        create: [
          { userId: users.charlie.id, shareCents: 62500 }, // $625.00 each
          { userId: users.david.id, shareCents: 62500 },
          { userId: users.eve.id, shareCents: 62500 },
          { userId: users.frank.id, shareCents: 62500 },
          { userId: users.grace.id, shareCents: 62500 },
          { userId: users.henry.id, shareCents: 62500 },
          { userId: users.iris.id, shareCents: 62500 },
          { userId: users.jack.id, shareCents: 62500 },
        ],
      },
    },
  });

  // Old expense for Inactive Group
  await prisma.expense.create({
    data: {
      groupId: inactiveGroup.id,
      description: 'Old group dinner',
      amountCents: 12000, // $120.00
      payerId: users.frank.id,
      category: 'Food',
      splitType: ExpenseSplitType.EQUAL,
      date: getPastDate(190),
      participants: {
        create: [
          { userId: users.frank.id, shareCents: 3000 }, // $30.00 each
          { userId: users.grace.id, shareCents: 3000 },
          { userId: users.henry.id, shareCents: 3000 },
          { userId: users.iris.id, shareCents: 3000 },
        ],
      },
    },
  });

  console.log('✅ Created expenses with all split types');

  // ============================================================================
  // 4. CREATE INVITES WITH DIFFERENT STATUSES
  // ============================================================================
  console.log('📨 Creating invites...');

  // Pending invite (valid, not expired)
  await prisma.invite.create({
    data: {
      groupId: weekendTrip.id,
      code: generateInviteCode(),
      createdBy: users.alice.id,
      status: InviteStatus.PENDING,
      expiresAt: getFutureDate(7),
      createdAt: getPastDate(1),
    },
  });

  await prisma.invite.create({
    data: {
      groupId: officeLunch.id,
      code: generateInviteCode(),
      createdBy: users.david.id,
      status: InviteStatus.PENDING,
      expiresAt: getFutureDate(14),
      createdAt: getPastDate(2),
    },
  });

  // Accepted invite (already used)
  await prisma.invite.create({
    data: {
      groupId: weekendTrip.id,
      code: generateInviteCode(),
      createdBy: users.alice.id,
      status: InviteStatus.ACCEPTED,
      expiresAt: getFutureDate(30),
      createdAt: getPastDate(28),
    },
  });

  await prisma.invite.create({
    data: {
      groupId: europeVacation.id,
      code: generateInviteCode(),
      createdBy: users.iris.id,
      status: InviteStatus.ACCEPTED,
      expiresAt: getFutureDate(30),
      createdAt: getPastDate(85),
    },
  });

  // Expired invite (past expiration date, still PENDING)
  await prisma.invite.create({
    data: {
      groupId: roommates.id,
      code: generateInviteCode(),
      createdBy: users.alice.id,
      status: InviteStatus.PENDING,
      expiresAt: getPastDate(5),
      createdAt: getPastDate(10),
    },
  });

  await prisma.invite.create({
    data: {
      groupId: officeLunch.id,
      code: generateInviteCode(),
      createdBy: users.eve.id,
      status: InviteStatus.PENDING,
      expiresAt: getPastDate(20),
      createdAt: getPastDate(25),
    },
  });

  // Cancelled invite
  await prisma.invite.create({
    data: {
      groupId: familyReunion.id,
      code: generateInviteCode(),
      createdBy: users.charlie.id,
      status: InviteStatus.CANCELLED,
      expiresAt: getFutureDate(10),
      createdAt: getPastDate(5),
    },
  });

  await prisma.invite.create({
    data: {
      groupId: newGroup.id,
      code: generateInviteCode(),
      createdBy: users.kate.id,
      status: InviteStatus.CANCELLED,
      expiresAt: getFutureDate(7),
      createdAt: getPastDate(2),
    },
  });

  console.log('✅ Created invites with all statuses');

  // ============================================================================
  // 5. CREATE SETTLEMENTS WITH ALL METHODS AND STATUSES
  // ============================================================================
  console.log('💸 Creating settlements...');

  // VENMO settlements
  await prisma.settlement.create({
    data: {
      groupId: weekendTrip.id,
      fromUserId: users.bob.id,
      toUserId: users.alice.id,
      amountCents: 5000, // $50.00
      method: SettlementMethod.VENMO,
      status: SettlementStatus.PENDING,
      createdAt: getPastDate(1),
    },
  });

  await prisma.settlement.create({
    data: {
      groupId: weekendTrip.id,
      fromUserId: users.charlie.id,
      toUserId: users.alice.id,
      amountCents: 10000, // $100.00
      method: SettlementMethod.VENMO,
      status: SettlementStatus.CONFIRMED,
      externalRef: 'VENMO-TXN-12345',
      createdAt: getPastDate(20),
    },
  });

  // PAYPAL settlements
  await prisma.settlement.create({
    data: {
      groupId: officeLunch.id,
      fromUserId: users.frank.id,
      toUserId: users.david.id,
      amountCents: 15000, // $150.00
      method: SettlementMethod.PAYPAL,
      status: SettlementStatus.PENDING,
      createdAt: getPastDate(3),
    },
  });

  await prisma.settlement.create({
    data: {
      groupId: officeLunch.id,
      fromUserId: users.grace.id,
      toUserId: users.eve.id,
      amountCents: 8000, // $80.00
      method: SettlementMethod.PAYPAL,
      status: SettlementStatus.CONFIRMED,
      externalRef: 'PAY-6RV12345ABCD',
      createdAt: getPastDate(15),
    },
  });

  // ZELLE settlements
  await prisma.settlement.create({
    data: {
      groupId: roommates.id,
      fromUserId: users.bob.id,
      toUserId: users.alice.id,
      amountCents: 66667, // $666.67 (rent share)
      method: SettlementMethod.ZELLE,
      status: SettlementStatus.PENDING,
      createdAt: getPastDate(2),
    },
  });

  await prisma.settlement.create({
    data: {
      groupId: roommates.id,
      fromUserId: users.alice.id,
      toUserId: users.bob.id,
      amountCents: 5000, // $50.00 (utilities)
      method: SettlementMethod.ZELLE,
      status: SettlementStatus.CONFIRMED,
      externalRef: 'ZELLE-REF-789',
      createdAt: getPastDate(10),
    },
  });

  // STRIPE_LINK settlements
  await prisma.settlement.create({
    data: {
      groupId: familyReunion.id,
      fromUserId: users.david.id,
      toUserId: users.charlie.id,
      amountCents: 62500, // $625.00
      method: SettlementMethod.STRIPE_LINK,
      status: SettlementStatus.PENDING,
      createdAt: getPastDate(5),
    },
  });

  await prisma.settlement.create({
    data: {
      groupId: europeVacation.id,
      fromUserId: users.jack.id,
      toUserId: users.iris.id,
      amountCents: 6250, // €62.50
      method: SettlementMethod.STRIPE_LINK,
      status: SettlementStatus.CONFIRMED,
      externalRef: 'pi_1234567890',
      createdAt: getPastDate(70),
    },
  });

  // MARK_ONLY settlements (no actual payment)
  await prisma.settlement.create({
    data: {
      groupId: weekendTrip.id,
      fromUserId: users.bob.id,
      toUserId: users.charlie.id,
      amountCents: 2500, // $25.00
      method: SettlementMethod.MARK_ONLY,
      status: SettlementStatus.CONFIRMED,
      createdAt: getPastDate(18),
    },
  });

  await prisma.settlement.create({
    data: {
      groupId: officeLunch.id,
      fromUserId: users.henry.id,
      toUserId: users.frank.id,
      amountCents: 1200, // $12.00
      method: SettlementMethod.MARK_ONLY,
      status: SettlementStatus.CONFIRMED,
      createdAt: getPastDate(12),
    },
  });

  console.log('✅ Created settlements with all methods and statuses');

  // ============================================================================
  // 6. CREATE COMPLEX BALANCE SCENARIOS
  // ============================================================================
  console.log('⚖️ Creating complex balance scenarios...');

  // Create a group with complex circular debts for testing netting algorithms
  const complexBalancesGroup = await prisma.group.create({
    data: {
      ownerId: users.alice.id,
      name: 'Complex Balances Test',
      currency: 'USD',
      createdAt: getPastDate(20),
      members: {
        create: [
          { userId: users.alice.id, role: 'OWNER', joinedAt: getPastDate(20) },
          { userId: users.bob.id, role: 'MEMBER', joinedAt: getPastDate(19) },
          {
            userId: users.charlie.id,
            role: 'MEMBER',
            joinedAt: getPastDate(18),
          },
          { userId: users.david.id, role: 'MEMBER', joinedAt: getPastDate(17) },
        ],
      },
    },
  });

  // Alice paid $300, owes $100 → net: +$200
  await prisma.expense.create({
    data: {
      groupId: complexBalancesGroup.id,
      description: 'Group dinner paid by Alice',
      amountCents: 30000, // $300.00
      payerId: users.alice.id,
      category: 'Food',
      splitType: ExpenseSplitType.EQUAL,
      date: getPastDate(15),
      participants: {
        create: [
          { userId: users.alice.id, shareCents: 10000 }, // $100.00 each
          { userId: users.bob.id, shareCents: 10000 },
          { userId: users.charlie.id, shareCents: 10000 },
        ],
      },
    },
  });

  // Bob paid $50, owes $150 → net: -$100
  await prisma.expense.create({
    data: {
      groupId: complexBalancesGroup.id,
      description: 'Taxi paid by Bob',
      amountCents: 5000, // $50.00
      payerId: users.bob.id,
      category: 'Transportation',
      splitType: ExpenseSplitType.EQUAL,
      date: getPastDate(14),
      participants: {
        create: [
          { userId: users.alice.id, shareCents: 1250 }, // $12.50 each
          { userId: users.bob.id, shareCents: 1250 },
          { userId: users.charlie.id, shareCents: 1250 },
          { userId: users.david.id, shareCents: 1250 },
        ],
      },
    },
  });

  // Additional expense where Bob owes more
  await prisma.expense.create({
    data: {
      groupId: complexBalancesGroup.id,
      description: 'Groceries paid by Charlie',
      amountCents: 40000, // $400.00
      payerId: users.charlie.id,
      category: 'Food',
      splitType: ExpenseSplitType.PERCENTAGE,
      date: getPastDate(13),
      participants: {
        create: [
          { userId: users.alice.id, shareCents: 10000 }, // 25% = $100
          { userId: users.bob.id, shareCents: 20000 }, // 50% = $200
          { userId: users.charlie.id, shareCents: 10000 }, // 25% = $100
        ],
      },
    },
  });

  // Charlie paid $0, owes $100 → net: -$100
  // (Already created above - Charlie paid $100 but owes $100, so net is $0)
  // Let's add another expense to make Charlie's balance negative
  await prisma.expense.create({
    data: {
      groupId: complexBalancesGroup.id,
      description: 'Event tickets paid by David',
      amountCents: 20000, // $200.00
      payerId: users.david.id,
      category: 'Entertainment',
      splitType: ExpenseSplitType.EQUAL,
      date: getPastDate(12),
      participants: {
        create: [
          { userId: users.alice.id, shareCents: 5000 }, // $50.00 each
          { userId: users.bob.id, shareCents: 5000 },
          { userId: users.charlie.id, shareCents: 5000 },
          { userId: users.david.id, shareCents: 5000 },
        ],
      },
    },
  });

  // David paid $200, owes $50 → net: +$150
  // (Created above - David paid $200, owes $50, so net is +$150)

  // Add some pending settlements to make it more complex
  await prisma.settlement.create({
    data: {
      groupId: complexBalancesGroup.id,
      fromUserId: users.bob.id,
      toUserId: users.alice.id,
      amountCents: 5000, // $50.00
      method: SettlementMethod.VENMO,
      status: SettlementStatus.PENDING,
      createdAt: getPastDate(2),
    },
  });

  await prisma.settlement.create({
    data: {
      groupId: complexBalancesGroup.id,
      fromUserId: users.charlie.id,
      toUserId: users.david.id,
      amountCents: 5000, // $50.00
      method: SettlementMethod.PAYPAL,
      status: SettlementStatus.PENDING,
      createdAt: getPastDate(1),
    },
  });

  console.log('✅ Created complex balance scenarios');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Users: ${Object.keys(users).length}`);
  console.log(`   Groups: 8`);
  console.log(`   Expenses: 15+`);
  console.log(`   Invites: 8`);
  console.log(`   Settlements: 12+`);
  console.log('\n🔑 All users have password: password123');
  console.log('\n📝 Test scenarios covered:');
  console.log('   ✓ All split types (EQUAL, PERCENTAGE, SHARES, EXACT)');
  console.log('   ✓ Multiple currencies (USD, EUR)');
  console.log(
    '   ✓ All settlement methods (VENMO, PAYPAL, ZELLE, STRIPE_LINK, MARK_ONLY)'
  );
  console.log('   ✓ All settlement statuses (PENDING, CONFIRMED)');
  console.log(
    '   ✓ All invite statuses (PENDING, ACCEPTED, CANCELLED, expired)'
  );
  console.log('   ✓ Complex balance scenarios');
  console.log('   ✓ Groups of various sizes (2-8 members)');
  console.log('   ✓ Different activity levels (active, inactive, new)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
