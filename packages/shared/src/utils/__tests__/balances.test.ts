import { describe, it, expect } from 'vitest';
import { computeNetBalances, calculateUserBalances, calculateUserStats, calculateGroupTotal } from '../balances';
import type { Expense, ExpenseParticipant } from '../../schemas/expense';

describe('Balance Calculations', () => {
  const mockExpenses: Expense[] = [
    {
      id: '1',
      groupId: 'group1',
      payerId: 'alice',
      description: 'Dinner',
      amountCents: 6000, // $60
      currency: 'USD',
      date: new Date('2024-01-01'),
      category: 'food',
      notes: null,
      createdAt: new Date(),
    },
    {
      id: '2',
      groupId: 'group1',
      payerId: 'bob',
      description: 'Movie tickets',
      amountCents: 3000, // $30
      currency: 'USD',
      date: new Date('2024-01-02'),
      category: 'entertainment',
      notes: null,
      createdAt: new Date(),
    },
  ];

  const mockParticipants: ExpenseParticipant[] = [
    // Dinner split equally: Alice, Bob, Charlie ($20 each)
    { id: '1', expenseId: '1', userId: 'alice', shareCents: 2000 },
    { id: '2', expenseId: '1', userId: 'bob', shareCents: 2000 },
    { id: '3', expenseId: '1', userId: 'charlie', shareCents: 2000 },

    // Movies split equally: Alice, Bob ($15 each)
    { id: '4', expenseId: '2', userId: 'alice', shareCents: 1500 },
    { id: '5', expenseId: '2', userId: 'bob', shareCents: 1500 },
  ];

  it('should calculate correct user balances', () => {
    const balances = calculateUserBalances(mockExpenses, mockParticipants);

    // Alice: paid $60, owes $35, net +$25
    const alice = balances.find((b) => b.userId === 'alice')!;
    expect(alice.totalPaid).toBe(6000);
    expect(alice.totalOwed).toBe(3500);
    expect(alice.netBalance).toBe(2500);

    // Bob: paid $30, owes $35, net -$5
    const bob = balances.find((b) => b.userId === 'bob')!;
    expect(bob.totalPaid).toBe(3000);
    expect(bob.totalOwed).toBe(3500);
    expect(bob.netBalance).toBe(-500);

    // Charlie: paid $0, owes $20, net -$20
    const charlie = balances.find((b) => b.userId === 'charlie')!;
    expect(charlie.totalPaid).toBe(0);
    expect(charlie.totalOwed).toBe(2000);
    expect(charlie.netBalance).toBe(-2000);
  });

  it('should compute minimal settlement edges', () => {
    const settlements = computeNetBalances(mockExpenses, mockParticipants);

    // Should have 2 settlements:
    // Charlie owes Alice $20
    // Bob owes Alice $5
    expect(settlements).toHaveLength(2);

    const charlieToAlice = settlements.find(
      (s) => s.fromUserId === 'charlie' && s.toUserId === 'alice'
    );
    expect(charlieToAlice?.amountCents).toBe(2000);

    const bobToAlice = settlements.find(
      (s) => s.fromUserId === 'bob' && s.toUserId === 'alice'
    );
    expect(bobToAlice?.amountCents).toBe(500);
  });

  it('should calculate group total correctly', () => {
    const total = calculateGroupTotal(mockExpenses);
    expect(total).toBe(9000); // $60 + $30 = $90
  });

  it('should calculate user stats correctly', () => {
    const aliceStats = calculateUserStats('alice', mockExpenses, mockParticipants);

    expect(aliceStats.userId).toBe('alice');
    expect(aliceStats.totalPaid).toBe(6000);
    expect(aliceStats.totalOwed).toBe(3500);
    expect(aliceStats.netBalance).toBe(2500);
    expect(aliceStats.expenseCount).toBe(1);
    expect(aliceStats.avgExpenseAmount).toBe(6000);

    const charlieStats = calculateUserStats('charlie', mockExpenses, mockParticipants);
    expect(charlieStats.expenseCount).toBe(0);
    expect(charlieStats.avgExpenseAmount).toBe(0);
  });

  it('should handle complex multi-user scenarios', () => {
    const complexExpenses: Expense[] = [
      {
        id: '1',
        groupId: 'group1',
        payerId: 'alice',
        description: 'Groceries',
        amountCents: 12000, // $120
        currency: 'USD',
        date: new Date('2024-01-01'),
        category: 'food',
        notes: null,
        createdAt: new Date(),
      },
      {
        id: '2',
        groupId: 'group1',
        payerId: 'bob',
        description: 'Gas',
        amountCents: 8000, // $80
        currency: 'USD',
        date: new Date('2024-01-02'),
        category: 'transport',
        notes: null,
        createdAt: new Date(),
      },
      {
        id: '3',
        groupId: 'group1',
        payerId: 'charlie',
        description: 'Utilities',
        amountCents: 15000, // $150
        currency: 'USD',
        date: new Date('2024-01-03'),
        category: 'utilities',
        notes: null,
        createdAt: new Date(),
      },
    ];

    const complexParticipants: ExpenseParticipant[] = [
      // Groceries split equally: Alice, Bob, Charlie, David ($30 each)
      { id: '1', expenseId: '1', userId: 'alice', shareCents: 3000 },
      { id: '2', expenseId: '1', userId: 'bob', shareCents: 3000 },
      { id: '3', expenseId: '1', userId: 'charlie', shareCents: 3000 },
      { id: '4', expenseId: '1', userId: 'david', shareCents: 3000 },

      // Gas split equally: Alice, Bob ($40 each)
      { id: '5', expenseId: '2', userId: 'alice', shareCents: 4000 },
      { id: '6', expenseId: '2', userId: 'bob', shareCents: 4000 },

      // Utilities split equally: All four ($37.50 each)
      { id: '7', expenseId: '3', userId: 'alice', shareCents: 3750 },
      { id: '8', expenseId: '3', userId: 'bob', shareCents: 3750 },
      { id: '9', expenseId: '3', userId: 'charlie', shareCents: 3750 },
      { id: '10', expenseId: '3', userId: 'david', shareCents: 3750 },
    ];

    const settlements = computeNetBalances(complexExpenses, complexParticipants);
    
    // Verify that the net settlements balance out
    const totalSettlements = settlements.reduce((sum, s) => sum + s.amountCents, 0);
    expect(totalSettlements).toBeGreaterThan(0);

    // Verify no self-payments
    settlements.forEach(settlement => {
      expect(settlement.fromUserId).not.toBe(settlement.toUserId);
    });
  });

  it('should handle edge case of balanced expenses', () => {
    const balancedExpenses: Expense[] = [
      {
        id: '1',
        groupId: 'group1',
        payerId: 'alice',
        description: 'Lunch',
        amountCents: 2000, // $20
        currency: 'USD',
        date: new Date('2024-01-01'),
        category: 'food',
        notes: null,
        createdAt: new Date(),
      },
      {
        id: '2',
        groupId: 'group1',
        payerId: 'bob',
        description: 'Coffee',
        amountCents: 2000, // $20
        currency: 'USD',
        date: new Date('2024-01-02'),
        category: 'food',
        notes: null,
        createdAt: new Date(),
      },
    ];

    const balancedParticipants: ExpenseParticipant[] = [
      // Each person paid $20 and owes $20
      { id: '1', expenseId: '1', userId: 'alice', shareCents: 1000 },
      { id: '2', expenseId: '1', userId: 'bob', shareCents: 1000 },
      { id: '3', expenseId: '2', userId: 'alice', shareCents: 1000 },
      { id: '4', expenseId: '2', userId: 'bob', shareCents: 1000 },
    ];

    const settlements = computeNetBalances(balancedExpenses, balancedParticipants);
    expect(settlements).toHaveLength(0); // No settlements needed
  });
});