# Plan: User Email Verification Feature

## Overview

Implement email verification for user accounts to ensure users register with valid email addresses and enhance account security. Users must verify their email before accessing certain features.

## Current State

- User model exists in Prisma schema without email verification fields
- No email verification tokens or status tracking
- No email sending service configured
- Authentication system exists but doesn't require email verification
- No frontend UI for email verification flow

## Goals

1. Add email verification fields to User model
2. Create email verification token system
3. Implement email sending service
4. Create verification API endpoints
5. Add frontend UI for verification flow
6. Protect routes/features requiring verified email
7. Add resend verification email functionality

## Architecture

### Backend

- Email verification token generation and storage
- Email sending service (SMTP or service like SendGrid)
- Verification endpoints
- Middleware to check verification status

### Frontend

- Verification page/component
- Resend verification email UI
- Email verification status indicator
- Protected route handling

## Implementation Plan

### Phase 1: Database Schema Updates

#### 1.1 Update User Model

**File**: `apps/api/prisma/schema.prisma`

Add email verification fields:

```prisma
model User {
  id                String   @id @default(uuid()) @db.Uuid
  email             String   @unique
  passwordHash      String
  name              String
  photoUrl          String?
  venmoHandle       String?
  paypalLink        String?
  emailVerified     Boolean  @default(false)
  emailVerifiedAt   DateTime?
  verificationToken String?  @unique
  verificationTokenExpiresAt DateTime?
  createdAt         DateTime @default(now())

  // ... existing relations
}
```

#### 1.2 Create EmailVerificationToken Model (Alternative Approach)

**File**: `apps/api/prisma/schema.prisma`

Alternative: Separate table for verification tokens:

```prisma
model EmailVerificationToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @unique @db.Uuid
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@index([expiresAt])
}
```

**Recommendation**: Use separate table for better token management and cleanup.

#### 1.3 Create Migration

**File**: `apps/api/prisma/migrations/[timestamp]_add_email_verification/migration.sql`

```sql
-- Add email verification fields to User
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "verificationToken" TEXT UNIQUE;
ALTER TABLE "User" ADD COLUMN "verificationTokenExpiresAt" TIMESTAMP(3);

-- Create EmailVerificationToken table (if using separate table)
CREATE TABLE "EmailVerificationToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailVerificationToken_userId_key" ON "EmailVerificationToken"("userId");
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");
CREATE INDEX "EmailVerificationToken_token_idx" ON "EmailVerificationToken"("token");
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");
```

### Phase 2: Email Service Setup

#### 2.1 Install Email Dependencies

**File**: `apps/api/package.json`

Add email sending library:

```json
{
  "dependencies": {
    "nodemailer": "^6.9.7",
    "@types/nodemailer": "^6.4.14"
  }
}
```

Or use service like SendGrid:

```json
{
  "dependencies": {
    "@sendgrid/mail": "^8.1.0"
  }
}
```

#### 2.2 Create Email Service

**File**: `apps/api/src/lib/email.ts` (new file)

Create email service with:

- SMTP configuration
- Email template rendering
- Send verification email function
- Send password reset email (future)
- Error handling

**Interface**:

```typescript
interface EmailService {
  sendVerificationEmail(
    email: string,
    token: string,
    name: string
  ): Promise<void>;
  sendWelcomeEmail(email: string, name: string): Promise<void>;
}
```

#### 2.3 Create Email Templates

**File**: `apps/api/src/lib/email-templates.ts` (new file)

Create HTML email templates:

- Verification email template
- Welcome email template
- Resend verification email template

**Template structure**:

```typescript
export function getVerificationEmailTemplate(
  name: string,
  verificationUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>Verify your email</h1>
        <p>Hi ${name},</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link expires in 24 hours.</p>
      </body>
    </html>
  `;
}
```

#### 2.4 Add Email Configuration

**File**: `apps/api/src/config/env.ts`

Add email environment variables:

```typescript
// Email Configuration
EMAIL_FROM: z.string().email(),
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
```

### Phase 3: Token Generation and Management

#### 3.1 Create Token Utilities

**File**: `apps/api/src/utils/tokens.ts` (new file)

Create functions:

- Generate secure verification token
- Validate token
- Check token expiration
- Cleanup expired tokens

**Functions**:

```typescript
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function isTokenExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}
```

#### 3.2 Create Verification Service

**File**: `apps/api/src/services/verification.ts` (new file)

Create service for:

- Creating verification token
- Verifying token
- Resending verification email
- Cleaning up expired tokens

### Phase 4: API Endpoints

#### 4.1 Create Verification Routes

**File**: `apps/api/src/routes/verification.ts` (new file)

Endpoints:

- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/resend-verification` - Resend verification email
- `GET /api/auth/verification-status` - Check verification status

