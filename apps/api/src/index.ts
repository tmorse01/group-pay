import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

// Initialize Application Insights if connection string is available
// This must be done early to properly instrument the app
// Returns the TelemetryClient if initialized, null otherwise
async function initializeApplicationInsights() {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    try {
      // Dynamic import to ensure it loads properly
      const appInsightsModule = await import('applicationinsights');
      const appInsights = appInsightsModule.default || appInsightsModule;

      appInsights
        .setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true, false) // Collect console logs but don't override console methods
        .setUseDiskRetryCaching(true)
        .setSendLiveMetrics(false)
        .setDistributedTracingMode(
          appInsights.DistributedTracingModes.AI_AND_W3C
        )
        .start();

      const client = appInsights.defaultClient;

      console.log('[APPLICATIONINSIGHTS] Initialized successfully');
      console.log(
        '[APPLICATIONINSIGHTS] Instrumentation Key:',
        process.env.APPINSIGHTS_INSTRUMENTATIONKEY?.substring(0, 8) + '...'
      );

      return client;
    } catch (error) {
      console.error('[APPLICATIONINSIGHTS] Failed to initialize:', error);
      return null;
    }
  }
  return null;
}

async function start() {
  // Initialize Application Insights before starting the app
  const appInsightsClient = await initializeApplicationInsights();
  try {
    // Create the app instance, passing Application Insights client for Pino integration
    const app = await createApp(appInsightsClient);

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
