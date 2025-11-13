import { useState } from 'react';
import { X, Download, Trash } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import type { Receipt } from '@group-pay/shared';

interface ReceiptDisplayProps {
  receipt: Receipt;
  onDelete?: (receiptId: string) => void;
  showActions?: boolean;
  className?: string;
}

export function ReceiptDisplay({
  receipt,
  onDelete,
  showActions = true,
  className,
}: ReceiptDisplayProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isImage = receipt.mimeType.startsWith('image/');
  const isPdf = receipt.mimeType === 'application/pdf';
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const fileUrl = receipt.fileUrl.startsWith('http')
    ? receipt.fileUrl
    : `${API_BASE_URL}${receipt.fileUrl}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = receipt.filename || 'receipt';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this receipt?')) {
      onDelete(receipt.id);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className={`relative group ${className}`}>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-neutral-50 dark:bg-neutral-800">
          {/* Preview */}
          <div className="relative aspect-video bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
            {isImage && !imageError ? (
              <img
                src={fileUrl}
                alt={receipt.filename || 'Receipt'}
                className="w-full h-full object-contain"
                onError={() => setImageError(true)}
              />
            ) : isPdf ? (
              <div className="flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 bg-neutral-300 dark:bg-neutral-600 rounded flex items-center justify-center mb-2">
                  <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">PDF</span>
                </div>
                <span className="text-xs text-neutral-500">PDF Receipt</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 bg-neutral-300 dark:bg-neutral-600 rounded flex items-center justify-center mb-2">
                  <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">IMG</span>
                </div>
                <span className="text-xs text-neutral-500">Receipt</span>
              </div>
            )}

            {/* Overlay on hover */}
            {showActions && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  color="primary"
                  onClick={() => setIsFullscreen(true)}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  color="tertiary"
                  onClick={handleDownload}
                  iconLeading={Download}
                >
                  Download
                </Button>
                {onDelete && (
                  <Button
                    size="sm"
                    color="primary-destructive"
                    onClick={handleDelete}
                    iconLeading={Trash}
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* File info */}
          <div className="p-2 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs font-medium text-neutral-900 dark:text-neutral-50 truncate">
              {receipt.filename || 'Receipt'}
            </p>
            {receipt.fileSize && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {formatFileSize(receipt.fileSize)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative max-w-4xl max-h-full w-full">
            <Button
              className="absolute top-4 right-4 z-10"
              color="tertiary"
              onClick={() => setIsFullscreen(false)}
              iconLeading={X}
              isIcon
            />
            {isImage ? (
              <img
                src={fileUrl}
                alt={receipt.filename || 'Receipt'}
                className="max-w-full max-h-[90vh] object-contain mx-auto"
                onClick={(e) => e.stopPropagation()}
              />
            ) : isPdf ? (
              <iframe
                src={fileUrl}
                className="w-full h-[90vh] border-0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="bg-white dark:bg-neutral-800 p-8 rounded-lg text-center">
                <div className="w-16 h-16 bg-neutral-300 dark:bg-neutral-600 rounded flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-neutral-600 dark:text-neutral-300">FILE</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-300">
                  Preview not available
                </p>
                <Button
                  className="mt-4"
                  onClick={handleDownload}
                  iconLeading={Download}
                >
                  Download File
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

