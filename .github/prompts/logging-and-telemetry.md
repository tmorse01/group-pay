# Logging and Telemetry Standards

This document provides standards and implementation guides for logging and telemetry in the Group Pay application.

## Logging Standards

### Log Message Format

Use consistent, ASCII-only prefixes for all log messages to ensure compatibility across all environments:

```typescript
// ✅ Correct - ASCII-only tags
app.log.info('[DATABASE] Connected successfully');
app.log.info('[SERVER] Starting on port 3001');
app.log.info('[AUTH] User authenticated successfully');
app.log.error('[ERROR] Failed to process request');

// ❌ Avoid - Unicode characters that may not display correctly
app.log.info('✅ Database connected');
app.log.info('🚀 Server starting');
```

### Standard Log Tags

| Tag           | Purpose                      | Example                                  |
| ------------- | ---------------------------- | ---------------------------------------- |
| `[SERVER]`    | Server lifecycle events      | `[SERVER] Started on port 3001`          |
| `[DATABASE]`  | Database operations          | `[DATABASE] Connection established`      |
| `[AUTH]`      | Authentication/authorization | `[AUTH] JWT token validated`             |
| `[API]`       | API request/response         | `[API] POST /api/groups - 201`           |
| `[ERROR]`     | Error conditions             | `[ERROR] Failed to create group`         |
| `[WARN]`      | Warning conditions           | `[WARN] Rate limit approaching`          |
| `[DEBUG]`     | Debug information            | `[DEBUG] Processing expense calculation` |
| `[HEALTH]`    | Health check status          | `[HEALTH] All services operational`      |
| `[DOCS]`      | Documentation endpoints      | `[DOCS] Swagger UI available`            |
| `[CACHE]`     | Caching operations           | `[CACHE] Redis connection established`   |
| `[MIGRATION]` | Database migrations          | `[MIGRATION] Applied schema update`      |
| `[SECURITY]`  | Security events              | `[SECURITY] Invalid login attempt`       |

### Log Levels

```typescript
// Use appropriate log levels
app.log.trace('[DEBUG] Detailed debugging info'); // Development only
app.log.debug('[DEBUG] Debug information'); // Development/staging
app.log.info('[INFO] General information'); // All environments
app.log.warn('[WARN] Warning condition'); // All environments
app.log.error('[ERROR] Error condition'); // All environments
app.log.fatal('[FATAL] Application crash'); // All environments
```

### Structured Logging

Include relevant context in log messages:

```typescript
// ✅ Good - Includes context
app.log.info('[API] POST /api/groups - 201', {
  userId: req.user.id,
  groupId: newGroup.id,
  responseTime: Date.now() - startTime,
});

// ✅ Good - Error with context
app.log.error('[ERROR] Failed to create expense', {
  error: error.message,
  userId: req.user.id,
  groupId: req.body.groupId,
  amount: req.body.amount,
});
```

### Environment-Specific Logging

```typescript
// Configure different log formats for different environments
const logger = {
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : env.NODE_ENV === 'production'
        ? {
            target: '@azure/logger', // For Azure Application Insights
          }
        : undefined,
};
```

## Telemetry Implementation

### Phase 1: OpenTelemetry Foundation

#### Dependencies to Add

```bash
pnpm add @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/instrumentation-http @opentelemetry/instrumentation-fastify @opentelemetry/exporter-jaeger
```

#### Basic OpenTelemetry Setup

Create `src/telemetry/index.ts`:

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { env } from '../config/env.js';

const jaegerExporter = new JaegerExporter({
  endpoint: env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
});

const sdk = new NodeSDK({
  traceExporter: jaegerExporter,
  instrumentations: [new HttpInstrumentation(), new FastifyInstrumentation()],
  serviceName: 'group-pay-api',
  serviceVersion: '1.0.0',
});

export function initializeTelemetry() {
  sdk.start();
  console.log('[TELEMETRY] OpenTelemetry initialized');
}

export { sdk };
```

#### Custom Spans for Business Logic

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('group-pay-api');

// Example: Tracing expense creation
export async function createExpense(data: CreateExpenseData) {
  const span = tracer.startSpan('create_expense');

  try {
    span.setAttributes({
      'expense.amount': data.amount,
      'expense.groupId': data.groupId,
      'expense.userId': data.userId,
    });

    const expense = await prisma.expense.create({ data });

    span.setStatus({ code: SpanStatusCode.OK });
    span.setAttributes({
      'expense.id': expense.id,
      'expense.created': true,
    });

    return expense;
  } catch (error) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    throw error;
  } finally {
    span.end();
  }
}
```

### Phase 2: Azure Integration

#### Azure Application Insights

Add Azure-specific dependencies:

```bash
pnpm add @azure/monitor-opentelemetry @azure/monitor-opentelemetry-exporter
```

Create `src/telemetry/azure.ts`:

