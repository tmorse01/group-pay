# Group Pay

A modern group expense tracker and bill splitting application built with TypeScript, React, and Fastify.

## 📁 Project Structure

```
.
├─ apps/
│  ├─ web/        # React + Vite + TypeScript (Mantine UI)
│  └─ api/        # Fastify + TypeScript + Prisma + PostgreSQL
├─ packages/
│  ├─ shared/     # Zod types, DTOs, utilities shared by web/api
│  └─ config/     # ESLint, Prettier, tsconfig bases
├─ .github/workflows/
│  └─ ci.yml      # Lint, typecheck, test for both apps
└─ README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   # API
   cp apps/api/.env.example apps/api/.env

   # Web
   cp apps/web/.env.local.example apps/web/.env.local
   ```

4. Set up the database:

   ```bash
   # Generate Prisma client
   cd apps/api
   pnpm prisma:generate

   # Run migrations
   pnpm prisma:migrate

   # Seed the database
   pnpm seed
   ```

### Development

Start both apps in development mode:

```bash
# From root directory
pnpm dev
```

Or start individually:

```bash
# API server (http://localhost:4000)
cd apps/api
pnpm dev

# Web app (http://localhost:5173)
cd apps/web
pnpm dev
```

### Available Scripts

From the root directory:

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps for production
- `pnpm test` - Run tests across all packages
- `pnpm lint` - Lint all packages
- `pnpm lint:fix` - Fix linting issues
- `pnpm type-check` - Type check all packages

## 🏗️ Architecture

### Backend (apps/api)

- **Framework**: Fastify with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with httpOnly cookies
- **Validation**: Zod schemas
- **API Docs**: Swagger/OpenAPI at `/docs`

### Frontend (apps/web)

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Mantine
- **Routing**: React Router v6
- **State Management**: TanStack Query
- **Forms**: Mantine Form with Zod validation

### Shared (packages/shared)

- **Types**: Zod schemas and TypeScript types
- **DTOs**: API request/response types
- **Utils**: Currency handling, expense splitting logic
- **Services**: Debt netting algorithms

## 📋 Features

- **Group Management**: Create and manage expense groups
- **Expense Tracking**: Add expenses with flexible splitting options
- **Smart Splitting**: Equal, percentage, shares, or exact amount splits
- **Debt Settlement**: Optimized debt resolution with minimal transactions
- **Receipt Upload**: Attach receipts to expenses
- **Real-time Updates**: Live updates across all group members
- **Mobile Responsive**: Works seamlessly on all devices

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
cd apps/api && pnpm test
cd apps/web && pnpm test
cd packages/shared && pnpm test
```

## 📦 Deployment

1. Build all packages:

   ```bash
   pnpm build
   ```

2. Set up production environment variables

3. Deploy:
   - API: Deploy `apps/api/dist` to your server
   - Web: Deploy `apps/web/dist` to your static hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

ISC License
