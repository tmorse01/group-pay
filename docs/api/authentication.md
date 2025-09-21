# Authentication API Reference

**Base URL**: `/auth`  
**Content-Type**: `application/json`  
**Authentication**: Bearer token or httpOnly cookies

## Endpoints Overview

| Method | Endpoint    | Description             | Auth Required    |
| ------ | ----------- | ----------------------- | ---------------- |
| POST   | `/register` | Create new user account | ❌               |
| POST   | `/login`    | Authenticate user       | ❌               |
| POST   | `/refresh`  | Refresh access token    | 🔄 Refresh token |
| POST   | `/logout`   | Clear session cookies   | ❌               |
| GET    | `/me`       | Get current user info   | ✅               |

---

## POST /auth/register

Create a new user account with email and password.

### Request

**Headers:**

```
Content-Type: application/json
```

**Body Schema:**

```json
{
  "email": "string (email format, required)",
  "password": "string (min 8 chars, required)",
  "name": "string (1-100 chars, required)"
}
```

**Example Request:**

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }'
```

### Response

**Success (201 Created):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "createdAt": "2025-09-20T10:00:00.000Z"
  }
}
```

**Set-Cookie Headers:**

```
Set-Cookie: accessToken=eyJhbGc...; HttpOnly; SameSite=Lax; Path=/; Max-Age=900
Set-Cookie: refreshToken=eyJhbGc...; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800
```

**Error (400 Bad Request):**

```json
{
  "error": "Validation Error",
  "code": "VALIDATION_ERROR",
  "message": "User with this email already exists"
}
```

---

## POST /auth/login

Authenticate existing user with email and password.

### Request

**Headers:**

```
Content-Type: application/json
```

**Body Schema:**

```json
{
  "email": "string (email format, required)",
  "password": "string (min 1 char, required)"
}
```

**Example Request:**

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securepassword123"
  }'
```

### Response

**Success (200 OK):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "name": "John Doe"
  }
}
```

**Set-Cookie Headers:**

```
Set-Cookie: accessToken=eyJhbGc...; HttpOnly; SameSite=Lax; Path=/; Max-Age=900
Set-Cookie: refreshToken=eyJhbGc...; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800
```

**Error (401 Unauthorized):**

```json
{
  "error": "UnauthorizedError",
  "code": "UNAUTHORIZED",
  "message": "Invalid email or password"
}
```

---

## POST /auth/refresh

Refresh an expired access token using a valid refresh token.

### Request

**Headers:**

```
Cookie: refreshToken=eyJhbGc...
```

**Example Request:**

```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Response

**Success (200 OK):**

```json
{
  "success": true
}
```

**Set-Cookie Headers:**

```
Set-Cookie: accessToken=eyJhbGc...; HttpOnly; SameSite=Lax; Path=/; Max-Age=900
```

**Error (401 Unauthorized):**

```json
{
  "error": "UnauthorizedError",
  "code": "UNAUTHORIZED",
  "message": "Invalid refresh token"
}
```

**Set-Cookie on Error (clears cookies):**

```
Set-Cookie: accessToken=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0
Set-Cookie: refreshToken=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0
```

---

## POST /auth/logout

Clear authentication cookies and end user session.

### Request

**Example Request:**

```bash
curl -X POST http://localhost:3001/auth/logout
```

### Response

**Success (200 OK):**

```json
{
  "success": true
}
```

**Set-Cookie Headers (clears cookies):**

```
Set-Cookie: accessToken=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0
Set-Cookie: refreshToken=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0
```

---

## GET /auth/me

Get current authenticated user information.

### Request

**Headers (Option 1 - Cookie):**

```
Cookie: accessToken=eyJhbGc...
```

**Headers (Option 2 - Bearer Token):**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Request:**

```bash
curl -X GET http://localhost:3001/auth/me \
  -H "Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Response

**Success (200 OK):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "photoUrl": null,
    "venmoHandle": null,
    "paypalLink": null,
    "createdAt": "2025-09-20T10:00:00.000Z"
  }
}
```

**Error (401 Unauthorized):**

```json
{
  "error": "UnauthorizedError",
  "code": "UNAUTHORIZED",
  "message": "No authentication token provided"
}
```

---

## Authentication Flow

### Registration Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant D as Database

    C->>A: POST /auth/register
    A->>D: Check if email exists
    D-->>A: User not found
    A->>A: Hash password with Argon2
    A->>D: Create user record
    D-->>A: User created
    A->>A: Generate JWT tokens
    A-->>C: 201 + user data + cookies
```

### Login Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant D as Database

    C->>A: POST /auth/login
    A->>D: Find user by email
    D-->>A: User found
    A->>A: Verify password hash
    A->>A: Generate JWT tokens
    A-->>C: 200 + user data + cookies
```

### Protected Request Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant D as Database

    C->>A: GET /auth/me (with cookie)
    A->>A: Extract & verify JWT
    A->>D: Find user by ID
    D-->>A: User data
    A-->>C: 200 + user data
```

### Token Refresh Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant D as Database

    C->>A: Request with expired access token
    A-->>C: 401 Unauthorized
    C->>A: POST /auth/refresh (with refresh token)
    A->>A: Verify refresh token
    A->>D: Confirm user exists
    D-->>A: User valid
    A->>A: Generate new access token
    A-->>C: 200 + new access token cookie
```

## Error Codes Reference

| Code               | HTTP Status | Description                     | Retry Safe |
| ------------------ | ----------- | ------------------------------- | ---------- |
| `VALIDATION_ERROR` | 400         | Request validation failed       | ❌         |
| `UNAUTHORIZED`     | 401         | Authentication required/invalid | ❌         |
| `NOT_FOUND`        | 404         | User not found                  | ❌         |
| `INTERNAL_ERROR`   | 500         | Server error                    | ✅         |

## Rate Limiting

| Endpoint    | Rate Limit   | Window     | Notes             |
| ----------- | ------------ | ---------- | ----------------- |
| `/register` | 5 requests   | 15 minutes | Per IP address    |
| `/login`    | 10 requests  | 15 minutes | Per IP address    |
| `/refresh`  | 20 requests  | 15 minutes | Per refresh token |
| `/logout`   | 20 requests  | 1 minute   | Per IP address    |
| `/me`       | 100 requests | 1 minute   | Per user          |

## Security Headers

### Request Security

- **CORS**: Configured for specific origin
- **CSRF**: SameSite cookie protection
- **XSS**: httpOnly cookies prevent script access

### Response Security

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

## Client Libraries

### JavaScript/TypeScript

```typescript
class AuthClient {
  private baseUrl = '/api/auth';

  async register(email: string, password: string, name: string) {
    const response = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  }

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  }

  async refreshToken() {
    const response = await fetch(`${this.baseUrl}/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    return response.ok;
  }

  async logout() {
    const response = await fetch(`${this.baseUrl}/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    return response.ok;
  }

  async getCurrentUser() {
    const response = await fetch(`${this.baseUrl}/me`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  }
}
```

### React Hook Example

```typescript
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { user } = await authClient.getCurrentUser();
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { user } = await authClient.login(email, password);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await authClient.logout();
    setUser(null);
  };

  return { user, loading, login, logout, checkAuth };
}
```

---

_For more information, see the [Authentication System Documentation](../features/authentication.md)._
