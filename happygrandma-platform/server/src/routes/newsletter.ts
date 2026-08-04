import { Router, Request, Response } from 'express';
import { eq, and, ilike, asc } from 'drizzle-orm';
import { db, newsletterSubscriptions, type NewNewsletterSubscription } from '@happygrandma/db';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * Newsletter API — DB-backed email preference management
 * GET    /api/newsletter                      — list subscribers (admin)
 * POST   /api/newsletter                      — subscribe
 * POST   /api/newsletter/:email/unsubscribe   — unsubscribe
 * PATCH  /api/newsletter/:email               — update preferences
 */

// ── POST /api/newsletter — subscribe ──────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, frequency, topics, language, source } = req.body;
    if (!email) {
      res.status(422).json({ error: 'email is required.' });
      return;
    }

    const lang = (language === 'en' || language === 'zh') ? language : 'zh';
    const freq = ['daily', 'weekly', 'biweekly'].includes(frequency) ? frequency : 'weekly';
    const top = Array.isArray(topics) ? topics : [];

    // Check if already subscribed
    const existing = await db.select().from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, email))
      .limit(1);

    if (existing.length > 0 && existing[0].status === 'subscribed') {
      res.status(409).json({ error: 'Email already subscribed.' });
      return;
    }

    const [created] = await db.insert(newsletterSubscriptions).values({
      email,
      status: 'subscribed',
      frequency: freq,
      topics: top,
      language: lang,
      source: source || 'web',
    }).returning();

    res.status(201).json({
      message: 'Successfully subscribed.',
      data: {
        id: created.id,
        email: created.email,
        frequency: created.frequency,
        topics: created.topics,
        language: created.language,
        source: created.source,
      },
    });
  } catch (err) {
    console.error('[Newsletter] Subscribe error:', err);
    res.status(500).json({ error: 'Failed to subscribe.' });
  }
});

// ── GET /api/newsletter — list (admin) ────────────────────────────────────
router.get('/', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }

  try {
    const { status, language, email, page = '1', limit = '50' } = req.query;
    const conditions: unknown[] = [];

    if (status && typeof status === 'string') conditions.push(eq(newsletterSubscriptions.status, status));
    if (language && typeof language === 'string') conditions.push(eq(newsletterSubscriptions.language, language));
    if (email && typeof email === 'string') conditions.push(ilike(newsletterSubscriptions.email, `%${email}%`));

    const rows = await db.select()
      .from(newsletterSubscriptions)
      .where(and(...conditions))
      .orderBy(asc(newsletterSubscriptions.createdAt))
      .limit(Math.min(Number(limit), 200));

    res.json({ data: rows, meta: { total: rows.length } });
  } catch (err) {
    console.error('[Newsletter] List error:', err);
    res.status(500).json({ error: 'Failed to list subscribers.' });
  }
});

// ── POST /api/newsletter/:email/unsubscribe ────────────────────────────────
router.post('/:email/unsubscribe', async (req: Request, res: Response) => {
  try {
    const [updated] = await db.update(newsletterSubscriptions)
      .set({ status: 'unsubscribed', unsubscribedAt: new Date() })
      .where(eq(newsletterSubscriptions.email, req.params.email))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'No subscription found for this email.' });
      return;
    }

    res.json({ message: 'Unsubscribed successfully.', email: req.params.email });
  } catch (err) {
    console.error('[Newsletter] Unsubscribe error:', err);
    res.status(500).json({ error: 'Failed to unsubscribe.' });
  }
});

// ── PATCH /api/newsletter/:email — update ──────────────────────────────────
router.patch('/:email', async (req: Request, res: Response) => {
  try {
    const { frequency, topics, language } = req.body;
    const updates: Record<string, string | string[] | unknown> = {};

    if (frequency && ['daily', 'weekly', 'biweekly'].includes(frequency)) updates.frequency = frequency;
    if (topics && Array.isArray(topics)) updates.topics = topics;
    if (language === 'en' || language === 'zh') updates.language = language;

    if (Object.keys(updates).length === 0) {
      res.status(422).json({ error: 'No valid fields to update.' });
      return;
    }

    const [updated] = await db.update(newsletterSubscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(newsletterSubscriptions.email, req.params.email))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Subscription not found.' });
      return;
    }

    res.json({ message: 'Preferences updated.', data: updated });
  } catch (err) {
    console.error('[Newsletter] Update error:', err);
    res.status(500).json({ error: 'Failed to update preferences.' });
  }
});

export default router;
