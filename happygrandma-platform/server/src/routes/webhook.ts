import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db, contentItems, contentCategories } from '@happygrandma/db';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * Directus Webhook Receiver
 * Validates Directus webhook signatures and handles cache invalidation.
 * Directus sends webhooks on content create/update/delete.
 * 
 * Expected events: directus.events.listen('items.create', 'items.update', 'items.delete')
 */

/**
 * Verify Directus webhook signature.
 * Directus sends the signature in the X-Directus-Signature header (HMAC-SHA256).
 */
function verifySignature(payload: string, signature: string | undefined): boolean {
  const secret = process.env.DIRECTUS_WEBHOOK_SECRET || '';
  if (!secret) {
    // Dev mode: skip verification
    return true;
  }

  if (!signature) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Parse raw body for signature verification
function parseWebhookBody(req: Request): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: string) => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

interface WebhookPayload {
  event: string;
  collection: string;
  id?: string | string[];
  data?: Record<string, unknown>;
  timestamp: string;
}

// In-memory cache for content items (replace with Redis in production)
const contentCache: Record<string, { etag: string; updatedAt: number }> = {};

/**
 * POST /api/webhooks/directus — Receive and process Directus webhooks
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const rawBody = await parseWebhookBody(req);
    const signature = req.headers['x-directus-signature'] as string | undefined;
    const eventHeader = req.headers['x-directus-event'] as string | undefined;

    // Verify signature
    if (!verifySignature(rawBody, signature)) {
      res.status(403).json({ error: 'Invalid webhook signature.' });
      return;
    }

    let payload: WebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      res.status(400).json({ error: 'Invalid JSON payload.' });
      return;
    }

    const { event, collection, id, data } = payload;
    const eventType = event || eventHeader;

    // Log the webhook event
    console.log(`[Webhook] ${eventType} on ${collection}`, id, data);

    // Handle content items updates
    if (collection === 'content_items' && id) {
      const itemId = typeof id === 'string' ? id : id[0];
      const etag = crypto.createHash('md5').update(`${itemId}-${Date.now()}`).digest('hex');

      if (eventType === 'items.delete') {
        // Invalidate cache on delete
        delete contentCache[itemId];
        console.log(`[Webhook] Invalidated cache for content item ${itemId}`);
      } else {
        // Update cache on create/update
        contentCache[itemId] = {
          etag,
          updatedAt: Date.now(),
        };
        console.log(`[Webhook] Updated cache for content item ${itemId}`);
      }
    }

    // Handle category updates
    if (collection === 'content_categories' && id) {
      const catId = typeof id === 'string' ? id : id[0];
      if (eventType === 'items.delete') {
        // Invalidate all content cache since categories changed
        Object.keys(contentCache).forEach(k => delete contentCache[k]);
        console.log('[Webhook] Full cache invalidation due to category deletion');
      } else {
        contentCache[catId] = {
          etag: crypto.createHash('md5').update(`${catId}-${Date.now()}`).digest('hex'),
          updatedAt: Date.now(),
        };
      }
    }

    res.json({ received: true, event: eventType, collection, id });
  } catch (err) {
    console.error('[Webhook] Error:', err);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

/**
 * GET /api/webhooks/directus/cache/status — Check cache status
 */
router.get('/cache/status', (_req: Request, res: Response) => {
  res.json({
    cacheSize: Object.keys(contentCache).length,
    entries: Object.entries(contentCache).map(([id, data]) => ({ id, ...data })),
  });
});

/**
 * POST /api/webhooks/directus/cache/clear — Force clear cache
 */
router.post('/cache/clear', (_req: Request, res: Response) => {
  Object.keys(contentCache).forEach(k => delete contentCache[k]);
  console.log('[Webhook] Full cache cleared');
  res.json({ message: 'Cache cleared.', size: 0 });
});

export default router;
