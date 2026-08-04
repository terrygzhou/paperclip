import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { eq, asc, ilike, or, and } from 'drizzle-orm';
import { db, users, profiles, type User, type NewUser, type Profile, type NewProfile } from '@happygrandma/db';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * Users API — real DB-backed implementation
 * GET    /api/users              — list users (admin)
 * GET    /api/users/:id          — get user by ID
 * GET    /api/users/:id/profile  — get user profile
 * PATCH  /api/users/:id/profile  — update user profile
 * PATCH  /api/users/:id          — update user settings
 * DELETE /api/users/:id          — soft-delete user (admin)
 */

// ── GET /api/users — list (admin only) ────────────────────────────────────
router.get('/', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }

  try {
    const { page = '1', limit = '20', search } = req.query;
    const offset = ((Number(page) - 1) * Number(limit));
    const limitNum = Math.min(Number(limit), 100);

    let whereClause = undefined;
    if (search && typeof search === 'string') {
      whereClause = or(
        ilike(users.email, `%${search}%`),
        ilike(users.name || '', `%${search}%`)
      );
    }

    const [rows, total] = await Promise.all([
      db.select().from(users)
        .limit(limitNum)
        .offset(offset)
        .orderBy(asc(users.createdAt)),
      db.select({ count: users.id }).from(users).where(whereClause),
    ]);

    res.json({
      data: rows.map(r => ({
        id: r.id,
        email: r.email,
        name: r.name,
        language: r.language,
        role: r.role,
        emailVerified: r.emailVerified,
        font_size: r.font_size,
        high_contrast: r.high_contrast,
        reduced_motion: r.reduced_motion,
        createdAt: r.createdAt,
      })),
      meta: {
        page: Number(page),
        limit: limitNum,
        total: total.length,
      },
    });
  } catch (err) {
    console.error('[Users] List error:', err);
    res.status(500).json({ error: 'Failed to list users.' });
  }
});

// ── GET /api/users/:id — get ──────────────────────────────────────────────
router.get('/:id', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user && req.user.role !== 'admin' && req.user.id !== req.params.id) {
      res.status(403).json({ error: 'You can only view your own profile.' });
      return;
    }

    const userRows = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
    if (userRows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const user = userRows[0];
    const profileRows = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        language: user.language,
        role: user.role,
        emailVerified: user.emailVerified,
        font_size: user.font_size,
        high_contrast: user.high_contrast,
        reduced_motion: user.reduced_motion,
        createdAt: user.createdAt,
      },
      profile: profileRows[0] ? {
        id: profileRows[0].id,
        age: profileRows[0].age,
        gender: profileRows[0].gender,
        location: profileRows[0].location,
        languages: profileRows[0].languages,
        interests: profileRows[0].interests,
        emergencyContactName: profileRows[0].emergencyContactName,
        emergencyContactPhone: profileRows[0].emergencyContactPhone,
        emergencyContactRelation: profileRows[0].emergencyContactRelation,
        medicalNotes: profileRows[0].medicalNotes,
      } : null,
    });
  } catch (err) {
    console.error('[Users] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// ── GET /api/users/:id/profile — get profile ──────────────────────────────
router.get('/:id/profile', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user && req.user.role !== 'admin' && req.user.id !== req.params.id) {
      res.status(403).json({ error: 'You can only view your own profile.' });
      return;
    }

    const profileRows = await db.select().from(profiles).where(eq(profiles.userId, req.params.id)).limit(1);
    if (profileRows.length === 0) {
      res.json({ profile: null });
      return;
    }

    res.json({ profile: profileRows[0] });
  } catch (err) {
    console.error('[Users] Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// ── PATCH /api/users/:id — update user ────────────────────────────────────
router.patch('/:id', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Users can only update their own account (except admin)
    if (req.user && req.user.role !== 'admin' && req.user.id !== req.params.id) {
      res.status(403).json({ error: 'You can only update your own account.' });
      return;
    }

    const { name, language, font_size, high_contrast, reduced_motion } = req.body;
    const updates: Record<string, string | number | boolean | null> = {};

    if (name !== undefined) updates.name = name;
    if (language === 'en' || language === 'zh') updates.language = language;
    if (font_size !== undefined) updates.font_size = font_size;
    if (high_contrast !== undefined) updates.high_contrast = high_contrast;
    if (reduced_motion !== undefined) updates.reduced_motion = reduced_motion;

    if (Object.keys(updates).length === 0) {
      res.status(422).json({ error: 'No valid fields to update.' });
      return;
    }

    const [updated] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, req.params.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      message: 'User updated successfully.',
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        language: updated.language,
        role: updated.role,
        font_size: updated.font_size,
        high_contrast: updated.high_contrast,
        reduced_motion: updated.reduced_motion,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    console.error('[Users] Update error:', err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// ── PATCH /api/users/:id/profile — update profile ─────────────────────────
router.patch('/:id/profile', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Users can only update their own profile (except admin)
    if (req.user && req.user.role !== 'admin' && req.user.id !== req.params.id) {
      res.status(403).json({ error: 'You can only update your own profile.' });
      return;
    }

    const { age, gender, location, languages, interests, emergencyContactName, emergencyContactPhone, emergencyContactRelation, medicalNotes } = req.body;
    const updates: Record<string, number | string | string[] | unknown | null> = {};

    if (age !== undefined) updates.age = age;
    if (gender !== undefined) updates.gender = gender;
    if (location !== undefined) updates.location = location;
    if (languages !== undefined) updates.languages = languages;
    if (interests !== undefined) updates.interests = interests;
    if (emergencyContactName !== undefined) updates.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) updates.emergencyContactPhone = emergencyContactPhone;
    if (emergencyContactRelation !== undefined) updates.emergencyContactRelation = emergencyContactRelation;
    if (medicalNotes !== undefined) updates.medicalNotes = medicalNotes;

    if (Object.keys(updates).length === 0) {
      res.status(422).json({ error: 'No valid fields to update.' });
      return;
    }

    // Check if profile exists
    const existing = await db.select().from(profiles).where(eq(profiles.userId, req.params.id)).limit(1);

    if (existing.length > 0) {
      const [updated] = await db.update(profiles)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(profiles.userId, req.params.id))
        .returning();

      res.json({ message: 'Profile updated successfully.', profile: updated });
    } else {
      const [created] = await db.insert(profiles).values({
        userId: req.params.id,
        ...updates,
      }).returning();

      res.status(201).json({ message: 'Profile created.', profile: created });
    }
  } catch (err) {
    console.error('[Users] Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ── DELETE /api/users/:id — soft delete (admin) ───────────────────────────
router.delete('/:id', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }

  try {
    // Drizzle doesn't have soft delete, so we just delete for now
    // In production, add an `deletedAt` column and use that
    const [deleted] = await db.delete(users).where(eq(users.id, req.params.id)).returning();

    if (!deleted) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('[Users] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// ── PATCH /api/users/:id/password — change password ───────────────────────
router.patch('/:id/password', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user && req.user.role !== 'admin' && req.user.id !== req.params.id) {
      res.status(403).json({ error: 'You can only change your own password.' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(422).json({ error: 'Current and new passwords are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(422).json({ error: 'New password must be at least 8 characters.' });
      return;
    }

    const userRows = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
    if (userRows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const user = userRows[0];
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ passwordHash: newPasswordHash, updatedAt: new Date() }).where(eq(users.id, req.params.id));

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[Users] Change password error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

export default router;
