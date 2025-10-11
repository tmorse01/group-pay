# Copilot Project Prompt — “Group Pay” (Group Expense Tracker, Phase 1)

You are generating a **TypeScript monorepo** for an MVP ### Front End (`apps/web`)

**Stack**: React 18 + Vite + TypeScript, **UntitledUI** components, React Router v6, **TanStack Query**, **Zod**, **Day.js**.

### Environment

`.env.local.example`

```
VITE_API_URL=http://localhost:4000
```

### Component Guidelines

**IMPORTANT**: Always use UntitledUI components from `@/components/base/*` instead of basic HTML elements:

- Use `<Button>` from `@/components/base/buttons/button` instead of `<button>`
- Use `<Input>` from `@/components/base/inputs/input` instead of `<input>`
- Use `<Input>` from `@/components/base/input/input` instead of `<input>`
- Use `<Select>` from `@/components/base/select/select` instead of `<select>`
- Use `<Modal>` from `@/components/application/modals/modal` instead of custom modal implementations
- Use UntitledUI form components with proper validation patterns

Always prefer the design system components to maintain consistency and leverage built-in accessibility features.

Form guidelines: see `.github/prompts/forms_guidelines.md` for the dedicated UiForm + UntitledUI inputs usage patterns (required for all app forms).

Expense Tracker** called **Group Pay\*\*.  
Deliver a production-ready scaffold with the following structure, code, and configs.

## Monorepo

- Package manager: **pnpm**
- Workspace layout:

```
.
├─ apps/
│  ├─ web/        # React + Vite + TS (Mantine UI)
│  └─ api/        # Fastify + TS + Prisma + PostgreSQL
├─ packages/
│  ├─ shared/     # Zod types, DTOs, utilities shared by web/api
│  └─ config/     # ESLint, Prettier, tsconfig bases
├─ .github/workflows/
│  └─ ci.yml      # Lint, typecheck, test for both apps
└─ README.md
```

## Global Tooling

- **ESLint** (TypeScript, React), **Prettier**
- **tsconfig**: strict, path aliases (@shared/\*)
- **Husky + lint-staged** (format on commit)
- **dotenv** support in both apps
- Basic **GitHub Actions** workflow: install, build, test (matrix for web/api)

---

## Shared Package (`packages/shared`)

Create a tiny library used by both web and api.

**Exports**

- `zod` schemas & types for core entities:
  - `User`, `Group`, `GroupMember`, `Expense`, `ExpenseParticipant`, `Settlement`, `Invite`, `Receipt`
- DTOs for API requests/responses:
  - `CreateGroupDto`, `AddExpenseDto`, `SettleUpDto`, `CreateInviteDto`
- **Netting service**:
  - `computeNetBalances(expenses: Expense[], participants: ExpenseParticipant[]): NettedEdge[]`
  - Greedy minimal edge reduction (who owes whom)
- **Currency utils**: sum with decimals, invariant checks (splits must equal total)
- **Error types**: `AppError` with `code` and `httpStatus`

Provide full TypeScript implementations + unit tests for:

- Equal/percent/shares/exact splits
- Netting minimal edges
- Decimal safety (use bigint cents under the hood)

---

## Back End (`apps/api`)

**Stack**: Fastify (TypeScript), Prisma, PostgreSQL, JWT auth, Zod validation, Fastify Swagger.

### Environment

Create `.env.example`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/splitsmarter
JWT_SECRET=change_me
PORT=4000
CORS_ORIGIN=http://localhost:5173
STORAGE_BUCKET_URL=http://localhost:4000/dev-storage
```

### Prisma Schema

Model the following tables with relations & indices:

- `User(id uuid @id, email @unique, passwordHash, name, photoUrl, venmoHandle, paypalLink, createdAt)`
- `Group(id uuid @id, ownerId -> User, name, currency, createdAt)`
- `GroupMember(id uuid @id, groupId -> Group, userId -> User, role enum[owner,admin,member], joinedAt, @@unique([groupId, userId]))`
- `Expense(id uuid @id, groupId -> Group, payerId -> User, description, amountCents int, currency, date, category, notes, createdAt)`
- `ExpenseParticipant(id uuid @id, expenseId -> Expense, userId -> User, shareCents int, @@unique([expenseId, userId]))`
- `Settlement(id uuid @id, groupId -> Group, fromUserId -> User, toUserId -> User, amountCents int, method enum[venmo,paypal,zelle,stripe_link,mark_only], externalRef, status enum[pending,confirmed], createdAt)`
- `Invite(id uuid @id, groupId -> Group, code @unique, createdBy -> User, status enum[pending,accepted,cancelled], expiresAt)`
- `Receipt(id uuid @id, expenseId -> Expense, fileUrl, mimeType)`

Include seed script creating:

- 2 users, 1 group, a few expenses with mixed splits, and resulting balances.

### Fastify App

- Plugins: CORS, sensible, JWT, Swagger (OpenAPI served at `/docs`)
- Middlewares: request logging with requestId
- Error handler mapping `AppError` → HTTP status + code

**Auth**

- Routes: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- Password hashing: **argon2**
- Tokens: short-lived access (15m), refresh (7d), stored as httpOnly cookies (document how front end calls it)

**Routes (v1)**

- `GET /me` → current user
- `POST /groups`, `GET /groups`, `GET /groups/:id`, `PATCH /groups/:id`, `DELETE /groups/:id`
- `POST /groups/:id/invites` → returns `{code, url}`
- `POST /invites/:code/accept`
- `POST /groups/:id/expenses`, `GET /groups/:id/expenses`, `PATCH /expenses/:id`, `DELETE /expenses/:id`
- `GET /groups/:id/balances` → compute via shared netting util
- `POST /groups/:id/settlements` (method: venmo/paypal/zelle/stripe_link/mark_only), `PATCH /settlements/:id/confirm`
- `POST /uploads/receipt` → returns presigned URL mock (for dev), store metadata on save

**Validation**

- All request bodies validated with **Zod** using shared DTO types.

**Tests**

- Unit: split math + netting (reuse shared tests)
- API: happy path e2e (create group → invite → add expense → balances → settle)

**Scripts**

- `pnpm dev` → tsx watch
- `pnpm prisma:migrate`, `pnpm prisma:studio`, `pnpm seed`

---

## Front End (`apps/web`)

**Stack**: React 18 + Vite + TypeScript, **Mantine** UI, React Router v6, **TanStack Query**, **Zod**, **Day.js**.

### Environment

`.env.local.example`

```
VITE_API_URL=http://localhost:4000
```

### App Shell

- Theme: light/dark toggle, primary color brand
- Layout: top nav with user menu, left sidebar on desktop
- Toast system for success/error (Mantine Notifications)

### Routing

```
/login
/register
/app
  /groups
  /groups/:groupId
    (tabs) /ledger | /balances | /members | /settings
  /invites/:code/accept
```

### Pages & Components

- **Auth pages** (email/password, form validation with Zod)
- **Groups list**: create group, join via code, empty states
- **Group detail**:
  - Ledger list (virtualized), filters by member/category/date
  - **Add Expense modal**:
    - Inputs: amount, description, date, payer, participants
    - Split modes: equal / percentages / shares / exact amounts
    - Auto-sum guardrail (must equal total)
    - Receipt upload (use presigned URL from API)
  - **Balances tab**: “who owes whom” (use netting API), quick “Settle Up” action
  - **Members tab**: invite link/QR, roles
  - **Settings tab**: currency, leave group, delete

```

---
```
