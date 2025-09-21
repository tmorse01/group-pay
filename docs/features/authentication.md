# Authentication System Documentation

**Status**: ✅ Implemented  
**Version**: 1.0.0  
**Last Updated**: September 20, 2025

## Overview

The Group Pay authentication system provides secure user registration, login, and session management using JWT tokens with httpOnly cookies. The system is built on Fastify with argon2 password hashing and comprehensive security measures.

## Architecture

### Core Components

```
├── src/utils/auth.ts          # Password hashing & JWT utilities
├── src/plugins/auth.ts        # Authentication middleware plugin
├── src/plugins/errorHandler.ts # Global error handling
├── src/routes/auth.ts         # Authentication endpoints
└── src/__tests__/auth.test.ts # Integration tests
```

### Security Stack

- **Password Hashing**: Argon2id (64MB memory, 3 time cost)
- **Token Management**: JWT with RS256 signing
- **Session Storage**: httpOnly cookies (XSS protection)
- **Token Expiry**: 15min access, 7-day refresh
- **CORS Protection**: Configured for frontend domain

## API Endpoints

### Authentication Routes (`/auth`)

#### `POST /auth/register`

Creates a new user account with email/password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response (201):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-09-20T10:00:00Z"
  }
}
```

**Cookies Set:**

- `accessToken` (15min, httpOnly)
- `refreshToken` (7 days, httpOnly)

---

#### `POST /auth/login`

Authenticates existing user credentials.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Cookies Set:**

- `accessToken` (15min, httpOnly)
- `refreshToken` (7 days, httpOnly)

---

#### `POST /auth/refresh`

Refreshes expired access token using refresh token.

**Request:** Uses `refreshToken` cookie automatically

**Response (200):**

```json
{
  "success": true
}
```

**Cookies Set:**

- `accessToken` (new 15min token)

---

#### `POST /auth/logout`

Clears authentication cookies.

**Response (200):**

```json
{
  "success": true
}
```

**Cookies Cleared:**

- `accessToken`
- `refreshToken`

---

#### `GET /auth/me`

Returns current authenticated user information.

**Headers Required:**

- Cookie with valid `accessToken` OR
- `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "photoUrl": null,
    "venmoHandle": null,
    "paypalLink": null,
    "createdAt": "2025-09-20T10:00:00Z"
  }
}
```

## Security Features

### Password Security

- **Argon2id Algorithm**: Industry-standard password hashing
- **High Memory Cost**: 64MB prevents brute force attacks
- **Salt Handling**: Automatic per-password salting
- **Verification**: Secure constant-time comparison

### Token Management

- **JWT Structure**: Contains `userId`, `email`, `iat`, `exp`
- **Signing**: HS256 with secret key (configurable to RS256)
- **Validation**: Issuer/audience verification
- **Expiry**: Short-lived access tokens, longer refresh tokens

### Cookie Security

- **httpOnly**: Prevents JavaScript access (XSS protection)
- **Secure**: HTTPS-only in production
- **SameSite**: 'lax' for CSRF protection
- **Path**: '/' for application-wide access

### Route Protection

- **Public Routes**: Registration, login, health, docs
- **Protected Routes**: Automatic token validation
- **Error Handling**: Consistent unauthorized responses

## Environment Configuration

### Required Variables

```env
# JWT Configuration
JWT_SECRET="minimum-32-character-secret-key"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
NODE_ENV="development|production|test"
CORS_ORIGIN="http://localhost:5173"
```

### Development Setup

```bash
# Copy environment template
cp .env.example .env

# Update JWT_SECRET with secure random string
# Ensure DATABASE_URL points to your PostgreSQL instance
```

## Usage Examples

### Frontend Integration

#### Login Flow

```typescript
// Login request
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
  credentials: 'include', // Important for cookies
});

const { user } = await response.json();
```

#### Authenticated Requests

```typescript
// Cookies automatically included
const response = await fetch('/api/protected-endpoint', {
  credentials: 'include',
});

