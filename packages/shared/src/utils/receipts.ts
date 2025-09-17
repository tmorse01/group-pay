export interface ReceiptMetadata {
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface ParsedReceiptData {
  merchantName?: string;
  totalAmount?: number;
  date?: Date;
  items?: Array<{
    description: string;
    amount: number;
  }>;
  confidence: number; // 0-1 score of parsing confidence
}

/**
 * Validate uploaded receipt file
 */
export function validateReceiptFile(file: {
  name: string;
  size: number;
  type: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File size must be less than 10MB');
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ];

  if (!allowedTypes.includes(file.type)) {
    errors.push('File must be an image (JPEG, PNG, GIF, WebP) or PDF');
  }

  // Check filename
  if (!file.name || file.name.length > 255) {
    errors.push('Filename must be provided and less than 255 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a secure filename for storage
 */
export function generateSecureFilename(
  originalName: string,
  userId: string
): string {
  const timestamp = Date.now();
  const parts = originalName.split('.');
  const extension = parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  const random = Math.random().toString(36).substring(2, 8);

  return `${userId}_${timestamp}_${random}${extension ? '.' + extension : ''}`;
}