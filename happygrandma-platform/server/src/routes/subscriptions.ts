import { Router, Request, Response } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware());

/**
 * Subscriptions API — Stripe-synced subscription management
 * GET    /api/subscriptions                — get current subscription
 * GET    /api/subscriptions/plans          — list available plans
 * POST   /api/subscriptions/checkout       — create Stripe checkout session
 * POST   /api/subscriptions/cancel         — cancel subscription (soft)
 */

// GET /api/subscriptions — get current
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  // TODO: fetch from subscriptions table
  res.json({
    hasSubscription: false,
    status: null,
  });
});

// GET /api/subscriptions/plans — list
router.get('/plans', async (_req: Request, res: Response) => {
  // TODO: fetch from DB or Stripe API
  res.json({
    data: [
      { id: 'free', name: 'Free', priceCents: 0, features: ['basic content'] },
      { id: 'premium', name: 'Premium', priceCents: 990, features: ['all content', 'family sharing', 'priority support'] },
    ],
  });
});

// POST /api/subscriptions/checkout — create Stripe session
router.post('/checkout', async (req: AuthenticatedRequest, res: Response) => {
  const { planId } = req.body;
  if (!planId) {
    res.status(422).json({ error: 'planId is required' });
    return;
  }
  // TODO: create Stripe checkout session
  res.status(201).json({ sessionId: 'stub-stripe-session' });
});

// POST /api/subscriptions/cancel — soft cancel
router.post('/cancel', async (req: AuthenticatedRequest, res: Response) => {
  // TODO: set cancelAtPeriodEnd=true in Stripe + DB
  res.json({ message: 'Subscription will be cancelled at period end' });
});

export default router;
