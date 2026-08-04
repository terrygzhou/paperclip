import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for validation failures (422)
 */
export class RequestValidationError extends Error {
  public statusCode: number;
  public errors: string[];

  constructor(message: string, errors: string[]) {
    super(message);
    this.statusCode = 422;
    this.errors = errors;
    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }
}

/**
 * Error handler middleware — must be last middleware in Express chain
 */
export function errorHandler(
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = err.status || 500;
  const message = status === 500 ? 'Internal Server Error' : err.message || 'Unknown error';
  
  // Log full error for debugging (not the message)
  if (status === 500) {
    console.error(`[ERROR] ${err.name}:`, err);
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
