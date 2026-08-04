import { Router, Request, Response } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware());

/**
 * Family API — multi-account family sharing
 * GET    /api/family/invitations         — list pending invitations
 * POST   /api/family/invitations         — send invitation
 * POST   /api/family/invitations/:id/accept — accept invitation
 * DELETE /api/family/:memberId           — remove family member
 */

// GET /api/family/invitations
router.get('/invitations', async (req: AuthenticatedRequest, res: Response) => {
  // TODO: query familyMembers where memberUserId=currentUser and acceptedAt=null
  res.json({ data: [] });
});

// POST /api/family/invitations — send invite
router.post('/invitations', async (req: AuthenticatedRequest, res: Response) => {
  const { email, relationship } = req.body;
  if (!email || !relationship) {
    res.status(422).json({ error: 'email and relationship are required' });
    return;
  }
  // TODO: create invitation, send email
  res.status(201).json({ message: 'Invitation sent', email });
});

// POST /api/family/invitations/:id/accept — accept
router.post('/invitations/:id/accept', async (req: AuthenticatedRequest, res: Response) => {
  // TODO: update familyMembers, set acceptedAt
  res.json({ message: 'Invitation accepted' });
});

export default router;
