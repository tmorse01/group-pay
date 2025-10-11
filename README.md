# Group Pay

A modern group expense tracker and bill splitting application built with TypeScript, React, and Fastify.

## 📁 Project Structure

```
.
├─ apps/
│  ├─ web/        # React + Vite + TypeScript (UntitledUI Components)
│  └─ api/        # Fastify + TypeScript + Prisma + PostgreSQL
├─ packages/
│  ├─ shared/     # Zod types, DTOs, utilities shared by web/api
│  └─ config/     # ESLint, Prettier, tsconfig bases
├─ docs/          # Documentation for components, features, and APIs
├─ .github/
│  ├─ workflows/  # CI/CD pipelines
│  └─ prompts/    # Copilot project prompts
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
   # Update DATABASE_URL and JWT_SECRET

   # Web
   cp apps/web/.env.local.example apps/web/.env.local
   # Update VITE_API_URL if needed
   ```

4. Set up the database:

   ```bash
   # Generate Prisma client
   cd apps/api
   pnpm prisma:generate

   # Run migrations
   pnpm prisma:migrate

   # Seed the database (optional)
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

Access the application:

- **Web App**: http://localhost:5173
- **API Docs**: http://localhost:4000/docs (Swagger UI)

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
- **Validation**: Zod schemas from shared package
- **API Docs**: Swagger/OpenAPI at `/docs`
- **Security**: Rate limiting, CORS, password hashing with argon2

### Frontend (apps/web)

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: UntitledUI Component System (React Aria Components)
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS with custom design tokens
- **Theme**: Light/Dark/System mode support

### Shared (packages/shared)

- **Types**: Zod schemas and TypeScript types
- **DTOs**: API request/response types
- **Utils**: Currency handling, expense splitting logic
- **Services**: Debt netting algorithms
- **Error Handling**: Centralized error types and codes

## 📋 Features

### ✅ Implemented

#### Core Features

- ✅ **User Authentication**: Secure JWT-based auth with httpOnly cookies
- ✅ **Group Management**: Create, view, update, and delete expense groups
- ✅ **Group Members**: Add/remove members, manage roles (owner/admin/member)
- ✅ **Invite System**: Generate and share invite links/codes
- ✅ **Expense Tracking**: Add, edit, and delete expenses
- ✅ **Flexible Splitting**:
  - Equal split
  - Percentage-based
  - Share-based
  - Exact amounts
- ✅ **Balance Calculation**: Real-time balance tracking per group
- ✅ **Debt Settlement**: Mark settlements between members
- ✅ **User Settings**: Profile management, payment info, theme preferences

#### UI/UX

- ✅ **Responsive Design**: Mobile-first, works on all screen sizes
- ✅ **Dark Mode**: Full dark mode support with system preference detection
- ✅ **Modern UI**: UntitledUI component library with accessible components
- ✅ **Toast Notifications**: User feedback for actions
- ✅ **Loading States**: Skeleton screens and loading indicators
- ✅ **Error Handling**: Comprehensive error boundaries and messages

#### Developer Experience

- ✅ **TypeScript**: Full type safety across frontend and backend
- ✅ **Monorepo**: pnpm workspace for code sharing
- ✅ **Code Quality**: ESLint, Prettier, Husky pre-commit hooks
- ✅ **API Documentation**: Auto-generated Swagger docs
- ✅ **Documentation**: Comprehensive docs for components and APIs

### 🚧 Planned Features

- [ ] Receipt upload and storage
- [ ] Advanced debt netting (minimal transaction optimization)
- [ ] Payment integration (Venmo, PayPal, Stripe)
- [ ] Expense categories and filtering
- [ ] Export data (CSV, PDF)
- [ ] Email notifications
- [ ] Activity feed
- [ ] Expense comments/discussion
- [ ] Multi-currency support
- [ ] Budget tracking

## 🎨 Design System

The application uses a custom design system built on UntitledUI components with:

- **Color Palette**: Neutral grays, brand colors, semantic colors
- **Typography**: Responsive text scales
- **Spacing**: Consistent spacing system
- **Components**: Accessible, composable UI components
- **Icons**: UntitledUI icon set

See `.github/REACT_CODING_STANDARDS.md` for coding standards and best practices.

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
cd apps/api && pnpm test
cd apps/web && pnpm test
cd packages/shared && pnpm test

# Run tests in watch mode
pnpm test:watch
```

## 📦 Deployment

### Building for Production

```bash
# Build all packages
pnpm build
```

### Deployment Steps

#### Backend (apps/api)

1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations:
   ```bash
   pnpm prisma:migrate
   ```
4. Deploy `apps/api/dist` to your server (Node.js hosting)
5. Ensure port 4000 is accessible (or configure PORT env var)

#### Frontend (apps/web)

1. Build the app:
   ```bash
   cd apps/web && pnpm build
   ```
2. Deploy `apps/web/dist` to static hosting (Vercel, Netlify, etc.)
3. Configure `VITE_API_URL` to point to your production API

### Environment Variables

#### API (.env)

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-key-min-32-chars
PORT=4000
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Web (.env.local)

```env
VITE_API_URL=https://your-api-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm test && pnpm lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

Please follow the coding standards outlined in `.github/REACT_CODING_STANDARDS.md`.

## � Documentation

- **API Documentation**: [docs/api/](docs/api/)
- **Component Guide**: [docs/components/](docs/components/)
- **Feature Documentation**: [docs/features/](docs/features/)
- **Forms Guide**: [docs/forms/](docs/forms/)

## 🛠️ Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- TanStack Query
- React Router v6
- Tailwind CSS
- UntitledUI Components
- Zod Validation

### Backend

- Fastify
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Argon2 Password Hashing
- Zod Validation

### DevOps

- pnpm Workspaces
- ESLint
- Prettier
- Husky
- GitHub Actions

## �📄 License

ISC License

## 👥 Authors

Built with ❤️ for better expense splitting and group payment management.
