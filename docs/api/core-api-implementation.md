# Core API Implementation

## Overview

The Group Pay Core API provides a comprehensive RESTful interface for managing shared expenses, groups, settlements, and users. Built with Fastify and Prisma, it offers robust authentication, validation, and documentation features.

## API Endpoints

### Base URL

- **Development**: `http://localhost:3001`
- **API Documentation**: `http://localhost:3001/docs`
- **Health Check**: `http://localhost:3001/health`

## Authentication

All API endpoints (except health check and authentication routes) require JWT authentication via cookies. The API uses httpOnly cookies for security.

### Authentication Flow

1. Login via `/auth/login` endpoint
2. JWT token is set as httpOnly cookie
3. Include cookie in subsequent requests
4. Access `request.authUser` for authenticated user info

## Route Groups

### 1. Groups Management (`/groups`)

Manage expense groups where users can share costs.

#### Endpoints

**GET /groups**

- **Description**: Get all groups for authenticated user
- **Authentication**: Required
- **Response**: Array of groups with member counts

```json
[
  {
    "id": "group-uuid",
    "name": "Weekend Trip",
    "description": "Our weekend getaway expenses",
    "createdAt": "2023-09-01T10:00:00Z",
    "ownerId": "user-uuid",
    "_count": { "members": 4 }
  }
]
```

**POST /groups**

- **Description**: Create a new group
- **Authentication**: Required
- **Request Body**:

```json
{
  "name": "Group Name",
  "description": "Optional description"
}
```

**GET /groups/:id**

- **Description**: Get specific group details with members and expenses
- **Authentication**: Required (must be group member)
- **Response**: Full group details including members and recent expenses

**PUT /groups/:id**

- **Description**: Update group details
- **Authentication**: Required (owner or admin only)
- **Request Body**:

