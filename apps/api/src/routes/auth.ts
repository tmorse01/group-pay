import { FastifyInstance } from 'fastify';
import { UnauthorizedError, ValidationError } from '@group-pay/shared';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from '../utils/auth.js';
import { prisma } from '../lib/prisma.js';
import { authSchemas } from '../schemas/auth.js';
import { createVerificationToken } from '../services/verification.js';

export default async function authRoutes(fastify: FastifyInstance) {
  // Register new user
  fastify.post(
    '/register',
    { schema: authSchemas.register },
    async (request, reply) => {
      const { email, password, name } = request.body as {
        email: string;
        password: string;
        name: string;
      };

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
          emailVerified: false, // New users start unverified
        },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      // Create verification token and send email (don't fail registration if email fails)
      try {
        await createVerificationToken(user.id);
      } catch (error) {
        // Log error but don't fail registration
        console.error('Failed to send verification email during registration:', error);
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
        })
        .code(201);

      return { user };
    }
  );

  // Login user
  fastify.post(
    '/login',
    { schema: authSchemas.login },
    async (request, reply) => {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };

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
  fastify.post(
    '/refresh',
    { schema: authSchemas.refresh },
    async (request, reply) => {
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
      } catch {
        // Clear invalid refresh token
        reply.clearCookie('refreshToken').clearCookie('accessToken');

        throw new UnauthorizedError('Invalid refresh token');
      }
    }
  );

  // Logout user
  fastify.post(
    '/logout',
    { schema: authSchemas.logout },
    async (request, reply) => {
      reply.clearCookie('accessToken').clearCookie('refreshToken');

      return { success: true };
    }
  );

  // Get current user
  fastify.get('/me', { schema: authSchemas.me }, async (request) => {
    if (!request.authUser) {
      throw new UnauthorizedError('Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: request.authUser.userId },
      select: {
        id: true,
        email: true,
        name: true,
        photoUrl: true,
        venmoHandle: true,
        paypalLink: true,
        emailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return { user };
  });
}
