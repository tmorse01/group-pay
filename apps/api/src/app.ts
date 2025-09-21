import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { env } from './config/env.js';
import errorHandler from './plugins/errorHandler.js';
import auth from './plugins/auth.js';
import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';

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
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(cookie, {
    secret: env.JWT_SECRET,
    parseOptions: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
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

  // Register auth plugin
  await app.register(auth);

  // Register routes
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(authRoutes, { prefix: '/auth' });

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
