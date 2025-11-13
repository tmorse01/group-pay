# Plan: Receipt Upload Feature Implementation

## Overview

Implement receipt upload functionality allowing users to attach receipt images or PDFs to expenses. This includes file upload handling, storage, display, and management.

## Current State

- Receipt model exists in Prisma schema (`apps/api/prisma/schema.prisma`)
- Receipt utilities exist in `packages/shared/src/utils/receipts.ts` (validation, filename generation)
- No API endpoints for receipt upload
- No frontend UI for receipt upload/display
- No file storage solution configured

## Goals

1. Implement backend API for receipt upload
2. Set up file storage (local filesystem for dev, cloud storage ready for production)
3. Create frontend UI for uploading receipts
4. Display receipts in expense details
5. Support multiple receipts per expense
6. Handle file validation and error cases

## Architecture

### Backend

- File upload endpoint using multipart/form-data
- File storage service (local filesystem initially)
- Receipt metadata stored in database
- File validation using existing utilities

### Frontend

- File input component for receipt upload
- Receipt display component (image viewer, PDF viewer)
- Receipt management (upload, delete, view)

## Implementation Plan

### Phase 1: Backend API Setup

#### 1.1 Install Required Dependencies

**File**: `apps/api/package.json`

Add file upload handling:

```json
{
  "dependencies": {
    "@fastify/multipart": "^8.0.0",
    "busboy": "^1.6.0"
  }
}
```

#### 1.2 Create Receipt Storage Service

**File**: `apps/api/src/lib/storage.ts` (new file)

Create storage service with:

- Local filesystem storage for development
- Interface for cloud storage (S3, Azure Blob) for production
- File path generation
- File deletion

**Interface**:

```typescript
interface StorageService {
  upload(file: Buffer, filename: string, mimeType: string): Promise<string>;
  delete(fileUrl: string): Promise<void>;
  getUrl(filePath: string): string;
}
```

#### 1.3 Create Receipt Routes

**File**: `apps/api/src/routes/receipts.ts` (new file)

Endpoints:

- `POST /api/expenses/:expenseId/receipts` - Upload receipt
- `GET /api/expenses/:expenseId/receipts` - Get all receipts for expense
- `GET /api/receipts/:receiptId` - Get receipt details
- `DELETE /api/receipts/:receiptId` - Delete receipt

**Request/Response schemas**:

```typescript
// POST /api/expenses/:expenseId/receipts
// multipart/form-data with file field

// Response
{
  receipt: {
    id: string;
    expenseId: string;
    fileUrl: string;
    mimeType: string;
  }
}

// GET /api/expenses/:expenseId/receipts
// Response
{
  receipts: Receipt[]
}
```

#### 1.4 Add Receipt Validation

**File**: `apps/api/src/routes/receipts.ts`

Use existing validation from `packages/shared/src/utils/receipts.ts`:

- File size validation (max 10MB)
- File type validation (images: JPEG, PNG, GIF, WebP; PDF)
- Filename validation

#### 1.5 Register Receipt Routes

**File**: `apps/api/src/app.ts`

Register receipt routes:

```typescript
await fastify.register(receiptRoutes, { prefix: '/api' });
```

### Phase 2: Database Updates

#### 2.1 Verify Receipt Schema

**File**: `apps/api/prisma/schema.prisma`

Ensure Receipt model is correct:

```prisma
model Receipt {
  id        String @id @default(uuid()) @db.Uuid
  expenseId String @db.Uuid
  fileUrl   String
  mimeType  String
  filename  String? // Add original filename
  fileSize  Int?    // Add file size in bytes
  createdAt DateTime @default(now()) // Add timestamp

  expense Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)

  @@index([expenseId])
}
```

#### 2.2 Create Migration

**File**: `apps/api/prisma/migrations/[timestamp]_add_receipt_fields/migration.sql`

Add new fields if needed:

