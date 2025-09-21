# Authentication Implementation Guide

This guide provides practical examples for implementing authentication in your Group Pay application.

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp apps/api/.env.example apps/api/.env

# Update required variables
JWT_SECRET="your-super-secure-32-plus-character-secret-key"
DATABASE_URL="postgresql://user:pass@localhost:5432/group_pay"
```

### 2. Start the API Server

```bash
cd apps/api
pnpm install
pnpm db:migrate
pnpm dev
```

### 3. Test Authentication

```bash
# Register a new user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Frontend Integration Patterns

### React Authentication Context

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const { user } = await response.json();
        setUser(user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const { user } = await response.json();
    setUser(user);
    return user;
  };

  const register = async (email: string, password: string, name: string): Promise<User> => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const { user } = await response.json();
    setUser(user);
    return user;
  };

  const logout = async (): Promise<void> => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
  };

  const refreshAuth = async (): Promise<void> => {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      await checkAuthStatus();
    } else {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      refreshAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Protected Route Component

```typescript
// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return fallback ? <>{fallback}</> : <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

### Login Form Component

```typescript
// components/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
```

## API Client Implementation

### Fetch Wrapper with Auto-Refresh

```typescript
// utils/api.ts
class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class APIClient {
  private baseURL: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
  }

  private async refreshToken(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((response) => {
        this.refreshPromise = null;
        return response.ok;
      })
      .catch(() => {
        this.refreshPromise = null;
        return false;
      });

    return this.refreshPromise;
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    let response = await fetch(url, config);

    // Handle token refresh on 401
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      const refreshed = await this.refreshToken();

      if (refreshed) {
        // Retry original request
        response = await fetch(url, config);
      } else {
        // Redirect to login or handle auth failure
        window.location.href = '/login';
        throw new APIError('Authentication failed', 401, 'UNAUTHORIZED');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData.code
      );
    }

    return response.json();
  }

  // Convenience methods
  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }
}

export const apiClient = new APIClient();
```

### Usage Examples

```typescript
// Authentication API calls
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  register: (email: string, password: string, name: string) =>
    apiClient.post('/auth/register', { email, password, name }),

  logout: () => apiClient.post('/auth/logout'),

  getCurrentUser: () => apiClient.get('/auth/me'),

  refreshToken: () => apiClient.post('/auth/refresh'),
};

// Protected API calls (automatically handle auth)
export const userAPI = {
  updateProfile: (data: Partial<User>) => apiClient.put('/users/me', data),

  getGroups: () => apiClient.get('/groups'),

  createGroup: (data: CreateGroupData) => apiClient.post('/groups', data),
};
```

## Testing Authentication

### Unit Tests

```typescript
// __tests__/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { APIClient } from '../utils/api';

describe('Authentication', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    apiClient = new APIClient('http://localhost:3001/api');
  });

  it('should register a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    const response = await apiClient.post('/auth/register', userData);

    expect(response.user).toBeDefined();
    expect(response.user.email).toBe(userData.email);
    expect(response.user.name).toBe(userData.name);
  });

  it('should login with valid credentials', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    const response = await apiClient.post('/auth/login', credentials);

    expect(response.user).toBeDefined();
    expect(response.user.email).toBe(credentials.email);
  });

  it('should handle invalid credentials', async () => {
    const credentials = {
      email: 'invalid@example.com',
      password: 'wrongpassword',
    };

    await expect(apiClient.post('/auth/login', credentials)).rejects.toThrow(
      'Invalid email or password'
    );
  });
});
```

### Integration Tests

```typescript
// __tests__/auth-flow.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function TestComponent() {
  const { user, login, logout } = useAuth();

  return (
    <div>
      {user ? (
        <div>
          <span data-testid="user-name">{user.name}</span>
          <button onClick={() => logout()} data-testid="logout-btn">
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={() => login('test@example.com', 'password123')}
          data-testid="login-btn"
        >
          Login
        </button>
      )}
    </div>
  );
}

describe('Authentication Flow', () => {
  it('should handle login and logout', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially not logged in
    expect(screen.getByTestId('login-btn')).toBeInTheDocument();

    // Login
    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toBeInTheDocument();
    });

    // Logout
    fireEvent.click(screen.getByTestId('logout-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('login-btn')).toBeInTheDocument();
    });
  });
});
```

## Common Patterns

### Form Validation

```typescript
// hooks/useFormValidation.ts
import { useState } from 'react';

interface ValidationRules {
  [key: string]: (value: any) => string | null;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  rules: ValidationRules
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};

    Object.keys(rules).forEach((field) => {
      const error = rules[field](values[field]);
      if (error) {
        newErrors[field as keyof T] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const setValue = (field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return {
    values,
    errors,
    setValue,
    validate,
    isValid: Object.keys(errors).length === 0,
  };
}

// Validation rules
export const authValidationRules = {
  email: (value: string) => {
    if (!value) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
    return null;
  },

  password: (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return null;
  },

  name: (value: string) => {
    if (!value) return 'Name is required';
    if (value.length < 2) return 'Name must be at least 2 characters';
    return null;
  },
};
```

### Error Handling

```typescript
// hooks/useErrorHandler.ts
import { useState } from 'react';
import { APIError } from '../utils/api';

export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown) => {
    if (err instanceof APIError) {
      switch (err.code) {
        case 'VALIDATION_ERROR':
          setError('Please check your input and try again');
          break;
        case 'UNAUTHORIZED':
          setError('Invalid credentials');
          break;
        default:
          setError(err.message);
      }
    } else {
      setError('An unexpected error occurred');
    }
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
}
```

## Production Considerations

### Security Headers

```typescript
// middleware/security.ts
export function securityHeaders(app: FastifyInstance) {
  app.addHook('onSend', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  });
}
```

### Rate Limiting

```typescript
// plugins/rateLimit.ts
import rateLimit from '@fastify/rate-limit';

export default async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.ip;
    },
    errorResponseBuilder: (request, context) => {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        error: 'Rate limit exceeded',
        message: `Too many requests, try again in ${Math.round(context.ttl / 1000)} seconds`,
      };
    },
  });
}
```

### Monitoring

```typescript
// utils/monitoring.ts
export function logAuthEvent(event: string, userId?: string, metadata?: any) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      userId,
      metadata,
      level: 'info',
    })
  );
}

// Usage in auth routes
logAuthEvent('user_login', user.id, { ip: request.ip });
logAuthEvent('user_registration', user.id, { ip: request.ip });
logAuthEvent('token_refresh', userId, { ip: request.ip });
```

---

This implementation guide provides everything you need to integrate the Group Pay authentication system into your application. For more detailed information, refer to the [Authentication API Reference](../api/authentication.md).