```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**DELETE /groups/:id**

- **Description**: Delete a group
- **Authentication**: Required (owner only)
- **Note**: Only empty groups (no expenses) can be deleted

**POST /groups/:id/members**

- **Description**: Add member to group
- **Authentication**: Required (member with invite permissions)
- **Request Body**:

```json
{
  "email": "user@example.com",
  "role": "member"
}
```

**DELETE /groups/:id/members/:userId**

- **Description**: Remove member from group
- **Authentication**: Required (admin/owner or self-removal)
- **Note**: Cannot remove owner or last admin

### 2. Expenses Management (`/expenses`)

Handle expense creation, updates, and complex splitting calculations.

#### Endpoints

**GET /expenses**

- **Description**: Get expenses for authenticated user across all groups
- **Authentication**: Required
- **Query Parameters**:
  - `groupId`: Filter by specific group
  - `limit`: Number of results (default: 50)
  - `offset`: Pagination offset
- **Response**: Paginated list of expenses with payer and group info

**POST /expenses**

- **Description**: Create new expense with splits
- **Authentication**: Required
- **Request Body**:

```json
{
  "description": "Dinner at restaurant",
  "amount": "125.50",
  "currency": "USD",
  "groupId": "group-uuid",
  "splits": [
    {
      "userId": "user1-uuid",
      "amount": "62.75",
      "percentage": 50
    },
    {
      "userId": "user2-uuid",
      "amount": "62.75",
      "percentage": 50
    }
  ],
  "receiptUrl": "https://example.com/receipt.jpg"
}
```

**GET /expenses/:id**

- **Description**: Get specific expense details
- **Authentication**: Required (group member only)
- **Response**: Full expense details with splits and participants

**PUT /expenses/:id**

- **Description**: Update expense
- **Authentication**: Required (expense creator or group admin)
- **Request Body**: Same as POST /expenses

**DELETE /expenses/:id**

- **Description**: Delete expense
- **Authentication**: Required (expense creator or group admin)

### 3. Settlements Management (`/settlements`)

Track and manage payments between group members.

#### Endpoints

**GET /settlements**

- **Description**: Get settlements for authenticated user
- **Authentication**: Required
- **Query Parameters**:
  - `groupId`: Filter by group
  - `status`: Filter by status (pending, confirmed, cancelled)
- **Response**: List of settlements with payer/payee details

**POST /settlements**

- **Description**: Record a payment between users
- **Authentication**: Required
- **Request Body**:

```json
{
  "payerId": "payer-uuid",
  "payeeId": "payee-uuid",
  "amount": "50.00",
  "currency": "USD",
  "groupId": "group-uuid",
  "description": "Settling dinner expenses",
  "proofUrl": "https://example.com/payment-proof.jpg"
}
```

**GET /settlements/:id**

- **Description**: Get specific settlement details
- **Authentication**: Required (involved user or group admin)

**PUT /settlements/:id/confirm**

- **Description**: Confirm a settlement
- **Authentication**: Required (payee only)
- **Effect**: Changes status from 'pending' to 'confirmed'

**DELETE /settlements/:id**

- **Description**: Cancel/delete settlement
- **Authentication**: Required (payer or payee only)
- **Note**: Only pending settlements can be cancelled

### 4. Users Management (`/users`)

Manage user profiles and retrieve user information.

#### Endpoints

**GET /users/me**

- **Description**: Get current user profile
- **Authentication**: Required
- **Response**: Full user profile with statistics

**PUT /users/me**

- **Description**: Update user profile
- **Authentication**: Required
- **Request Body**:

```json
{
  "name": "Updated Name",
  "email": "new@example.com",
  "phone": "+1234567890",
  "profilePicture": "https://example.com/avatar.jpg",
  "preferences": {
    "currency": "USD",
    "notifications": true
  }
}
```

**GET /users/search**

- **Description**: Search users by email
- **Authentication**: Required
- **Query Parameters**:
  - `email`: Email to search for
- **Response**: User basic info (for adding to groups)

**GET /users/balances**

- **Description**: Get user's balances across all groups
- **Authentication**: Required
- **Response**: Aggregated balance information

```json
{
  "totalOwed": "125.50",
  "totalOwing": "75.25",
  "netBalance": "50.25",
  "balancesByGroup": [
    {
      "groupId": "group-uuid",
      "groupName": "Weekend Trip",
      "balance": "25.00"
    }
  ]
}
```

## Data Models

### Group

```typescript
{
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  members: GroupMember[];
  expenses: Expense[];
}
```

### Expense

```typescript
{
  id: string;
  description: string;
  amount: Decimal;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  payerId: string;
  groupId: string;
  receiptUrl?: string;
  splits: ExpenseSplit[];
}
```

### Settlement

```typescript
{
  id: string;
  amount: Decimal;
  currency: string;
  description?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  payerId: string;
  payeeId: string;
  groupId: string;
  proofUrl?: string;
}
```

### User

```typescript
{
  id: string;
  email: string;
  name: string;
  phone?: string;
  profilePicture?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

The API uses consistent error response format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional context (optional)"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` (401): Missing or invalid authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid request data
- `CONFLICT` (409): Resource conflict (e.g., duplicate)
- `INTERNAL_SERVER_ERROR` (500): Server error

## Validation

All endpoints use JSON Schema validation for request bodies and parameters:

- **Required fields** are enforced
- **Data types** are validated
- **Format validation** for emails, UUIDs, currencies
- **Range validation** for amounts and percentages
- **Business logic validation** (e.g., splits sum to 100%)

## Security Features

1. **JWT Authentication**: Secure token-based auth with httpOnly cookies
2. **Role-based Access Control**: Group owners, admins, and members have different permissions
3. **Input Validation**: All inputs are validated and sanitized
4. **SQL Injection Protection**: Prisma ORM prevents SQL injection
5. **CORS Protection**: Configured for specific origins
6. **Request Logging**: All requests are logged for monitoring

## Performance Features

1. **Database Optimization**: Efficient queries with proper joins
2. **Pagination**: Large result sets are paginated
3. **Caching**: Response caching where appropriate
4. **Connection Pooling**: Database connection pooling
5. **Error Monitoring**: Structured error logging

## API Documentation

Interactive API documentation is available at `/docs` endpoint using Swagger UI. Features include:

- **Interactive Testing**: Try endpoints directly from the browser
- **Schema Documentation**: Complete request/response schemas
- **Authentication Testing**: Login and test authenticated endpoints
- **Examples**: Sample requests and responses for all endpoints

## Development Features

1. **TypeScript**: Full type safety across the application
2. **Testing**: Comprehensive test suite with Vitest
3. **Linting**: ESLint configuration for code quality
4. **Auto-reload**: Development server with hot reload
5. **Database Migrations**: Prisma migrations for schema changes

## Getting Started

1. **Install Dependencies**:

   ```bash
   pnpm install
   ```

2. **Setup Database**:

   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

3. **Start Development Server**:

   ```bash
   pnpm dev
   ```

4. **Access API Documentation**:
   Visit `http://localhost:3001/docs`

## Testing

Run the test suite:

```bash
pnpm test
```

Tests cover:

- Route functionality
- Authentication flows
- Validation rules
- Error handling
- Business logic

## Deployment

The API is containerized and ready for deployment:

1. **Build**: `pnpm build`
2. **Database Migration**: `pnpm db:migrate:prod`
3. **Start**: `pnpm start`

Environment variables required:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `NODE_ENV`: Environment (development/production)

## Future Enhancements

Potential improvements for future versions:

1. **Real-time Updates**: WebSocket support for live updates
2. **File Uploads**: Direct receipt/proof image uploads
3. **Push Notifications**: Mobile/web notifications
4. **Advanced Analytics**: Spending analytics and insights
5. **Currency Exchange**: Real-time currency conversion
6. **Export Features**: PDF reports and CSV exports
7. **Advanced Splitting**: Tax, tip, and discount calculations
8. **Recurring Expenses**: Automated recurring expense creation

---

_This API implementation provides a solid foundation for the Group Pay application with room for future enhancements and scalability._
