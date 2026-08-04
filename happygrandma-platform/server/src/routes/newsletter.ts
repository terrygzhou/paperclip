import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Newsletter API — email preference management
 * GET    /api/newsletter                     — list user newsletter prefs
 * POST   /api/newsletter                     — subscribe
 * POST   /api/newsletter/:id/unsubscribe     — unsubscribe
 * PATCH  /api/newsletter/:id                 — update preferences
 */

// POST /api/newsletter — subscribe
router.post('/', async (req: Request, res: Response) => {
  const { email, frequency, topics, language, source } = req.body;
  if (!email) {
    res.status(422).json({ error: 'email is required' });
    return;
  }
  // TODO: create/update newsletterSubscriptions in DB
  res.status(201).json({ 
    message: 'Successfully subscribed',
    data: { email, frequency: frequency || 'weekly', language: language || 'zh' },
  });
});

// GET /api/newsletter — list (admin)
router.get('/', async (req: Request, res: Response) => {
  const { status, language, email } = req.query;
  // TODO: filter and list from DB
  res.json({ data: [] });
});

// POST /api/newsletter/:email/unsubscribe — unsubscribe
router.post('/:email/unsubscribe', async (req: Request, res: Response) => {
  // TODO: set status='unsubscribed' in DB
  res.json({ message: 'Unsubscribed successfully', email: req.params.email });
});

// PATCH /api/newsletter/:email — update
router.patch('/:email', async (req: Request, res: Response) => {
  const updates = req.body;
  res.json({ message: 'Preferences updated', email: req.params.email, ...updates });
});

export default router;
