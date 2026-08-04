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
import usersRouter from './routes/users';
import contentRouter from './routes/content';
import subscriptionsRouter from './routes/subscriptions';
import familyRouter from './routes/family';
import commentsRouter from './routes/comments';
import newsletterRouter from './routes/newsletter';
import analyticsRouter from './routes/analytics';

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
app.use('/api/users', authMiddleware(), usersRouter);
app.use('/api/content', contentRouter);
app.use('/api/subscriptions', authMiddleware(), subscriptionsRouter);
app.use('/api/family', authMiddleware(), familyRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/analytics', authMiddleware(), analyticsRouter);

// ── Error Handling ─────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`HappyGrandma API running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Timezone: ${config.timezone}`);
});

export default app;
