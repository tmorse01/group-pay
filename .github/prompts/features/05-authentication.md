# Feature: Authentication System

**Priority**: HIGH | **Estimated Time**: 3-4 hours | **Dependencies**: Prisma Schema, Shared Types

## 🎯 Objective

Implement a secure JWT-based authentication system with argon2 password hashing, httpOnly cookies, and comprehensive auth routes.

## 📋 Requirements

### Security Setup

#### Password Hashing with Argon2

```typescript
// apps/api/src/utils/auth.ts
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(
  hashedPassword: string,
  plainPassword: string
): Promise<boolean> {
  try {
    return await argon2.verify(hashedPassword, plainPassword);
  } catch {
    return false;
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '15m',
    issuer: 'group-pay-api',
    audience: 'group-pay-web',
  });
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d',
    issuer: 'group-pay-api',
    audience: 'group-pay-web',
  });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_SECRET!, {
    issuer: 'group-pay-api',
    audience: 'group-pay-web',
  }) as JWTPayload;
}
```

### Fastify Auth Plugin

#### JWT Plugin Setup

```typescript
// apps/api/src/plugins/auth.ts
import { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { verifyToken, type JWTPayload } from '../utils/auth.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('user', null);

  fastify.addHook('preHandler', async (request: FastifyRequest) => {
    // Skip auth for public routes
    const publicRoutes = [
      '/auth/register',
      '/auth/login',
      '/auth/refresh',
      '/health',
      '/docs',
    ];

    if (publicRoutes.some((route) => request.url.startsWith(route))) {
      return;
    }

    // Extract token from Authorization header or httpOnly cookie
    let token: string | undefined;

    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (request.cookies?.accessToken) {
      token = request.cookies.accessToken;
    }

    if (!token) {
      throw fastify.httpErrors.unauthorized('No authentication token provided');
    }

    try {
      const payload = verifyToken(token);
      request.user = payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw fastify.httpErrors.unauthorized('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw fastify.httpErrors.unauthorized('Token expired');
      }
      throw fastify.httpErrors.unauthorized('Token verification failed');
    }
  });
}

export default fp(authPlugin, {
  name: 'auth',
  dependencies: ['@fastify/jwt'],
});
```

### Authentication Routes

#### Auth Route Handler

```typescript
// apps/api/src/routes/auth.ts
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  CreateUserSchema,
  LoginSchema,
  UnauthorizedError,
  ValidationError,
} from '@group-pay/shared';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
} from '../utils/auth.js';

const prisma = new PrismaClient();

export default async function authRoutes(fastify: FastifyInstance) {
  // Register new user
  fastify.post(
    '/register',
    {
      schema: {
        body: CreateUserSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  createdAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password, name } = request.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ValidationError('User with this email already exists');
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const tokenPayload = { userId: user.id, email: user.email };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Set httpOnly cookies
      reply
        .setCookie('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: '/',
        })
        .setCookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/',
        })
        .code(201);

      return { user };
    }
  );

  // Login user
  fastify.post(
    '/login',
    {
      schema: {
        body: LoginSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const isPasswordValid = await verifyPassword(user.passwordHash, password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Generate tokens
      const tokenPayload = { userId: user.id, email: user.email };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Set httpOnly cookies
      reply
        .setCookie('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: '/',
        })
        .setCookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/',
        });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    }
  );

  // Refresh access token
  fastify.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedError('No refresh token provided');
    }

    try {
      const payload = verifyToken(refreshToken);

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Generate new access token
      const newTokenPayload = { userId: user.id, email: user.email };
      const newAccessToken = generateAccessToken(newTokenPayload);

      // Set new access token cookie
      reply.setCookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/',
      });

      return { success: true };
    } catch (error) {
      // Clear invalid refresh token
      reply.clearCookie('refreshToken').clearCookie('accessToken');

      throw new UnauthorizedError('Invalid refresh token');
    }
  });

  // Logout user
  fastify.post('/logout', async (request, reply) => {
    reply.clearCookie('accessToken').clearCookie('refreshToken');

    return { success: true };
  });

  // Get current user
  fastify.get('/me', async (request) => {
    if (!request.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        photoUrl: true,
        venmoHandle: true,
        paypalLink: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return { user };
  });
}
```

### Error Handler Integration

#### Global Error Handler

