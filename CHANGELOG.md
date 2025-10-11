# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Core Features

- User authentication with JWT and httpOnly cookies
- Group management (create, read, update, delete)
- Group member management with role-based access (owner, admin, member)
- Invite system with shareable codes and links
- Expense tracking with full CRUD operations
- Multiple split types:
  - Equal split (divide evenly among participants)
  - Percentage-based split
  - Share-based split (weighted distribution)
  - Exact amount split (custom amounts per person)
- Real-time balance calculation per group
- Settlement tracking between members
- User profile management
- Payment information (Venmo handle, PayPal link)

#### Frontend Features

- Modern, responsive UI with UntitledUI components
- Light/Dark theme support with system preference detection
- Protected routes with authentication
- Dashboard with group overview
- Groups list with create/manage functionality
- Detailed group view with:
  - Expense ledger
  - Balance summary
  - Member management
  - Settings panel
- Expense creation modal with split calculator
- Settings page with profile and preferences
- Toast notifications for user feedback
- Loading states and error handling
- Mobile-responsive design

#### Backend Features

- RESTful API with Fastify
- PostgreSQL database with Prisma ORM
- Comprehensive API documentation (Swagger/OpenAPI)
- Rate limiting for API protection
- CORS configuration
- Request validation with Zod schemas
- Error handling middleware
- Authentication middleware
- Database migrations and seeding

#### Developer Experience

- Monorepo setup with pnpm workspaces
- Shared types and utilities package
- TypeScript strict mode across all packages
- ESLint and Prettier configuration
- Pre-commit hooks with Husky and lint-staged
- Path aliases for clean imports
- Comprehensive documentation:
  - API documentation
  - Component guidelines
  - Feature documentation
  - Coding standards
  - Forms guide
  - Copilot prompts

### Technical Details

#### Database Schema

- User table with authentication and profile info
- Group table with ownership and settings
- GroupMember junction table with roles
- Expense table with split type tracking
- ExpenseParticipant table for split amounts
- Settlement table for payment tracking
- Invite table for group invitations
- Receipt table (schema ready, upload pending)

#### API Endpoints

- `/api/auth` - Authentication (login, register, logout, me)
- `/api/groups` - Group management
- `/api/groups/:id/expenses` - Expense management
- `/api/groups/:id/balances` - Balance calculation
- `/api/groups/:id/settlements` - Settlement tracking
- `/api/groups/:id/invites` - Invite management
- `/api/invites/:code/accept` - Accept invitation
- `/api/users/profile` - User profile updates
- `/api/health` - Health check

#### Component Library

- Avatar
- Badges
- Buttons (primary, secondary, tertiary, variants)
- Checkbox
- Dropdown menus
- Input fields with validation
- Select dropdowns
- Tags
- Textarea
- Tooltips
- Modal dialogs
- Layout components

### Security

- Password hashing with argon2
- JWT token authentication
- httpOnly cookies for token storage
- CORS protection
- Rate limiting
- Request validation
- SQL injection prevention (Prisma ORM)
- XSS protection

### Performance

- Code splitting with lazy loading
- Optimistic updates with React Query
- Efficient re-renders with React Query caching
- Database indexing on frequently queried columns
- Connection pooling with Prisma

## [0.1.0] - 2025-01-10

### Initial Release

- Project scaffolding
- Basic monorepo structure
- Development environment setup
- Core data models
- Authentication system
- Basic UI components

---

## Roadmap

### Planned Features

#### Short Term

- [ ] Receipt upload and storage
- [ ] Advanced debt netting algorithm (minimize transactions)
- [ ] Expense categories with filtering
- [ ] Date range filtering for expenses
- [ ] Export functionality (CSV, PDF)
- [ ] User email verification

#### Medium Term

- [ ] Payment provider integration (Venmo, PayPal, Stripe)
- [ ] Email notifications for group activities
- [ ] Activity feed/timeline
- [ ] Expense comments and discussion
- [ ] Multi-currency support with exchange rates
- [ ] Budget tracking and alerts

#### Long Term

- [ ] Mobile app (React Native)
- [ ] Recurring expenses
- [ ] Split templates (save common split patterns)
- [ ] Analytics and reports
- [ ] Group expense trends and insights
- [ ] API rate limiting per user
- [ ] Two-factor authentication
- [ ] Social features (profile pictures from OAuth)
- [ ] Integration with banking APIs

### Performance Improvements

- [ ] Implement caching layer (Redis)
- [ ] Optimize database queries
- [ ] Add CDN for static assets
- [ ] Implement lazy loading for images
- [ ] Add service worker for offline support

### Developer Tools

- [ ] E2E testing with Playwright
- [ ] Visual regression testing
- [ ] Performance monitoring
- [ ] Error tracking (Sentry)
- [ ] CI/CD pipeline improvements
- [ ] Docker containerization
- [ ] Kubernetes deployment configs
