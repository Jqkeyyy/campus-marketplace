const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail().custom((value) => {
    // Require @uww.edu email
    if (!value.endsWith('@uww.edu')) {
      throw new Error('Email must be a valid @uww.edu address');
    }
    return true;
  }),
  body('display_name').trim().isLength({ min: 2, max: 100 }),
  body('phone').trim().optional({ checkFalsy: true }).isMobilePhone(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, display_name, phone, password } = req.body;

  try {
    // Check if user already exists
    const userCheck = await db.query('SELECT "UserID" FROM "User" WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user with active status
    const result = await db.query(
      `INSERT INTO "User" (email, display_name, phone, password_hash, status, is_admin, created_at)
       VALUES ($1, $2, $3, $4, 'active', false, CURRENT_TIMESTAMP)
       RETURNING "UserID", email, display_name, phone, created_at, is_admin, status`,
      [email, display_name, phone || null, hashedPassword]
    );

    const user = result.rows[0];

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { UserID: user.UserID, email: user.email, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful! You can now log in.',
      token,
      user: {
        UserID: user.UserID,
        email: user.email,
        display_name: user.display_name,
        phone: user.phone,
        is_admin: user.is_admin,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const result = await db.query(
      'SELECT * FROM "User" WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { UserID: user.UserID, email: user.email, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...userWithoutSensitiveData } = user;
    res.json({ user: userWithoutSensitiveData, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT "UserID", email, display_name, phone, created_at, is_admin, status
       FROM "User" WHERE "UserID" = $1`,
      [req.user.UserID]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/me', authenticateToken, [
  body('display_name').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone').trim().optional({ checkFalsy: true }).isMobilePhone()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { display_name, phone } = req.body;

  try {
    const result = await db.query(
      `UPDATE "User"
       SET display_name = COALESCE($1, display_name),
           phone = COALESCE($2, phone)
       WHERE "UserID" = $3
       RETURNING "UserID", email, display_name, phone, created_at, is_admin, status`,
      [display_name, phone, req.user.UserID]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID (public profile)
router.get('/:userId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT "UserID", display_name, created_at
       FROM "User" WHERE "UserID" = $1 AND status = 'active'`,
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get all users
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT "UserID", email, display_name, phone, created_at, is_admin, status
       FROM "User" ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Update user status
router.patch('/:userId/status', authenticateToken, isAdmin, async (req, res) => {
  const { status } = req.body;

  if (!['active', 'suspended', 'banned'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await db.query(
      `UPDATE "User" SET status = $1 WHERE "UserID" = $2
       RETURNING "UserID", email, display_name, status`,
      [status, req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