```typescript
// apps/api/src/plugins/errorHandler.ts
import { FastifyInstance, FastifyError } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '@group-pay/shared';

async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler(
    (error: FastifyError & Partial<AppError>, request, reply) => {
      // Log error for debugging
      fastify.log.error(error);

      // Handle validation errors
      if (error.validation) {
        return reply.status(400).send({
          error: 'Validation Error',
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.validation,
        });
      }

      // Handle custom app errors
      if (error.httpStatus && error.code) {
        return reply.status(error.httpStatus).send({
          error: error.name || 'Application Error',
          code: error.code,
          message: error.message,
          details: error.details,
        });
      }

      // Handle Fastify HTTP errors
      if (error.statusCode) {
        return reply.status(error.statusCode).send({
          error: error.name || 'HTTP Error',
          code: error.code || 'HTTP_ERROR',
          message: error.message,
        });
      }

      // Handle unknown errors
      return reply.status(500).send({
        error: 'Internal Server Error',
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      });
    }
  );
}

export default fp(errorHandlerPlugin, {
  name: 'errorHandler',
});
```

## 🔧 Implementation Steps

### 1. Install Dependencies

```bash
cd apps/api
pnpm add argon2 @fastify/jwt @fastify/cookie
pnpm add -D @types/jsonwebtoken
```

### 2. Environment Configuration

Update `apps/api/.env`:

```env
JWT_SECRET=your-very-long-super-secure-random-string-here-min-32-chars
NODE_ENV=development
```

### 3. Register Plugins

```typescript
// apps/api/src/app.ts
import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import errorHandler from './plugins/errorHandler.js';
import auth from './plugins/auth.js';
import authRoutes from './routes/auth.js';

const app = Fastify({
  logger: true,
});

// Register plugins
await app.register(cookie);
await app.register(jwt, {
  secret: process.env.JWT_SECRET!,
});
await app.register(errorHandler);
await app.register(auth);

// Register routes
await app.register(authRoutes, { prefix: '/auth' });

export default app;
```

### 4. Create Integration Tests

```typescript
// apps/api/src/routes/__tests__/auth.test.ts
import { test, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import app from '../../app.js';

const prisma = new PrismaClient();

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await prisma.$disconnect();
  await app.close();
});

test('POST /auth/register - should create new user', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      email: 'test@example.com',
      password: 'securepassword123',
      name: 'Test User',
    },
  });

  expect(response.statusCode).toBe(201);
  const body = JSON.parse(response.body);
  expect(body.user).toHaveProperty('id');
  expect(body.user.email).toBe('test@example.com');
  expect(body.user.name).toBe('Test User');

  // Should set cookies
  expect(response.cookies).toHaveLength(2);
  expect(response.cookies.some((c) => c.name === 'accessToken')).toBe(true);
  expect(response.cookies.some((c) => c.name === 'refreshToken')).toBe(true);
});

test('POST /auth/login - should authenticate user', async () => {
  // First create a user
  await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      email: 'login@example.com',
      password: 'password123',
      name: 'Login User',
    },
  });

  // Then login
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'login@example.com',
      password: 'password123',
    },
  });

  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body.user.email).toBe('login@example.com');
});

test('GET /auth/me - should return current user', async () => {
  // Register and get cookies
  const registerResponse = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      email: 'me@example.com',
      password: 'password123',
      name: 'Me User',
    },
  });

  const cookies = registerResponse.cookies
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  // Call /me endpoint
  const response = await app.inject({
    method: 'GET',
    url: '/auth/me',
    headers: {
      cookie: cookies,
    },
  });

  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body.user.email).toBe('me@example.com');
});
```

## ✅ Acceptance Criteria

- [ ] Users can register with email/password
- [ ] Passwords are hashed with argon2
- [ ] JWT tokens are generated correctly
- [ ] httpOnly cookies are set for tokens
- [ ] Access tokens expire in 15 minutes
- [ ] Refresh tokens expire in 7 days
- [ ] Token refresh endpoint works
- [ ] Logout clears cookies
- [ ] Protected routes require authentication
- [ ] Error handling covers all auth scenarios
- [ ] Integration tests pass

## 🧪 Testing

### Security Testing

```bash
# Test password strength
# Test JWT token validation
# Test cookie security settings
# Test logout functionality
```

## 📚 Next Steps

After completing this feature:

1. **[Core API Routes](./06-core-api.md)** - Protect API routes with auth
2. **[Authentication UI](./09-auth-ui.md)** - Build login/register forms
3. **[API Testing](./07-api-testing.md)** - Add auth to test suite

## 📖 Frontend Integration Guide

The frontend should handle authentication like this:

```typescript
// Frontend auth service
const authService = {
  async login(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Important for cookies
    });

    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  async refreshToken() {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    return response.ok;
  },
};
```
