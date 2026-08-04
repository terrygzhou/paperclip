/**
 * HappyGrandma Platform — Express API Entry
 * 
 * Start: pnpm --filter @happygrandma/server dev
 * Dev server: http://localhost:3100
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

// Routes
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import contentRouter from './routes/content';
import subscriptionsRouter from './routes/subscriptions';
import familyRouter from './routes/family';
import commentsRouter from './routes/comments';
import newsletterRouter from './routes/newsletter';
import analyticsRouter from './routes/analytics';
import webhookRouter from './routes/webhook';

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
}));
app.use(rateLimiter);
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    timezone: config.timezone,
  });
});

// ── Routes ─────────────────────────────────────────────────────────────────
// Auth routes (public)
app.use('/api/auth', authRouter);

// User management (requires auth)
app.use('/api/users', authMiddleware(), usersRouter);

// Content delivery (public)
app.use('/api/content', contentRouter);

// Subscription management (requires auth)
app.use('/api/subscriptions', authMiddleware(), subscriptionsRouter);

// Family management (requires auth)
app.use('/api/family', authMiddleware(), familyRouter);

// Comments (public list, auth for create)
app.use('/api/comments', commentsRouter);

// Newsletter (public subscribe)
app.use('/api/newsletter', newsletterRouter);

// Analytics (requires auth)
app.use('/api/analytics', authMiddleware(), analyticsRouter);

// Directus webhooks (no auth — verified by signature)
app.use('/api/webhooks/directus', webhookRouter);

// ── Error Handling ─────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`HappyGrandma API running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Timezone: ${config.timezone}`);
});

export default app;
