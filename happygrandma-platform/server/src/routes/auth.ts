import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db, users, profiles, activityLogs } from '@happygrandma/db';
import { config } from '../config';

const router = Router();

// Rate limiters: 5 req/min on auth, 3/min on password reset
const authLimiter = require('express-rate-limit')({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.ip,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});
const passwordResetLimiter = require('express-rate-limit')({
  windowMs: 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.ip,
  message: { error: 'Too many password reset requests. Please try again later.' },
});

// In-memory token store for email verification and password reset (replace with Redis in prod)
const verificationTokens: Record<string, { userId: string; expires: number }> = {};
const resetTokens: Record<string, { userId: string; expires: number }> = {};

/**
 * POST /api/auth/register — Register new user
 * Body: { email, password, name?, language? }
 */
router.post('/register', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, language } = req.body;
    if (!email || !password) {
      res.status(422).json({ error: 'Email and password are required.' });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(422).json({ error: 'Invalid email format.' });
      return;
    }

    // Validate password strength (min 8 chars)
    if (password.length < 8) {
      res.status(422).json({ error: 'Password must be at least 8 characters.' });
      return;
    }

    const lang = (language === 'en' || language === 'zh') ? language : 'zh';

    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name: name || undefined,
        language: lang,
        role: 'user',
        font_size: 18,
        high_contrast: true,
        reduced_motion: false,
      })
      .returning();

    const user = newUser[0];

    // Generate verification token (expiring in 24h)
    const verifyToken = crypto.randomBytes(32).toString('hex');
    verificationTokens[verifyToken] = { userId: user.id, expires: Date.now() + 24 * 60 * 60 * 1000 };

    // TODO: Send verification email (integrate with email provider like SendGrid)
    // For now, return the token for development
    if (config.nodeEnv === 'development') {
      console.log(`[DEV] Verification token for ${email}: ${verifyToken}`);
    }

    // Log activity
    await db.insert(activityLogs).values({
      userId: user.id,
      type: 'login',
      data: { action: 'registered', email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null,
    });

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        language: user.language,
        emailVerified: false,
      },
      verificationToken: config.nodeEnv === 'development' ? verifyToken : undefined,
    });
  } catch (err) {
    console.error('[Auth] Registration error:', err);
    next(err);
  }
});

/**
 * POST /api/auth/verify-email — Verify email with token
 * Body: { token }
 */
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(422).json({ error: 'Verification token is required.' });
      return;
    }

    const stored = verificationTokens[token];
    if (!stored || stored.expires < Date.now()) {
      res.status(410).json({ error: 'Verification token has expired.' });
      return;
    }

    await db.update(users).set({ emailVerified: true }).where(eq(users.id, stored.userId));
    delete verificationTokens[token];

    res.json({ message: 'Email verified successfully.' });
  } catch (err) {
    console.error('[Auth] Verify email error:', err);
    next(err);
  }
});

/**
 * POST /api/auth/login — Login with email/password
 * Body: { email, password }
 */
router.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(422).json({ error: 'Email and password are required.' });
      return;
    }

    const userRow = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (userRow.length === 0) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = userRow[0];

    if (!user.emailVerified) {
      res.status(403).json({ error: 'Please verify your email before logging in.' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Generate JWTs
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name: user.name, language: user.language },
      config.jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Log activity
    await db.insert(activityLogs).values({
      userId: user.id,
      type: 'login',
      data: { email, ip: req.ip },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null,
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        language: user.language,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    next(err);
  }
});

/**
 * POST /api/auth/refresh — Refresh access token
 * Body: { refreshToken }
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(422).json({ error: 'Refresh token is required.' });
      return;
    }

    let decoded: { sub: string; type: string };
    try {
      decoded = jwt.verify(refreshToken, config.jwtSecret) as { sub: string; type: string };
    } catch {
      res.status(401).json({ error: 'Invalid refresh token.' });
      return;
    }

    if (decoded.type !== 'refresh') {
      res.status(401).json({ error: 'Invalid token type.' });
      return;
    }

    const userRow = await db.select().from(users).where(eq(users.id, decoded.sub)).limit(1);
    if (userRow.length === 0 || !userRow[0].emailVerified) {
      res.status(401).json({ error: 'Account not found or not verified.' });
      return;
    }

    const user = userRow[0];

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name: user.name, language: user.language },
      config.jwtSecret,
      { expiresIn: '15m' }
    );

    res.json({ accessToken });
  } catch (err) {
    console.error('[Auth] Refresh error:', err);
    next(err);
  }
});

/**
 * POST /api/auth/forgot-password — Request password reset
 * Body: { email }
 */
router.post('/forgot-password', passwordResetLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(422).json({ error: 'Email is required.' });
      return;
    }

    const userRow = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (userRow.length === 0) {
      // Don't reveal if user exists
      res.json({ message: 'If the email exists, a reset link has been sent.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    resetTokens[resetToken] = { userId: userRow[0].id, expires: Date.now() + 60 * 60 * 1000 }; // 1 hour

    // TODO: Send reset email with link
    if (config.nodeEnv === 'development') {
      console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);
    }

    res.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[Auth] Forgot password error:', err);
    next(err);
  }
});

/**
 * POST /api/auth/reset-password — Reset password with token
 * Body: { token, password }
 */
router.post('/reset-password', passwordResetLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(422).json({ error: 'Token and new password are required.' });
      return;
    }

    if (password.length < 8) {
      res.status(422).json({ error: 'Password must be at least 8 characters.' });
      return;
    }

    const stored = resetTokens[token];
    if (!stored || stored.expires < Date.now()) {
      res.status(410).json({ error: 'Reset token has expired.' });
      return;
    }

    const newPasswordHash = await bcrypt.hash(password, 12);
    await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, stored.userId));
    delete resetTokens[token];

    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    console.error('[Auth] Reset password error:', err);
    next(err);
  }
});

/**
 * POST /api/auth/logout — Invalidate refresh token (client-side clear)
 * Body: { refreshToken }
 */
router.post('/logout', async (req: Request, res: Response) => {
  // In production with Redis, invalidate the refresh token here
  res.json({ message: 'Logged out successfully.' });
});

export default router;
