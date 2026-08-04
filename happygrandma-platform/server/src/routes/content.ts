import { Router, Request, Response } from 'express';
import { eq, and, or, ilike, like, asc, lt } from 'drizzle-orm';
import { db, contentItems, contentCategories, type ContentItem, type NewContentItem } from '@happygrandma/db';
import { optionalAuthMiddleware, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * Content API — DB-backed with Directus proxy layer
 * GET    /api/content                  — list content (with filters)
 * GET    /api/content/categories       — list categories
 * GET    /api/content/featured         — featured content
 * GET    /api/content/search           — bilingual search
 * GET    /api/content/:id              — get by ID
 * GET    /api/content/directus/:path   — Directus proxy (cache)
 */

// ── GET /api/content — list with filters ──────────────────────────────────
router.get('/', optionalAuthMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, category, language, status, featured, page = '1', limit = '20' } = req.query;
    const offset = ((Number(page) - 1) * Number(limit));
    const limitNum = Math.min(Number(limit), 100);

    // Build where clause
    const conditions: unknown[] = [];

    if (type && typeof type === 'string') {
      conditions.push(eq(contentItems.type, type));
    }
    if (category && typeof category === 'string') {
      conditions.push(eq(contentItems.categoryId, category));
    }
    if (status && typeof status === 'string') {
      conditions.push(eq(contentItems.status, status));
    } else {
      // Default: show published only
      conditions.push(eq(contentItems.status, 'published'));
    }
    if (featured && featured === 'true') {
      conditions.push(eq(contentItems.featured, true));
    }

    // Language: prefer matching, fall back to any
    const lang = (language === 'en' || language === 'zh') ? language : undefined;
    let query;
    if (lang) {
      query = db.select().from(contentItems)
        .where(and(
          ...conditions,
          or(
            eq(contentItems.language, lang),
            eq(contentItems.language, 'zh'), // fallback to Chinese
            eq(contentItems.language, null),
            eq(contentItems.language, undefined),
          )
        ))
        .limit(limitNum)
        .offset(offset)
        .orderBy(asc(contentItems.createdAt));
    } else {
      query = db.select().from(contentItems)
        .where(and(...conditions))
        .limit(limitNum)
        .offset(offset)
        .orderBy(asc(contentItems.createdAt));
    }

    const [rows, totalResult] = await Promise.all([
      query,
      db.select({ count: contentItems.id }).from(contentItems).where(and(...conditions)),
    ]);

    // Inject language resolution info
    const data = rows.map(item => {
      const itemLang = lang && (item.language === lang || item.language === 'zh' || !item.language);
      return {
        id: item.id,
        titleZn: item.titleZn,
        titleEn: item.titleEn,
        excerptZn: item.excerptZn,
        excerptEn: item.excerptEn,
        bodyZn: itemLang ? item.bodyZn : undefined,
        bodyEn: itemLang ? item.bodyEn : undefined,
        type: item.type,
        status: item.status,
        categoryId: item.categoryId,
        featured: item.featured,
        language: item.language || lang || 'zh',
        imageUrl: item.imageUrl,
        viewCount: item.viewCount,
        publishedAt: item.publishedAt,
        createdAt: item.createdAt,
      };
    });

    res.json({
      data,
      meta: { page: Number(page), limit: limitNum, total: totalResult.length },
      language: lang || 'zh',
    });
  } catch (err) {
    console.error('[Content] List error:', err);
    res.status(500).json({ error: 'Failed to list content.' });
  }
});

// ── GET /api/content/categories — list categories ─────────────────────────
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const rows = await db.select()
      .from(contentCategories)
      .where(eq(contentCategories.isActive, true))
      .orderBy(asc(contentCategories.sortOrder));

    res.json({
      data: rows.map(r => ({
        id: r.id,
        nameZn: r.nameZn,
        nameEn: r.nameEn,
        slugZn: r.slugZn,
        slugEn: r.slugEn,
        parentId: r.parentId,
        descriptionZn: r.descriptionZn,
        descriptionEn: r.descriptionEn,
        sortOrder: r.sortOrder,
      })),
    });
  } catch (err) {
    console.error('[Content] Categories error:', err);
    res.status(500).json({ error: 'Failed to list categories.' });
  }
});

// ── GET /api/content/featured — featured content ──────────────────────────
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const { language, limit = '6' } = req.query;
    const lang = (language === 'en' || language === 'zh') ? language : undefined;
    const limitNum = Math.min(Number(limit), 20);

    let query = db.select().from(contentItems)
      .where(and(
        eq(contentItems.featured, true),
        eq(contentItems.status, 'published'),
      ))
      .limit(limitNum);

    if (lang) {
      // Add language condition
      query = db.select().from(contentItems)
        .where(and(
          eq(contentItems.featured, true),
          eq(contentItems.status, 'published'),
          or(
            eq(contentItems.language, lang),
            eq(contentItems.language, 'zh'),
            eq(contentItems.language, null),
            eq(contentItems.language, undefined),
          )
        ))
        .limit(limitNum);
    }

    const rows = await query;

    const data = rows.map(item => ({
      id: item.id,
      titleZn: item.titleZn,
      titleEn: item.titleEn,
      excerptZn: item.excerptZn,
      excerptEn: item.excerptEn,
      type: item.type,
      imageUrl: item.imageUrl,
      featured: item.featured,
      language: item.language || 'zh',
      publishedAt: item.publishedAt,
    }));

    res.json({ data, language: lang || 'zh' });
  } catch (err) {
    console.error('[Content] Featured error:', err);
    res.status(500).json({ error: 'Failed to fetch featured content.' });
  }
});

