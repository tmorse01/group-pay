import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import { verifyToken, type JWTPayload } from '../utils/auth.js';
import { UnauthorizedError, ForbiddenError } from '@group-pay/shared';
import { prisma } from '../lib/prisma.js';

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: JWTPayload;
  }
}

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('authUser', null);

  fastify.addHook('preHandler', async (request: FastifyRequest) => {
    // Skip auth for public routes
    // Use routerPath for more reliable route matching (handles trailing slashes)
    const path = request.routerPath || request.url.split('?')[0];
    // Normalize path (remove trailing slash for comparison)
    const normalizedPath =
      path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;

    const publicRoutes = [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/refresh',
      '/api/auth/logout',
      '/api/auth/verify-email',
      '/api/health',
      '/api/docs',
      '/docs', // Swagger UI
      '/', // Root endpoint
    ];

    // Check if path matches any public route
    // Match exact path, path with trailing slash, or path that starts with route + /
    const isPublicRoute = publicRoutes.some((route) => {
      const normalizedRoute =
        route.endsWith('/') && route !== '/' ? route.slice(0, -1) : route;
      return (
        normalizedPath === normalizedRoute ||
        normalizedPath === normalizedRoute + '/' ||
        normalizedPath.startsWith(normalizedRoute + '/')
      );
    });

    if (isPublicRoute) {
      return;
    }

    // Extract token from Authorization header or httpOnly cookie
    let token: string | undefined;

    const authHeader = request.headers.authorization;
    const cookies = request.cookies;
    const origin = request.headers.origin;
    const referer = request.headers.referer;
    const userAgent = request.headers['user-agent'];

    // Log authentication attempt details
    fastify.log.info({
      msg: 'Authentication check',
      path: normalizedPath,
      method: request.method,
      origin,
      referer,
      hasAuthHeader: !!authHeader,
      hasCookies: !!cookies,
      cookieKeys: cookies ? Object.keys(cookies) : [],
      hasAccessTokenCookie: !!cookies?.accessToken,
      hasRefreshTokenCookie: !!cookies?.refreshToken,
      userAgent,
    });

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      fastify.log.debug({
        msg: 'Token found in Authorization header',
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + '...',
      });
    } else if (request.cookies?.accessToken) {
      token = request.cookies.accessToken;
      fastify.log.debug({
        msg: 'Token found in accessToken cookie',
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + '...',
        cookieValue: request.cookies.accessToken.substring(0, 20) + '...',
      });
    }

    if (!token) {
      fastify.log.warn({
        msg: 'No authentication token found',
        path: normalizedPath,
        method: request.method,
        origin,
        referer,
        hasCookies: !!cookies,
        cookieKeys: cookies ? Object.keys(cookies) : [],
        allCookies: cookies,
        headers: {
          authorization: authHeader ? 'present' : 'missing',
          cookie: request.headers.cookie ? 'present' : 'missing',
        },
      });
      throw new UnauthorizedError('No authentication token provided');
    }

    try {
      const payload = verifyToken(token);
      request.authUser = payload;
      fastify.log.debug({
        msg: 'Token verified successfully',
        userId: payload.userId,
        email: payload.email,
      });
    } catch (error) {
      fastify.log.warn({
        msg: 'Token verification failed',
        error: error instanceof Error ? error.message : String(error),
        errorType:
          error instanceof jwt.JsonWebTokenError
            ? 'JsonWebTokenError'
            : error instanceof jwt.TokenExpiredError
              ? 'TokenExpiredError'
              : 'UnknownError',
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + '...',
      });

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

/**
 * Middleware to require verified email
 */
export async function requireVerifiedEmail(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  if (!request.authUser?.userId) {
    throw new UnauthorizedError('Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { id: request.authUser.userId },
    select: { emailVerified: true },
  });

  if (!user?.emailVerified) {
    throw new ForbiddenError('Email verification required');
  }
}

export default fp(authPlugin, {
  name: 'auth',
  dependencies: ['@fastify/jwt', '@fastify/cookie'],
});
