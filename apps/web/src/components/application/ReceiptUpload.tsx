import { useRef, useState, useCallback } from 'react';
import { Upload } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { useUploadReceipt } from '@/services/receipts';
import { validateReceiptFile } from '@group-pay/shared';

interface ReceiptUploadProps {
  expenseId: string;
  onUploadComplete?: () => void;
  maxFiles?: number;
  className?: string;
}

export function ReceiptUpload({
  expenseId,
  onUploadComplete,
  maxFiles = 10,
  className,
}: ReceiptUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadMutation = useUploadReceipt();

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file
      const validation = validateReceiptFile({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (!validation.isValid) {
        setError(validation.errors[0]);
        return;
      }

      try {
        await uploadMutation.mutateAsync({ expenseId, file });
        onUploadComplete?.();
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
    },
    [expenseId, uploadMutation, onUploadComplete]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  const isPdf = (mimeType: string) => {
    return mimeType === 'application/pdf';
  };

  return (
    <div className={className}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${
            dragActive
              ? 'border-brand bg-brand-subtle'
              : 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800'
          }
          ${uploadMutation.isPending ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          onChange={handleChange}
          className="hidden"
          disabled={uploadMutation.isPending}
        />

        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-3">
            {dragActive ? (
              <Upload className="w-8 h-8 text-brand" />
            ) : (
              <Upload className="w-8 h-8 text-neutral-400" />
            )}
          </div>

          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-1">
            {dragActive ? 'Drop receipt here' : 'Upload receipt'}
          </p>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
            Drag and drop or click to select
          </p>

          <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-4">
            Supports: JPEG, PNG, GIF, WebP, PDF (max 10MB)
          </p>

          <Button
            onClick={handleClick}
            size="sm"
            color="primary"
            isDisabled={uploadMutation.isPending}
            iconLeading={Upload}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Choose File'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-error-subtle border border-error rounded text-sm text-error">
          {error}
        </div>
      )}
    </div>
  );
}