// ── GET /api/content/search — bilingual search ────────────────────────────
router.get('/search', optionalAuthMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, language, type, limit = '20' } = req.query;
    if (!q || typeof q !== 'string' || !q.trim()) {
      res.status(422).json({ error: 'Search query "q" is required.' });
      return;
    }

    const lang = (language === 'en' || language === 'zh') ? language : undefined;
    const limitNum = Math.min(Number(limit), 50);
    const searchTerm = `%${q}%`;

    // Simple pattern matching — upgrade to pg_trgm/tsvector in production
    const conditions: unknown[] = [
      eq(contentItems.status, 'published'),
      or(
        ilike(contentItems.titleZn, searchTerm),
        ilike(contentItems.titleEn, searchTerm),
        ilike(contentItems.excerptZn, searchTerm),
        ilike(contentItems.excerptEn, searchTerm),
        ilike(contentItems.bodyZn, searchTerm),
        ilike(contentItems.bodyEn, searchTerm),
      ),
    ];

    if (type && typeof type === 'string') {
      conditions.push(eq(contentItems.type, type));
    }

    const rows = await db.select().from(contentItems)
      .where(and(...conditions))
      .limit(limitNum);

    const data = rows.map(item => {
      const itemLang = lang && (item.language === lang || item.language === 'zh' || !item.language);
      return {
        id: item.id,
        titleZn: item.titleZn,
        titleEn: item.titleEn,
        excerptZn: itemLang ? item.excerptZn : undefined,
        excerptEn: itemLang ? item.excerptEn : undefined,
        type: item.type,
        imageUrl: item.imageUrl,
        language: item.language || lang || 'zh',
        publishedAt: item.publishedAt,
      };
    });

    res.json({
      query: q,
      data,
      meta: { total: data.length },
      language: lang || 'zh',
    });
  } catch (err) {
    console.error('[Content] Search error:', err);
    res.status(500).json({ error: 'Search failed.' });
  }
});

// ── GET /api/content/:id — get by ID ──────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(contentItems).where(eq(contentItems.id, req.params.id)).limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Content not found.' });
      return;
    }

    const item = rows[0];

    // Increment view count
    await db.update(contentItems)
      .set({ viewCount: (item.viewCount || 0) + 1 })
      .where(eq(contentItems.id, req.params.id));

    res.json({
      id: item.id,
      titleZn: item.titleZn,
      titleEn: item.titleEn,
      excerptZn: item.excerptZn,
      excerptEn: item.excerptEn,
      bodyZn: item.bodyZn,
      bodyEn: item.bodyEn,
      type: item.type,
      status: item.status,
      categoryId: item.categoryId,
      featured: item.featured,
      language: item.language || 'zh',
      imageUrl: item.imageUrl,
      viewCount: (item.viewCount || 0) + 1,
      publishedAt: item.publishedAt,
      createdAt: item.createdAt,
      seoTitleZn: item.seoTitleZn,
      seoTitleEn: item.seoTitleEn,
      seoDescriptionZn: item.seoDescriptionZn,
      seoDescriptionEn: item.seoDescriptionEn,
      seoKeywordsZn: item.seoKeywordsZn,
      seoKeywordsEn: item.seoKeywordsEn,
    });
  } catch (err) {
    console.error('[Content] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch content.' });
  }
});

// ── GET /api/content/directus/:path — Directus proxy ──────────────────────
// Falls back to local DB when Directus is not configured.
router.get('/directus/:path(*)', async (req: Request, res: Response) => {
  try {
    const directusUrl = process.env.DIRECTUS_URL;

    if (!directusUrl) {
      // Return local DB data as fallback
      const { collection, id } = req.params;
      // Simplified: always return featured content for /directus/entries
      const rows = await db.select().from(contentItems)
        .where(and(
          eq(contentItems.featured, true),
          eq(contentItems.status, 'published'),
        ))
        .limit(10);

      const data = rows.map(item => ({
        id: item.id,
        title: item.titleEn,
        type: item.type,
        status: item.status,
        publishedAt: item.publishedAt,
      }));

      res.json({ data, _local: true });
      return;
    }

    // Forward request to Directus
    const directusToken = process.env.DIRECTUS_ADMIN_TOKEN || process.env.DIRECTUS_API_TOKEN;
    const targetUrl = `${directusUrl}/api/v1/${req.params.path}`;

    try {
      const resp = await fetch(targetUrl, {
        headers: {
          'Accept': 'application/json',
          ...(directusToken ? { Authorization: `Bearer ${directusToken}` } : {}),
        },
      });

      if (!resp.ok) {
        const body = await resp.text().catch(() => '');
        res.status(resp.status).json({ error: `Directus error: ${resp.status}`, details: body });
        return;
      }

      const data = await resp.json();
      res.json(data);
    } catch (fetchErr) {
      // Directus unavailable — fallback to local DB
      console.warn('[Content] Directus unavailable, using local fallback:', fetchErr);
      res.json({ data: [], _local: true, _fallback: true });
    }
  } catch (err) {
    console.error('[Content] Directus proxy error:', err);
    res.status(500).json({ error: 'Directus proxy failed.' });
  }
});

export default router;
