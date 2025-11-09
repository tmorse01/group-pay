// Only load dotenv in non-production environments
if (process.env.NODE_ENV !== 'production') {
  await import('dotenv/config');
}

import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

async function start() {
  try {
    // Create the app instance
    const app = await createApp();

    // Test database connection
    await prisma.$connect();
    app.log.info('[DATABASE] Connected successfully');

    // Start the server
    await app.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });

    app.log.info(
      `[SERVER] Group Pay API server is running on port ${env.PORT}`
    );
    app.log.info(`[DOCS] API Documentation: http://localhost:${env.PORT}/docs`);
    app.log.info(`[HEALTH] Health Check: http://localhost:${env.PORT}/health`);

    // Handle graceful shutdown
    const shutdown = async () => {
      app.log.info('Shutting down gracefully');
      await app.close();
      await prisma.$disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('[ERROR] Error starting server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

start();
