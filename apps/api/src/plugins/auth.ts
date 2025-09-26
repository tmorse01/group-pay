import { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import { verifyToken, type JWTPayload } from '../utils/auth.js';
import { UnauthorizedError } from '@group-pay/shared';

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: JWTPayload;
  }
}

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('authUser', null);

  fastify.addHook('preHandler', async (request: FastifyRequest) => {
    // Skip auth for public routes
    const publicRoutes = [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/refresh',
      '/api/auth/logout',
      '/api/health',
      '/api/docs',
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
      throw new UnauthorizedError('No authentication token provided');
    }

    try {
      const payload = verifyToken(token);
      request.authUser = payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      throw new UnauthorizedError('Token verification failed');
    }
  });
}

export default fp(authPlugin, {
  name: 'auth',
  dependencies: ['@fastify/jwt', '@fastify/cookie'],
});
