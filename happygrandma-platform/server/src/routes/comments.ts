import { Router, Request, Response } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * Comments API — content engagement with moderation
 * GET    /api/comments/:contentItemId    — list comments for content
 * POST   /api/comments                   — post comment
 * POST   /api/comments/:id/report        — report comment
 * PATCH  /api/comments/:id               — update/delete (admin/moderator)
 */

// GET /api/comments/:contentItemId — list
router.get('/:contentItemId', async (req: Request, res: Response) => {
  // TODO: query comments by contentItemId, status='approved'
  res.json({ data: [] });
});

// POST /api/comments — create (with moderation)
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const { contentItemId, body } = req.body;
  if (!contentItemId || !body) {
    res.status(422).json({ error: 'contentItemId and body are required' });
    return;
  }
  // TODO: create comment, default status='pending'
  res.status(201).json({ 
    message: 'Comment created (pending approval)',
    data: { contentItemId, body, status: 'pending' },
  });
});

// POST /api/comments/:id/report — report
router.post('/:id/report', async (req: AuthenticatedRequest, res: Response) => {
  // TODO: set reported=true
  res.json({ message: 'Comment reported for review' });
});

export default router;
