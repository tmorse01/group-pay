import type { Expense, ExpenseParticipant } from '../schemas/expense';

export interface UserBalance {
  userId: string;
  netBalance: number; // Positive = owed money, Negative = owes money
  totalPaid: number;
  totalOwed: number;
}

export interface NettedEdge {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
}

/**
 * Calculate net balances for all users in a group
 */
export function calculateUserBalances(
  expenses: Expense[],
  participants: ExpenseParticipant[]
): UserBalance[] {
  const balanceMap = new Map<string, UserBalance>();

  // Initialize all users from participants
  const allUserIds = new Set([
    ...expenses.map((e) => e.payerId),
    ...participants.map((p) => p.userId),
  ]);

  for (const userId of allUserIds) {
    balanceMap.set(userId, {
      userId,
      netBalance: 0,
      totalPaid: 0,
      totalOwed: 0,
    });
  }

  // Calculate what each user paid
  for (const expense of expenses) {
    const balance = balanceMap.get(expense.payerId)!;
    balance.totalPaid += expense.amountCents;
    balance.netBalance += expense.amountCents;
  }

  // Calculate what each user owes
  for (const participant of participants) {
    const balance = balanceMap.get(participant.userId)!;
    balance.totalOwed += participant.shareCents;
    balance.netBalance -= participant.shareCents;
  }

  return Array.from(balanceMap.values());
}

/**
 * Convert user balances into minimal settlement edges using greedy algorithm
 */
export function computeNetBalances(
  expenses: Expense[],
  participants: ExpenseParticipant[]
): NettedEdge[] {
  const userBalances = calculateUserBalances(expenses, participants);

  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors = userBalances
    .filter((b) => b.netBalance > 0)
    .map((b) => ({ userId: b.userId, amount: b.netBalance }))
    .sort((a, b) => b.amount - a.amount); // Largest first

  const debtors = userBalances
    .filter((b) => b.netBalance < 0)
    .map((b) => ({ userId: b.userId, amount: -b.netBalance }))
    .sort((a, b) => b.amount - a.amount); // Largest first

  const settlements: NettedEdge[] = [];

  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settlementAmount = Math.min(creditor.amount, debtor.amount);

    if (settlementAmount > 0) {
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amountCents: settlementAmount,
      });
    }

    creditor.amount -= settlementAmount;
    debtor.amount -= settlementAmount;

    if (creditor.amount === 0) i++;
    if (debtor.amount === 0) j++;
  }

  return settlements;
}

/**
 * Calculate total group spending
 */
export function calculateGroupTotal(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amountCents, 0);
}

/**
 * Calculate individual user statistics
 */
export interface UserStats {
  userId: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
  expenseCount: number;
  avgExpenseAmount: number;
}

export function calculateUserStats(
  userId: string,
  expenses: Expense[],
  participants: ExpenseParticipant[]
): UserStats {
  const userExpenses = expenses.filter((e) => e.payerId === userId);
  const userParticipations = participants.filter((p) => p.userId === userId);

  const totalPaid = userExpenses.reduce((sum, e) => sum + e.amountCents, 0);
  const totalOwed = userParticipations.reduce(
    (sum, p) => sum + p.shareCents,
    0
  );

  return {
    userId,
    totalPaid,
    totalOwed,
    netBalance: totalPaid - totalOwed,
    expenseCount: userExpenses.length,
    avgExpenseAmount:
      userExpenses.length > 0 ? totalPaid / userExpenses.length : 0,
  };
}