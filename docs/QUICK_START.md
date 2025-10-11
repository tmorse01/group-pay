# GroupPay Quick Start Guide

Get GroupPay up and running in 5 minutes!

## Prerequisites

Make sure you have these installed:

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **pnpm** 8 or higher (install with `npm install -g pnpm`)
- **PostgreSQL** 14 or higher ([Download](https://www.postgresql.org/download/))

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/group-pay.git
cd group-pay

# Install dependencies
pnpm install
```

## Step 2: Set Up Database

### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE grouppay;

# Exit psql
\q
```

### Configure Environment Variables

Create environment files from examples:

```bash
# API environment
cp apps/api/.env.example apps/api/.env

# Web environment
cp apps/web/.env.local.example apps/web/.env.local
```

Edit `apps/api/.env`:

```env
# Database connection string
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/grouppay"

# JWT secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"

# Server port
PORT=4000

# Frontend URL for CORS
CORS_ORIGIN="http://localhost:5173"
```

Edit `apps/web/.env.local`:

```env
# Backend API URL
VITE_API_URL=http://localhost:4000
```

## Step 3: Initialize Database

```bash
# Navigate to API directory
cd apps/api

# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# (Optional) Seed with sample data
pnpm seed

# Return to root
cd ../..
```

## Step 4: Start Development Servers

From the root directory:

```bash
# Start both API and Web app
pnpm dev
```

This will start:

- **API Server** at http://localhost:4000
- **Web App** at http://localhost:5173
- **API Docs** at http://localhost:4000/docs

## Step 5: Create Your First Account

1. Open http://localhost:5173 in your browser
2. Click "Sign up" (or navigate to the login page)
3. Create an account with:
   - Email address
   - Secure password (min 8 characters)
   - Your name

4. You'll be automatically logged in!

## Step 6: Create Your First Group

1. From the dashboard, click "Create Group"
2. Enter:
   - **Group Name**: e.g., "Roommates" or "Trip to Paris"
   - **Currency**: USD (or your preferred currency)
3. Click "Create"

## Step 7: Add Members

1. Open your newly created group
2. Go to the "Members" tab
3. Click "Create Invite Link"
4. Share the link with friends!

Or invite by email if they already have accounts.

## Step 8: Add Your First Expense

1. In your group, click "Add Expense"
2. Fill in the details:
   - **Description**: "Groceries"
   - **Amount**: 50.00
   - **Who Paid**: Select yourself
   - **Split Type**: Choose "Equal"
   - **Participants**: Select who to split with
3. Click "Save"

## Step 9: Check Balances

1. Navigate to the "Balances" tab
2. See who owes whom
3. Click "Settle Up" to record payments

## Next Steps

### Explore Features

- ✅ Add more expenses with different split types
- ✅ Try percentage-based or custom amount splits
- ✅ Update your profile with payment info (Venmo, PayPal)
- ✅ Toggle between light and dark mode
- ✅ Manage group settings

### Customize

- Update theme preferences in Settings
- Add your payment handles for easy settlements
- Add profile photo URL

### Development

- Check out the API documentation at http://localhost:4000/docs
- Read the [coding standards](.github/REACT_CODING_STANDARDS.md)
- Explore the codebase structure in [README.md](../README.md)

## Troubleshooting

### Database Connection Issues

If you see "Can't connect to database":

1. Check PostgreSQL is running:

   ```bash
   # macOS/Linux
   pg_isready

   # Windows (check service)
   sc query postgresql-x64-14
   ```

2. Verify connection string in `apps/api/.env`
3. Ensure database exists:
   ```bash
   psql -U postgres -l
   ```

### Port Already in Use

If port 4000 or 5173 is taken:

```bash
# Kill process on port (macOS/Linux)
lsof -ti:4000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Or change port in .env files
```

### Prisma Migration Errors

Reset database if migrations fail:

```bash
cd apps/api
pnpm prisma:reset
pnpm prisma:migrate
```

⚠️ **Warning**: This deletes all data!

### Cannot Find Module Errors

Clear and reinstall:

```bash
# Remove node_modules and lock files
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm pnpm-lock.yaml

# Reinstall
pnpm install
```

## Common Commands Reference

### Development

```bash
# Start everything
pnpm dev

# Start only API
cd apps/api && pnpm dev

# Start only Web
cd apps/web && pnpm dev
```

### Database

```bash
cd apps/api

# View data in Prisma Studio
pnpm prisma:studio

# Create new migration
pnpm prisma:migrate

# Reset database
pnpm prisma:reset

# Seed data
pnpm seed
```

### Code Quality

```bash
# Lint all code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type check
pnpm type-check

# Run tests
pnpm test
```

### Building

```bash
# Build for production
pnpm build

# Build specific app
cd apps/web && pnpm build
cd apps/api && pnpm build
```

## Getting Help

- 📚 [Full Documentation](../README.md)
- 🔧 [API Reference](./api/API_REFERENCE.md)
- 💬 [GitHub Issues](https://github.com/yourusername/group-pay/issues)
- 📖 [Coding Standards](.github/REACT_CODING_STANDARDS.md)

---

**Happy expense tracking! 🎉**
