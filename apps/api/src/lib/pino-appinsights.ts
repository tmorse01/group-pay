import type { TelemetryClient } from 'applicationinsights';

/**
 * Pino stream interface - matches what Fastify expects
 */
interface PinoStream {
  write: (log: string) => void;
}

/**
 * Creates a Pino stream that sends logs to Application Insights AND stdout
 * This ensures Pino JSON logs are properly captured as traces while also
 * maintaining stdout output for Azure App Service log capture
 */
export function createApplicationInsightsStream(
  client: TelemetryClient
): PinoStream {
  return {
    write(log: string) {
      // Always write to stdout first (for Azure App Service log capture)
      process.stdout.write(log + '\n');

      // Also send to Application Insights
      try {
        const logObj = JSON.parse(log);

        // Map Pino log levels to Application Insights severity levels
        // Pino levels: 10=trace, 20=debug, 30=info, 40=warn, 50=error, 60=fatal
        const severityLevel =
          logObj.level >= 50
            ? 3 // Error/Fatal
            : logObj.level >= 40
              ? 2 // Warn
              : logObj.level >= 30
                ? 1 // Info
                : 0; // Debug/Trace

        // Extract message from log object
        const message = logObj.msg || JSON.stringify(logObj);

        // Extract custom properties (everything except standard Pino fields)
        const customProperties: Record<string, string> = {};
        const standardFields = [
          'level',
          'time',
          'pid',
          'hostname',
          'msg',
          'v', // Pino version
        ];

        for (const [key, value] of Object.entries(logObj)) {
          if (!standardFields.includes(key) && value !== undefined) {
            // Convert values to strings for Application Insights
            customProperties[key] =
              typeof value === 'object' ? JSON.stringify(value) : String(value);
          }
        }

        // Send trace to Application Insights
        client.trackTrace({
          message,
          severity: severityLevel as 0 | 1 | 2 | 3 | 4,
          properties: customProperties,
        });
      } catch (error) {
        // If parsing fails, send the raw log string
        client.trackTrace({
          message: log,
          severity: 1,
          properties: {
            parseError: error instanceof Error ? error.message : String(error),
          },
        });
      }
    },
  };
}
