import { PrismaClient } from '@prisma/client';
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
  const group = await prisma.group.create({
    data: {
      ownerId: alice.id,
      name: 'Weekend Trip',
      currency: 'USD',
      members: {
        create: [
          { userId: alice.id, role: 'OWNER' },
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
      amountCents: 30000, // $300.00
      payerId: alice.id,
      category: 'Accommodation',
      participants: {
        create: [
          { userId: alice.id, shareCents: 10000 }, // $100.00
          { userId: bob.id, shareCents: 10000 }, // $100.00
          { userId: charlie.id, shareCents: 10000 }, // $100.00
        ],
      },
    },
  });

  const expense2 = await prisma.expense.create({
    data: {
      groupId: group.id,
      description: 'Dinner at restaurant',
      amountCents: 12000, // $120.00
      payerId: bob.id,
      category: 'Food',
      participants: {
        create: [
          { userId: alice.id, shareCents: 4500 }, // $45.00
          { userId: bob.id, shareCents: 3500 }, // $35.00
          { userId: charlie.id, shareCents: 4000 }, // $40.00
        ],
      },
    },
  });

  // Create test settlement
  await prisma.settlement.create({
    data: {
      fromUserId: bob.id,
      toUserId: alice.id,
      groupId: group.id,
      amountCents: 10000, // $100.00
      method: 'VENMO',
      status: 'CONFIRMED',
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
