# GroupPay API Documentation

## Base URL

Development: `http://localhost:4000/api`
Production: `https://your-domain.com/api`

## Authentication

GroupPay uses JWT (JSON Web Tokens) stored in httpOnly cookies for authentication. Most endpoints require authentication.

### Auth Endpoints

#### Register a New User

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "photoUrl": null,
    "venmoHandle": null,
    "paypalLink": null,
    "createdAt": "2025-01-10T12:00:00.000Z"
  },
  "token": "jwt-token-here"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt-token-here"
}
```

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "photoUrl": null,
    "venmoHandle": null,
    "paypalLink": null,
    "createdAt": "2025-01-10T12:00:00.000Z"
  }
}
```

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "message": "Logged out successfully"
}
```

---

## User Management

#### Update User Profile

```http
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Updated",
  "photoUrl": "https://example.com/photo.jpg",
  "venmoHandle": "@johndoe",
  "paypalLink": "https://paypal.me/johndoe"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Updated",
    "photoUrl": "https://example.com/photo.jpg",
    "venmoHandle": "@johndoe",
    "paypalLink": "https://paypal.me/johndoe",
    "createdAt": "2025-01-10T12:00:00.000Z"
  }
}
```

---

## Group Management

#### Create a Group

```http
POST /api/groups
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Roommates",
  "currency": "USD"
}
```

**Response (201 Created):**

```json
{
  "group": {
    "id": "uuid",
    "name": "Roommates",
    "currency": "USD",
    "ownerId": "user-uuid",
    "createdAt": "2025-01-10T12:00:00.000Z",
    "memberCount": 1
  }
}
```

#### Get All Groups

```http
GET /api/groups
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "groups": [
    {
      "id": "uuid",
      "name": "Roommates",
      "currency": "USD",
      "ownerId": "user-uuid",
      "createdAt": "2025-01-10T12:00:00.000Z",
      "memberCount": 3
    }
  ]
}
```

#### Get Single Group

```http
GET /api/groups/{groupId}
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "group": {
    "id": "uuid",
    "name": "Roommates",
    "currency": "USD",
    "ownerId": "user-uuid",
    "createdAt": "2025-01-10T12:00:00.000Z",
    "members": [
      {
        "id": "member-uuid",
        "userId": "user-uuid",
        "role": "OWNER",
        "joinedAt": "2025-01-10T12:00:00.000Z",
        "user": {
          "id": "user-uuid",
          "name": "John Doe",
          "email": "john@example.com",
          "photoUrl": null
        }
      }
    ]
  }
}
```

#### Update Group

```http
PATCH /api/groups/{groupId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Roommates",
  "currency": "EUR"
}
```

#### Delete Group

```http
DELETE /api/groups/{groupId}
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "message": "Group deleted successfully"
}
```

---

## Group Members

#### Add Member to Group

```http
POST /api/groups/{groupId}/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user-uuid",
  "role": "MEMBER"
}
```

**Roles:** `OWNER`, `ADMIN`, `MEMBER`

#### Update Member Role

```http
PATCH /api/groups/{groupId}/members/{memberId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "ADMIN"
}
```

#### Remove Member

```http
DELETE /api/groups/{groupId}/members/{memberId}
Authorization: Bearer {token}
```

---

## Invitations

#### Create Invite

```http
POST /api/groups/{groupId}/invites
Authorization: Bearer {token}
Content-Type: application/json

