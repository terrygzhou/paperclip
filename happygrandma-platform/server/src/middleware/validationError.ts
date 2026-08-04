/**
 * Custom validation error for HTTP 422 responses
 */
export class RequestValidationError extends Error {
  public statusCode: number = 422;
  public errors: string[];

  constructor(message: string, errors: string[]) {
    super(message);
    this.errors = errors;
    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }
}
