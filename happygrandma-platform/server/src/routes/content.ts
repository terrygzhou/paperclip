import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Content API — articles, activities, guides, videos
 * GET    /api/content                 — list content items (with filtering)
 * GET    /api/content/categories      — list content categories
 * GET    /api/content/:id             — get content item by ID
 * GET    /api/content/search          — search content (bilingual)
 * POST   /api/content                 — create content (admin)
 * PATCH  /api/content/:id             — update content (admin)
 * DELETE /api/content/:id             — archive content (admin)
 */

// GET /api/content — list with filters (type, category, status, language)
router.get('/', async (req: Request, res: Response) => {
  const { type, category, language, status, featured, page = '1', limit = '20' } = req.query;
  // TODO: query DB with filters and pagination
  res.json({
    data: [],
    meta: { page: Number(page), limit: Number(limit), total: 0 },
  });
});

// GET /api/content/categories — list categories (tree structure)
router.get('/categories', async (_req: Request, res: Response) => {
  // TODO: query contentCategories table
  res.json({ data: [] });
});

// GET /api/content/:id — get by ID
router.get('/:id', async (req: Request, res: Response) => {
  // TODO: fetch by ID, increment viewCount
  res.json({
    id: req.params.id,
    titleZn: '示例文章',
    titleEn: 'Sample Article',
    type: 'article',
    status: 'published',
    viewCount: 0,
  });
});

// GET /api/content/search — bilingual search
router.get('/search', async (req: Request, res: Response) => {
  const { q, language } = req.query;
  if (!q) {
    res.status(422).json({ error: 'Search query "q" is required' });
    return;
  }
  // TODO: full-text search on titleZn/titleEn + excerptZn/excerptEn
  res.json({ query: q, data: [], meta: { total: 0 } });
});

// POST /api/content — create (admin only)
router.post('/', async (req: Request, res: Response) => {
  const { titleZn, titleEn, bodyZn, bodyEn, type, categoryId, status } = req.body;
  if (!titleZn || !titleEn || !type) {
    res.status(422).json({ error: 'titleZn, titleEn, and type are required' });
    return;
  }
  // TODO: insert into contentItems
  res.status(201).json({ message: 'Content created', id: 'stub-id' });
});

// PATCH /api/content/:id — update
router.patch('/:id', async (req: Request, res: Response) => {
  const updates = req.body;
  res.json({ id: req.params.id, ...updates, updatedAt: new Date().toISOString() });
});

export default router;
