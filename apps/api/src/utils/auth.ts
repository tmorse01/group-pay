import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(
  hashedPassword: string,
  plainPassword: string
): Promise<boolean> {
  try {
    return await argon2.verify(hashedPassword, plainPassword);
  } catch {
    return false;
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '15m',
    issuer: 'group-pay-api',
    audience: 'group-pay-web',
  });
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d',
    issuer: 'group-pay-api',
    audience: 'group-pay-web',
  });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_SECRET!, {
    issuer: 'group-pay-api',
    audience: 'group-pay-web',
  }) as JWTPayload;
}
