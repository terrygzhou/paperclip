import rateLimit from 'express-rate-limit';
import { config } from '../config';

/**
 * Rate limiter for API endpoints
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