**Request/Response schemas**:

```typescript
// POST /api/auth/verify-email
// Body: { token: string }
// Response: { success: boolean, user: User }

// POST /api/auth/resend-verification
// Auth required
// Response: { success: boolean, message: string }

// GET /api/auth/verification-status
// Auth required
// Response: { emailVerified: boolean }
```

#### 4.2 Update Registration Endpoint

**File**: `apps/api/src/routes/auth.ts`

Modify registration to:

- Generate verification token
- Send verification email
- Set emailVerified to false
- Return user without requiring verification (for login)

#### 4.3 Update Auth Middleware

**File**: `apps/api/src/plugins/auth.ts`

Add optional verification check middleware:

```typescript
export async function requireVerifiedEmail(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = requireAuth(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user?.emailVerified) {
    throw new ForbiddenError('Email verification required');
  }
}
```

#### 4.4 Register Verification Routes

**File**: `apps/api/src/app.ts`

Register verification routes:

```typescript
await fastify.register(verificationRoutes, { prefix: '/api/auth' });
```

### Phase 5: Shared Types and Schemas

#### 5.1 Create Verification Schemas

**File**: `packages/shared/src/schemas/verification.ts` (new file)

Create Zod schemas:

```typescript
export const VerifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const ResendVerificationSchema = z.object({
  email: z.string().email().optional(), // Optional if user is authenticated
});
```

#### 5.2 Update User Schema

**File**: `packages/shared/src/schemas/user.ts`

Add email verification fields:

```typescript
export const UserSchema = z.object({
  // ... existing fields
  emailVerified: z.boolean(),
  emailVerifiedAt: z.date().nullable(),
});
```

### Phase 6: Frontend Service Layer

#### 6.1 Create Verification Service

**File**: `apps/web/src/services/verification.ts` (new file)

Create React Query hooks:

```typescript
export function useVerifyEmail() {
  // Verify email mutation
}

export function useResendVerification() {
  // Resend verification email mutation
}

export function useVerificationStatus() {
  // Check verification status
}
```

#### 6.2 Create API Functions

**File**: `apps/web/src/services/verification.ts`

API functions:

```typescript
const verificationApi = {
  verifyEmail: (token: string) => api.post('/api/auth/verify-email', { token }),

  resendVerification: (email?: string) =>
    api.post('/api/auth/resend-verification', { email }),

  getVerificationStatus: () => api.get('/api/auth/verification-status'),
};
```

### Phase 7: Frontend Components

#### 7.1 Create Verification Page

**File**: `apps/web/src/pages/VerifyEmail.tsx` (new file)

Features:

- Extract token from URL query params
- Verify email on mount
- Show success/error states
- Redirect to login or dashboard
- Link to resend email

#### 7.2 Create Verification Status Component

**File**: `apps/web/src/components/application/EmailVerificationBanner.tsx` (new file)

Features:

- Show banner if email not verified
- Link to resend verification
- Dismissible (optional)
- Show in dashboard/settings

#### 7.3 Create Resend Verification Component

**File**: `apps/web/src/components/application/ResendVerification.tsx` (new file)

Features:

- Form to resend verification email
- Success/error feedback
- Rate limiting feedback
- Cooldown timer

#### 7.4 Update Settings Page

**File**: `apps/web/src/pages/Settings.tsx`

Add email verification section:

- Show verification status
- Resend verification button
- Verification date (if verified)

#### 7.5 Update Auth Context

**File**: `apps/web/src/contexts/AuthContext.tsx`

Include email verification status in user object.

### Phase 8: Route Protection

#### 8.1 Create Protected Route Component

**File**: `apps/web/src/components/application/RequireVerifiedEmail.tsx` (new file)

Component that:

- Checks email verification status
- Shows verification prompt if not verified
- Allows access if verified

#### 8.2 Update Router

**File**: `apps/web/src/Router.tsx`

Protect routes requiring verification:

- Group creation (optional)
- Expense creation (optional)
- Settings (optional)

**Note**: Decide which features require verification vs. just showing a banner.

### Phase 9: Cleanup and Maintenance

#### 9.1 Create Cleanup Job

**File**: `apps/api/src/jobs/cleanup-expired-tokens.ts` (new file)

Scheduled job to:

- Delete expired verification tokens
- Run daily/hourly

#### 9.2 Add Token Expiration Handling