// Or with Bearer token
const response = await fetch('/api/protected-endpoint', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

#### Token Refresh

```typescript
// Automatic refresh on 401
async function apiCall(url: string, options: RequestInit = {}) {
  let response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  if (response.status === 401) {
    // Try to refresh token
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      // Retry original request
      response = await fetch(url, {
        ...options,
        credentials: 'include',
      });
    } else {
      // Redirect to login
      window.location.href = '/login';
    }
  }

  return response;
}
```

## Error Handling

### Error Response Format

```json
{
  "error": "Error Type",
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "details": {
    /* Additional context */
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400): Invalid request data
- `UNAUTHORIZED` (401): Missing/invalid authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `INTERNAL_ERROR` (500): Server error

### Example Error Responses

**Invalid Credentials:**

```json
{
  "error": "UnauthorizedError",
  "code": "UNAUTHORIZED",
  "message": "Invalid email or password"
}
```

**Validation Error:**

```json
{
  "error": "Validation Error",
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [
    {
      "code": "invalid_string",
      "path": ["email"],
      "message": "Invalid email"
    }
  ]
}
```

## Testing

### Test Coverage

- ✅ User registration with valid data
- ✅ Duplicate email rejection
- ✅ User login with valid credentials
- ✅ Invalid credential rejection
- ✅ Current user retrieval
- ✅ Unauthenticated request rejection
- ✅ Token refresh functionality
- ✅ Logout cookie clearing

### Running Tests

```bash
# Run all auth tests
pnpm test auth

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch
```

### Test Environment

- **Database**: Isolated test database
- **Environment**: `.env.test` configuration
- **Cleanup**: Database reset between tests
- **Timeouts**: 30s for integration tests

## Performance Considerations

### Password Hashing

- **Cost**: 3 iterations balanced for security/speed
- **Memory**: 64MB memory cost prevents parallel attacks
- **Async**: Non-blocking password operations

### Token Validation

- **In-Memory**: JWT validation without database calls
- **Caching**: Consider Redis for token blacklisting
- **Expiry**: Short access tokens minimize exposure

### Database Queries

- **User Lookup**: Indexed email field
- **Select Fields**: Limited user data exposure
- **Connection Pool**: Prisma handles connection management

## Deployment Considerations

### Production Checklist

- [ ] Generate secure 32+ character JWT_SECRET
- [ ] Enable HTTPS (secure cookies)
- [ ] Configure CORS_ORIGIN for production domain
- [ ] Set up database connection pooling
- [ ] Enable request rate limiting
- [ ] Configure proper logging levels
- [ ] Set up monitoring for auth failures

### Environment Variables

```env
# Production example
JWT_SECRET="production-secret-key-very-long-and-random"
NODE_ENV="production"
CORS_ORIGIN="https://yourdomain.com"
LOG_LEVEL="warn"
```

### Monitoring

- **Failed Login Attempts**: Track for brute force detection
- **Token Refresh Rate**: Monitor for unusual patterns
- **Error Rates**: Watch authentication error trends
- **Performance**: Monitor password hashing response times

## Future Enhancements

### Planned Features

- [ ] Two-Factor Authentication (2FA)
- [ ] OAuth integration (Google, GitHub)
- [ ] Password reset functionality
- [ ] Account verification via email
- [ ] Session management dashboard
- [ ] Rate limiting per user
- [ ] Suspicious activity detection

### Security Improvements

- [ ] RS256 JWT signing with key rotation
- [ ] Token blacklisting with Redis
- [ ] Geolocation-based security
- [ ] Device fingerprinting
- [ ] Advanced password policies
- [ ] Account lockout after failed attempts

## Troubleshooting

### Common Issues

**"No authentication token provided"**

- Check if cookies are being sent with requests
- Verify CORS credentials setting
- Ensure token hasn't expired

**"Invalid token"**

- Check JWT_SECRET consistency across environments
- Verify token format and signing algorithm
- Check for token corruption or truncation

**"User not found"**

- Database connection issues
- User deleted after token issued
- Database migration needed

**Password verification failing**

- Argon2 library version mismatch
- Corrupted password hash in database
- Incorrect password provided

### Debug Commands

```bash
# Check environment variables
pnpm run env:check

# Validate JWT token manually
node -e "console.log(require('jsonwebtoken').verify('TOKEN', 'SECRET'))"

# Test database connection
pnpm run db:test-connection

# View API logs
pnpm run logs:tail
```

## API Documentation

Interactive API documentation is available at `/docs` when the server is running in development mode.

### Swagger/OpenAPI

- **Authentication**: Bearer token and cookie auth documented
- **Schemas**: Request/response validation schemas
- **Examples**: Sample requests and responses
- **Testing**: Try-it-out functionality for all endpoints

Access at: `http://localhost:3001/docs`

---

_This documentation is automatically updated when authentication features are modified. For questions or improvements, please refer to the development team._
