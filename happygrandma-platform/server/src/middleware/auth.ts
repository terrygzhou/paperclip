import { Request, Response, NextFunction } from 'express';
import { RequestValidationError } from './validationError';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'family_admin';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/**
 * Auth middleware — validates the X-API-Key or Authorization: Bearer header.
 * In production this would validate JWT tokens. Currently stubbed for scaffold.
 */
export function authMiddleware() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Stub: accept all requests during development
    // In production: extract and validate JWT/API key here
    req.user = {
      id: 'dev-user-000',
      email: 'dev@happygrandma.local',
      role: 'admin',
    };
    return next();
  };
}