**File**: `apps/api/src/routes/verification.ts`

Handle expired tokens gracefully:

- Return clear error message
- Offer to resend verification email

## File Structure

```
apps/api/
├── src/
│   ├── lib/
│   │   ├── email.ts (new)
│   │   └── email-templates.ts (new)
│   ├── services/
│   │   └── verification.ts (new)
│   ├── routes/
│   │   ├── auth.ts (update)
│   │   └── verification.ts (new)
│   ├── plugins/
│   │   └── auth.ts (update)
│   ├── utils/
│   │   └── tokens.ts (new)
│   └── jobs/
│       └── cleanup-expired-tokens.ts (new)
├── prisma/
│   ├── schema.prisma (update)
│   └── migrations/
│       └── [timestamp]_add_email_verification/ (new)

packages/shared/
└── src/
    ├── schemas/
    │   ├── verification.ts (new)
    │   └── user.ts (update)
    └── index.ts (update)

apps/web/
└── src/
    ├── components/
    │   └── application/
    │       ├── EmailVerificationBanner.tsx (new)
    │       ├── ResendVerification.tsx (new)
    │       └── RequireVerifiedEmail.tsx (new)
    ├── pages/
    │   ├── VerifyEmail.tsx (new)
    │   └── Settings.tsx (update)
    ├── services/
    │   └── verification.ts (new)
    ├── contexts/
    │   └── AuthContext.tsx (update)
    └── Router.tsx (update)
```

## API Endpoints

### POST /api/auth/verify-email

Verify email with token.

**Request**:

```json
{
  "token": "verification-token-string"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": true,
    "emailVerifiedAt": "2025-01-10T12:00:00Z"
  }
}
```

**Errors**:

- 400: Invalid token
- 400: Token expired
- 404: Token not found

### POST /api/auth/resend-verification

Resend verification email.

**Request** (authenticated or with email):

```json
{
  "email": "user@example.com" // Optional if authenticated
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Verification email sent"
}
```

**Errors**:

- 400: Email already verified
- 429: Too many requests (rate limited)
- 404: User not found

### GET /api/auth/verification-status

Get current user's verification status.

**Response** (200 OK):

```json
{
  "emailVerified": false
}
```

## Email Template Example

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .button {
        background-color: #4caf50;
        color: white;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 5px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Verify Your Email</h1>
      <p>Hi {{name}},</p>
      <p>
        Thank you for signing up for Group Pay! Please verify your email address
        by clicking the button below:
      </p>
      <a href="{{verificationUrl}}" class="button">Verify Email</a>
      <p>Or copy and paste this link into your browser:</p>
      <p>{{verificationUrl}}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
  </body>
</html>
```

## Security Considerations

1. **Token Security**
   - Use cryptographically secure random tokens
   - Set expiration (24 hours recommended)
   - One-time use tokens (optional)
   - Rate limit token generation

2. **Email Security**
   - Validate email addresses
   - Prevent email enumeration
   - Use HTTPS for verification links
   - Sanitize email content

3. **Rate Limiting**
   - Limit resend requests per email
   - Limit verification attempts per token
   - Implement cooldown periods

4. **Token Storage**
   - Hash tokens in database (optional)
   - Clean up expired tokens regularly
   - Use secure token generation

## Testing

### Backend Tests

**File**: `apps/api/src/routes/__tests__/verification.test.ts` (new)

Test cases:

- Verify email successfully
- Verify with invalid token
- Verify with expired token
- Resend verification email
- Rate limiting
- Email sending

### Frontend Tests

**File**: `apps/web/src/pages/__tests__/VerifyEmail.test.tsx` (new)

Test cases:

- Verify email on page load
- Handle verification errors
- Show success message
- Redirect after verification

## Success Criteria

- [ ] User model updated with verification fields
- [ ] Email verification token system implemented
- [ ] Email sending service configured
- [ ] Verification API endpoints working
- [ ] Frontend verification page created
- [ ] Email verification banner component created
- [ ] Resend verification functionality working
- [ ] Protected routes implemented (if needed)
- [ ] Email templates created
- [ ] Token cleanup job implemented
- [ ] Tests written and passing
- [ ] Documentation updated

## Future Enhancements

1. **Two-Factor Authentication**
   - Build on email verification foundation
   - Add SMS/authenticator app support

2. **Email Change**
   - Verify new email before changing
   - Notify old email address

3. **Account Recovery**
   - Use verification system for password reset
   - Account recovery flow

4. **Advanced Features**
   - Email verification reminders
   - Bulk verification for admins
   - Verification analytics
