import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSchema() {
  try {
    console.log('🔍 Testing database schema...');

    // Test creating a user
    console.log('Creating test user...');
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hash123',
        name: 'Test User',
        venmoHandle: '@testuser',
      },
    });
    console.log('✅ User created:', user.id);

    // Test creating a group
    console.log('Creating test group...');
    const group = await prisma.group.create({
      data: {
        ownerId: user.id,
        name: 'Test Group',
        currency: 'USD',
      },
    });
    console.log('✅ Group created:', group.id);

    // Test creating a group member
    console.log('Adding user to group...');
    const groupMember = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user.id,
        role: 'OWNER',
      },
    });
    console.log('✅ Group member created:', groupMember.id);

    // Test creating an expense
    console.log('Creating test expense...');
    const expense = await prisma.expense.create({
      data: {
        groupId: group.id,
        payerId: user.id,
        description: 'Test Expense',
        amountCents: 2500, // $25.00
        currency: 'USD',
        category: 'Food',
      },
    });
    console.log('✅ Expense created:', expense.id);

    // Test creating an expense participant
    console.log('Adding expense participant...');
    const participant = await prisma.expenseParticipant.create({
      data: {
        expenseId: expense.id,
        userId: user.id,
        shareCents: 2500, // $25.00
      },
    });
    console.log('✅ Expense participant created:', participant.id);

    // Test reading data with relations
    console.log('Testing data relationships...');
    const userWithData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        ownedGroups: true,
        groupMemberships: {
          include: {
            group: true,
          },
        },
        paidExpenses: {
          include: {
            participants: true,
          },
        },
      },
    });
    console.log('✅ User with relations:', {
      id: userWithData?.id,
      ownedGroups: userWithData?.ownedGroups.length,
      memberships: userWithData?.groupMemberships.length,
      expenses: userWithData?.paidExpenses.length,
    });

    // Clean up test data
    console.log('Cleaning up test data...');
    await prisma.expenseParticipant.delete({ where: { id: participant.id } });
    await prisma.expense.delete({ where: { id: expense.id } });
    await prisma.groupMember.delete({ where: { id: groupMember.id } });
    await prisma.group.delete({ where: { id: group.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('✅ Test data cleaned up');

    console.log('🎉 All database tests passed!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSchema().catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

export { testSchema };