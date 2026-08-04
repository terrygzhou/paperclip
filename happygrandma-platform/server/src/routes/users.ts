import { Router } from 'express';
import { authMiddleware, type AuthRequest, type AuthUser } from '../middleware/auth';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/**
 * Users API — registration, login, profile management
 * GET    /api/users              — list users (admin)
 * GET    /api/users/:id          — get user by ID
 * POST   /api/users              — register new user
 * PATCH  /api/users/:id          — update user profile
 * DELETE /api/users/:id          — soft-delete user (admin)
 */

// POST /api/users — register
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, passwordHash, name, language } = req.body;
    if (!email || !passwordHash) {
      res.status(422).json({ error: 'email and passwordHash are required' });
      return;
    }
    // TODO: hash password, create user, return token
    res.status(201).json({ 
      message: 'User registered',
      user: { id: 'stub', email, name, language: language || 'zh' },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users — list (admin)
router.get('/', async (_req: AuthenticatedRequest, res: Response) => {
  // TODO: fetch users from DB
  res.json({ data: [], meta: { total: 0 } });
});

// GET /api/users/:id — get
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  // TODO: fetch user by ID
  res.json({ id: req.params.id, email: 'dev@happygrandma.local', role: 'admin' });
});

// PATCH /api/users/:id — update
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const updates = req.body;
  // TODO: validate and update user in DB
  res.json({ id: req.params.id, ...updates });
});

export default router;
