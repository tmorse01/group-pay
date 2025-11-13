import { FastifyInstance, FastifyRequest } from 'fastify';
import multipart, { FastifyMultipartBaseOptions } from '@fastify/multipart';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  UnauthorizedError,
  validateReceiptFile,
} from '@group-pay/shared';
import { receiptSchemas } from '../schemas/receipts.js';
import { storageService } from '../lib/storage.js';
import { prisma } from '../lib/prisma.js';
import path from 'path';
import { promises as fs } from 'fs';

// Helper to ensure user is authenticated
function requireAuth(request: FastifyRequest) {
  if (!request.authUser?.userId) {
    throw new UnauthorizedError('Authentication required');
  }
  return request.authUser.userId as string;
}

export default async function receiptRoutes(fastify: FastifyInstance) {
  // Register multipart plugin for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // Upload receipt for an expense
  fastify.post(
    '/expenses/:expenseId/receipts',
    { schema: receiptSchemas.uploadReceipt },
    async (request, reply) => {
      const userId = requireAuth(request);
      const { expenseId } = request.params as { expenseId: string };

      // Verify expense exists and user has access
      const expense = await prisma.expense.findFirst({
        where: {
          id: expenseId,
          group: {
            members: {
              some: { userId },
            },
          },
        },
        include: {
          group: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!expense) {
        throw new NotFoundError('Expense');
      }

      // Verify user is a participant or group admin
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId: expense.groupId,
          userId,
        },
      });

      if (!membership) {
        throw new ForbiddenError('You are not a member of this group');
      }

      const data = await (request as any).file();

      if (!data) {
        throw new ValidationError('No file provided');
      }

      const buffer = await data.toBuffer();
      const filename = data.filename || 'receipt';
      const mimeType = data.mimetype || 'application/octet-stream';

      // Validate file
      const validation = validateReceiptFile({
        name: filename,
        size: buffer.length,
        type: mimeType,
      });

      if (!validation.isValid) {
        throw new ValidationError(validation.errors.join(', '));
      }

      // Upload file
      const filePath = await storageService.upload(buffer, filename, mimeType);
      const fileUrl = storageService.getUrl(filePath);

      // Create receipt record
      const receipt = await prisma.receipt.create({
        data: {
          expenseId,
          fileUrl: filePath, // Store path, not full URL
          mimeType,
          filename,
          fileSize: buffer.length,
        },
      });

      reply.status(201).send({
        receipt: {
          ...receipt,
          fileUrl, // Return full URL to client
        },
      });
    }
  );

  // Get all receipts for an expense
  fastify.get(
    '/expenses/:expenseId/receipts',
    { schema: receiptSchemas.getReceipts },
    async (request) => {
      const userId = requireAuth(request);
      const { expenseId } = request.params as { expenseId: string };

      // Verify expense exists and user has access
      const expense = await prisma.expense.findFirst({
        where: {
          id: expenseId,
          group: {
            members: {
              some: { userId },
            },
          },
        },
      });

      if (!expense) {
        throw new NotFoundError('Expense');
      }

      const receipts = await prisma.receipt.findMany({
        where: { expenseId },
        orderBy: { createdAt: 'desc' },
      });

      // Convert file paths to URLs
      const receiptsWithUrls = receipts.map((receipt) => ({
        ...receipt,
        fileUrl: storageService.getUrl(receipt.fileUrl),
      }));

      return { receipts: receiptsWithUrls };
    }
  );

  // Get receipt by ID
  fastify.get(
    '/receipts/:receiptId',
    { schema: receiptSchemas.getReceiptById },
    async (request) => {
      const userId = requireAuth(request);
      const { receiptId } = request.params as { receiptId: string };

      const receipt = await prisma.receipt.findFirst({
        where: {
          id: receiptId,
          expense: {
            group: {
              members: {
                some: { userId },
              },
            },
          },
        },
      });

      if (!receipt) {
        throw new NotFoundError('Receipt');
      }

      return {
        receipt: {
          ...receipt,
          fileUrl: storageService.getUrl(receipt.fileUrl),
        },
      };
    }
  );

  // Delete receipt
  fastify.delete(
    '/receipts/:receiptId',
    { schema: receiptSchemas.deleteReceipt },
    async (request) => {
      const userId = requireAuth(request);
      const { receiptId } = request.params as { receiptId: string };

      // Verify receipt exists and user has access
      const receipt = await prisma.receipt.findFirst({
        where: {
          id: receiptId,
          expense: {
            group: {
              members: {
                some: { userId },
              },
            },
          },
        },
        include: {
          expense: {
            select: {
              payerId: true,
              groupId: true,
            },
          },
        },
      });

      if (!receipt) {
        throw new NotFoundError('Receipt');
      }

      // Only the expense payer or group admin can delete receipts
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId: receipt.expense.groupId,
          userId,
        },
      });

      const canDelete =
        receipt.expense.payerId === userId ||
        ['OWNER', 'ADMIN'].includes(membership?.role || '');

      if (!canDelete) {
        throw new ForbiddenError(
          'Only the expense payer or group admins can delete receipts'
        );
      }

      // Delete file from storage
      await storageService.delete(receipt.fileUrl);

      // Delete receipt record
      await prisma.receipt.delete({
        where: { id: receiptId },
      });

      return { success: true };
    }
  );

  // Serve receipt files (static file serving for local storage only)
  // For Azure storage, files are served directly via blob URLs
  fastify.get('/receipts/files/:filename', async (request, reply) => {
    const userId = requireAuth(request);
    const { filename } = request.params as { filename: string };

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      throw new ValidationError('Invalid filename');
    }

    // Find receipt to verify access
    const receipt = await prisma.receipt.findFirst({
      where: {
        fileUrl: {
          contains: filename,
        },
        expense: {
          group: {
            members: {
              some: { userId },
            },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundError('Receipt');
    }

    // If using Azure storage, redirect to blob URL or return 404
    // (Azure blobs should be accessed directly via their URLs)
    const storageType = process.env.STORAGE_TYPE || 'local';
    if (storageType === 'azure') {
      // Azure storage URLs are returned directly from getUrl()
      // This endpoint should not be used for Azure storage
      throw new NotFoundError('Receipt file not available via this endpoint');
    }

    // Get file path for local storage
    const filePath = path.resolve(
      process.cwd(),
      process.env.UPLOAD_DEST || 'uploads/receipts',
      filename
    );

    try {
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(filename).toLowerCase();

      // Set appropriate content type
      let contentType = receipt.mimeType;
      if (!contentType) {
        const mimeTypes: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.pdf': 'application/pdf',
        };
        contentType = mimeTypes[ext] || 'application/octet-stream';
      }

      reply.type(contentType);
      return fileBuffer;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundError('Receipt file');
      }
      throw error;
    }
  });
}
