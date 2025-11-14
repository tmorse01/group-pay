const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

// Track ongoing refresh to prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempts to refresh the access token using the refresh token cookie
 * @returns true if refresh succeeded, false otherwise
 */
async function refreshToken(): Promise<boolean> {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      const success = response.ok;
      refreshPromise = null;
      return success;
    } catch {
      refreshPromise = null;
      return false;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    credentials: 'include', // This is crucial - sends cookies with requests
    headers: {
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  };

  // Only set Content-Type if we have a body
  if (fetchOptions.body) {
    config.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  // Don't add Authorization header - we're using httpOnly cookies now
  // The cookies will be sent automatically with credentials: 'include'
  if (requiresAuth) {
    // Clear any old tokens from localStorage since we're using cookies now
    localStorage.removeItem('auth_token');
  }

  try {
    let response = await fetch(url, config);

    // Handle different response types
    let data;
    const contentType = response.headers.get('Content-Type');

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle token refresh on 401 errors (expired access token)
    if (
      response.status === 401 &&
      requiresAuth &&
      !endpoint.includes('/auth/')
    ) {
      // Attempt to refresh the token
      const refreshed = await refreshToken();

      if (refreshed) {
        // Retry the original request with the new access token
        response = await fetch(url, config);

        // Re-parse the response data after retry
        if (
          response.headers.get('Content-Type')?.includes('application/json')
        ) {
          data = await response.json();
        } else {
          data = await response.text();
        }
      } else {
        // Refresh failed - throw the original 401 error
        throw new ApiError(
          data?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        );
      }
    }

    if (!response.ok) {
      throw new ApiError(
        data?.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle abort/timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        'Request timeout - please check your connection',
        0,
        error
      );
    }

    // Handle network errors
    throw new ApiError(
      'Network error - please check your connection',
      0,
      error
    );
  }
}

// HTTP method helpers
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'GET', ...options }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'DELETE', ...options }),
};