```typescript
import { useAzureMonitor } from '@azure/monitor-opentelemetry';
import { env } from '../config/env.js';

export function initializeAzureTelemetry() {
  if (env.NODE_ENV === 'production' && env.AZURE_MONITOR_CONNECTION_STRING) {
    useAzureMonitor({
      connectionString: env.AZURE_MONITOR_CONNECTION_STRING,
      samplingRatio: 0.1, // Sample 10% of traces
    });

    console.log('[TELEMETRY] Azure Application Insights initialized');
  }
}
```

#### Environment Variables

Add to your `.env` files:

```bash
# OpenTelemetry
JAEGER_ENDPOINT=http://localhost:14268/api/traces
OTEL_SERVICE_NAME=group-pay-api
OTEL_SERVICE_VERSION=1.0.0

# Azure Application Insights (Production)
AZURE_MONITOR_CONNECTION_STRING=InstrumentationKey=your-key-here;IngestionEndpoint=https://region.in.applicationinsights.azure.com/
```

### Phase 3: Custom Metrics

#### Business Metrics

```typescript
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('group-pay-api');

// Counters
const expenseCreatedCounter = meter.createCounter('expenses_created_total', {
  description: 'Total number of expenses created',
});

const userRegistrationCounter = meter.createCounter('users_registered_total', {
  description: 'Total number of user registrations',
});

// Histograms
const expenseAmountHistogram = meter.createHistogram('expense_amount', {
  description: 'Distribution of expense amounts',
  unit: 'currency',
});

// Gauges
const activeGroupsGauge = meter.createUpDownCounter('active_groups_count', {
  description: 'Number of active groups',
});

// Usage in your application
export function recordExpenseCreated(amount: number, currency: string) {
  expenseCreatedCounter.add(1, {
    currency,
    'expense.type': 'user_created',
  });

  expenseAmountHistogram.record(amount, { currency });
}
```

### Phase 4: Monitoring and Alerting

#### Health Check Telemetry

```typescript
// Add to health check endpoint
app.get('/health', async (request, reply) => {
  const span = tracer.startSpan('health_check');

  try {
    // Database health
    await prisma.$queryRaw`SELECT 1`;

    span.setAttributes({
      'health.database': 'ok',
      'health.status': 'healthy',
    });

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        cache: 'ok', // Add other service checks
      },
    };
  } catch (error) {
    span.recordException(error);
    span.setAttributes({
      'health.database': 'error',
      'health.status': 'unhealthy',
    });

    reply.status(503);
    return {
      status: 'unhealthy',
      error: error.message,
    };
  } finally {
    span.end();
  }
});
```

#### Error Tracking

```typescript
// Enhanced error handler with telemetry
export const errorHandler = fp(async function (fastify) {
  fastify.setErrorHandler(async (error, request, reply) => {
    const span = trace.getActiveSpan();

    if (span) {
      span.recordException(error);
      span.setAttributes({
        'error.type': error.constructor.name,
        'error.message': error.message,
        'http.route': request.routeOptions?.url || request.url,
        'http.method': request.method,
      });
    }

    // Log with telemetry context
    fastify.log.error('[ERROR] Request failed', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      traceId: span?.spanContext().traceId,
    });

    reply.status(500).send({
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      traceId: span?.spanContext().traceId, // Include for debugging
    });
  });
});
```

### Implementation Roadmap

1. **Week 1**: Implement ASCII-only logging standards
2. **Week 2**: Set up basic OpenTelemetry with Jaeger (local development)
3. **Week 3**: Add custom spans for critical business operations
4. **Week 4**: Integrate Azure Application Insights for production
5. **Week 5**: Implement custom metrics and monitoring
6. **Week 6**: Set up alerting and dashboards in Azure

### Monitoring Checklist

- [ ] Request/response times for all API endpoints
- [ ] Database query performance
- [ ] Error rates and types
- [ ] User authentication success/failure rates
- [ ] Expense creation and settlement metrics
- [ ] Group activity and user engagement
- [ ] System resource usage (memory, CPU)
- [ ] External service dependencies

## Best Practices

1. **Consistent Formatting**: Always use the standardized log tags
2. **Context Inclusion**: Include relevant business context in logs
3. **Performance Impact**: Monitor telemetry overhead in production
4. **Privacy**: Never log sensitive data (passwords, tokens, personal info)
5. **Sampling**: Use appropriate sampling rates to control volume and cost
6. **Correlation**: Ensure logs and traces can be correlated via trace IDs
7. **Documentation**: Document custom metrics and their business meaning

## Local Development Setup

For local development with telemetry:

```bash
# Start Jaeger with Docker
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 14250:14250 \
  -p 14268:14268 \
  jaegertracing/all-in-one:latest

# Access Jaeger UI at http://localhost:16686
```

This setup provides a solid foundation for observability that will scale from development through production deployment on Azure.
