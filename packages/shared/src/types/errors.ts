export interface AppError extends Error {
  code: string;
  httpStatus: number;
  details?: Record<string, unknown>;
}

export class ValidationError extends Error implements AppError {
  code = 'VALIDATION_ERROR';
  httpStatus = 400;

  constructor(
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error implements AppError {
  code = 'NOT_FOUND';
  httpStatus = 404;

  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error implements AppError {
  code = 'UNAUTHORIZED';
  httpStatus = 401;

  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error implements AppError {
  code = 'FORBIDDEN';
  httpStatus = 403;

  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}