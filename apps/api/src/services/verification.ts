import { prisma } from '../lib/prisma.js';
import { emailService } from '../lib/email.js';
import {
  generateVerificationToken,
  calculateTokenExpiration,
  isTokenExpired,
} from '../utils/tokens.js';
import { env } from '../config/env.js';
import { ValidationError, NotFoundError } from '@group-pay/shared';

/**
 * Create a verification token for a user and send verification email
 */
export async function createVerificationToken(userId: string): Promise<string> {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.emailVerified) {
    throw new ValidationError('Email is already verified');
  }

  // Delete any existing verification token for this user
  await prisma.emailVerificationToken.deleteMany({
    where: { userId },
  });

  // Generate new token
  const token = generateVerificationToken();
  const expiresAt = calculateTokenExpiration(env.VERIFICATION_TOKEN_EXPIRY_HOURS);

  // Create token in database
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  // Send verification email
  try {
    await emailService.sendVerificationEmail(user.email, token, user.name);
  } catch (error) {
    // If email fails, still create the token (user can request resend)
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }

  return token;
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<{
  userId: string;
  email: string;
  name: string;
}> {
  // Find token
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verificationToken) {
    throw new ValidationError('Invalid verification token');
  }

  // Check if token is expired
  if (isTokenExpired(verificationToken.expiresAt)) {
    // Delete expired token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });
    throw new ValidationError('Verification token has expired');
  }

  // Check if email is already verified
  if (verificationToken.user.emailVerified) {
    // Delete token since it's already used
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });
    throw new ValidationError('Email is already verified');
  }

  // Update user as verified
  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Delete used token
  await prisma.emailVerificationToken.delete({
    where: { id: verificationToken.id },
  });

  return {
    userId: verificationToken.user.id,
    email: verificationToken.user.email,
    name: verificationToken.user.name,
  };
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(
  userId?: string,
  email?: string
): Promise<void> {
  let user;

  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
    });
  } else if (email) {
    user = await prisma.user.findUnique({
      where: { email },
    });
  } else {
    throw new ValidationError('Either userId or email must be provided');
  }

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.emailVerified) {
    throw new ValidationError('Email is already verified');
  }

  // Create new verification token (this will delete old one and send email)
  await createVerificationToken(user.id);
}

/**
 * Cleanup expired verification tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const now = new Date();
  const result = await prisma.emailVerificationToken.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });

  return result.count;
}

