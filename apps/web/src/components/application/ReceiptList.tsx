import { ReceiptDisplay } from './ReceiptDisplay';
import { ReceiptUpload } from './ReceiptUpload';
import { useReceipts, useDeleteReceipt } from '@/services/receipts';
import type { Receipt } from '@group-pay/shared';

interface ReceiptListProps {
  expenseId: string;
  canUpload?: boolean;
  canDelete?: boolean;
  className?: string;
}

export function ReceiptList({
  expenseId,
  canUpload = true,
  canDelete = true,
  className,
}: ReceiptListProps) {
  const { data, isLoading, refetch } = useReceipts(expenseId);
  const deleteMutation = useDeleteReceipt();

  const receipts = data?.receipts || [];

  const handleDelete = async (receiptId: string) => {
    try {
      await deleteMutation.mutateAsync(receiptId);
      refetch();
    } catch (error) {
      console.error('Failed to delete receipt:', error);
    }
  };

  const handleUploadComplete = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className={`${className} p-4 text-center text-neutral-500`}>
        Loading receipts...
      </div>
    );
  }

  return (
    <div className={className}>
      {canUpload && (
        <div className="mb-4">
          <ReceiptUpload
            expenseId={expenseId}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      )}

      {receipts.length === 0 ? (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          <p className="text-sm">No receipts uploaded yet</p>
          {canUpload && (
            <p className="text-xs mt-1">Upload a receipt above to get started</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {receipts.map((receipt: Receipt) => (
            <ReceiptDisplay
              key={receipt.id}
              receipt={receipt}
              onDelete={canDelete ? handleDelete : undefined}
              showActions={canDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

