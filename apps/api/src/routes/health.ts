import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { healthSchemas } from '../schemas/health.js';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/', { schema: healthSchemas.healthCheck }, async () => {
    const startTime = Date.now();

    try {
      // Check database connectivity
      await prisma.$queryRaw`SELECT 1`;
      const dbTime = Date.now() - startTime;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: 'connected',
          responseTime: `${dbTime}ms`,
        },
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  });

  fastify.get('/db', { schema: healthSchemas.databaseCheck }, async () => {
    try {
      // Test basic connectivity
      const connectionTest = await prisma.$queryRaw`SELECT 1 as test`;

      // Get database info (simplified for PostgreSQL)
      const dbInfo = await prisma.$queryRaw`
        SELECT 
          current_database() as database_name,
          current_user as username,
          version() as version
      `;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Database connection successful',
        connection_test: connectionTest,
        database_info: dbInfo,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing',
        },
      };
    }
  });
}
