import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { env } from './config/env.js';

// Extend FastifyRequest to include startTime for logging
declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
}
import errorHandler from './plugins/errorHandler.js';
import auth from './plugins/auth.js';
// import rateLimit from './plugins/rateLimit.js';
import authRoutes from './routes/auth.js';
import verificationRoutes from './routes/verification.js';
import healthRoutes from './routes/health.js';
import groupRoutes from './routes/groups.js';
import expenseRoutes from './routes/expenses.js';
import settlementRoutes from './routes/settlements.js';
import userRoutes from './routes/users.js';
import receiptRoutes from './routes/receipts.js';

export async function createApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register plugins
  await app.register(sensible);

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        cb(null, true);
        return;
      }

      try {
        const originUrl = new URL(origin);
        const hostname = originUrl.hostname;

        // Always allow localhost for development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          cb(null, true);
          return;
        }

        // Parse allowed origins from environment variable (comma-separated)
        const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

        // Check if the origin matches any allowed origin
        const isAllowed = allowedOrigins.some((allowedOrigin) => {
          try {
            const allowedUrl = new URL(allowedOrigin);
            const allowedHostname = allowedUrl.hostname;

            // Exact match
            if (origin === allowedOrigin) {
              return true;
            }

            // Hostname match
            if (originUrl.hostname === allowedHostname) {
              return true;
            }

            // Subdomain match (e.g., *.azurestaticapps.net)
            if (originUrl.hostname.endsWith('.' + allowedHostname)) {
              return true;
            }

            // Special handling for Azure Static Apps: allow any *.azurestaticapps.net subdomain
            // if the allowed origin is an azurestaticapps.net domain
            if (
              allowedHostname.includes('azurestaticapps.net') &&
              originUrl.hostname.endsWith('.azurestaticapps.net')
            ) {
              return true;
            }

            return false;
          } catch {
            // If allowedOrigin is not a valid URL, do exact string match
            return origin === allowedOrigin;
          }
        });

        if (isAllowed) {
          cb(null, true);
        } else {
          cb(new Error('Not allowed by CORS'), false);
        }
      } catch {
        // Invalid origin URL
        cb(new Error('Invalid origin'), false);
      }
    },
    credentials: true,
  });

  await app.register(cookie, {
    secret: env.JWT_SECRET,
    parseOptions: {},
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  await app.register(swagger, {
    swagger: {
      info: {
        title: 'Group Pay API',
        description: 'API for managing group expenses and payments',
        version: '1.0.0',
      },
      host: `localhost:${env.PORT}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        {
          name: 'Authentication',
          description: 'User authentication endpoints',
        },
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Groups', description: 'Group management endpoints' },
        { name: 'Expenses', description: 'Expense management endpoints' },
        { name: 'Settlements', description: 'Settlement/payment endpoints' },
        { name: 'Users', description: 'User management endpoints' },
        {
          name: 'Receipts',
          description: 'Receipt upload and management endpoints',
        },
      ],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'Enter JWT Bearer token in format: Bearer <token>',
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
  });

  // Register error handler before auth plugin
  await app.register(errorHandler);

  // Add request logging hook
  app.addHook('onRequest', async (request, _reply) => {
    const startTime = Date.now();
    request.startTime = startTime;

    // Log request details (excluding sensitive data)
    app.log.debug({
      msg: 'Incoming request',
      method: request.method,
      url: request.url,
      path: request.routerPath || request.url.split('?')[0],
      origin: request.headers.origin,
      referer: request.headers.referer,
      userAgent: request.headers['user-agent'],
      hasCookies: !!request.cookies,
      cookieKeys: request.cookies ? Object.keys(request.cookies) : [],
      hasAuthHeader: !!request.headers.authorization,
    });
  });

  // Add response logging hook
  app.addHook('onResponse', async (request, reply) => {
    const duration = Date.now() - (request.startTime || Date.now());

    app.log.info({
      msg: 'Request completed',
      method: request.method,
      url: request.url,
      path: request.routerPath || request.url.split('?')[0],
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
      origin: request.headers.origin,
      hasCookies: !!request.cookies,
      cookieKeys: request.cookies ? Object.keys(request.cookies) : [],
    });
  });

  // TODO: Register rate limiting when compatible version is available
  // await app.register(rateLimit);

  // Register auth plugin
  await app.register(auth);

  // Register routes
  await app.register(healthRoutes, { prefix: '/api/health' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(verificationRoutes, { prefix: '/api/auth' });
  await app.register(groupRoutes, { prefix: '/api/groups' });
  await app.register(expenseRoutes, { prefix: '/api/expenses' });
  await app.register(settlementRoutes, { prefix: '/api/settlements' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(receiptRoutes, { prefix: '/api' });

  // Root endpoint
  app.get('/', async () => {
    return {
      name: 'Group Pay API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      documentation: '/docs',
    };
  });

  // 404 handler
  app.setNotFoundHandler(async (request, reply) => {
    reply.status(404).send({
      error: 'Not Found',
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`,
      statusCode: 404,
    });
  });

  return app;
}

export default createApp;
