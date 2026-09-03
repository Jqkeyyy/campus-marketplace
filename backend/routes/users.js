const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authCookieOptions, clearAuthCookieOptions, jwtOptions } = require('../config/auth');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { authLimiter, registrationLimiter } = require('../middleware/rateLimits');
const {
  makeVerificationToken,
  hashVerificationToken,
  sendVerificationEmail,
} = require('../services/email');

const router = express.Router();
const VERIFICATION_MESSAGE = 'If the address is eligible, a verification email will arrive shortly.';

const getValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
};

router.post('/register', registrationLimiter, [
  body('email').isEmail().normalizeEmail().isLength({ max: 254 }).custom((value) => {
    if (!value.endsWith('@uww.edu')) {
      throw new Error('Email must be a valid @uww.edu address');
    }
    return true;
  }),
  body('display_name').trim().isLength({ min: 2, max: 100 }),
  body('phone').trim().optional({ checkFalsy: true }).isMobilePhone(),
  body('password')
    .isLength({ min: 12, max: 72 })
    .withMessage('Password must be between 12 and 72 characters'),
], async (req, res) => {
  if (getValidationErrors(req, res)) return;

  const { email, display_name, phone, password } = req.body;

  try {
    const existing = await db.query('SELECT "UserID" FROM "User" WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(202).json({ message: VERIFICATION_MESSAGE });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verification = makeVerificationToken();

    await db.query(
      `INSERT INTO "User" (
         email, display_name, phone, password_hash, status, is_admin, email_verified,
         verification_token_hash, verification_expires_at, created_at
       ) VALUES ($1, $2, $3, $4, 'pending', false, false, $5, $6, CURRENT_TIMESTAMP)`,
      [
        email,
        display_name,
        phone || null,
        hashedPassword,
        verification.hash,
        verification.expiresAt,
      ]
    );

    await sendVerificationEmail(email, verification.token);
    return res.status(202).json({ message: VERIFICATION_MESSAGE });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(202).json({ message: VERIFICATION_MESSAGE });
    }
    console.error('Registration error:', error);
    return res.status(503).json({ error: 'Registration is temporarily unavailable' });
  }
});

router.post('/resend-verification', registrationLimiter, [
  body('email').isEmail().normalizeEmail().isLength({ max: 254 }),
], async (req, res) => {
  if (getValidationErrors(req, res)) return;

  try {
    const verification = makeVerificationToken();
    const result = await db.query(
      `UPDATE "User"
       SET verification_token_hash = $1, verification_expires_at = $2
       WHERE email = $3 AND email_verified = false AND status = 'pending'
       RETURNING email`,
      [verification.hash, verification.expiresAt, req.body.email]
    );

    if (result.rows.length > 0) {
      try {
        await sendVerificationEmail(result.rows[0].email, verification.token);
      } catch (error) {
        console.error('Resend verification email error:', error);
      }
    }
    return res.status(202).json({ message: VERIFICATION_MESSAGE });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(202).json({ message: VERIFICATION_MESSAGE });
  }
});

router.post('/verify-email', registrationLimiter, [
  body('token').isHexadecimal().isLength({ min: 64, max: 64 }),
], async (req, res) => {
  if (getValidationErrors(req, res)) return;

  try {
    const tokenHash = hashVerificationToken(req.body.token);
    const result = await db.query(
      `UPDATE "User"
       SET email_verified = true,
           status = 'active',
           verification_token_hash = NULL,
           verification_expires_at = NULL
       WHERE verification_token_hash = $1
         AND verification_expires_at > CURRENT_TIMESTAMP
         AND email_verified = false
       RETURNING "UserID"`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Verification link is invalid or expired' });
    }
    return res.json({ message: 'Email verified. You can now log in.' });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Email verification failed' });
  }
});

router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 1, max: 72 }),
], async (req, res) => {
  if (getValidationErrors(req, res)) return;

  try {
    const result = await db.query('SELECT * FROM "User" WHERE email = $1', [req.body.email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.email_verified || user.status === 'pending') {
      return res.status(403).json({ error: 'Verify your email before logging in' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    const token = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET,
      { ...jwtOptions, subject: String(user.UserID) }
    );
    res.cookie('auth_token', token, authCookieOptions);
    return res.json({
      user: {
        user_id: user.UserID,
        email: user.email,
        display_name: user.display_name,
        phone: user.phone,
        is_admin: user.is_admin,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', clearAuthCookieOptions);
  return res.status(204).send();
});

router.get('/me', authenticateToken, async (req, res) => {
  return res.json({
    user_id: req.user.UserID,
    email: req.user.email,
    display_name: req.user.display_name,
    phone: req.user.phone,
    created_at: req.user.created_at,
    is_admin: req.user.is_admin,
    status: req.user.status,
  });
});

router.put('/me', authenticateToken, [
  body('display_name').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone').trim().optional({ checkFalsy: true }).isMobilePhone(),
], async (req, res) => {
  if (getValidationErrors(req, res)) return;

  try {
    const result = await db.query(
      `UPDATE "User"
       SET display_name = COALESCE($1, display_name), phone = $2
       WHERE "UserID" = $3
       RETURNING "UserID" as user_id, email, display_name, phone, created_at, is_admin, status`,
      [req.body.display_name, req.body.phone || null, req.user.UserID]
    );
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT "UserID" as user_id, display_name, created_at
       FROM "User" WHERE "UserID" = $1 AND status = 'active' AND email_verified = true`,
      [req.params.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT "UserID" as user_id, email, display_name, phone, created_at, is_admin, status, email_verified
       FROM "User" ORDER BY created_at DESC`
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:userId/status', authenticateToken, isAdmin, [
  body('status').isIn(['active', 'suspended', 'banned']),
], async (req, res) => {
  if (getValidationErrors(req, res)) return;

  try {
    const result = await db.query(
      `UPDATE "User" SET status = $1 WHERE "UserID" = $2
       RETURNING "UserID" as user_id, email, display_name, status`,
      [req.body.status, req.params.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
