// Receipt route schemas
export const receiptSchemas = {
  uploadReceipt: {
    tags: ['Receipts'],
    summary: 'Upload a receipt for an expense',
    params: {
      type: 'object',
      properties: {
        expenseId: { type: 'string', format: 'uuid' },
      },
      required: ['expenseId'],
    },
    consumes: ['multipart/form-data'],
    response: {
      201: {
        type: 'object',
        properties: {
          receipt: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              expenseId: { type: 'string' },
              fileUrl: { type: 'string' },
              mimeType: { type: 'string' },
              filename: { type: 'string', nullable: true },
              fileSize: { type: 'number', nullable: true },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
  },

  getReceipts: {
    tags: ['Receipts'],
    summary: 'Get all receipts for an expense',
    params: {
      type: 'object',
      properties: {
        expenseId: { type: 'string', format: 'uuid' },
      },
      required: ['expenseId'],
    },
    response: {
      200: {
        type: 'object',
        properties: {
          receipts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                expenseId: { type: 'string' },
                fileUrl: { type: 'string' },
                mimeType: { type: 'string' },
                filename: { type: 'string', nullable: true },
                fileSize: { type: 'number', nullable: true },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },

  getReceiptById: {
    tags: ['Receipts'],
    summary: 'Get receipt details',
    params: {
      type: 'object',
      properties: {
        receiptId: { type: 'string', format: 'uuid' },
      },
      required: ['receiptId'],
    },
  },

  deleteReceipt: {
    tags: ['Receipts'],
    summary: 'Delete a receipt',
    params: {
      type: 'object',
      properties: {
        receiptId: { type: 'string', format: 'uuid' },
      },
      required: ['receiptId'],
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
        },
      },
    },
  },
} as const;

