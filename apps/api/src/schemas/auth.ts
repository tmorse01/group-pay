// Fastify JSON schemas for authentication endpoints
export const authSchemas = {
  register: {
    description:
      'Register a new user account. Example: email="newuser@example.com", password="password123", name="New User"',
    tags: ['Authentication'],
    body: {
      type: 'object',
      required: ['email', 'password', 'name'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
        },
        password: {
          type: 'string',
          minLength: 8,
        },
        name: {
          type: 'string',
          minLength: 1,
        },
      },
    },
    response: {
      201: {
        description: 'User created successfully',
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      400: {
        description: 'Validation error',
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },

  login: {
    description:
      'Login with email and password. Try these seeded users: alice@example.com, bob@example.com, or charlie@example.com (all use password: password123)',
    tags: ['Authentication'],
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
        },
        password: {
          type: 'string',
        },
      },
    },
    response: {
      200: {
        description: 'Login successful',
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
            },
          },
        },
      },
      401: {
        description: 'Invalid credentials',
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },

  refresh: {
    description: 'Refresh access token using refresh token cookie',
    tags: ['Authentication'],
    response: {
      200: {
        description: 'Token refreshed successfully',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
        },
      },
      401: {
        description: 'Invalid or missing refresh token',
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },

  logout: {
    description: 'Logout user and clear authentication cookies',
    tags: ['Authentication'],
    response: {
      200: {
        description: 'Logout successful',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
        },
      },
    },
  },

  me: {
    description: 'Get current authenticated user information',
    tags: ['Authentication'],
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        description: 'Current user information',
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              photoUrl: { type: 'string', nullable: true },
              venmoHandle: { type: 'string', nullable: true },
              paypalLink: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      401: {
        description: 'Not authenticated',
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
} as const;
