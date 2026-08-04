import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '@happygrandma/db';
import { users, type User } from '@happygrandma/db';
import { eq } from 'drizzle-orm';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user' | 'family_admin';
  language?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name?: string;
  language?: string;
}

/**
 * Parse Authorization header and validate JWT.
 * Returns (req: AuthenticatedRequest) => void middleware factory.
 * In dev mode, accepts X-Dev-User header as a bypass for frontend development.
 */
export function authMiddleware() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Dev bypass: allow frontend dev with X-Dev-User header
    const devUser = (req as Request).headers['x-dev-user'];
    if (config.nodeEnv === 'development' && devUser) {
      req.user = {
        id: 'dev-user-000',
        email: 'dev@happygrandma.local',
        name: 'Dev User',
        role: 'admin',
        language: 'zh',
      };
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
      return;
    }

    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      // Refresh: verify user still exists and email is verified
      const userRow = await db.select().from(users).where(eq(users.id, decoded.sub)).limit(1);
      if (userRow.length === 0 || !userRow[0].emailVerified) {
        res.status(401).json({ error: 'Account not found or email not verified.' });
        return;
      }

      req.user = {
        id: userRow[0].id,
        email: userRow[0].email,
        name: userRow[0].name || undefined,
        role: userRow[0].role as 'admin' | 'user' | 'family_admin',
        language: userRow[0].language || 'zh',
      };
      return next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired token.' });
      return;
    }
  };
}

/**
 * Optional auth middleware — sets req.user if token valid, proceeds otherwise.
 */
export function optionalAuthMiddleware() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Dev bypass: allow frontend dev with X-Dev-User header
    const devUser = (req as Request).headers['x-dev-user'];
    if (config.nodeEnv === 'development' && devUser) {
      req.user = {
        id: 'dev-user-000',
        email: 'dev@happygrandma.local',
        name: 'Dev User',
        role: 'user',
        language: 'zh',
      };
      return next();
    }

    const authHeader = (req as Request).headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        const userRow = await db.select().from(users).where(eq(users.id, decoded.sub)).limit(1);
        if (userRow.length > 0) {
          req.user = {
            id: userRow[0].id,
            email: userRow[0].email,
            name: userRow[0].name || undefined,
            role: userRow[0].role as 'admin' | 'user' | 'family_admin',
            language: userRow[0].language || 'zh',
          };
        }
      } catch {
        // Token invalid — proceed unauthenticated
      }
    }
    return next();
  };
}

/**
 * Admin-only middleware
 */
export function adminOnly() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required.' });
      return;
    }
    return next();
  };
}
