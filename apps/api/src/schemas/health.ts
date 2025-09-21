// Fastify JSON schemas for health check endpoints
export const healthSchemas = {
  healthCheck: {
    description:
      'General health check endpoint that returns application status, database connectivity, memory usage, and system information',
    tags: ['Health'],
    response: {
      200: {
        description: 'Application is healthy',
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy'],
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          uptime: {
            type: 'number',
            description: 'Application uptime in seconds',
          },
          database: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['connected'],
              },
              responseTime: {
                type: 'string',
                pattern: '^\\d+ms$',
                description: 'Database response time in milliseconds',
              },
            },
            required: ['status', 'responseTime'],
          },
          memory: {
            type: 'object',
            properties: {
              rss: {
                type: 'number',
                description: 'Resident Set Size in bytes',
              },
              heapTotal: {
                type: 'number',
                description: 'Total heap size in bytes',
              },
              heapUsed: {
                type: 'number',
                description: 'Used heap size in bytes',
              },
              external: {
                type: 'number',
                description: 'External memory usage in bytes',
              },
              arrayBuffers: {
                type: 'number',
                description: 'ArrayBuffer memory usage in bytes',
              },
            },
            required: ['rss', 'heapTotal', 'heapUsed', 'external'],
          },
          version: {
            type: 'string',
            description: 'Application version',
          },
        },
        required: [
          'status',
          'timestamp',
          'uptime',
          'database',
          'memory',
          'version',
        ],
      },
      500: {
        description: 'Application is unhealthy',
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['unhealthy'],
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          database: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['disconnected'],
              },
              error: {
                type: 'string',
                description: 'Database connection error message',
              },
            },
            required: ['status', 'error'],
          },
        },
        required: ['status', 'timestamp', 'database'],
      },
    },
  },

  databaseCheck: {
    description:
      'Detailed database health check that tests connectivity, retrieves database information, and verifies environment configuration',
    tags: ['Health'],
    response: {
      200: {
        description: 'Database is healthy and accessible',
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy'],
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          message: {
            type: 'string',
            enum: ['Database connection successful'],
          },
          connection_test: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                test: {
                  type: 'number',
                  enum: [1],
                },
              },
              required: ['test'],
            },
            minItems: 1,
            maxItems: 1,
          },
          database_info: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                database_name: {
                  type: 'string',
                  description: 'Current database name',
                },
                username: {
                  type: 'string',
                  description: 'Current database user',
                },
                version: {
                  type: 'string',
                  description: 'Database version information',
                },
              },
              required: ['database_name', 'username', 'version'],
            },
            minItems: 1,
            maxItems: 1,
          },
          environment: {
            type: 'object',
            properties: {
              NODE_ENV: {
                type: 'string',
                nullable: true,
                description: 'Current Node.js environment',
              },
              DATABASE_URL: {
                type: 'string',
                enum: ['configured', 'missing'],
                description: 'Database URL configuration status',
              },
            },
            required: ['DATABASE_URL'],
          },
        },
        required: [
          'status',
          'timestamp',
          'message',
          'connection_test',
          'database_info',
          'environment',
        ],
      },
      500: {
        description: 'Database is unhealthy or inaccessible',
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['unhealthy'],
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          message: {
            type: 'string',
            enum: ['Database connection failed'],
          },
          error: {
            type: 'string',
            description: 'Database connection error message',
          },
          environment: {
            type: 'object',
            properties: {
              NODE_ENV: {
                type: 'string',
                nullable: true,
                description: 'Current Node.js environment',
              },
              DATABASE_URL: {
                type: 'string',
                enum: ['configured', 'missing'],
                description: 'Database URL configuration status',
              },
            },
            required: ['DATABASE_URL'],
          },
        },
        required: ['status', 'timestamp', 'message', 'error', 'environment'],
      },
    },
  },
} as const;