```sql
ALTER TABLE "Receipt" ADD COLUMN "filename" TEXT;
ALTER TABLE "Receipt" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "Receipt" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

### Phase 3: Shared Types and Schemas

#### 3.1 Create Receipt Schemas

**File**: `packages/shared/src/schemas/receipt.ts` (new file)

Create Zod schemas:

```typescript
export const ReceiptSchema = z.object({
  id: z.string().uuid(),
  expenseId: z.string().uuid(),
  fileUrl: z.string().url(),
  mimeType: z.string(),
  filename: z.string().nullable(),
  fileSize: z.number().int().nullable(),
  createdAt: z.date(),
});

export type Receipt = z.infer<typeof ReceiptSchema>;
```

#### 3.2 Export Receipt Types

**File**: `packages/shared/src/index.ts`

Export receipt schemas and types.

### Phase 4: Frontend Service Layer

#### 4.1 Create Receipts Service

**File**: `apps/web/src/services/receipts.ts` (new file)

Create React Query hooks:

```typescript
export function useReceipts(expenseId: string) {
  // Fetch receipts for expense
}

export function useUploadReceipt() {
  // Upload receipt mutation
}

export function useDeleteReceipt() {
  // Delete receipt mutation
}
```

#### 4.2 Create API Functions

**File**: `apps/web/src/services/receipts.ts`

API functions:

```typescript
const receiptsApi = {
  uploadReceipt: async (expenseId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/expenses/${expenseId}/receipts`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getReceipts: (expenseId: string) =>
    api.get(`/api/expenses/${expenseId}/receipts`),

  deleteReceipt: (receiptId: string) =>
    api.delete(`/api/receipts/${receiptId}`),
};
```

### Phase 5: Frontend Components

#### 5.1 Create Receipt Upload Component

**File**: `apps/web/src/components/application/ReceiptUpload.tsx` (new file)

Features:

- File input with drag-and-drop
- File preview before upload
- Upload progress indicator
- Error handling
- File validation feedback

**Props**:

```typescript
interface ReceiptUploadProps {
  expenseId: string;
  onUploadComplete?: (receipt: Receipt) => void;
  maxFiles?: number;
}
```

#### 5.2 Create Receipt Display Component

**File**: `apps/web/src/components/application/ReceiptDisplay.tsx` (new file)

Features:

- Image viewer for image receipts
- PDF viewer for PDF receipts
- Thumbnail/preview
- Full-screen view
- Download option
- Delete option (if user has permission)

**Props**:

```typescript
interface ReceiptDisplayProps {
  receipt: Receipt;
  onDelete?: (receiptId: string) => void;
  showActions?: boolean;
}
```

#### 5.3 Create Receipt List Component

**File**: `apps/web/src/components/application/ReceiptList.tsx` (new file)

Features:

- Display multiple receipts
- Grid/list view
- Thumbnail previews
- Upload new receipt button
- Delete receipts

#### 5.4 Integrate into Expense Modal

**File**: `apps/web/src/components/application/modals/ExpenseModal.tsx`

Add receipt upload section:

- Show existing receipts
- Allow uploading new receipts
- Allow deleting receipts

### Phase 6: Environment Configuration

#### 6.1 Add Storage Configuration

**File**: `apps/api/src/config/env.ts`

Add environment variables:

```typescript
STORAGE_TYPE: z.enum(['local', 's3', 'azure']).default('local'),
STORAGE_PATH: z.string().default('uploads/receipts'),
AWS_S3_BUCKET: z.string().optional(),
AWS_S3_REGION: z.string().optional(),
AWS_ACCESS_KEY_ID: z.string().optional(),
AWS_SECRET_ACCESS_KEY: z.string().optional(),
```

#### 6.2 Update .env.example

**File**: `apps/api/.env.example`

Add storage configuration examples.

### Phase 7: Error Handling

#### 7.1 Backend Error Handling

**File**: `apps/api/src/routes/receipts.ts`

Handle errors:

- File too large
- Invalid file type
- Storage errors
- Permission errors
- Database errors

#### 7.2 Frontend Error Handling

**File**: `apps/web/src/components/application/ReceiptUpload.tsx`

Display user-friendly errors:

- File validation errors
- Upload failures
- Network errors

## File Structure

```
apps/api/
├── src/
│   ├── lib/
│   │   └── storage.ts (new)
│   ├── routes/
│   │   └── receipts.ts (new)
│   └── config/
│       └── env.ts (update)
├── prisma/
│   ├── schema.prisma (update)
│   └── migrations/
│       └── [timestamp]_add_receipt_fields/ (new)
└── uploads/ (new directory)
    └── receipts/

packages/shared/
└── src/
    ├── schemas/
    │   └── receipt.ts (new)
    └── index.ts (update)

apps/web/
└── src/
    ├── components/
    │   └── application/
    │       ├── ReceiptUpload.tsx (new)
    │       ├── ReceiptDisplay.tsx (new)
    │       └── ReceiptList.tsx (new)
    ├── services/
    │   └── receipts.ts (new)
    └── components/application/modals/
        └── ExpenseModal.tsx (update)
```

## API Endpoints

### POST /api/expenses/:expenseId/receipts

Upload a receipt for an expense.

**Request**:

- Method: POST
- Content-Type: multipart/form-data
- Body: `file` (File)
- Params: `expenseId` (UUID)

**Response** (201 Created):

```json
{
  "receipt": {
    "id": "uuid",
    "expenseId": "uuid",
    "fileUrl": "https://example.com/receipts/uuid.jpg",
    "mimeType": "image/jpeg",
    "filename": "receipt.jpg",
    "fileSize": 123456,
    "createdAt": "2025-01-10T12:00:00Z"
  }
}
```

### GET /api/expenses/:expenseId/receipts

Get all receipts for an expense.

**Response** (200 OK):

```json
{
  "receipts": [
    {
      "id": "uuid",
      "expenseId": "uuid",
      "fileUrl": "https://example.com/receipts/uuid.jpg",
      "mimeType": "image/jpeg",
      "filename": "receipt.jpg",
      "fileSize": 123456,
      "createdAt": "2025-01-10T12:00:00Z"
    }
  ]
}
```

### DELETE /api/receipts/:receiptId

Delete a receipt.

**Response** (200 OK):

```json
{
  "success": true
}
```

## Security Considerations

1. **File Validation**
   - Validate file type (whitelist only)
   - Validate file size (max 10MB)
   - Scan for malicious content (optional)

2. **Access Control**
   - Only expense participants can upload/view receipts
   - Only expense creator/admin can delete receipts
   - Verify user is group member

3. **File Storage**
   - Use secure file paths (UUID-based)
   - Prevent directory traversal
   - Set proper file permissions

4. **Rate Limiting**
   - Limit uploads per user/time period
   - Prevent abuse

## Testing

### Backend Tests

**File**: `apps/api/src/routes/__tests__/receipts.test.ts` (new)

Test cases:

- Upload receipt successfully
- Upload invalid file type
- Upload file too large
- Get receipts for expense
- Delete receipt
- Permission checks
- Storage errors

### Frontend Tests

**File**: `apps/web/src/components/application/__tests__/ReceiptUpload.test.tsx` (new)

Test cases:

- File selection
- File validation
- Upload progress
- Error handling
- Success handling

## Success Criteria

- [ ] Receipt upload API endpoint working
- [ ] File storage configured (local filesystem)
- [ ] Receipt validation working
- [ ] Frontend upload component created
- [ ] Receipt display component created
- [ ] Receipts integrated into expense modal
- [ ] Multiple receipts per expense supported
- [ ] Receipt deletion working
- [ ] Error handling implemented
- [ ] Tests written and passing
- [ ] Documentation updated

## Future Enhancements

1. **Cloud Storage Integration**
   - AWS S3 integration
   - Azure Blob Storage integration
   - CDN for file delivery

2. **Receipt OCR**
   - Extract expense details from receipts
   - Auto-fill expense form from receipt

3. **Receipt Processing**
   - Image optimization
   - PDF generation from images
   - Receipt categorization

4. **Advanced Features**
   - Receipt search
   - Receipt tags
   - Receipt sharing
