# Plan: Expand Seed Data for Better Testing

## Overview

Expand the database seed script (`apps/api/prisma/seed.ts`) to create comprehensive test data covering various scenarios, edge cases, and realistic use cases for thorough testing of the Group Pay application.

## Current State

- Basic seed data exists with 3 users, 1 group, 2 expenses, and 1 settlement
- Limited coverage of different split types, roles, and scenarios
- No test data for invites, multiple groups, or complex balance scenarios

## Goals

1. Create diverse user profiles with different payment methods
2. Generate multiple groups with various member configurations
3. Create expenses covering all split types (EQUAL, PERCENTAGE, SHARES, EXACT)
4. Add test data for invites (pending, accepted, expired)
5. Create complex balance scenarios for testing netting algorithms
6. Add settlements with different statuses and methods
7. Include edge cases (empty groups, single-member groups, large groups)

## Implementation Plan

### 1. Expand User Seed Data

**File**: `apps/api/prisma/seed.ts`

Create 10-15 test users with diverse profiles:

- Users with Venmo handles
- Users with PayPal links
- Users with both payment methods
- Users with profile photos
- Users without payment methods

**Example structure**:

```typescript
const users = [
  {
    email: 'alice@example.com',
    name: 'Alice Johnson',
    venmoHandle: '@alice-j',
  },
  {
    email: 'bob@example.com',
    name: 'Bob Smith',
    paypalLink: 'https://paypal.me/bobsmith',
  },
  {
    email: 'charlie@example.com',
    name: 'Charlie Brown',
    venmoHandle: '@charlie',
    paypalLink: 'https://paypal.me/charlie',
  },
  // ... more users
];
```

### 2. Create Multiple Groups

**File**: `apps/api/prisma/seed.ts`

Create 5-8 groups with different characteristics:

- Small groups (2-3 members)
- Medium groups (4-6 members)
- Large groups (7-10 members)
- Groups with different currencies (USD, EUR, GBP)
- Groups with different activity levels (active, inactive)
- Empty groups (no expenses yet)

**Group scenarios**:

1. **Weekend Trip** - 3 members, USD, active with expenses
2. **Office Lunch** - 5 members, USD, regular expenses
3. **European Vacation** - 4 members, EUR, multiple expenses
4. **Roommates** - 2 members, USD, recurring expenses
5. **Family Reunion** - 8 members, USD, large expenses
6. **New Group** - 3 members, USD, no expenses yet
7. **Inactive Group** - 4 members, USD, old expenses only

### 3. Create Expenses with All Split Types

**File**: `apps/api/prisma/seed.ts`

Create expenses demonstrating each split type:

**EQUAL Split** (default):

- Simple expenses split evenly among participants
- Examples: Hotel room, shared taxi, group dinner

**PERCENTAGE Split**:

- Expenses split by percentage (e.g., 50%, 30%, 20%)
- Examples: Groceries where one person buys more, event tickets with different tiers

**SHARES Split**:

- Expenses split by weighted shares
- Examples: Room sharing (person A pays 2 shares, person B pays 1 share)

**EXACT Split**:

- Custom amounts per person
- Examples: Individual purchases, different menu items

**Expense examples**:

```typescript
// EQUAL split
{ description: 'Hotel booking', amountCents: 30000, splitType: 'EQUAL' }

// PERCENTAGE split
{ description: 'Groceries', amountCents: 50000, splitType: 'PERCENTAGE' }
// Alice: 50%, Bob: 30%, Charlie: 20%

// SHARES split
{ description: 'Rent', amountCents: 200000, splitType: 'SHARES' }
// Alice: 2 shares, Bob: 1 share, Charlie: 1 share

// EXACT split
{ description: 'Individual purchases', amountCents: 15000, splitType: 'EXACT' }
// Alice: $5, Bob: $7, Charlie: $3
```

### 4. Add Invite Test Data

**File**: `apps/api/prisma/seed.ts`

Create invites with different statuses:

- Pending invites (not yet accepted)
- Accepted invites (already used)
- Expired invites (past expiration date)
- Cancelled invites

**Invite examples**:

```typescript
// Pending invite
{ code: 'ABC123', status: 'PENDING', expiresAt: futureDate }

// Accepted invite
{ code: 'XYZ789', status: 'ACCEPTED', expiresAt: pastDate }

// Expired invite
{ code: 'EXP456', status: 'PENDING', expiresAt: pastDate }

// Cancelled invite
{ code: 'CAN789', status: 'CANCELLED', expiresAt: futureDate }
```

### 5. Create Complex Balance Scenarios

**File**: `apps/api/prisma/seed.ts`

Create groups with complex balance situations:

- Users who owe money
- Users who are owed money
- Users with zero balance
- Circular debts (A owes B, B owes C, C owes A)
- Large balance differences
- Multiple pending settlements

**Balance scenario example**:

```typescript
// Group where balances need netting
// Alice paid $300, owes $100 → net: +$200
// Bob paid $50, owes $150 → net: -$100
// Charlie paid $0, owes $100 → net: -$100
```

