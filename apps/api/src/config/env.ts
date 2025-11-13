import { z } from 'zod';
import { config } from 'dotenv';

// Load environment variables from .env file (only in non-production)
// dotenv will look for .env in process.cwd() (should be apps/api directory)
if (process.env.NODE_ENV !== 'production') {
  config();
}

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),
  DATABASE_URL_TEST: z.string().url().optional(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Server
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  SESSION_SECRET: z.string().min(32).optional(),

  // File Upload
  MAX_FILE_SIZE: z.coerce.number().default(5242880), // 5MB
  UPLOAD_DEST: z.string().default('uploads/receipts'),
  STORAGE_TYPE: z.enum(['local', 's3', 'azure']).default('local'),

  // Email Configuration
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().default('Group Pay'),
  EMAIL_SERVICE: z.enum(['smtp', 'sendgrid']).default('smtp'),

  // SMTP Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_SECURE: z.coerce.boolean().default(true),

  // SendGrid Configuration
  SENDGRID_API_KEY: z.string().optional(),

  // Verification
  VERIFICATION_TOKEN_EXPIRY_HOURS: z.coerce.number().default(24),
  VERIFICATION_BASE_URL: z.string().url().default('http://localhost:5173'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment configuration:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

// Export validated config
export const env = validateEnv();
