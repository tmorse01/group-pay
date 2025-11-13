import { FastifyInstance } from 'fastify';
import { ValidationError, NotFoundError, UnauthorizedError } from '@group-pay/shared';
import {
  verifyEmail,
  resendVerificationEmail,
} from '../services/verification.js';
import { requireAuth } from '../utils/auth.js';
import { prisma } from '../lib/prisma.js';

export const verificationSchemas = {
  verifyEmail: {
    description: 'Verify email address with verification token',
    tags: ['Authentication'],
    body: {
      type: 'object',
      required: ['token'],
      properties: {
        token: {
          type: 'string',
          minLength: 1,
        },
      },
    },
    response: {
      200: {
        description: 'Email verified successfully',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              emailVerified: { type: 'boolean' },
              emailVerifiedAt: { type: 'string', format: 'date-time', nullable: true },
            },
          },
        },
      },
      400: {
        description: 'Invalid or expired token',
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
  resendVerification: {
    description: 'Resend verification email',
    tags: ['Authentication'],
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
        },
      },
    },
    response: {
      200: {
        description: 'Verification email sent',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
      400: {
        description: 'Email already verified or invalid request',
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
  verificationStatus: {
    description: 'Get current user verification status',
    tags: ['Authentication'],
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        description: 'Verification status',
        type: 'object',
        properties: {
          emailVerified: { type: 'boolean' },
          emailVerifiedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    },
  },
} as const;

export default async function verificationRoutes(fastify: FastifyInstance) {
  // Verify email with token
  fastify.post(
    '/verify-email',
    { schema: verificationSchemas.verifyEmail },
    async (request, reply) => {
      const { token } = request.body as { token: string };

      try {
        const result = await verifyEmail(token);

        // Get updated user
        const user = await prisma.user.findUnique({
          where: { id: result.userId },
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
            emailVerifiedAt: true,
          },
        });

        return {
          success: true,
          user,
        };
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new ValidationError('Failed to verify email');
      }
    }
  );

  // Resend verification email
  fastify.post(
    '/resend-verification',
    { schema: verificationSchemas.resendVerification },
    async (request, reply) => {
      const userId = requireAuth(request);
      const { email } = (request.body as { email?: string }) || {};

      try {
        // Use authenticated user's ID if no email provided
        await resendVerificationEmail(userId, email);

        return {
          success: true,
          message: 'Verification email sent',
        };
      } catch (error) {
        if (error instanceof ValidationError || error instanceof NotFoundError) {
          throw error;
        }
        throw new ValidationError('Failed to resend verification email');
      }
    }
  );

  // Get verification status
  fastify.get(
    '/verification-status',
    { schema: verificationSchemas.verificationStatus },
    async (request) => {
      const userId = requireAuth(request);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          emailVerified: true,
          emailVerifiedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return {
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
      };
    }
  );
}

