import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
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

  fastify.get('/health/db', async () => {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          version() as version,
          current_database() as database,
          current_user as user,
          inet_server_addr() as host,
          inet_server_port() as port
      `;

      const stats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes
        FROM pg_stat_user_tables
        ORDER BY schemaname, tablename
      `;

      return {
        connection: result,
        statistics: stats,
      };
    } catch (error) {
      throw new Error(`Database health check failed: ${error}`);
    }
  });
}
