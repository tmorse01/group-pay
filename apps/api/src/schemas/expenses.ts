// Expense route schemas
export const expenseSchemas = {
  getAllExpenses: {
    tags: ['Expenses'],
    summary: 'Get all expenses for the authenticated user',
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'number', minimum: 1, maximum: 100 },
        offset: { type: 'number', minimum: 0 },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          expenses: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                description: { type: 'string' },
                amountCents: { type: 'number' },
                currency: { type: 'string' },
                date: { type: 'string' },
                category: { type: 'string', nullable: true },
                groupId: { type: 'string' },
                payerId: { type: 'string' },
                notes: { type: 'string', nullable: true },
                splitType: { type: 'string' },
                createdAt: { type: 'string' },
                payer: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    photoUrl: { type: 'string', nullable: true },
                  },
                },
                participants: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      expenseId: { type: 'string' },
                      userId: { type: 'string' },
                      shareCents: { type: 'number' },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          photoUrl: { type: 'string', nullable: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          pagination: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              limit: { type: 'number' },
              offset: { type: 'number' },
              hasMore: { type: 'boolean' },
            },
          },
        },
      },
    },
  },

  createExpense: {
    tags: ['Expenses'],
    summary: 'Create a new expense',
    querystring: {
      type: 'object',
      properties: {
        groupId: { type: 'string', format: 'uuid' },
      },
      required: ['groupId'],
    },
    body: {
      type: 'object',
      properties: {
        description: { type: 'string', minLength: 1, maxLength: 200 },
        amountCents: { type: 'number', minimum: 1 },
        currency: {
          type: 'string',
          minLength: 3,
          maxLength: 3,
          default: 'USD',
        },
        date: { type: 'string', format: 'date-time' },
        category: { type: 'string', maxLength: 50, nullable: true },
        notes: { type: 'string', maxLength: 500, nullable: true },
        payerId: { type: 'string', format: 'uuid' },
        splitType: {
          type: 'string',
          enum: ['EQUAL', 'PERCENTAGE', 'SHARES', 'EXACT'],
        },
        participants: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string', format: 'uuid' },
              shareCents: { type: 'number', minimum: 0 },
              sharePercentage: { type: 'number', minimum: 0, maximum: 100 },
              shareCount: { type: 'number', minimum: 1 },
            },
            required: ['userId'],
          },
        },
      },
      required: [
        'description',
        'amountCents',
        'payerId',
        'splitType',
        'participants',
      ],
    },
    response: {
      201: {
        type: 'object',
        properties: {
          expense: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              amountCents: { type: 'number' },
              currency: { type: 'string' },
              date: { type: 'string' },
              category: { type: 'string', nullable: true },
              payer: { type: 'object' },
              participants: { type: 'array' },
            },
          },
        },
      },
    },
  },

  getExpenseById: {
    tags: ['Expenses'],
    summary: 'Get expense details',
    params: {
      type: 'object',
      properties: {
        expenseId: { type: 'string', format: 'uuid' },
      },
      required: ['expenseId'],
    },
  },

  getGroupExpenses: {
    tags: ['Expenses'],
    summary: 'Get all expenses for a group',
    params: {
      type: 'object',
      properties: {
        groupId: { type: 'string', format: 'uuid' },
      },
      required: ['groupId'],
    },
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'number', minimum: 1, maximum: 100 },
        offset: { type: 'number', minimum: 0 },
      },
    },
  },

  updateExpense: {
    tags: ['Expenses'],
    summary: 'Update expense',
    params: {
      type: 'object',
      properties: {
        expenseId: { type: 'string', format: 'uuid' },
      },
      required: ['expenseId'],
    },
    body: {
      type: 'object',
      properties: {
        description: { type: 'string', minLength: 1, maxLength: 200 },
        amountCents: { type: 'number', minimum: 1 },
        date: { type: 'string', format: 'date-time' },
        category: { type: 'string', maxLength: 50, nullable: true },
        notes: { type: 'string', maxLength: 500, nullable: true },
        payerId: { type: 'string', format: 'uuid' },
        splitType: { type: 'string', enum: ['EQUAL', 'SHARES', 'EXACT'] },
        participants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string', format: 'uuid' },
              shareCents: { type: 'number', minimum: 0 },
            },
            required: ['userId'],
            additionalProperties: false,
          },
        },
      },
    },
  },

  deleteExpense: {
    tags: ['Expenses'],
    summary: 'Delete expense',
    params: {
      type: 'object',
      properties: {
        expenseId: { type: 'string', format: 'uuid' },
      },
      required: ['expenseId'],
    },
  },
} as const;
