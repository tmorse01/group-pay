# Group Pay Documentation

Welcome to the Group Pay documentation! This guide will help you understand, implement, and maintain the Group Pay application.

## 📚 Documentation Overview

### Features Documentation

- **[Authentication System](./features/authentication.md)** - Complete authentication implementation with JWT tokens, secure cookies, and comprehensive security measures

### API Reference

- **[Authentication API](./api/authentication.md)** - Detailed API endpoints for user authentication, registration, and session management

### Implementation Guides

- **[Authentication Implementation](./guides/authentication-implementation.md)** - Practical guide for integrating authentication into your frontend application

## 🏗️ Architecture Overview

```
group-pay/
├── apps/
│   ├── api/          # Fastify backend API
│   └── web/          # React frontend application
├── packages/
│   ├── shared/       # Shared types and utilities
│   └── config/       # Configuration packages
└── docs/             # Documentation (this folder)
```

### Technology Stack

**Backend (API)**

- **Framework**: Fastify with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with httpOnly cookies
- **Security**: Argon2 password hashing, CORS protection
- **Testing**: Vitest with integration tests

**Frontend (Web)**

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **State Management**: React Context + Hooks
- **Styling**: Tailwind CSS (planned)
- **Testing**: Vitest + React Testing Library

**Shared**

- **Validation**: Zod schemas
- **Types**: Shared TypeScript interfaces
- **Utilities**: Common utility functions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm package manager

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd group-pay

# Install dependencies
pnpm install

# Set up environment
cp apps/api/.env.example apps/api/.env
# Update DATABASE_URL and JWT_SECRET in .env

# Run database migrations
cd apps/api
pnpm db:migrate

# Start development servers
pnpm dev  # Starts both API and web servers
```

### Testing

```bash
# Run all tests
pnpm test

# Run API tests only
cd apps/api && pnpm test

# Run with coverage
pnpm test:coverage
```

## 📋 Feature Implementation Status

| Feature             | Status      | Documentation                        |
| ------------------- | ----------- | ------------------------------------ |
| Authentication      | ✅ Complete | [Docs](./features/authentication.md) |
| User Management     | 🟡 Planned  | Coming soon                          |
| Group Management    | 🟡 Planned  | Coming soon                          |
| Expense Tracking    | 🟡 Planned  | Coming soon                          |
| Settlement System   | 🟡 Planned  | Coming soon                          |
| Receipt Upload      | 🟡 Planned  | Coming soon                          |
| Smart Splits        | 🟡 Planned  | Coming soon                          |
| Payment Integration | 🟡 Planned  | Coming soon                          |

## 🔑 Key Features

### ✅ Implemented Features

#### Authentication System

- **User Registration**: Secure account creation with email/password
- **User Login**: JWT-based authentication with httpOnly cookies
- **Session Management**: Automatic token refresh and secure logout
- **Password Security**: Argon2 hashing with industry-standard parameters
- **API Protection**: Middleware-based route protection
- **Error Handling**: Comprehensive error responses and logging

### 🟡 Planned Features

#### User Management

- Profile management and settings
- Avatar upload and management
- Payment method configuration
- Account verification via email

#### Group Management

- Create and join expense groups
- Invite system with shareable links
- Role-based permissions (owner, admin, member)
- Group settings and preferences

#### Expense Tracking

- Add expenses with receipt uploads
- Smart expense splitting algorithms
- Category-based expense organization
- Multi-currency support

#### Settlement System

- Automatic balance calculations
- Payment integration (Venmo, PayPal, Stripe)
- Settlement tracking and confirmations
- Payment reminders and notifications

## 🛡️ Security Considerations

### Authentication Security

- **Password Hashing**: Argon2id with 64MB memory cost
- **JWT Tokens**: Secure signing with configurable secrets
- **Cookie Security**: httpOnly, Secure, SameSite protection
- **Token Expiry**: Short-lived access tokens with refresh mechanism
- **CORS Protection**: Configured for specific origins

### API Security

- **Input Validation**: Zod schema validation on all endpoints
- **Rate Limiting**: Protection against brute force attacks
- **Error Handling**: Secure error responses without data leakage
- **SQL Injection**: Protected by Prisma ORM parameterization

### Production Security

- **Environment Variables**: Secure configuration management
- **HTTPS Enforcement**: Secure cookies and headers
- **Security Headers**: XSS, CSRF, and clickjacking protection
- **Monitoring**: Authentication event logging

## 📖 Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Configured for consistent code style
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Semantic commit messages

### Testing Standards

- **Unit Tests**: Individual function and component testing
- **Integration Tests**: End-to-end API testing
- **Test Coverage**: Aim for >80% coverage on critical paths
- **Test Data**: Isolated test environments with cleanup

### Documentation Standards

- **Feature Documentation**: Complete implementation details
- **API Reference**: Comprehensive endpoint documentation
- **Implementation Guides**: Practical usage examples
- **Code Comments**: Clear inline documentation

## 🚦 API Endpoints Overview

### Authentication (`/auth`)

- `POST /register` - Create new user account
- `POST /login` - Authenticate user
- `POST /refresh` - Refresh access token
- `POST /logout` - Clear session
- `GET /me` - Get current user

### Health Check (`/health`)

- `GET /health` - Service health status

### Documentation

- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /` - API information and status

## 🔧 Configuration

### Environment Variables

**Required for API:**

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/group_pay"
JWT_SECRET="minimum-32-character-secret-key"
NODE_ENV="development|production|test"
```

**Optional Configuration:**

```env
PORT=3001
CORS_ORIGIN="http://localhost:5173"
LOG_LEVEL="info"
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

### Database Configuration

- **Production**: Connection pooling recommended
- **Development**: Local PostgreSQL instance
- **Testing**: Separate test database with cleanup

## 📞 Support and Contributing

### Getting Help

- Check existing documentation first
- Review test files for usage examples
- Check issues in the repository
- Contact the development team

### Contributing

- Follow conventional commit standards
- Write tests for new features
- Update documentation for changes
- Follow the established code style

### Documentation Updates

When implementing new features:

1. Create feature documentation in `docs/features/`
2. Add API reference in `docs/api/`
3. Provide implementation guide in `docs/guides/`
4. Update this main README

---

_This documentation is maintained alongside the codebase. For the latest updates, please refer to the repository._
