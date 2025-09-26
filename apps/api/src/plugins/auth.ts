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

    // Debug logging for cookies
    fastify.log.info(`Request URL: ${request.url}`);
    fastify.log.info(`Request method: ${request.method}`);
    fastify.log.info(`Request origin: ${request.headers.origin || 'none'}`);
    fastify.log.info(`Raw cookies: ${request.headers.cookie || 'none'}`);
    fastify.log.info(`Parsed cookies: ${JSON.stringify(request.cookies)}`);
    fastify.log.info(`Cookie keys: ${Object.keys(request.cookies || {})}`);

    // Check if cookies object exists and has accessToken
    if (request.cookies) {
      fastify.log.info(
        `accessToken in cookies: ${!!request.cookies.accessToken}`
      );
      if (request.cookies.accessToken) {
        fastify.log.info(
          `accessToken length: ${request.cookies.accessToken.length}`
        );
      }
    }

    // Extract token from Authorization header or httpOnly cookie
    let token: string | undefined;

    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      fastify.log.info('Token found in Authorization header');
    } else if (request.cookies?.accessToken) {
      token = request.cookies.accessToken;
      fastify.log.info('Token found in accessToken cookie');
    }

    if (!token) {
      fastify.log.warn('No authentication token found');
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
