import { describe, it, expect } from 'vitest';
import { validateReceiptFile, generateSecureFilename } from '../receipts';

describe('Receipt Processing', () => {
  describe('validateReceiptFile', () => {
    it('should accept valid image files', () => {
      const validFiles = [
        { name: 'receipt.jpg', size: 1024 * 1024, type: 'image/jpeg' },
        { name: 'receipt.png', size: 2 * 1024 * 1024, type: 'image/png' },
        { name: 'receipt.gif', size: 500 * 1024, type: 'image/gif' },
        { name: 'receipt.webp', size: 1.5 * 1024 * 1024, type: 'image/webp' },
      ];

      validFiles.forEach(file => {
        const result = validateReceiptFile(file);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should accept valid PDF files', () => {
      const pdfFile = {
        name: 'receipt.pdf',
        size: 3 * 1024 * 1024,
        type: 'application/pdf',
      };

      const result = validateReceiptFile(pdfFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject files that are too large', () => {
      const largeFile = {
        name: 'large-receipt.jpg',
        size: 12 * 1024 * 1024, // 12MB, over the 10MB limit
        type: 'image/jpeg',
      };

      const result = validateReceiptFile(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File size must be less than 10MB');
    });

    it('should reject unsupported file types', () => {
      const invalidFiles = [
        { name: 'receipt.txt', size: 1024, type: 'text/plain' },
        { name: 'receipt.doc', size: 1024, type: 'application/msword' },
        { name: 'receipt.xlsx', size: 1024, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        { name: 'receipt.mp4', size: 1024, type: 'video/mp4' },
      ];

      invalidFiles.forEach(file => {
        const result = validateReceiptFile(file);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('File must be an image (JPEG, PNG, GIF, WebP) or PDF');
      });
    });

    it('should reject files with missing or invalid filenames', () => {
      const invalidNameFiles = [
        { name: '', size: 1024, type: 'image/jpeg' },
        { name: 'a'.repeat(256), size: 1024, type: 'image/jpeg' }, // 256 chars, over limit
      ];

      invalidNameFiles.forEach(file => {
        const result = validateReceiptFile(file);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Filename must be provided and less than 255 characters');
      });
    });

    it('should return multiple errors for multiple violations', () => {
      const badFile = {
        name: 'a'.repeat(256),
        size: 15 * 1024 * 1024, // Too large
        type: 'text/plain', // Wrong type
      };

      const result = validateReceiptFile(badFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('File size must be less than 10MB');
      expect(result.errors).toContain('File must be an image (JPEG, PNG, GIF, WebP) or PDF');
      expect(result.errors).toContain('Filename must be provided and less than 255 characters');
    });

    it('should handle edge case of exactly 10MB file', () => {
      const maxSizeFile = {
        name: 'receipt.jpg',
        size: 10 * 1024 * 1024, // Exactly 10MB
        type: 'image/jpeg',
      };

      const result = validateReceiptFile(maxSizeFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle edge case of 255 character filename', () => {
      const maxNameFile = {
        name: 'a'.repeat(251) + '.jpg', // 255 chars total
        size: 1024,
        type: 'image/jpeg',
      };

      const result = validateReceiptFile(maxNameFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('generateSecureFilename', () => {
    it('should generate filename with userId, timestamp, and random string', () => {
      const originalName = 'my-receipt.jpg';
      const userId = 'user123';

      const secureFilename = generateSecureFilename(originalName, userId);

      expect(secureFilename).toMatch(/^user123_\d+_[a-z0-9]{6}\.jpg$/);
    });

    it('should preserve file extension', () => {
      const testCases = [
        { original: 'receipt.jpg', expected: 'jpg' },
        { original: 'receipt.PNG', expected: 'png' },
        { original: 'receipt.PDF', expected: 'pdf' },
        { original: 'receipt.JPEG', expected: 'jpeg' },
      ];

      testCases.forEach(({ original, expected }) => {
        const secureFilename = generateSecureFilename(original, 'user123');
        expect(secureFilename).toMatch(new RegExp(`\\.${expected}$`));
      });
    });

    it('should handle filenames without extensions', () => {
      const secureFilename = generateSecureFilename('receipt', 'user123');
      expect(secureFilename).toMatch(/^user123_\d+_[a-z0-9]{6}$/);
    });

    it('should handle filenames with multiple dots', () => {
      const secureFilename = generateSecureFilename('my.receipt.v2.jpg', 'user123');
      expect(secureFilename).toMatch(/^user123_\d+_[a-z0-9]{6}\.jpg$/);
    });

    it('should generate unique filenames for the same input', () => {
      const originalName = 'receipt.jpg';
      const userId = 'user123';

      const filename1 = generateSecureFilename(originalName, userId);
      const filename2 = generateSecureFilename(originalName, userId);

      expect(filename1).not.toBe(filename2);
    });

    it('should include timestamp that progresses', async () => {
      const originalName = 'receipt.jpg';
      const userId = 'user123';

      const filename1 = generateSecureFilename(originalName, userId);
      
      // Wait a small amount to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 2));
      
      const filename2 = generateSecureFilename(originalName, userId);

      // Extract timestamps
      const timestamp1 = parseInt(filename1.split('_')[1]);
      const timestamp2 = parseInt(filename2.split('_')[1]);

      expect(timestamp2).toBeGreaterThanOrEqual(timestamp1);
    });

    it('should handle special characters in userId', () => {
      const secureFilename = generateSecureFilename('receipt.jpg', 'user-123@example.com');
      expect(secureFilename).toMatch(/^user-123@example\.com_\d+_[a-z0-9]{6}\.jpg$/);
    });
  });
});