{
  "expiresInDays": 7
}
```

**Response (201 Created):**

```json
{
  "invite": {
    "id": "uuid",
    "code": "ABC123XYZ",
    "groupId": "group-uuid",
    "createdBy": "user-uuid",
    "status": "PENDING",
    "expiresAt": "2025-01-17T12:00:00.000Z",
    "url": "http://localhost:5173/invites/ABC123XYZ/accept"
  }
}
```

#### Accept Invite

```http
POST /api/invites/{code}/accept
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "group": {
    "id": "uuid",
    "name": "Roommates",
    "currency": "USD"
  },
  "membership": {
    "id": "member-uuid",
    "role": "MEMBER",
    "joinedAt": "2025-01-10T12:00:00.000Z"
  }
}
```

---

## Expenses

#### Create Expense

```http
POST /api/groups/{groupId}/expenses
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Groceries",
  "amountCents": 5000,
  "currency": "USD",
  "date": "2025-01-10T12:00:00.000Z",
  "category": "Food",
  "notes": "Weekly groceries",
  "splitType": "EQUAL",
  "payerId": "user-uuid",
  "participants": [
    {
      "userId": "user1-uuid",
      "shareCents": 2500
    },
    {
      "userId": "user2-uuid",
      "shareCents": 2500
    }
  ]
}
```

**Split Types:**

- `EQUAL` - Split evenly among all participants
- `PERCENTAGE` - Split by percentage (shareCents represents percentage \* 100)
- `SHARES` - Split by shares/weights
- `EXACT` - Exact amounts per person

**Response (201 Created):**

```json
{
  "expense": {
    "id": "uuid",
    "groupId": "group-uuid",
    "payerId": "user-uuid",
    "description": "Groceries",
    "amountCents": 5000,
    "currency": "USD",
    "date": "2025-01-10T12:00:00.000Z",
    "category": "Food",
    "notes": "Weekly groceries",
    "splitType": "EQUAL",
    "createdAt": "2025-01-10T12:00:00.000Z",
    "participants": [...]
  }
}
```

#### Get Group Expenses

```http
GET /api/groups/{groupId}/expenses
Authorization: Bearer {token}
```

**Query Parameters:**

- `limit` (optional): Number of expenses to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**

```json
{
  "expenses": [
    {
      "id": "uuid",
      "description": "Groceries",
      "amountCents": 5000,
      "currency": "USD",
      "date": "2025-01-10T12:00:00.000Z",
      "category": "Food",
      "payer": {
        "id": "user-uuid",
        "name": "John Doe"
      },
      "participants": [...]
    }
  ],
  "total": 1
}
```

#### Update Expense

```http
PATCH /api/expenses/{expenseId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Updated Groceries",
  "amountCents": 6000
}
```

#### Delete Expense

```http
DELETE /api/expenses/{expenseId}
Authorization: Bearer {token}
```

---

## Balances

#### Get Group Balances

```http
GET /api/groups/{groupId}/balances
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "balances": [
    {
      "userId": "user1-uuid",
      "userName": "John Doe",
      "balance": 2500,
      "owes": [],
      "owedBy": [
        {
          "userId": "user2-uuid",
          "userName": "Jane Smith",
          "amount": 2500
        }
      ]
    },
    {
      "userId": "user2-uuid",
      "userName": "Jane Smith",
      "balance": -2500,
      "owes": [
        {
          "userId": "user1-uuid",
          "userName": "John Doe",
          "amount": 2500
        }
      ],
      "owedBy": []
    }
  ]
}
```

---

## Settlements

#### Create Settlement

```http
POST /api/groups/{groupId}/settlements
Authorization: Bearer {token}
Content-Type: application/json

{
  "fromUserId": "user-uuid",
  "toUserId": "user-uuid",
  "amountCents": 2500,
  "method": "VENMO",
  "externalRef": "venmo-transaction-id"
}
```

**Settlement Methods:**

- `VENMO`
- `PAYPAL`
- `ZELLE`
- `STRIPE_LINK`
- `MARK_ONLY` (record without actual payment)

#### Confirm Settlement

```http
PATCH /api/settlements/{settlementId}/confirm
Authorization: Bearer {token}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` (401) - Not authenticated
- `FORBIDDEN` (403) - Not authorized to perform action
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request data
- `INTERNAL_ERROR` (500) - Server error

---

## Rate Limiting

API requests are rate-limited to:

- **100 requests per minute** per IP address
- **1000 requests per hour** per authenticated user

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704888000
```

---

## Interactive API Documentation

For interactive API documentation with the ability to test endpoints, visit:

**Development:** http://localhost:4000/docs

The Swagger UI provides:

- Complete endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Authentication testing
- Example payloads