### 6. Add Settlement Test Data

**File**: `apps/api/prisma/seed.ts`

Create settlements with different:

- Methods: VENMO, PAYPAL, ZELLE, STRIPE_LINK, MARK_ONLY
- Statuses: PENDING, CONFIRMED
- Amounts: small, medium, large
- Relationships: various user pairs

**Settlement examples**:

```typescript
// Pending Venmo settlement
{ method: 'VENMO', status: 'PENDING', amountCents: 5000 }

// Confirmed PayPal settlement
{ method: 'PAYPAL', status: 'CONFIRMED', amountCents: 10000, externalRef: 'PAY-123' }

// Mark-only settlement (no actual payment)
{ method: 'MARK_ONLY', status: 'CONFIRMED', amountCents: 2500 }
```

### 7. Add Receipt Test Data (Optional)

**File**: `apps/api/prisma/seed.ts`

If receipt upload is implemented, add sample receipts:

- Receipts linked to expenses
- Different file types (images, PDFs)
- Receipts with metadata

## File Structure

```
apps/api/prisma/
├── seed.ts (main seed file - update this)
└── seed-helpers.ts (optional helper functions)
```

## Implementation Steps

### Step 1: Create Helper Functions

Create utility functions in `seed.ts` or separate `seed-helpers.ts`:

- `createUsers(count: number)` - Generate multiple users
- `createGroup(config)` - Create group with members
- `createExpense(config)` - Create expense with participants
- `createSettlement(config)` - Create settlement
- `createInvite(config)` - Create invite

### Step 2: Organize Seed Data

Structure seed data into logical sections:

1. Users creation
2. Groups creation
3. Group memberships
4. Expenses creation
5. Invites creation
6. Settlements creation
7. Receipts creation (if applicable)

### Step 3: Add Realistic Data

Use realistic names, descriptions, and amounts:

- Real-world expense descriptions
- Realistic currency amounts
- Varied dates (some recent, some older)
- Different categories

### Step 4: Ensure Data Relationships

Ensure all relationships are valid:

- All group members exist as users
- All expense participants are group members
- All settlements involve group members
- All invites reference valid groups and creators

### Step 5: Add Comments and Documentation

Add clear comments explaining:

- Purpose of each test scenario
- What each data set tests
- Expected outcomes

## Testing Scenarios Covered

After implementation, seed data should support testing:

1. **User Management**
   - User profiles with/without payment methods
   - User authentication flows

2. **Group Management**
   - Creating groups
   - Adding/removing members
   - Role management (OWNER, ADMIN, MEMBER)

3. **Expense Tracking**
   - All split types
   - Different categories
   - Various amounts and currencies

4. **Balance Calculations**
   - Simple balances
   - Complex netting scenarios
   - Edge cases (zero balances, large amounts)

5. **Settlements**
   - Different payment methods
   - Pending vs confirmed
   - Settlement workflows

6. **Invites**
   - Creating invites
   - Accepting invites
   - Expired/cancelled invites

## Example Seed Data Structure

```typescript
// Users (10-15 users)
const users = { alice, bob, charlie, david, eve, ... };

// Groups (5-8 groups)
const groups = {
  weekendTrip: { id, name: 'Weekend Trip', currency: 'USD' },
  officeLunch: { id, name: 'Office Lunch', currency: 'USD' },
  europeVacation: { id, name: 'European Vacation', currency: 'EUR' },
  // ... more groups
};

// Expenses (15-20 expenses across groups)
const expenses = {
  hotel: { splitType: 'EQUAL', amountCents: 30000 },
  groceries: { splitType: 'PERCENTAGE', amountCents: 50000 },
  rent: { splitType: 'SHARES', amountCents: 200000 },
  // ... more expenses
};

// Invites (10-15 invites)
const invites = {
  pending1: { status: 'PENDING', expiresAt: futureDate },
  accepted1: { status: 'ACCEPTED' },
  expired1: { status: 'PENDING', expiresAt: pastDate },
  // ... more invites
};

// Settlements (10-15 settlements)
const settlements = {
  venmoPending: { method: 'VENMO', status: 'PENDING' },
  paypalConfirmed: { method: 'PAYPAL', status: 'CONFIRMED' },
  // ... more settlements
};
```

## Validation

After seeding, verify:

- All users can log in (password: 'password123' for all)
- All groups are accessible
- All expenses have valid participants
- All balances calculate correctly
- All relationships are valid

## Notes

- Use consistent password hash for all users (e.g., 'password123')
- Use realistic dates (mix of recent and older dates)
- Ensure data diversity (different amounts, currencies, statuses)
- Add comments explaining test scenarios
- Keep seed script maintainable and well-organized

## Success Criteria

- [ ] 10+ test users created
- [ ] 5+ groups with different configurations
- [ ] Expenses covering all 4 split types
- [ ] Invites with all statuses
- [ ] Settlements with all methods and statuses
- [ ] Complex balance scenarios for testing
- [ ] All data relationships valid
- [ ] Seed script runs without errors
- [ ] Data supports comprehensive testing
