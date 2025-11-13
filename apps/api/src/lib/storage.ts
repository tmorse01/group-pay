import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { env } from '../config/env.js';

export interface StorageService {
  upload(file: Buffer, filename: string, mimeType: string): Promise<string>;
  delete(fileUrl: string): Promise<void>;
  getUrl(filePath: string): string;
}

/**
 * Local filesystem storage service for development
 */
class LocalStorageService implements StorageService {
  private basePath: string;

  constructor() {
    // Use STORAGE_PATH from env or default to uploads/receipts
    this.basePath = path.resolve(
      process.cwd(),
      env.UPLOAD_DEST || 'uploads/receipts'
    );
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists() {
    try {
      await fs.access(this.basePath);
    } catch {
      await fs.mkdir(this.basePath, { recursive: true });
    }
  }

  async upload(
    file: Buffer,
    filename: string,
    _mimeType: string
  ): Promise<string> {
    await this.ensureDirectoryExists();

    // Generate secure filename using UUID
    const ext = path.extname(filename);
    const secureFilename = `${randomUUID()}${ext}`;
    const filePath = path.join(this.basePath, secureFilename);

    await fs.writeFile(filePath, file);

    // Return relative path for storage in database
    return `receipts/${secureFilename}`;
  }

  async delete(fileUrl: string): Promise<void> {
    // Extract filename from URL/path
    const filename = fileUrl.includes('/') ? fileUrl.split('/').pop() : fileUrl;
    if (!filename) return;

    const filePath = path.join(this.basePath, filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore error
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  getUrl(filePath: string): string {
    // For local storage, return a path that can be served statically
    // In production, this would return a CDN URL or signed URL
    return `/api/receipts/files/${filePath.replace('receipts/', '')}`;
  }
}

/**
 * Azure Blob Storage service for production
 */
class AzureStorageService implements StorageService {
  private containerClient: ContainerClient;
  private containerName: string;
  private accountName: string;

  constructor() {
    const connectionString =
      process.env.AZURE_STORAGE_CONNECTION_STRING ||
      process.env.AZURE_STORAGE_ACCOUNT_CONNECTION_STRING;

    if (!connectionString) {
      throw new Error(
        'AZURE_STORAGE_CONNECTION_STRING environment variable is required for Azure storage'
      );
    }

    this.containerName =
      process.env.AZURE_STORAGE_CONTAINER_NAME || 'receipts';
    this.accountName =
      process.env.AZURE_STORAGE_ACCOUNT_NAME || '';

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(
      this.containerName
    );
  }

  async upload(
    file: Buffer,
    filename: string,
    mimeType: string
  ): Promise<string> {
    // Generate secure filename using UUID
    const ext = path.extname(filename);
    const secureFilename = `${randomUUID()}${ext}`;
    const blobName = `receipts/${secureFilename}`;

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(file, file.length, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
      },
    });

    // Return path for storage in database
    return blobName;
  }

  async delete(fileUrl: string): Promise<void> {
    // Extract blob name from URL/path
    const blobName = fileUrl.includes('/')
      ? fileUrl
      : `receipts/${fileUrl}`;

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    try {
      await blockBlobClient.delete();
    } catch (error: unknown) {
      // Blob might not exist, ignore 404 errors
      if (
        error &&
        typeof error === 'object' &&
        'statusCode' in error &&
        error.statusCode === 404
      ) {
        return;
      }
      throw error;
    }
  }

  getUrl(filePath: string): string {
    // Construct blob URL
    // Format: https://{accountName}.blob.core.windows.net/{containerName}/{blobName}
    const blobName = filePath.startsWith('receipts/')
      ? filePath
      : `receipts/${filePath}`;

    if (this.accountName) {
      return `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${blobName}`;
    }

    // Fallback: return path that can be served via API endpoint
    return `/api/receipts/files/${blobName.replace('receipts/', '')}`;
  }
}

// Factory function to create storage service based on env
export function createStorageService(): StorageService {
  const storageType = process.env.STORAGE_TYPE || 'local';

  switch (storageType) {
    case 'azure':
      return new AzureStorageService();
    case 'local':
      return new LocalStorageService();
    default:
      return new LocalStorageService();
  }
}

export const storageService = createStorageService();
