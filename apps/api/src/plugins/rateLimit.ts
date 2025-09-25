import { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';

interface RateLimitContext {
  ttl: number;
}

async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    max: 100, // 100 requests
    timeWindow: '1 minute',
    errorResponseBuilder: (
      request: FastifyRequest,
      context: RateLimitContext
    ) => ({
      code: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`,
      retryAfter: Math.round(context.ttl / 1000),
    }),
  });
}

export default fp(rateLimitPlugin, {
  name: 'rateLimit',
});
