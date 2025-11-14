import { FastifyInstance, FastifyError } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '@group-pay/shared';

async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler(
    (error: FastifyError & Partial<AppError>, request, reply) => {
      // Don't log expected authentication errors as errors (they're normal)
      // Log them at debug level instead to reduce noise
      const isExpectedAuthError =
        error.httpStatus === 401 &&
        (error.code === 'UNAUTHORIZED' || error.message.includes('expired'));

      if (isExpectedAuthError) {
        fastify.log.debug({
          msg: 'Authentication failed (expected)',
          code: error.code,
          message: error.message,
          path: request.routerPath || request.url,
          method: request.method,
        });
      } else {
        // Log actual errors
        fastify.log.error({
          msg: 'Request error',
          error: error.message,
          code: error.code,
          httpStatus: error.httpStatus,
          path: request.routerPath || request.url,
          method: request.method,
          stack: error.stack,
        });
      }

      // Handle validation errors
      if (error.validation) {
        return reply.status(400).send({
          error: 'Validation Error',
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.validation,
        });
      }

      // Handle custom app errors
      if (error.httpStatus && error.code) {
        return reply.status(error.httpStatus).send({
          error: error.name || 'Application Error',
          code: error.code,
          message: error.message,
          details: error.details,
        });
      }

      // Handle Fastify HTTP errors
      if (error.statusCode) {
        return reply.status(error.statusCode).send({
          error: error.name || 'HTTP Error',
          code: error.code || 'HTTP_ERROR',
          message: error.message,
        });
      }

      // Handle unknown errors
      return reply.status(500).send({
        error: 'Internal Server Error',
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      });
    }
  );
}

export default fp(errorHandlerPlugin, {
  name: 'errorHandler',
});
